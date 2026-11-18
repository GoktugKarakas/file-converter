# File Converter

A desktop application for converting documents to PDF locally, built with Electron, React, and TypeScript.

> **Status: Early development / minimum working version.** The core conversion pipeline and a basic desktop interface are implemented. The UI is temporary, and this version is not yet a production-ready release.

## Features

- Convert individual files or batches of documents to PDF.
- Select input files and an output directory through native file dialogs.
- Perform conversions locally using LibreOffice, without uploading documents to an online service.
- View per-file success or failure results after a batch completes.
- Reject duplicate output destinations within the same batch and avoid overwriting existing outputs.

### Supported conversions

| Input   | Output | Engine      |
| ------- | ------ | ----------- |
| `.docx` | `.pdf` | LibreOffice |
| `.pptx` | `.pdf` | LibreOffice |
| `.xlsx` | `.pdf` | LibreOffice |

Other conversion directions and the Microsoft Office engine are **not implemented** in this version.

## Requirements

- Node.js and npm for running the project from source.
- [LibreOffice](https://www.libreoffice.org/download/download-libreoffice/) installed on your computer and discoverable by the application.

The code includes LibreOffice executable discovery for Windows, macOS, and Linux, but cross-platform operation and packaged distributions have not yet been fully validated.

## Getting started

Clone the repository and install dependencies:

```bash
git clone https://github.com/GoktugKarakas/file-converter.git
cd file-converter
npm install
```

Launch the application with the development script:

```bash
npm run dev
```

> Check `package.json` for available scripts and project-specific setup requirements. This README describes running the source project, not a prebuilt installer.

## Usage

1. Launch the application.
2. Select one or more DOCX, PPTX, or XLSX files.
3. Choose an output directory.
4. Click **Convert to PDF**.
5. Review the results and locate converted PDFs in the selected directory.

Converted files use the source filename with a `.pdf` extension. If an output file already exists, the application reports a failure rather than intentionally overwriting it.

## Current limitations

- Only DOCX, PPTX, and XLSX to PDF conversions are supported.
- LibreOffice must be installed separately; it is not bundled with the app.
- Batch conversions run sequentially, and results are displayed when the batch finishes.
- The UI does not yet provide per-file progress or cancellation.
- Two inputs that would generate the same destination path cannot be processed together in a batch.
- The current UI is a temporary functional interface.
- Production packaging and behavior across operating systems still need further testing.

## Project overview

The application uses Electron's main and renderer processes, with a restricted preload bridge for IPC communication. The renderer handles file selection and conversion requests; the main process delegates conversion work to a conversion manager and the LibreOffice engine.

The conversion code is organized independently of the UI to support additional engines and formats later. Implementation details and testing notes are maintained separately in the project's existing documentation.

## Development direction

Planned areas of work include a polished interface, improved conversion feedback, cancellation support, expanded format support, a Microsoft Office engine, and distribution/testing across supported desktop platforms. These are development goals, not features available in the current version.

## Project status

This repository is under active development. The current milestone is a minimum working desktop conversion flow intended as a foundation for further development, not a final release.
