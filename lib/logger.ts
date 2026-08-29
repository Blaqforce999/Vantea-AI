type LogContext = Record<string, unknown>;

/**
 * Structured logger. Never pass item names, values, "why" notes, wishlist/goal
 * contents, passwords, session tokens, the Anthropic key, or any AI prompt or
 * completion in `context` — see .agents/rules/security.md "Logging".
 */
function write(level: 'info' | 'warn' | 'error', event: string, context?: LogContext) {
  const line = {
    level,
    event,
    time: new Date().toISOString(),
    ...(context ?? {}),
  };
  const serialized = JSON.stringify(line);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) => write('error', event, context),
};
