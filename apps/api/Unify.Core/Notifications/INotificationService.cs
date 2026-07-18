namespace Unify.Core.Notifications;

/// <summary>
/// Server-side notification service.
/// </summary>
public interface INotificationService
{
    Task SendAsync(Notification notification, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> GetHistoryAsync(int limit = 50, CancellationToken ct = default);
}

public record Notification(
    string Type,
    string Title,
    string? Message = null,
    string? Source = null,
    DateTime? Timestamp = null
);
