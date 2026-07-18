namespace Unify.Core.AI;

/// <summary>
/// AI provider abstraction. Every AI module depends on this interface,
/// never on a specific vendor (OpenAI, Claude, etc.).
/// </summary>
public interface IAIProvider
{
    string Id { get; }
    string Name { get; }
    IReadOnlyList<string> Capabilities { get; }

    Task<AIResponse> SendMessageAsync(AIRequest request, CancellationToken ct = default);
    IAsyncEnumerable<AIStreamChunk> StreamMessageAsync(AIRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<AIModel>> GetModelsAsync(CancellationToken ct = default);
    Task<bool> ValidateConfigAsync(CancellationToken ct = default);
}

/// <summary>
/// Routes AI tasks to the appropriate provider based on capability,
/// preference, and fallback rules.
/// </summary>
public interface IAIRouter
{
    Task<IAIProvider> RouteAsync(AITask task, CancellationToken ct = default);
    void RegisterProvider(IAIProvider provider);
    void RemoveProvider(string id);
    void SetDefaultProvider(string id);
    void SetFallbackChain(IReadOnlyList<string> providerIds);
    IReadOnlyList<IAIProvider> GetProviders();
}

// ---- DTOs ----

public record AIRequest(
    IReadOnlyList<AIMessage> Messages,
    string? Model = null,
    double? Temperature = null,
    int? MaxTokens = null,
    string? ResponseFormat = null
);

public record AIMessage(string Role, string Content);

public record AIResponse(
    string Id,
    string Content,
    string Model,
    string Provider,
    TokenUsage Usage,
    string FinishReason,
    long LatencyMs
);

public record AIStreamChunk(string Id, string Delta, bool Done);

public record AIModel(string Id, string Name, string Provider, IReadOnlyList<string> Capabilities, int MaxTokens);

public record TokenUsage(int PromptTokens, int CompletionTokens, int TotalTokens);

public record AITask(
    string Type,
    IReadOnlyList<string>? RequiredCapabilities = null,
    string? PreferredProvider = null
);
