# FAZ3G leakage measurement

Reference: Desktop grup-36---programci(1).pdf and .audit/phase3f-current-open/exam.json. Reproduce: node scripts/measure-leakage.mjs "C:/Users/ahmet/Desktop/grup-36---programci(1).pdf" .audit/phase3f-current-open/exam.json docs/phase3g-assets/leakage-measurement.json

All 50 imported question records measured; 43 have complete option geometry. Unknown: 5, 6, 16, 21, 23, 25, 39. The JSON contains raw, aligned and normalized contrasts for all question records. Answers are used only in local script memory for contrasts; no answer indices or per-option key-match booleans are emitted.

Geometry is independent of answers: use each cell's own x/y and the common A-D median first-line height (capped at 0.018 page height), eliminating E's trailing whitespace denominator. Same-letter/position darkness is removed with a robust leave-one-question-out median from at least eight peers per option; all observations from the current question are excluded. No tuning against the key was performed. This is an OCR anchor approximation, not verified glyph localization.

| Metric | Raw flags / measured | Normalized flags / measured |
|---|---:|---:|
| before | 6/43 | 20/43 |
| clean | 7/43 | 22/43 |
| masked | 0/43 | 0/43 |
| erased | 14/43 | 14/43 |
| bodyLoss | 10/43 | 10/43 |

Normalization increases clean-marker flags from 7 to 22, so it does not support a no-leakage finding. Body-loss flags remain 10/43; erased-area flags remain 14/43. Actual protected student images inspected: 174, maximum red ratio 0. Masked marker contrast is a reconstructed 144-DPI production strip, distinct from inspection of stored images. Strong-red overlap is 17/24; old 18/23 used different geometry and cannot establish causal improvement.

Each table entry is correct-minus-other-four mean difference / descriptive z / exploratory flag / unique extreme. Unknown geometry or missing reference yields unknown; null z means zero variance among the other four, not a clean bill of health. Flag threshold is |z|>=2, or a nonzero difference with zero other-choice variance. Flags are descriptive, uncalibrated and not corrected for multiple comparisons.

| Question | Raw before | Raw clean | Aligned clean | Normalized before | Normalized clean | Raw masked | Normalized body loss |
|---|---|---|---|---|---|---|---|
| 1 | -0.084782 / -7.662 / flag / extreme | -0.085107 / -7.371 / flag / extreme | -0.052885 / -4.580 / flag / extreme | -0.042680 / -7.145 / flag / extreme | -0.044682 / -8.299 / flag / extreme | -0.001501 / -1.665 / - / extreme | -0.000008 / -0.028 / - / - |
| 2 | -0.036507 / -1.107 / - / - | -0.039666 / -1.271 / - / - | -0.052319 / -5.962 / flag / extreme | -0.069133 / -6.892 / flag / extreme | -0.073389 / -6.115 / flag / extreme | -0.001535 / -1.308 / - / extreme | -0.001071 / -0.750 / - / - |
| 3 | 0.013224 / 0.354 / - / - | 0.000885 / 0.024 / - / - | -0.017345 / -1.151 / - / extreme | -0.024615 / -5.000 / flag / extreme | -0.037122 / -7.264 / flag / extreme | -0.002073 / -0.996 / - / - | -0.000393 / -2.997 / flag / extreme |
| 4 | -0.033446 / -0.708 / - / - | -0.046476 / -0.986 / - / - | -0.071799 / -6.854 / flag / extreme | -0.039866 / -15.475 / flag / extreme | -0.055286 / -15.664 / flag / extreme | -0.001144 / -1.414 / - / - | 0.000279 / 2.594 / flag / extreme |
| 5 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 6 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 7 | -0.005655 / -0.177 / - / - | -0.005655 / -0.177 / - / - | -0.017066 / -1.452 / - / extreme | 0.005090 / 1.633 / - / extreme | 0.002524 / 0.758 / - / - | -0.000275 / -0.577 / - / - | 0.000152 / 1.417 / - / - |
| 8 | -0.008946 / -0.226 / - / - | -0.023448 / -0.618 / - / - | -0.031397 / -3.486 / flag / extreme | -0.033169 / -3.465 / flag / extreme | -0.052467 / -6.504 / flag / extreme | 0.000571 / 0.527 / - / - | 0.000081 / 0.599 / - / - |
| 9 | -0.029689 / -2.008 / flag / extreme | -0.031868 / -2.155 / flag / extreme | -0.041855 / -3.747 / flag / extreme | -0.020195 / -7.654 / flag / extreme | -0.023722 / -9.410 / flag / extreme | 0.000000 / null / - / - | 0.000131 / 0.670 / - / - |
| 10 | -0.002470 / -0.077 / - / - | -0.002470 / -0.077 / - / - | -0.007212 / -0.262 / - / - | -0.000130 / -0.008 / - / - | 0.000763 / 0.046 / - / - | 0.000000 / null / - / - | 0.000359 / 3.335 / flag / extreme |
| 11 | 0.022405 / 0.929 / - / - | 0.022868 / 0.973 / - / - | 0.018577 / 1.044 / - / - | -0.000045 / -0.005 / - / - | 0.000202 / 0.023 / - / - | 0.000000 / null / - / - | 0.000486 / 5.832 / flag / extreme |
| 12 | 0.025624 / 0.926 / - / - | 0.027409 / 0.966 / - / - | 0.029346 / 1.173 / - / - | 0.008802 / 0.642 / - / - | 0.012088 / 0.788 / - / - | 0.000000 / null / - / - | -0.000101 / -0.312 / - / - |
| 13 | -0.026938 / -1.065 / - / - | -0.032938 / -1.302 / - / - | -0.045335 / -4.887 / flag / extreme | -0.020411 / -2.994 / flag / extreme | -0.028822 / -4.324 / flag / extreme | 0.000000 / null / - / - | 0.000936 / 5.602 / flag / extreme |
| 14 | 0.040535 / 1.333 / - / extreme | 0.040535 / 1.333 / - / extreme | 0.027885 / 1.683 / - / extreme | 0.009542 / 0.883 / - / - | 0.010641 / 0.926 / - / - | 0.000000 / null / - / - | 0.000190 / 1.283 / - / extreme |
| 15 | 0.049295 / 1.804 / - / extreme | 0.049295 / 1.804 / - / extreme | 0.035096 / 2.163 / flag / extreme | 0.016994 / 2.737 / flag / extreme | 0.017205 / 2.426 / flag / extreme | 0.000000 / null / - / - | -0.000079 / -0.606 / - / - |
| 16 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 17 | -0.011302 / -0.316 / - / - | -0.020690 / -0.610 / - / - | -0.031957 / -3.820 / flag / extreme | -0.042750 / -4.145 / flag / extreme | -0.052168 / -3.426 / flag / extreme | 0.000000 / null / - / - | 0.002836 / 2.170 / flag / extreme |
| 18 | -0.013279 / -0.562 / - / - | -0.012180 / -0.521 / - / - | -0.022527 / -2.037 / flag / extreme | -0.001626 / -0.177 / - / - | -0.002389 / -0.205 / - / - | 0.000000 / null / - / - | 0.000161 / 0.214 / - / - |
| 19 | 0.030731 / 1.192 / - / extreme | 0.033348 / 1.426 / - / extreme | 0.032606 / 3.256 / flag / extreme | 0.011357 / 2.353 / flag / extreme | 0.013916 / 2.191 / flag / extreme | 0.000000 / null / - / - | 0.000005 / 0.008 / - / - |
| 20 | -0.032992 / -1.926 / - / extreme | -0.037277 / -2.363 / flag / extreme | -0.033425 / -4.113 / flag / extreme | -0.019883 / -4.889 / flag / extreme | -0.026852 / -4.288 / flag / extreme | 0.000000 / null / - / - | -0.000942 / -0.897 / - / extreme |
| 21 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 22 | -0.048623 / -7.312 / flag / extreme | -0.050230 / -8.368 / flag / extreme | -0.078297 / -8.628 / flag / extreme | -0.066203 / -3.553 / flag / extreme | -0.071724 / -4.291 / flag / extreme | 0.000000 / null / - / - | -0.000358 / -0.739 / - / - |
| 23 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 24 | 0.040888 / 0.951 / - / extreme | 0.032020 / 0.748 / - / - | 0.002934 / 0.217 / - / - | -0.007406 / -0.924 / - / extreme | -0.015938 / -1.742 / - / extreme | 0.000000 / null / - / - | -0.000026 / -0.191 / - / - |
| 25 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 26 | 0.013644 / 0.565 / - / - | 0.013644 / 0.565 / - / - | 0.004660 / 0.481 / - / - | -0.013103 / -5.387 / flag / extreme | -0.012954 / -4.712 / flag / extreme | 0.000000 / null / - / - | -0.000139 / -1.055 / - / - |
| 27 | 0.010212 / 0.327 / - / - | 0.010212 / 0.327 / - / - | 0.023364 / 9.100 / flag / extreme | 0.004252 / 0.389 / - / - | 0.005351 / 0.497 / - / - | 0.000000 / null / - / - | -0.000101 / -0.536 / - / - |
| 28 | -0.032258 / -0.719 / - / - | -0.032258 / -0.719 / - / - | -0.032538 / -2.236 / flag / extreme | -0.010538 / -1.672 / - / extreme | -0.012949 / -2.190 / flag / extreme | 0.000000 / null / - / - | 0.000001 / 0.004 / - / - |
| 29 | -0.008211 / -0.688 / - / - | -0.008211 / -0.688 / - / - | 0.009615 / 0.953 / - / - | 0.018801 / 1.778 / - / extreme | 0.021336 / 2.151 / flag / extreme | 0.000000 / null / - / - | 0.000234 / 1.587 / - / extreme |
| 30 | 0.043761 / 1.214 / - / - | 0.043761 / 1.214 / - / - | 0.025238 / 1.489 / - / - | 0.006373 / 1.136 / - / extreme | 0.006366 / 0.950 / - / - | 0.000000 / null / - / - | 0.000383 / 0.990 / - / extreme |
| 31 | 0.018306 / 0.566 / - / - | 0.018160 / 0.566 / - / - | 0.011779 / 0.579 / - / - | 0.020017 / 2.197 / flag / extreme | 0.021151 / 2.090 / flag / extreme | 0.000000 / null / - / - | -0.000691 / -2.260 / flag / extreme |
| 32 | 0.008893 / 0.571 / - / - | 0.008463 / 0.558 / - / - | -0.002885 / -0.416 / - / - | 0.019801 / 1.610 / - / extreme | 0.018113 / 1.361 / - / - | 0.000000 / null / - / - | 0.000128 / 0.271 / - / - |
| 33 | 0.007439 / 0.361 / - / - | 0.001617 / 0.078 / - / - | -0.001374 / -0.077 / - / - | 0.012330 / 1.438 / - / extreme | 0.006048 / 0.649 / - / - | 0.000000 / null / - / - | 0.002847 / 4.294 / flag / extreme |
| 34 | 0.037129 / 1.913 / - / extreme | 0.037113 / 1.895 / - / extreme | 0.018750 / 1.318 / - / - | -0.000670 / -0.079 / - / - | 0.000090 / 0.012 / - / - | 0.000000 / null / - / - | -0.001144 / -1.530 / - / extreme |
| 35 | 0.010789 / 0.870 / - / - | 0.010560 / 0.887 / - / - | 0.002404 / 0.178 / - / - | -0.014824 / -2.278 / flag / extreme | -0.016741 / -2.646 / flag / extreme | 0.000000 / null / - / - | -0.001244 / -1.838 / - / extreme |
| 36 | 0.031783 / 0.915 / - / - | 0.026452 / 0.765 / - / - | -0.000962 / -0.093 / - / - | 0.009661 / 1.586 / - / extreme | 0.007868 / 1.185 / - / - | 0.000000 / null / - / - | -0.000728 / -0.760 / - / - |
| 37 | -0.010079 / -2.014 / flag / extreme | -0.010079 / -2.014 / flag / extreme | 0.005769 / 0.442 / - / - | 0.015453 / 7.250 / flag / extreme | 0.015729 / 7.525 / flag / extreme | 0.000000 / null / - / - | 0.000006 / 0.032 / - / - |
| 38 | 0.017297 / 1.980 / - / extreme | 0.017297 / 1.980 / - / extreme | 0.020330 / 2.829 / flag / extreme | 0.001822 / 0.396 / - / - | 0.001100 / 0.246 / - / - | 0.000000 / null / - / - | -0.000135 / -1.205 / - / - |
| 39 | unknown | unknown | unknown | unknown | unknown | unknown | unknown |
| 40 | 0.038832 / 1.134 / - / - | 0.038832 / 1.134 / - / - | 0.027885 / 1.381 / - / - | 0.009020 / 1.086 / - / - | 0.009013 / 1.011 / - / - | 0.000000 / null / - / - | 0.000873 / 10.579 / flag / extreme |
| 41 | -0.014471 / -0.472 / - / - | -0.013114 / -0.423 / - / - | -0.003259 / -0.235 / - / - | 0.003109 / 0.601 / - / - | 0.005492 / 0.993 / - / - | 0.000000 / null / - / - | 0.000392 / 1.917 / - / extreme |
| 42 | -0.020150 / -0.525 / - / - | -0.018577 / -0.490 / - / - | -0.006111 / -0.463 / - / - | -0.027623 / -21.093 / flag / extreme | -0.026969 / -6.330 / flag / extreme | 0.000000 / null / - / - | -0.001131 / -0.860 / - / - |
| 43 | -0.003882 / -0.135 / - / - | -0.005687 / -0.197 / - / - | -0.011795 / -0.834 / - / - | 0.009397 / 1.312 / - / - | 0.006338 / 0.946 / - / - | 0.000000 / null / - / - | 0.000226 / 0.464 / - / - |
| 44 | 0.005509 / 0.259 / - / - | 0.005366 / 0.256 / - / - | -0.021203 / -3.269 / flag / extreme | -0.001627 / -0.223 / - / - | -0.003703 / -0.431 / - / - | 0.000000 / null / - / - | 0.000721 / 4.192 / flag / extreme |
| 45 | 0.030503 / 2.260 / flag / extreme | 0.030760 / 2.287 / flag / extreme | 0.022564 / 2.901 / flag / extreme | 0.003800 / 0.481 / - / - | 0.003334 / 0.436 / - / - | 0.000000 / null / - / - | -0.000100 / -0.574 / - / - |
| 46 | -0.029532 / -1.661 / - / extreme | -0.029020 / -1.716 / - / extreme | 0.006627 / 1.145 / - / - | 0.016069 / 2.104 / flag / extreme | 0.019117 / 2.626 / flag / extreme | 0.000000 / null / - / - | 0.000030 / 0.088 / - / - |
| 47 | -0.032181 / -1.645 / - / extreme | -0.032042 / -1.623 / - / extreme | 0.010181 / 0.612 / - / - | 0.019853 / 2.105 / flag / extreme | 0.022671 / 2.171 / flag / extreme | 0.000000 / null / - / - | -0.000065 / -0.087 / - / - |
| 48 | 0.009324 / 0.531 / - / - | 0.007603 / 0.431 / - / - | -0.006505 / -0.572 / - / - | -0.021440 / -7.384 / flag / extreme | -0.024118 / -12.674 / flag / extreme | 0.000000 / null / - / - | -0.000119 / -0.406 / - / - |
| 49 | 0.017114 / 2.484 / flag / extreme | 0.016487 / 2.482 / flag / extreme | 0.017251 / 4.049 / flag / extreme | 0.001468 / 0.100 / - / - | -0.000362 / -0.025 / - / - | 0.000000 / null / - / - | -0.000047 / -0.074 / - / - |
| 50 | -0.017025 / -0.493 / - / - | -0.017439 / -0.504 / - / - | -0.019129 / -1.306 / - / extreme | -0.011091 / -1.139 / - / - | -0.010379 / -1.036 / - / - | 0.000000 / null / - / - | 0.000244 / 0.525 / - / - |

Limits: OCR anchors can be wrong; fixed first-line windows are geometry normalization, not verified glyph boxes. Five choices do not yield a calibrated statistical leakage detector; no multiple-testing control. Letter/position baselines mix fonts, pages and possible marked options; robust median does not guarantee clean controls. Body-loss normalization retains dependence on differing option content; body erasure is a remaining signal and content-loss risk. Masked metric reconstructs the production strip at 144 DPI; protected image scan reports actual stored student image red ratio separately. Missing question/option geometry remains unknown and cannot support a no-leakage conclusion. No leak-free claim. OCR language, OEM, PSM and rendering remain tur+eng / 1 / 11 / 144 DPI; the production reddish threshold is untouched. No OCR rerun or automatic text correction was performed by this measurement.

Regression: node tests/phase3g-metric-regression.mjs. Observed failure before implementation: alignedMarkerBoxes undefined. Passing result covers E trailing whitespace, shifted x anchor, natural letter darkness, held-out anomaly, small peer pool and missing geometry.
