import assert from 'node:assert/strict'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { afterEach, before, beforeEach, describe, it } from 'node:test'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'

import { ConversionManager } from '../manager'
import { LibreOfficeEngine } from '../adapters/libre-office'
import type { ConversionRequest } from '../../../shared/conversion'
import type { Logger } from '../../../shared/logger'

const fixturePath = fileURLToPath(
  new URL('../adapters/__tests__/fixtures/sample.docx', import.meta.url)
)

const events: string[] = []
const logger: Logger = {
  debug: (event) => {
    events.push(event)
  },
  info: (event) => {
    events.push(event)
  },
  warn: (event) => {
    events.push(event)
  },
  error: (event) => {
    events.push(event)
  }
}
