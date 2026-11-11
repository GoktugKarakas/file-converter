import { mkdtemp, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

import type { ConversionEngine } from '../types'
import { findLibreOfficeExecutable } from '../utils/libre-officeDiscovery'
import { validateConversionRequest } from '../utils/fileValidation'
import { runProcess } from '../utils/processRunner'
import { publishOutput } from '../utils/outputPublishing'

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

  private async getExecutablePath(): Promise<string> {
    const executable = this.executablePath ?? (await findLibreOfficeExecutable())
    if (!executable) {
      throw new Error(
        'LibreOffice executable not found. Please ensure LibreOffice is installed and accessible in your system PATH.'
      )
    }
    this.executablePath = executable
    return executable
  }

  private buildArguments(request: ConversionRequest, workspace: string): string[] {
    const profilePath = path.join(workspace, 'profile')
    return [
      `-env:UserInstallation=${pathToFileURL(profilePath).href}`,
      '--headless',
      '--convert-to',
      request.targetFormat,
      '--outdir',
      workspace,
      path.resolve(request.inputPath)
    ]
  }

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

    const executable = await this.getExecutablePath()
    const workspace = await mkdtemp(path.join(request.outputDirectory, '.converter-'))

    try {
      const tempOutputPath = path.join(workspace, path.basename(outputPath))
      const args = this.buildArguments(request, workspace)

      await runProcess(executable, args, {
        timeoutMs: 120_000
      })

      await publishOutput(tempOutputPath, outputPath)

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
