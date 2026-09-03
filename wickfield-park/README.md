# Wickfield Park — Website

Marketing site for **Wickfield Park**, an RV park at 1919 N Jardot Rd, Stillwater, OK.

11 oversized pull-through sites · free 50 amp electric · free WiFi · dog park · chipping green ·
nightly, weekly and monthly rates · reservations through Firefly.

## Stack

One static page — `index.html` with inline CSS and a few lines of vanilla JS. No build step, no
dependencies, no third-party requests except the Google Maps embed. Preview it by opening the file,
or:

```
python3 -m http.server 8000    # then visit http://localhost:8000
```

## Files

```
index.html                    the whole site
assets/logo.svg               primary horizontal lockup (dark, for light backgrounds)
assets/logo-reversed.svg      same lockup in cream, for dark backgrounds
assets/logo-mark.svg          the "field" mark on its own — favicon, profile pictures
assets/logo-badge.svg         alternate: the horizon roundel, for signage and merch
assets/logo-wordmark.svg      alternate: wordmark with horizon rule, no mark
assets/og-card.png            1200×630 share card for Facebook / texts / link previews
assets/fonts/                 Bitter + Inter, self-hosted (82 KB total)
robots.txt / sitemap.xml      basic SEO files
```

The header and footer logos are inlined directly in `index.html` (so they pick up the webfont).
If you change the logo, update those two inline `<svg>` blocks as well as the files above.

## Reservations (Firefly)

Wired up and live. The booking link lives in one place, at the bottom of `index.html`:

```js
const FIREFLY = {
  bookingUrl: "https://app.fireflyreservations.com/reserve/property/WickfieldPark",
  embed: false
};
```

Every "Book" button carries `data-book` and is pointed at that URL. The same URL is also hardcoded
on those links so they keep working with JavaScript off — **if you change the URL, change it in the
config and find-and-replace the old one in the file.**

`embed: false` opens Firefly in a new tab. Set it to `true` to load their calendar in an iframe on
the page instead — but check it on the live site first: many booking engines send
`X-Frame-Options: DENY`, which would render a blank box. If Firefly gives you a `<script>` widget
snippet instead of a URL, paste it inside `#firefly-frame` in place of the reserve card.

## Still to do before launch

Search the file for `TODO`.

- [ ] **Rates** — the three cards show `$—`. Drop in real nightly / weekly / monthly starting rates.
- [ ] **Contact form** — it posts to `https://formspree.io/f/REPLACE_WITH_FORM_ID` and will not
      deliver until that's a real form ID. Create a free form at formspree.io, or swap in another
      handler.
- [ ] **Drive times** — the location section lists ~10 min to campus / stadium / downtown. Verify.
- [ ] **Check-in / check-out times** and any park rules to publish.
- [ ] **Photos** — the site is deliberately photo-free for now (drawn horizons and icons instead).
      When photos exist, the natural slots are the hero background, the illustrated panel in
      "Built for big rigs", and a new gallery section.
- [ ] **Site specs** — exact length/width, surface, and whether water & sewer are at every site.
      The page currently claims electric and WiFi only.
- [ ] **Opening date** — the top bar and hero say "Now taking reservations." Add a date if you want
      one.

## Hosting

Any static host. For GitHub Pages: Settings → Pages → deploy from `main`, root folder. For the
wickfieldpark.com domain, add a `CNAME` file containing `wickfieldpark.com` and point DNS at GitHub.

---

**Note:** these files are staged here on the `claude/wickfield-park-website-xfw78p` branch only
because the Wickfield Park GitHub repo doesn't exist yet — the GitHub app in this session can't
create repositories. Once `TyWickMedia/wickfield-park` exists, the contents of this folder move to
that repo's root and this folder goes away.
