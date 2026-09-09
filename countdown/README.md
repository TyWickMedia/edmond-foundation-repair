# Move Day Manifest

A countdown to **Tuesday 13 October 2026, 10:00 PM** (device local time), installable as a
progressive web app.

This folder is self-contained and is not linked from the main site.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page. All CSS and JS are inline; fonts come from Google Fonts. |
| `manifest.json` | Install metadata (name, icons, standalone display). |
| `sw.js` | Service worker. Caches the shell so the countdown runs with no network. |
| `icons/` | Generated 192px, 512px and 180px Apple touch icons. |

## Installing

Serve the folder over HTTPS, then open `/countdown/` on the phone.

- **iPhone:** Share, then Add to Home Screen.
- **Android:** browser menu, then Install app.

A service worker requires HTTPS (or `localhost`), so the install prompt will not appear from a
`file://` URL.

## Changing the date

Both constants live in one place near the bottom of `index.html`:

```js
var TARGET = new Date(2026, 9, 13, 22, 0, 0, 0);   // month is 0-indexed: 9 = October
var START  = new Date(2026, 8, 9, 0, 0, 0, 0);     // start of the packing-window bar
```

After editing, bump `CACHE` in `sw.js` so installed copies pick up the new version.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000/countdown/
