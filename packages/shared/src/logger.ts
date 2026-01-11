/**
 * Simple logger utility that wraps console methods.
 * Provides a central point of control for logging that can be:
 * - Replaced with a proper logging library (e.g., pino) in production
 * - Configured to disable logs in tests
 * - Extended with log levels, formatting, or remote logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createLogger(prefix?: string): Logger {
  const formatMessage = (level: LogLevel, args: unknown[]): unknown[] => {
    const timestamp = new Date().toISOString();
    const prefixStr = prefix ? `[${prefix}]` : '';
    return [`${timestamp} ${level.toUpperCase()}${prefixStr}:`, ...args];
  };

  return {
    debug: (...args: unknown[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(...formatMessage('debug', args));
      }
    },
    info: (...args: unknown[]) => {
      console.info(...formatMessage('info', args));
    },
    warn: (...args: unknown[]) => {
      console.warn(...formatMessage('warn', args));
    },
    error: (...args: unknown[]) => {
      console.error(...formatMessage('error', args));
    },
  };
}

// Default logger instance
export const logger = createLogger();

// Create a logger with a specific prefix/namespace
export function createNamedLogger(name: string): Logger {
  return createLogger(name);
}
