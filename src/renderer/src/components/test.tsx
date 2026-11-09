export default function Test(): React.JSX.Element {
  async function handleClick(): Promise<void> {
    const files = await window.api.selectFiles()
    console.log('Selected files:', files)
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
    >
      Select Files
    </button>
  )
}
