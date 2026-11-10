import { useState } from 'react'

export default function FileSelector(): React.JSX.Element {
  const [files, setFiles] = useState<string[]>([])

  async function handleClick(): Promise<void> {
    const selectedFiles = await window.api.selectFiles()

    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
    }
  }

  return (
    <div className="p-6">
      <button
        onClick={handleClick}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Select Files
      </button>

      <h2 className="mt-6 font-semibold">Selected Files ({files.length})</h2>

      {files.length === 0 ? (
        <p>No files selected.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {files.map((file) => (
            <li key={file} className="rounded border p-2">
              {file}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
