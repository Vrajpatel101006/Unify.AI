namespace Unify.Infrastructure.Providers;

/// <summary>
/// Stores provider API keys per user, in memory for this session.
/// 
/// Known limitations (by design for this pass):
///   - Keys are NOT encrypted at rest — they live in process memory only.
///   - Keys do NOT persist across API restarts — users must re-enter after restart.
///   - Interface is designed for a durable, encrypted-at-rest replacement
///     (e.g. ASP.NET Core Data Protection + SQLite) without changing controller code.
/// </summary>
public interface IProviderKeyStore
{
    /// <summary>Stores (or overwrites) a key for the given user + provider pair.</summary>
    void SetKey(string userId, string providerId, string apiKey);

    /// <summary>Returns the API key, or null if not configured for this user.</summary>
    string? GetKey(string userId, string providerId);

    /// <summary>Removes the key for this user + provider pair.</summary>
    void RemoveKey(string userId, string providerId);

    /// <summary>Returns true if a key is configured for this user + provider pair.</summary>
    bool HasKey(string userId, string providerId);

    /// <summary>Returns all provider IDs that have a key stored for this user.</summary>
    IReadOnlyList<string> GetConfiguredProviders(string userId);
}
