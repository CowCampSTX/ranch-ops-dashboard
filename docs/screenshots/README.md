# Screenshots

The images on the repository's front page ([README.md](../../README.md)). They show the page with the fictional
Example Ranch data. Retake them when the page changes, with the same window sizes, pixel density and reduced motion
(below), and keep the file names so the README's links still work. The two section images are as tall as their
sections, so their height can change; update the sizes in the table after each retake.

| File | What it shows | Size in pixels |
|---|---|---|
| `screenshot.png` | The top of the page on a desktop: summary numbers and the exception report | 2560 x 1800 |
| `water.png` | Water tank levels | 2416 x 1134 |
| `grazing-gain.png` | Grazing rotation and daily gain | 2416 x 1306 |
| `phone.png` | The page on a phone | 780 x 1688 |

They were taken for the redesign commit `f9ef651` (2026-10-20) with a Playwright Chromium script in Claude's session,
which is not saved in this repository: twice the pixel density, reduced motion; `screenshot.png` is a 1280 x 900
window, `water.png` and `grazing-gain.png` are the `#water` and `.grid2` sections of that window, and `phone.png` is
a 390 x 844 phone window with touch. Checked here: the pixel sizes above, read from the PNG headers, are twice those
windows (the two sections are 1208 px wide at 1280). Not checkable from the repository: the reduced-motion and touch
settings.

The audit's own baseline screenshots of the page before the redesign are in
[audit/screenshots/](../audit/screenshots/README.md). The Drive copy is the folder `screenshots`.
