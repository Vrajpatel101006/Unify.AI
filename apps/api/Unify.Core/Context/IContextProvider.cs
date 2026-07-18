namespace Unify.Core.Context;

/// <summary>
/// Server-side context provider — tracks current workspace state.
/// </summary>
public interface IContextProvider
{
    WorkspaceContext GetContext();
    void Set<T>(string key, T value);
    T? Get<T>(string key);
}

public record WorkspaceContext(
    string? CurrentProject,
    string? CurrentFile,
    string? CurrentWorkspace,
    string? CurrentDatabase,
    string? CurrentAIProvider,
    string? GitBranch
);
