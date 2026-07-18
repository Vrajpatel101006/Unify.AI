namespace Unify.Core.Events;

/// <summary>
/// Server-side event bus for loose coupling between modules.
/// </summary>
public interface IEventBus
{
    Task PublishAsync<T>(string eventName, T data, CancellationToken ct = default);
    IDisposable Subscribe<T>(string eventName, Func<T, Task> handler);
    IDisposable Subscribe<T>(string eventName, Action<T> handler);
}
