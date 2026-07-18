/**
 * @unify/platform-telemetry — Optional telemetry, disabled by default.
 * Event-based usage patterns only. Never content.
 */

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
  timestamp: number;
}

export interface ITelemetryService {
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
  trackEvent(event: TelemetryEvent): void;
  flush(): Promise<void>;
}
