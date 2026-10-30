using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unify.Infrastructure.Providers;

namespace Unify.API.Controllers;

// ─── DTOs ────────────────────────────────────────────────────────────────────

public record SaveProviderKeyRequest(
    [Required, MaxLength(50)] string ProviderId,
    [Required, MaxLength(512)] string ApiKey
);

public record ProviderStatusDto(
    string ProviderId,
    bool Configured
);

// ─── Controller ──────────────────────────────────────────────────────────────

/// <summary>
/// Manages per-user provider API key registration.
/// Keys are stored in memory for this session only — see IProviderKeyStore for known limitations.
/// The API key is never returned to the client after being stored.
/// </summary>
[ApiController]
[Route("api/providers")]
[Authorize]
public class ProvidersController : ControllerBase
{
    private static readonly string[] KnownProviders =
        ["gemini", "groq", "grok", "huggingface", "openai", "claude", "deepseek", "ollama"];

    private readonly IProviderKeyStore _keyStore;

    public ProvidersController(IProviderKeyStore keyStore) => _keyStore = keyStore;

    private string? GetUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    /// <summary>
    /// Returns which providers have a key configured for this user.
    /// Never returns the key value itself.
    /// </summary>
    [HttpGet]
    public IActionResult GetProviders()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var statuses = KnownProviders.Select(id => new ProviderStatusDto(
            ProviderId: id,
            Configured: _keyStore.HasKey(userId, id)
        ));

        return Ok(statuses);
    }

    /// <summary>
    /// Stores the API key for the specified provider, keyed to the authenticated user.
    /// The key lives in memory only and does not persist across API restarts.
    /// </summary>
    [HttpPost]
    public IActionResult SaveKey([FromBody] SaveProviderKeyRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (!KnownProviders.Contains(request.ProviderId.ToLowerInvariant()))
            return BadRequest(new { error = $"Unknown provider: {request.ProviderId}" });

        _keyStore.SetKey(userId, request.ProviderId.ToLowerInvariant(), request.ApiKey);

        return Ok(new { message = $"Key for provider '{request.ProviderId}' stored for this session." });
    }

    /// <summary>Removes the stored key for the specified provider.</summary>
    [HttpDelete("{providerId}")]
    public IActionResult RemoveKey(string providerId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        _keyStore.RemoveKey(userId, providerId.ToLowerInvariant());
        return Ok(new { message = $"Key for provider '{providerId}' removed." });
    }
}
