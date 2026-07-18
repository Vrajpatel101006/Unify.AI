/**
 * @unify/platform-logging
 *
 * Structured logging with levels, categories, and pluggable transports.
 */

// ---------------------------------------------------------------------------
// Log Levels & Categories
// ---------------------------------------------------------------------------

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
  Fatal = 4,
}

export enum LogCategory {
  General = 'general',
  Performance = 'performance',
  AI = 'ai',
  Plugin = 'plugin',
  Database = 'database',
  Network = 'network',
  Search = 'search',
  UI = 'ui',
  Security = 'security',
  Lifecycle = 'lifecycle',
}

// ---------------------------------------------------------------------------
// Log Entry
// ---------------------------------------------------------------------------

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
  error?: Error;
  source?: string;
}

// ---------------------------------------------------------------------------
// Log Transport
// ---------------------------------------------------------------------------

export interface ILogTransport {
  name: string;
  write(entry: LogEntry): void;
  flush?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Logger Interface
// ---------------------------------------------------------------------------

export interface ILogger {
  log(level: LogLevel, category: LogCategory, message: string, data?: Record<string, unknown>): void;
  debug(category: LogCategory, message: string, data?: Record<string, unknown>): void;
  info(category: LogCategory, message: string, data?: Record<string, unknown>): void;
  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void;
  error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): void;
  fatal(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): void;

  /** Create a child logger with a fixed category. */
  createChild(category: LogCategory, source?: string): ILogger;

  /** Add a transport (console, file, remote, etc.). */
  addTransport(transport: ILogTransport): void;

  /** Set the minimum log level. */
  setLevel(level: LogLevel): void;
}
