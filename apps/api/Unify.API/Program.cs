using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Threading.RateLimiting;
using Unify.Infrastructure.Providers;

// ----------------------------------------------------------------
// Unify.AI — API Host
// ----------------------------------------------------------------

var builder = WebApplication.CreateBuilder(args);

// Serilog structured logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Services
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// HTTP client factory for outbound AI provider calls
builder.Services.AddHttpClient();

// Provider key store — in-memory for this pass (see IProviderKeyStore for known limitations)
builder.Services.AddSingleton<IProviderKeyStore, InMemoryProviderKeyStore>();

// CORS — allow Vite dev server and Electron
builder.Services.AddCors(options =>
{
    options.AddPolicy("UnifyDevCors", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for httpOnly cookie to flow
    });
});

// ── Authentication — JWT Bearer, read from httpOnly cookie ────────────────────
var jwtConfig = builder.Configuration.GetSection("Jwt");
var secretKey = jwtConfig["SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey must be configured. Use user-secrets or an environment variable.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"] ?? "unify-api",
            ValidAudience = jwtConfig["Audience"] ?? "unify-client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // Read the JWT from the httpOnly cookie instead of the Authorization header.
        // This means the token never appears in renderer-accessible JS.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("unify_session", out var cookieToken))
                {
                    context.Token = cookieToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── Rate limiting — 20 requests/minute per authenticated user on AI endpoints ─
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("ai-per-user", limiterOptions =>
    {
        limiterOptions.PermitLimit = 20;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0; // Reject immediately when limit hit
    });

    // Keyed by user ID claim so the limit is per-user, not global
    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Rate limit exceeded. Maximum 20 AI requests per minute per user." }, ct);
    };
});

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("UnifyDevCors");
app.UseHttpsRedirection();

// *** ORDER MATTERS: Authentication before Authorization ***
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Health check endpoint — anonymous, not rate-limited
app.MapHealthChecks("/api/health");

app.MapControllers();

Log.Information("Unify.AI API starting on {Urls}", string.Join(", ", app.Urls));

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Unify.AI API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
