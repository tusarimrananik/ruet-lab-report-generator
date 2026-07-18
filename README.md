# Reportor — RUET Lab Report Generator

A browser-based report studio for RUET students. It combines the complete RUET Cover Page Generator with a structured lab-report builder.

## Features

- Complete upstream RUET cover-page editor and PDF renderer
- Student, subject, teacher, second-teacher, department and designation controls
- Lab report, assignment, thesis and other cover types
- Watermark, borders, series, session, group, date placement and course-information settings
- CO/PO assessment table, automatic text fitting, import/export and reset tools
- Official RUET emblem, motto artwork and TeX Gyre Termes fonts
- Assembly/microprocessor, programming/logic, and electrical/instrumentation presets
- Live A4 preview
- PDF printing and Word-compatible export
- Image and screenshot insertion
- Local autosave—report data stays in the browser
- JSON backup and restore
- AI-assisted autofill for empty report sections
- Responsive editor

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

AI autofill is served through the Vercel API route. Add the key to `.env.local` for local Vercel development, or configure it as a protected environment variable in the hosting project:

```bash
GROQ_API_KEY=your_key_here
```

Never expose the key through a client-side environment variable or commit it to Git.

## Build

```bash
npm run build
npm start
```

## Cover-page attribution

The full cover editor is integrated from [ruet-cover-page/ruet-cover-page.github.io](https://github.com/ruet-cover-page/ruet-cover-page.github.io), used under its MIT License. Its original editing controls, state model, assets, font fitting, import/export, PDF preview and PDF download functionality are preserved.

## Privacy

Drafts and uploaded images remain in the user's browser. When AI autofill is requested, the lab title, optional notes, and text-only report context are sent through the server-side Groq API route. Uploaded image data and the API key are not sent to the browser.

## License

MIT. See [LICENSE](LICENSE).
