import { useState } from 'react'
import type { BatchItemResult, ConversionRequest } from '../../../shared/conversion'
/**
 * ==================================================
                   THIS IS TEMPORARY CHANGE IT 
   ==================================================
 */
export default function FileSelector(): React.JSX.Element {
  const [files, setFiles] = useState<string[]>([])
  const [outputDirectory, setOutputDirectory] = useState<string | null>(null)
  const [results, setResults] = useState<BatchItemResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  async function handleSelectFiles(): Promise<void> {
    try {
      const selected = await window.api.selectFiles()
      if (selected.length > 0) {
        setFiles(selected)
        setResults([])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleSelectDirectory(): Promise<void> {
    try {
      const directory = await window.api.selectOutputDirectory()
      if (directory !== null) {
        setOutputDirectory(directory)
        setResults([])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleConvert(): Promise<void> {
    if (!outputDirectory || files.length === 0 || converting) return

    const requests: ConversionRequest[] = files.map((inputPath) => ({
      inputPath,
      outputDirectory,
      targetFormat: 'pdf'
    }))

    setConverting(true)
    setError(null)
    setResults([])

    try {
      setResults(await window.api.convertBatch(requests))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setConverting(false)
    }
  }

  const successful = results.filter((item) => item.success).length
  const failed = results.length - successful

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-10 text-slate-100">
      <section className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            File Converter
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">Convert files to PDF</h1>

          <p className="mt-2 text-sm text-slate-400">
            Select your documents and an output directory to begin.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Input files</label>

            <button
              type="button"
              disabled={converting}
              onClick={handleSelectFiles}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-500 bg-slate-900/50 px-4 py-5 text-left transition hover:border-indigo-400 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-sm text-slate-300">
                {files.length === 0
                  ? 'Choose DOCX, PPTX or XLSX files'
                  : `${files.length} file${files.length === 1 ? '' : 's'} selected`}
              </span>

              <span className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium">
                Browse
              </span>
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Output directory</label>

            <button
              type="button"
              disabled={converting}
              onClick={handleSelectDirectory}
              className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-4 text-left transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0 truncate text-sm text-slate-300">
                {outputDirectory ?? 'Choose destination folder'}
              </span>

              <span className="shrink-0 text-xs font-medium text-indigo-400">Browse</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Target format</span>
              <span className="rounded-md bg-indigo-500/15 px-3 py-1 font-semibold text-indigo-300">
                PDF
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={converting || files.length === 0 || !outputDirectory}
            onClick={handleConvert}
            className="w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            {converting ? 'Converting files...' : 'Convert to PDF'}
          </button>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 border-t border-slate-700 pt-5">
              <h2 className="text-sm font-semibold">Conversion results</h2>

              <div className="flex gap-4 text-sm">
                <span className="text-emerald-400">{successful} successful</span>
                <span className="text-red-400">{failed} failed</span>
              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto">
                {results.map((item, index) => (
                  <div key={index} className="rounded-md bg-slate-900/60 px-3 py-2 text-xs">
                    {item.success ? (
                      <p className="break-all text-emerald-300">✓ {item.result.outputPath}</p>
                    ) : (
                      <p className="break-words text-red-300">✕ {String(item.error)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Powered by LibreOffice · Local conversion
        </p>
      </section>
    </main>
  )
}
