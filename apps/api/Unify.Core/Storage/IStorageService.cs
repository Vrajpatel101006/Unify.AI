namespace Unify.Core.Storage;

/// <summary>
/// Abstract storage interface for local-first data access.
/// </summary>
public interface IStorageService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
    Task<bool> ExistsAsync(string key, CancellationToken ct = default);
}
