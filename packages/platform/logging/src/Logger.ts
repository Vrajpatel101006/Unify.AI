/**
 * Logger — Structured logging with pluggable transports.
 */

import type { ILogTransport, ILogger, LogEntry } from './types';
import { LogCategory, LogLevel } from './types';

export class Logger implements ILogger {
  private readonly _transports: ILogTransport[] = [];
  private _minLevel: LogLevel = LogLevel.Debug;
  private readonly _category: LogCategory;
  private readonly _source?: string;

  constructor(category: LogCategory = LogCategory.General, source?: string) {
    this._category = category;
    this._source = source;
  }

  log(level: LogLevel, category: LogCategory, message: string, data?: Record<string, unknown>): void {
    if (level < this._minLevel) return;

    const entry: LogEntry = {
      level,
      category,
      message,
      timestamp: Date.now(),
      data,
      source: this._source,
    };

    for (const transport of this._transports) {
      try {
        transport.write(entry);
      } catch {
        // Never let logging errors crash the app
      }
    }
  }

  debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Debug, category, message, data);
  }

  info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Info, category, message, data);
  }

  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Warning, category, message, data);
  }

  error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.Error,
      category,
      message,
      timestamp: Date.now(),
      error,
      data,
      source: this._source,
    };

    for (const transport of this._transports) {
      try {
        transport.write(entry);
      } catch {
        // Swallow
      }
    }
  }

  fatal(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.Fatal,
      category,
      message,
      timestamp: Date.now(),
      error,
      data,
      source: this._source,
    };

    for (const transport of this._transports) {
      try {
        transport.write(entry);
      } catch {
        // Swallow
      }
    }
  }

  createChild(category: LogCategory, source?: string): ILogger {
    const child = new Logger(category, source ?? this._source);
    child._minLevel = this._minLevel;
    // Share transports with parent
    child._transports.push(...this._transports);
    return child;
  }

  addTransport(transport: ILogTransport): void {
    this._transports.push(transport);
  }

  setLevel(level: LogLevel): void {
    this._minLevel = level;
  }
}

/** Console transport — logs to browser/Node console with color. */
export class ConsoleTransport implements ILogTransport {
  name = 'console';

  write(entry: LogEntry): void {
    const prefix = `[${LogLevel[entry.level]}] [${entry.category}]${entry.source ? ` [${entry.source}]` : ''}`;
    const msg = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.Debug:
        console.debug(msg, entry.data ?? '');
        break;
      case LogLevel.Info:
        console.info(msg, entry.data ?? '');
        break;
      case LogLevel.Warning:
        console.warn(msg, entry.data ?? '');
        break;
      case LogLevel.Error:
      case LogLevel.Fatal:
        console.error(msg, entry.error ?? '', entry.data ?? '');
        break;
    }
  }
}
