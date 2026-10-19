# LabelCheck · SIH 2026 prototype

Prototype for SIH Problem Statement 26034: scan packaged commodity labels, review OCR text, screen selected declarations, save inspection records, and export a PDF.

> **Prototype only.** Not a Government of India service or an authoritative legal checker. OCR and rule results require human review against the current complete rules and package. Do not use the demo sign-in for real identities or sensitive case data.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The sample label is generated in the browser. Build with `npm run build`.

## OCR options

- If `OCR_SPACE_API_KEY` is configured as a server-side environment variable, the app tries hosted OCR first. Keep this key out of browser-exposed `NEXT_PUBLIC_*` variables.
- If hosted OCR is unavailable, the app uses Tesseract.js in the browser.
- Sparse or low-confidence scans receive a second pass over four overlapping, enlarged crops. This can recover some small print but does not guarantee accuracy.
- OCR is currently English-only. The image-relative text-height display is a visual heuristic, not a statutory font-size calculation.
- Review the extracted transcript against the original photo. On the report page, choose **Edit report**, correct OCR text, and save to recalculate the text-pattern screen.

## Data and authentication

Without Supabase environment configuration, records stay in the current browser's local storage and are not shared across users or devices. Optional Supabase integration is present, but secure authentication, inspector role enforcement, production retention controls, and evidence integrity are not implemented. Login and registration are demo-only flows.

## Pages

- `/` — scan summary for the active storage backend
- `/scan` — upload/capture a label and run OCR screening
- `/reports` and `/reports/[id]` — search, review, correct transcript, and export scans
- `/about` — scope and limitations

See [`../docs/problem-statement-26034-audit.md`](../docs/problem-statement-26034-audit.md) for the requirement-by-requirement coverage review and small-print fallback playbook.
