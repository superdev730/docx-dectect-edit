# DOCX Editor Tool

This project is a web-based tool for editing and modifying DOCX files. It allows users to upload a DOCX document, apply various modifications, and download the edited file.

## Features

- Upload DOCX files
- Apply modifications to the document content, such as:
  - Inserting text after a specific heading
  - Inserting text within a numbered section
  - Adding new sections with titles and content
- Download the modified DOCX file

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **DOCX Processing:** jszip, docxtemplater, pizzip

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/docx-editor-tool.git
   ```
2. Navigate to the project directory:
   ```bash
   cd docx-editor-tool
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

This will start the Vite development server, and you can view the application by navigating to `http://localhost:5173` in your web browser.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the source code using ESLint.
- `npm run preview`: Previews the production build locally.

## Project Structure

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── DownloadButton.tsx
│   │   ├── FileUploader.tsx
│   │   └── ProcessingStatus.tsx
│   ├── services/
│   │   ├── ContractEditor.tsx
│   │   └── DocumentProcessor.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .eslintrc.cjs
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or find any bugs.
