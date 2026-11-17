import path from 'node:path'

// import type { ConversionRequest } from '../../shared/conversion'
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

  private async selectEngine(preferredEngineId: string): Promise<ConversionEngine | undefined> {
    const engine = this.getEngine(preferredEngineId)

    if (!engine) {
      this.logger.warn('engine.not_found for_id', { engineId: preferredEngineId })
      return undefined
    }

    try {
      if (!(await engine.isAvailable())) {
        this.logger.warn('engine.unavailable', { engineId: preferredEngineId })
        return undefined
      }
    } catch (err) {
      this.logger.error('engine.availability_check_failed', {
        engineId: preferredEngineId,
        error: err instanceof Error ? err.message : String(err)
      })
      return undefined
    }
    return engine
  }

  async convertBatch(
    requests: ConversionRequest[],
    preferredEngineId: 'libre-office'
  ): Promise<BatchItemResult[]> {
    const destinations = new Set<string>()
    const results: BatchItemResult[] = []

    for (const request of requests) {
      const outputPath = path.join(
        request.outputDirectory,
        `${path.parse(request.inputPath).name}.${request.targetFormat}`
      )
      destinations.add(outputPath)

      if (destinations.has(outputPath)) {
        this.logger.warn('batch.duplicate_destination', { outputPath })
        throw new Error(`Duplicate output destination: ${outputPath}`)
      }
      destinations.add(outputPath)
    }
    const engine = await this.selectEngine(preferredEngineId)

    if (!engine) {
      // filler
    }
    return results
  }
}
