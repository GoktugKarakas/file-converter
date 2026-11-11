import type { ConversionEngine } from '../types'
import { findLibreOfficeExecutable } from '../utils/libre-officeDiscovery'
import { validateConversionRequest } from '../utils/fileValidation'
import { runProcess } from '../utils/processRunner'
import { mkdtemp, rm, stat, link } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

import type {
  ConversionRequest,
  ConversionResult,
  SupportedFormat
} from '../../../shared/conversion'

// TODO: Add support for other format capabilities in the future
const conversionTargets = {
  docx: ['pdf'],
  pptx: ['pdf'],
  xlsx: ['pdf']
} as const satisfies Partial<Record<SupportedFormat, readonly SupportedFormat[]>>

export class LibreOfficeEngine implements ConversionEngine {
  readonly id = 'libre-office'

  private executablePath: string | null = null

  async isAvailable(): Promise<boolean> {
    this.executablePath = await findLibreOfficeExecutable()

    return this.executablePath !== null
  }

  supports(source: SupportedFormat, target: SupportedFormat): boolean {
    const targets: readonly SupportedFormat[] =
      conversionTargets[source as keyof typeof conversionTargets] ?? []
    return targets.includes(target)
  }

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    const outputPath = await validateConversionRequest(request, (source, target) =>
      this.supports(source, target)
    )

    const executable = this.executablePath ?? (await findLibreOfficeExecutable())
    if (!executable) {
      throw new Error(
        'LibreOffice executable not found. Please ensure LibreOffice is installed and accessible in your system PATH.'
      )
    }
    this.executablePath = executable

    // Temp buffer file
    const workspace = await mkdtemp(path.join(request.outputDirectory, '.converter-'))

    try {
      const tempOutputPath = path.join(workspace, path.basename(outputPath))

      // libre-office cli command
      const args = [
        '--headless',
        '--convert-to',
        request.targetFormat,
        '--outdir',
        workspace,
        path.resolve(request.inputPath)
      ]

      const profilePath = path.join(workspace, 'profile')
      args.unshift(`-env:UserInstallation=${pathToFileURL(profilePath).href}`)

      await runProcess(executable, args, { timeoutMs: 120_000 })

      const outputStats = await stat(tempOutputPath)
      if (!outputStats.isFile() || outputStats.size === 0) {
        throw new Error('LibreOffice produced an invalid output file.')
      }

      try {
        await link(tempOutputPath, outputPath)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new Error(`Output already exists: ${outputPath}`, { cause: err })
        }
        throw err
      }

      return {
        inputPath: request.inputPath,
        outputPath,
        engine: this.id
      }
    } finally {
      await rm(workspace, {
        recursive: true,
        force: true
      })
    }
  }
}
