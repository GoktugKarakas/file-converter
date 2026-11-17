import type { ConversionEngine } from './types'

export class ConversionManager {
  constructor(private readonly engines: ConversionEngine[]) {}

  private getEngine(id: string): ConversionEngine | undefined {
    return this.engines.find((engine) => engine.id === id)
  }
}
