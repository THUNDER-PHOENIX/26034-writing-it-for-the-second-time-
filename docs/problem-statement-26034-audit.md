# SIH Problem Statement 26034: feature audit

Review date: 19 October 2026. This is a code and deployment review, not legal certification or OCR benchmark testing.

## Coverage in the current prototype

| Requirement | Current state | Gap / judge-facing note |
|---|---|---|
| Web/mobile application | Partial | Responsive web app with upload and camera capture; no native mobile app. |
| Scan product images | Partial | Image upload/capture and quality hints exist. One overall image is stored as evidence. |
| Detect/extract declarations | Partial | English OCR and regex screening for selected text fields. OCR can miss small, curved, reflective, rotated, or multilingual text. A tiled browser OCR recovery pass now runs for sparse/low-confidence scans. |
| Validate correctness and completeness | Partial | Presence patterns only; does not fully validate addresses, declarations' values, exceptions, placement, e-commerce listing details, or the amended rules. |
| Font size and readability | Partial | Blur/brightness/resolution warnings and image-relative OCR text-height heuristic. It does not calculate statutory print size from package display area or calibration. |
| Missing/non-standard declarations | Partial | Selected missing-text flags; no dependable detection of misleading wording or layout. A missed OCR token can create a false flag. |
| Compliance report and summaries | Implemented as prototype output | Detailed page and PDF export. Labels now describe the result as an automated screening result requiring human review. |
| Scanned-product repository/history | Partial | Browser-local storage by default; optional Supabase code exists. Browser data is not shared across inspectors. No operational retention policy. |
| Dashboard | Partial | Counts and recent scans for the selected storage backend; no multi-zone enforcement data unless a configured backend supplies it. |
| Search and retrieval | Implemented locally | Reports page can search/filter scans in the current store. |
| PDF and editable exports | Partial | PDF and CSV/JSON exports exist; editable formats are data exports, not an editable DOCX report. |
| Evidence photos | Partial | Original scan image can be attached to a record. No multi-angle capture workflow or evidence integrity controls. |
| Role-based access and secure authentication | Not implemented | Login/registration are demo-only local profile flows; there is no identity verification or authorization boundary. Do not use real inspector credentials or sensitive case data. |
| Technical/deployment documentation | Partial | README and architecture notes exist; deployment and configuration limitations need to be stated clearly. |

## Important correctness gaps found

- The original navigation and dashboard described the app as an official government enforcement portal, showed a false “synced” state, and displayed government support details. Those claims were removed and replaced with prototype/local-storage wording.
- The UI offered Hindi and Kannada OCR options, but the selected language was never passed to OCR. The misleading selector was removed; OCR is currently English-only.
- The original preprocessing reduced images to 1600 px and median-filtered pixels, which can erase tiny character strokes. It now preserves up to 2400 px and skips destructive denoising/sharpening. Sparse scans receive a four-crop, enlarged Tesseract fallback.
- Barcode presence was presented as a mandatory declaration and affected scoring. Barcode detection remains available for identification, but is excluded from category compliance scores.
- The original font-height percentage was presented as if it were a legal minimum. It is now described as a visual heuristic only.
- The rule set should be reviewed against the current consolidated Rules and every notification/amendment before any enforcement use. The official Department of Consumer Affairs publishes the Rules and amendment notices at [consumeraffairs.nic.in](https://consumeraffairs.nic.in/).
- The current engine also does not fully cover common/generic product name, unit sale price, imported-product conditional declarations, several package-specific exceptions, or every applicable font-size/placement rule. Food labels have separate FSSAI requirements that this prototype does not comprehensively assess.

## OCR recovery playbook for a live demo

1. Use the original photo as evidence and capture a second close-up of each small-print panel. Keep the label flat, fill the frame, avoid flash glare, and tap to focus.
2. The app uses configured OCR.space first. If the result is sparse or low-confidence, it checks four overlapping enlarged crops with browser Tesseract. If the service is down or no API key is configured, it falls back to browser Tesseract.
3. Open the generated record, compare the extracted transcript with the photograph, and use **Edit report** to correct OCR text. Saving recalculates the text-rule screen; the font heuristic remains tied to the original image.
4. If either OCR engine still misses a declaration, record it manually in inspection notes and retain the close-up as evidence. Report the scan as needing human review rather than asserting a violation based only on OCR.
5. Before the event, use the sample flow and one real package photo in the deployed environment, confirm whether hosted OCR is configured, and keep an offline photo/crop ready. This review did not measure OCR accuracy on a representative image set.
