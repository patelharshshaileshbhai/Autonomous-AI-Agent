import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
    context?: string;
}

const LOG_COLORS = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
};

class Logger {
    private context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    private formatLog(entry: LogEntry): string {
        const color = LOG_COLORS[entry.level];
        const reset = LOG_COLORS.reset;
        const contextStr = entry.context ? `[${entry.context}]` : '';
        const levelStr = entry.level.toUpperCase().padEnd(5);

        let output = `${color}${entry.timestamp} ${levelStr}${reset} ${contextStr} ${entry.message}`;

        if (entry.data !== undefined) {
            output += '\n' + JSON.stringify(entry.data, null, 2);
        }

        return output;
    }

    private log(level: LogLevel, message: string, data?: unknown): void {
        // Skip debug logs in production
        if (level === 'debug' && env.server.isProd) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            context: this.context,
        };

        const formatted = this.formatLog(entry);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    }

    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }

    error(message: string, data?: unknown): void {
        this.log('error', message, data);
    }

    child(context: string): Logger {
        return new Logger(this.context ? `${this.context}:${context}` : context);
    }
}

// Default logger instance
export const logger = new Logger();

// Create context-specific loggers
export const createLogger = (context: string): Logger => new Logger(context);

export default logger;
