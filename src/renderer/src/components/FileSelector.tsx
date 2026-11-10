import { useState } from 'react'
import fileUploadIcon from '../assets/file-upload.svg'

export default function FileSelector(): React.JSX.Element {
  const [files, setFiles] = useState<string[]>([])

  async function handleSelectFiles(): Promise<void> {
    const selectedFiles = await window.api.selectFiles()

    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <img src={fileUploadIcon} alt="" className="h-20 w-20 dark:invert" />
      <h2 className="text-xl font-semibold">Select Files</h2>
      <p className="text-sm">Choose one or more files:</p>

      <button
        type="button"
        onClick={handleSelectFiles}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Browse Files
      </button>

      <p className="text-sm font-medium">
        {files.length === 0
          ? 'No files selected'
          : `${files.length} file${files.length === 1 ? '' : 's'} selected`}
      </p>
    </div>
  )
}
