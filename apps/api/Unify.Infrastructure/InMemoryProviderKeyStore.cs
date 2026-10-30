using System.Collections.Concurrent;

namespace Unify.Infrastructure.Providers;

/// <inheritdoc cref="IProviderKeyStore"/>
public sealed class InMemoryProviderKeyStore : IProviderKeyStore
{
    // Outer key: userId, inner key: providerId, value: raw API key.
    // ConcurrentDictionary so this is safe under concurrent HTTP requests.
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _store = new();

    public void SetKey(string userId, string providerId, string apiKey)
    {
        var userBucket = _store.GetOrAdd(userId, _ => new ConcurrentDictionary<string, string>());
        userBucket[providerId] = apiKey;
    }

    public string? GetKey(string userId, string providerId)
    {
        if (_store.TryGetValue(userId, out var userBucket) &&
            userBucket.TryGetValue(providerId, out var key))
        {
            return key;
        }
        return null;
    }

    public void RemoveKey(string userId, string providerId)
    {
        if (_store.TryGetValue(userId, out var userBucket))
        {
            userBucket.TryRemove(providerId, out _);
        }
    }

    public bool HasKey(string userId, string providerId) =>
        _store.TryGetValue(userId, out var userBucket) && userBucket.ContainsKey(providerId);

    public IReadOnlyList<string> GetConfiguredProviders(string userId)
    {
        if (_store.TryGetValue(userId, out var userBucket))
            return userBucket.Keys.ToList();
        return [];
    }
}
