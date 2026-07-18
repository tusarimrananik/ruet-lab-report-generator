# Reportor — RUET Lab Report Generator

A browser-based lab report studio for RUET students. Build a structured report, preview the A4 document live, and export it as PDF or a Word-compatible file.

## Features

- RUET cover page with the official emblem
- Assembly/microprocessor, programming/logic, and electrical/instrumentation presets
- Live A4 preview
- PDF printing and Word-compatible export
- Image and screenshot insertion
- Local autosave—report data stays in the browser
- JSON backup and restore
- Responsive editor

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Cover-page attribution

The cover layout and RUET emblem are adapted from [ruet-cover-page/ruet-cover-page.github.io](https://github.com/ruet-cover-page/ruet-cover-page.github.io), used under its MIT License. It preserves the core A4 structure: university and department identity, course information, lab metadata, submitted-by/submitted-to blocks, and experiment/submission dates.

## Privacy

The application has no backend. Drafts and uploaded images remain in the user's browser.

## License

MIT. See [LICENSE](LICENSE).
