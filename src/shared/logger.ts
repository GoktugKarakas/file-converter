export type LogContext = Record<string, string | number | boolean | null>

export interface Logger {
  debug: (event: string, context?: LogContext) => void
  info: (event: string, context?: LogContext) => void
  warn: (event: string, context?: LogContext) => void
  error: (event: string, context?: LogContext) => void
}
