import { describe, it, expect, vi } from 'vitest';
import { Logger, LogLevel, LogCategory } from '../src';
import type { ILogTransport, LogEntry } from '../src/types';

class MockTransport implements ILogTransport {
  name = 'mock';
  entries: LogEntry[] = [];
  write(entry: LogEntry): void {
    this.entries.push(entry);
  }
}

describe('Logger', () => {
  it('should log messages to registered transports', () => {
    const logger = new Logger(LogCategory.General);
    const transport = new MockTransport();
    logger.addTransport(transport);

    logger.info(LogCategory.AI, 'Test AI message', { tokenCount: 100 });

    expect(transport.entries.length).toBe(1);
    const entry = transport.entries[0]!;
    expect(entry.level).toBe(LogLevel.Info);
    expect(entry.category).toBe(LogCategory.AI);
    expect(entry.message).toBe('Test AI message');
    expect(entry.data).toEqual({ tokenCount: 100 });
  });

  it('should respect minimum log levels', () => {
    const logger = new Logger(LogCategory.General);
    const transport = new MockTransport();
    logger.addTransport(transport);

    logger.setLevel(LogLevel.Warning);

    logger.debug(LogCategory.General, 'Debug msg');
    logger.info(LogCategory.General, 'Info msg');
    logger.warn(LogCategory.General, 'Warning msg');

    expect(transport.entries.length).toBe(1);
    expect(transport.entries[0]!.level).toBe(LogLevel.Warning);
  });
});
