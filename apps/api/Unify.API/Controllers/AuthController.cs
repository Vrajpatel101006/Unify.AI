using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Unify.API.Controllers;

// ─── DTOs ────────────────────────────────────────────────────────────────────

public record LoginRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MaxLength(128)] string Password
);

public record LoginResponse(
    string Name,
    string Email,
    string? AvatarUrl
);

// ─── In-memory dev user store ─────────────────────────────────────────────────

internal sealed class DevUser(string Id, string Name, string Email, string PasswordHash, string? AvatarUrl)
{
    public string Id { get; } = Id;
    public string Name { get; } = Name;
    public string Email { get; } = Email;
    public string PasswordHash { get; } = PasswordHash;
    public string? AvatarUrl { get; } = AvatarUrl;
}

// ─── Controller ──────────────────────────────────────────────────────────────

/// <summary>
/// Issues httpOnly session cookies containing a signed JWT.
/// The token value is never returned in the response body — only the display
/// profile (name, email, avatarUrl) is returned to the client.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    // Dev-time in-memory user store. Replace with a real identity DB in production.
    private static readonly ConcurrentDictionary<string, DevUser> _users = new(
        StringComparer.OrdinalIgnoreCase)
    {
        ["dev@unify.ai"] = new("dev-user-1", "Dev User", "dev@unify.ai",
            BCryptHash("devpassword"),
            "https://api.dicebear.com/7.x/initials/svg?seed=Dev")
    };

    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration config, ILogger<AuthController> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates the user and sets an httpOnly session cookie.
    /// Returns only the display profile — never the token itself.
    /// </summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!_users.TryGetValue(request.Email, out var user) ||
            !BCryptVerify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for {Email}", request.Email);
            return Unauthorized(new { error = "Invalid email or password." });
        }

        var token = BuildJwt(user);

        // Set as httpOnly, Secure, SameSite=Strict cookie.
        // The token value is NEVER returned in the response body.
        Response.Cookies.Append("unify_session", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Path = "/"
        });

        _logger.LogInformation("User {UserId} logged in", user.Id);

        // Return display profile only
        return Ok(new LoginResponse(user.Name, user.Email, user.AvatarUrl));
    }

    /// <summary>Expires the session cookie.</summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("unify_session", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UnixEpoch,
            Path = "/"
        });
        return Ok(new { message = "Logged out." });
    }

    /// <summary>
    /// Dev-only: register a new user into the in-memory store.
    /// Remove this endpoint before any real deployment.
    /// </summary>
    [HttpPost("register")]
    public IActionResult Register([FromBody] LoginRequest request)
    {
        if (_users.ContainsKey(request.Email))
            return Conflict(new { error = "Email already registered." });

        var userId = Guid.NewGuid().ToString();
        var displayName = request.Email.Split('@')[0];
        displayName = char.ToUpper(displayName[0]) + displayName[1..];

        var newUser = new DevUser(
            userId, displayName, request.Email,
            BCryptHash(request.Password),
            $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(displayName)}"
        );

        _users[request.Email] = newUser;
        return Ok(new LoginResponse(newUser.Name, newUser.Email, newUser.AvatarUrl));
    }

    // ── JWT helpers ────────────────────────────────────────────────────────────

    private string BuildJwt(DevUser user)
    {
        var jwtConfig = _config.GetSection("Jwt");
        var secretKey = jwtConfig["SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
        var issuer = jwtConfig["Issuer"] ?? "unify-api";
        var audience = jwtConfig["Audience"] ?? "unify-client";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Minimal BCrypt-style helpers using PBKDF2 (no extra dependency)
    private static string BCryptHash(string password)
    {
        var salt = new byte[16];
        System.Security.Cryptography.RandomNumberGenerator.Fill(salt);
        using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
            password, salt, 100_000, System.Security.Cryptography.HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    private static bool BCryptVerify(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
            password, salt, 100_000, System.Security.Cryptography.HashAlgorithmName.SHA256);
        var hash = Convert.ToBase64String(pbkdf2.GetBytes(32));
        return hash == parts[1];
    }
}
