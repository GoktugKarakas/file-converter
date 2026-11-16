import log from 'electron-log/main'
import type { Logger } from '../../shared/logger'

export const logger: Logger = {
  debug: (event, context) => log.debug(event, context ?? {}),
  info: (event, context) => log.info(event, context ?? {}),
  warn: (event, context) => log.warn(event, context ?? {}),
  error: (event, context) => log.error(event, context ?? {})
}
