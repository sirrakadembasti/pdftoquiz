# OCR benchmark (Phase 3C-1)

No new dependencies. Reference PDFs ship in tests/reference/ and are the defaults. Uses the existing PDF.js/Tesseract/canvas pipeline. Override with TAPU_REFERENCE_PDF and REAL_REFERENCE_PDF, then run pnpm test:ocr. Node >=22 and installed project dependencies are required. Output: .test-tmp/qa/ocr by default; override OCR_OUTPUT_DIR.

Default: base raster, production 144 DPI, PSM 11, tur+eng, OEM 1, user_defined_dpi=150, no preprocessing. OCR_VARIATIONS=base,shift-minus3,shift-plus3,skew-minus1,skew-plus1,margin-inset,margin-outset,combined enables independent raster tests. Margin scales: .94/1.03; combined: +3% horizontal shift, +1 degree, .94 zoom. Selectable digital pages remain untouched.

OCR_CASE=r300-h150 is measurement-only 300 DPI. OCR_REPLAY_DIR may point to a compatible prior case; input PNG hashes/dimensions are checked. Replay performs no actual recognition: its time and memory are not OCR performance evidence. The full-page production renderer and OCR settings are not changed by these scripts.

The user-provided real-scan page/column reference is only used for scoring; it is never supplied to the parser. Text ground truth is the selectable Tapu PDF. Reference requires 50 five-option questions on the real scan and 50 four-option questions on Tapu. Question labels in this benchmark are not correct-answer letters.

Runtime outputs include raw word boxes/confidence, grouped lines, column splits, rejection chains, number placement and option counts. These contain OCR source text: treat them as private reference material. Instrumentation transpiles sources under the output folder; no app source mutation.

## Phase 3C-2 red ink ablation

`OCR_RED_ABLATION=1 pnpm test:ocr` runs the unchanged baseline, measurement-only white removal at k=35/60 on the real scan, seeded synthetic Tapu circles/lines, and the same synthetic images after white removal. Outputs are separated by case. `OCR_RED_CLEAN=1`, `OCR_RED_MARKS=1` and `OCR_RED_K=35` can select a single measurement case. The random generator is seeded with 137+page*173; strokes are generated in memory over sampled number/choice lines. Record `redConfig`, prep/recognition time, changed pixels and retained black/grey pixels. No fixture binary is committed.

OCR cleanup was **not adopted**: real-scan number recall stayed 46/50 and question 9 was lost. Production OCR input/settings and the Phase 3C-1 parser remain unchanged. Student/AI raster image cleanup is mandatory and separate: R-G>35 and R-B>35 removes strong/dark red to white; faint R-G>16/R-B>16 halos are removed only within two pixels of an 8-connected strong component with at least 30 pixels, preserves alpha and all pixels with channel spread <=16. Every cleaned scanned page is flagged for teacher review because red ink cannot be reliably distinguished from a genuine red diagram.

`pnpm test` includes generated red scanned images and student API/asset/React preview/shared-link checks. Set REAL_REFERENCE_PDF to include the actual scan; optional REAL_OCR_REPLAY is a previously measured output directory whose input PNG hashes must match. Replay checks image safety/parser stability, never performance. API tests explicitly complete missing choice text/answer/review in an in-memory teacher fixture; they do not publish the incomplete real exam to a service.

## Phase 3C-3 sequence repairs and number-gap experiment

Production repairs only OCR option markers inside an accepted question, using a median local left edge and the order of reliable neighbours. Repairs carry `Sıra çıkarımı` warnings and keep original question images. Full-page OCR, number/column acceptance, and image sanitization settings are unchanged.

`node scripts/ocr/diagnose-sequence.mjs BASELINE_SOURCE OUTPUT real=OCR_OUTPUT tapu=OCR_OUTPUT` compares saved raw rectangles with two source revisions; this is parser evidence, not OCR performance. Outputs include all question option text, inferred markers, and detected structural faults. Pre-existing fixture defects must be distinguished from newly introduced repairs; source crops still require visual review.

`node scripts/ocr/measure-gaps.mjs PDF OCR_BASELINE OUTPUT` is **measurement only** and is never imported by production. Only gaps bounded by accepted n-1/n+1 get a column number strip, rendered at 300 DPI and locally cleaned. Worker language/OEM/PSM/DPI hint remain tur+eng/1/11/150. Set OCR_GAP_ID=300dpi for synthetic Tapu, OCR_GAP_VARIATION for an existing raster variation. It reports provisional number candidates, never a fully reconstructed extra question. Wrong numbers, off-edge numbers and numbers without same-line text are rejected. No inference-only number 5 is added. A replay baseline cannot provide OCR timing; extraPercent is null for replay baselines unless a separately measured denominator is supplied.

`pnpm test:ocr` keeps the existing full-pipeline benchmark. `pnpm test` now includes the structural repair and legacy image fail-closed regressions. Neither command migrates stored exams.

## Phase 3C screenshot follow-up (2.0.9)

The application now opts into `recoverNumberGaps`; the benchmark enables it by default. `OCR_GAP_REPAIR=0` is the ablation switch. Direct `convertPDF` callers retain the previous default. A reused worker reads only bounded, locally cleaned 300 DPI number strips; no additional `setParameters` call occurs. Acceptance requires the exact missing number, confidence >=70, alignment with the column's median number edge, and lettered text on the same OCR line; code-like lines are rejected. An elapsed-time budget of 7% of full-page recognition time and one prior-region reserve limit extra calls. One non-interruptible recognition can exceed its estimate; this is not a hard timeout.

Full-page call hashes/CER/times exclude these strips; `gapOCRMs`, `gapWallMs` and `gapDiagnostics` account for them separately. Sparse scan dust is skipped before OCR. Headerless repeated `Soru - N X` rows produce a pending PDF key proposal, not automatic correct answers. New options preserve word/symbol rectangles to separate fused labels from content; no symbol-to-letter or code-spelling replacement table is used. An unnumbered second choice sequence is kept for teacher review rather than overwriting the preceding accepted question.
