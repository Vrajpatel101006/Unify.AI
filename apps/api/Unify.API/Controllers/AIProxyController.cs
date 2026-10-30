using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Unify.Infrastructure.Providers;

namespace Unify.API.Controllers;

// ─── DTOs ────────────────────────────────────────────────────────────────────

public record AiMessageDto(
    [Required] string Role,
    [Required] string Content
);

public record AiCompleteRequest(
    [Required, MaxLength(50)] string ProviderId,
    [Required, MaxLength(100)] string Model,
    [Required, MinLength(1)] List<AiMessageDto> Messages,
    [Range(0.0, 2.0)] double? Temperature,
    [Range(1, 32000)] int? MaxTokens
);

public record AiCompleteResponse(
    string Id,
    string Content,
    string Model,
    string Provider,
    AiUsageDto Usage
);

public record AiUsageDto(int PromptTokens, int CompletionTokens, int TotalTokens);

// ─── Controller ──────────────────────────────────────────────────────────────

/// <summary>
/// Server-side AI proxy. Resolves the provider API key from the authenticated
/// user's stored keys, then makes the outbound call from the backend.
/// The frontend never holds a raw third-party API key after this is in place.
/// </summary>
[ApiController]
[Route("api/ai")]
[Authorize]
[EnableRateLimiting("ai-per-user")]
public class AIProxyController : ControllerBase
{
    private readonly IProviderKeyStore _keyStore;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AIProxyController> _logger;

    public AIProxyController(
        IProviderKeyStore keyStore,
        IHttpClientFactory httpClientFactory,
        ILogger<AIProxyController> logger)
    {
        _keyStore = keyStore;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpPost("complete")]
    public async Task<IActionResult> Complete(
        [FromBody] AiCompleteRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var apiKey = _keyStore.GetKey(userId, request.ProviderId);
        if (string.IsNullOrEmpty(apiKey))
            return BadRequest(new { error = $"No API key configured for provider '{request.ProviderId}'. Please add it via /api/providers." });

        try
        {
            var result = await DispatchToProvider(request, apiKey, ct);
            return Ok(result);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Outbound AI provider call failed for provider {Provider}", request.ProviderId);
            return StatusCode(502, new { error = $"Provider call failed: {ex.Message}" });
        }
    }

    // ── Provider dispatch ─────────────────────────────────────────────────────

    private async Task<AiCompleteResponse> DispatchToProvider(
        AiCompleteRequest request, string apiKey, CancellationToken ct)
    {
        return request.ProviderId.ToLowerInvariant() switch
        {
            "gemini"      => await CallGemini(request, apiKey, ct),
            "groq"        => await CallOpenAiCompat("https://api.groq.com/openai/v1/chat/completions", "Groq", request, apiKey, ct),
            "grok"        => await CallOpenAiCompat("https://api.x.ai/v1/chat/completions", "xAI Grok", request, apiKey, ct),
            "huggingface" => await CallHuggingFace(request, apiKey, ct),
            "ollama"      => await CallOpenAiCompat($"http://localhost:11434/v1/chat/completions", "Ollama", request, "ollama", ct),
            // Providers not yet implemented on the backend — return 501 rather than silently failing
            "openai" or "claude" or "deepseek" =>
                throw new NotImplementedException($"Provider '{request.ProviderId}' backend integration is not yet implemented. Contributions welcome."),
            _ => throw new ArgumentException($"Unknown provider: {request.ProviderId}")
        };
    }

    // ── Gemini ────────────────────────────────────────────────────────────────

    private async Task<AiCompleteResponse> CallGemini(
        AiCompleteRequest request, string apiKey, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient();
        var model = request.Model;
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var contents = request.Messages.Select(m => new
        {
            role = m.Role == "assistant" ? "model" : "user",
            parts = new[] { new { text = m.Content } }
        });

        var payload = new
        {
            contents,
            generationConfig = new
            {
                temperature = request.Temperature ?? 0.7,
                maxOutputTokens = request.MaxTokens ?? 2048
            }
        };

        var response = await client.PostAsJsonAsync(url, payload, ct);
        response.EnsureSuccessStatusCode();

        var data = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Empty response from Gemini");

        var text = data.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? "";
        var usage = data.UsageMetadata;

        return new AiCompleteResponse(
            $"gemini-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            text, model, "Google Gemini",
            new AiUsageDto(usage?.PromptTokenCount ?? 0, usage?.CandidatesTokenCount ?? 0, usage?.TotalTokenCount ?? 0));
    }

    // ── OpenAI-compatible (Groq, Grok, Ollama) ───────────────────────────────

    private async Task<AiCompleteResponse> CallOpenAiCompat(
        string baseUrl, string providerName, AiCompleteRequest request, string apiKey, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient();
        if (apiKey != "ollama")
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model = request.Model,
            messages = request.Messages.Select(m => new { role = m.Role, content = m.Content }),
            temperature = request.Temperature ?? 0.7,
            max_tokens = request.MaxTokens ?? 2048
        };

        var response = await client.PostAsJsonAsync(baseUrl, payload, ct);
        response.EnsureSuccessStatusCode();

        var data = await response.Content.ReadFromJsonAsync<OpenAiResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException($"Empty response from {providerName}");

        var content = data.Choices?.FirstOrDefault()?.Message?.Content ?? "";
        var usage = data.Usage;

        return new AiCompleteResponse(
            data.Id ?? $"{providerName.ToLower()}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            content, data.Model ?? request.Model, providerName,
            new AiUsageDto(usage?.PromptTokens ?? 0, usage?.CompletionTokens ?? 0, usage?.TotalTokens ?? 0));
    }

    // ── HuggingFace ──────────────────────────────────────────────────────────

    private async Task<AiCompleteResponse> CallHuggingFace(
        AiCompleteRequest request, string apiKey, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var model = request.Model;
        var url = $"https://api-inference.huggingface.co/models/{model}/v1/chat/completions";

        var payload = new
        {
            model,
            messages = request.Messages.Select(m => new { role = m.Role, content = m.Content }),
            temperature = request.Temperature ?? 0.7,
            max_tokens = request.MaxTokens ?? 1024
        };

        var response = await client.PostAsJsonAsync(url, payload, ct);
        response.EnsureSuccessStatusCode();

        var data = await response.Content.ReadFromJsonAsync<OpenAiResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Empty response from HuggingFace");

        var content = data.Choices?.FirstOrDefault()?.Message?.Content ?? "";
        var usage = data.Usage;

        return new AiCompleteResponse(
            data.Id ?? $"hf-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            content, model, "Hugging Face",
            new AiUsageDto(usage?.PromptTokens ?? 0, usage?.CompletionTokens ?? 0, usage?.TotalTokens ?? 0));
    }
}

// ─── Response shape records (for JSON deserialization) ────────────────────────

file record GeminiResponse(
    List<GeminiCandidate>? Candidates,
    GeminiUsageMetadata? UsageMetadata
);
file record GeminiCandidate(GeminiContent? Content);
file record GeminiContent(List<GeminiPart>? Parts);
file record GeminiPart(string? Text);
file record GeminiUsageMetadata(int PromptTokenCount, int CandidatesTokenCount, int TotalTokenCount);

file record OpenAiResponse(
    string? Id,
    string? Model,
    List<OpenAiChoice>? Choices,
    OpenAiUsage? Usage
);
file record OpenAiChoice(OpenAiMessage? Message, string? FinishReason);
file record OpenAiMessage(string? Role, string? Content);
file record OpenAiUsage(
    [property: System.Text.Json.Serialization.JsonPropertyName("prompt_tokens")] int PromptTokens,
    [property: System.Text.Json.Serialization.JsonPropertyName("completion_tokens")] int CompletionTokens,
    [property: System.Text.Json.Serialization.JsonPropertyName("total_tokens")] int TotalTokens
);
