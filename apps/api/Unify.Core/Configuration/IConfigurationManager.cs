namespace Unify.Core.Configuration;

/// <summary>
/// Configuration interface with layered scopes.
/// </summary>
public interface IConfigurationManager
{
    T Get<T>(string key);
    void Set(string key, object value, ConfigScope scope = ConfigScope.User);
    void Reset(string key, ConfigScope scope = ConfigScope.User);
}

public enum ConfigScope
{
    Default,
    User,
    Workspace
}
