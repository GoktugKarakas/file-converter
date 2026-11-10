import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { validateConversionRequest } from './fileValidation'

const supports = (source: string, target: string): boolean => source === 'docx' && target === 'pdf'

test('accepts a valid DOCX to PDF request', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'converter-test-'))

  try {
    const inputPath = path.join(dir, 'example.docx')
    await writeFile(inputPath, 'test content')

    const result = await validateConversionRequest(
      {
        inputPath,
        outputDirectory: dir,
        targetFormat: 'pdf'
      },
      supports
    )

    assert.equal(result, path.join(dir, 'example.pdf'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('rejects an existing PDF output', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'converter-test-'))

  try {
    const inputPath = path.join(dir, 'example.docx')
    const outputPath = path.join(dir, 'example.pdf')

    await writeFile(inputPath, 'test content')
    await writeFile(outputPath, 'existing PDF')

    await assert.rejects(
      validateConversionRequest(
        {
          inputPath,
          outputDirectory: dir,
          targetFormat: 'pdf'
        },
        supports
      ),
      /Output file .* already exists/
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('rejects an unsupported conversion', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'converter-test-'))

  try {
    const inputPath = path.join(dir, 'example.txt')
    await writeFile(inputPath, 'test content')

    await assert.rejects(
      validateConversionRequest(
        {
          inputPath,
          outputDirectory: dir,
          targetFormat: 'pdf'
        },
        supports
      ),
      /not supported/
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('rejects a missing input file', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'converter-test-'))

  try {
    await assert.rejects(
      validateConversionRequest(
        {
          inputPath: path.join(dir, 'missing.docx'),
          outputDirectory: dir,
          targetFormat: 'pdf'
        },
        supports
      ),
      { code: 'ENOENT' }
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
