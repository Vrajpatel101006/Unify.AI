namespace Unify.Core.Search;

/// <summary>
/// Universal search interface. Each workspace registers its own search provider.
/// </summary>
public interface ISearchEngine
{
    Task<SearchResults> SearchAsync(SearchQuery query, CancellationToken ct = default);
    void RegisterProvider(ISearchProvider provider);
    IReadOnlyList<ISearchProvider> GetProviders();
}

public interface ISearchProvider
{
    string Id { get; }
    string Name { get; }
    string Category { get; }
    Task<IReadOnlyList<SearchResult>> SearchAsync(string query, CancellationToken ct = default);
}

public record SearchQuery(string Text, string? Category = null, int Limit = 50, int Offset = 0);
public record SearchResult(string Id, string Title, string? Description, string Category, double Score);
public record SearchResults(IReadOnlyList<SearchResult> Items, int Total, long QueryTimeMs);
