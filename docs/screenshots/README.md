# Screenshots

The images on the repository's front page ([README.md](../../README.md)). They show the page with the fictional
Example Ranch data. Retake them when the page changes, with the same window sizes, pixel density and reduced motion
(below), and keep the file names so the README's links still work. The two section images are as tall as their
sections, so their height can change; update the sizes in the table after each retake.

| File | What it shows | Size in pixels |
|---|---|---|
| `screenshot.png` | The top of the page on a desktop: summary numbers and the exception report | 2560 x 1800 |
| `water.png` | Water tank levels | 2416 x 1134 |
| `grazing-gain.png` | Grazing rotation and daily gain | 2416 x 1312 |
| `phone.png` | The page on a phone | 780 x 1688 |

They show the page of the redesign follow-up pull request (the one that fixes the known issues of
[06 section 15](../audit/06-phase1-spec.md#15-open-decisions-and-assumptions)), taken on 2026-10-20 and retaken on
2026-10-21 with [capture.mjs](capture.mjs) in this folder (the retake changed only `grazing-gain.png`, where the flagged
squares are packed by their sides; its size stayed the same): twice the pixel density, reduced motion;
`screenshot.png` is a 1280 x 900 window, `water.png` and `grazing-gain.png` are the `#water` and `.grid2` sections of
that window, and `phone.png` is a 390 x 844 phone window with touch. The sizes above were read from the PNG headers.
The same script run on the page files of the redesign commit `0315d09` gives the images committed before this pull
request, byte for byte (Playwright Chromium on Linux, 2026-10-20).

To retake them, from the repository root:

```bash
python3 -m http.server 8766 --bind 127.0.0.1      # in another terminal
node docs/screenshots/capture.mjs http://localhost:8766/
```

It needs Playwright with Chromium, found the way the preserve checks find it (see "Before running the review scripts"
in [audit/README.md](../audit/README.md)). It overwrites the four files and checks nothing about the page, so look at
each image afterwards. It cannot show how the page looks on a real phone, or with the fonts of another machine: the
page loads no web font, so the text is drawn in the fonts the machine has (Inter on the machine that took these).

The audit's own baseline screenshots of the page before the redesign are in
[audit/screenshots/](../audit/screenshots/README.md). The Drive copy is the folder `screenshots`.
