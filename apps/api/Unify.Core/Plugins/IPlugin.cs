namespace Unify.Core.Plugins;

/// <summary>
/// Plugin lifecycle interface. Every workspace implements this.
/// The platform only knows it is loading a plugin — it doesn't
/// need to know what kind.
/// </summary>
public interface IPlugin
{
    string Id { get; }
    string Name { get; }
    string Version { get; }
    string Description { get; }

    Task ActivateAsync(IServiceProvider services, CancellationToken ct = default);
    Task DeactivateAsync(CancellationToken ct = default);
}

/// <summary>
/// Hosts and manages plugin lifecycle.
/// </summary>
public interface IPluginHost
{
    Task RegisterAsync(IPlugin plugin, CancellationToken ct = default);
    Task ActivateAsync(string pluginId, CancellationToken ct = default);
    Task DeactivateAsync(string pluginId, CancellationToken ct = default);
    IPlugin? GetPlugin(string id);
    IReadOnlyList<IPlugin> GetPlugins();
    bool IsActive(string pluginId);
}
