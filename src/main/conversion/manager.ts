import path from 'node:path'

import type { ConversionRequest } from '../../shared/conversion'
import type { ConversionEngine } from './types'
import type { Logger } from '../../shared/logger'

export class ConversionManager {
  constructor(
    private readonly engines: ConversionEngine[],
    private readonly logger: Logger
  ) {}

  private getEngine(id: string): ConversionEngine | undefined {
    return this.engines.find((engine) => engine.id === id)
  }

  private async selectEngine(
    preferredEngineId: string,
    request: ConversionRequest
  ): Promise<ConversionEngine | undefined> {
    const engine = this.getEngine(preferredEngineId)
    if (!engine) {
      return undefined
    }

    try {
      if (
        (await engine.isAvailable()) &&
        engine.supports(request.sourceFormat, request.targetFormat)
      ) {
        return engine
      }
    } catch (err) {
      console.error('Error selecting conversion engine: ', err)
    }
    return undefined
  }
}
