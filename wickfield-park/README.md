# Wickfield Park — Website

Marketing site for **Wickfield Park**, an RV park at 1919 N Jardot Rd, Stillwater, OK.

11 oversized pull-through sites · free 50 amp electric · free WiFi · dog park · chipping green ·
$60 a night · $250 a week · $500 a month · reservations through Firefly.

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

## The day you open: flip one switch

The site currently runs in pre-opening mode. One flag at the bottom of `index.html` controls it:

```js
const FIREFLY = {
  bookingUrl: "https://app.fireflyreservations.com/reserve/property/WickfieldPark",
  bookingOpen: false,   // ← flip to true the day reservations open
  embed: false
};
```

**`bookingOpen: false`** (now) — the top bar and hero say "Opening soon", every call-to-action reads
"Ask About Dates" and scrolls to the contact form, and the reservations section invites people to
send their dates.

**`bookingOpen: true`** — the same page says "Now taking reservations", every call-to-action changes
its wording ("Check Availability", "Book Your Site") and points at Firefly in a new tab, and the
reservations section switches to the reserve card. Nothing else needs editing.

The wording for both states lives in the HTML: `data-open-text` on the two "opening soon" phrases,
and `data-open-label` / `data-open-href` on each button. To reword a button for the open state, edit
its `data-open-label`.

`embed` only matters once `bookingOpen` is true. `false` opens Firefly in a new tab (the safe
default). `true` loads their calendar in an iframe on the page — check it on the live site first,
because many booking engines send `X-Frame-Options: DENY` and would leave a blank box. If Firefly
gives you a `<script>` widget snippet instead of a URL, paste it inside `#firefly-frame`.

## Still to do before launch

Search the file for `TODO`.

- [ ] **Contact form** — it posts to `https://formspree.io/f/REPLACE_WITH_FORM_ID` and will not
      deliver until that's a real form ID. This is the only thing on the page that is actively
      broken: with the park pre-opening, every call-to-action leads here.
- [ ] **Drive times** — the location section lists ~10 min to campus / stadium / downtown. Verify.
- [ ] **Check-in / check-out times** and any park rules to publish.
- [ ] **Photos** — the site is deliberately photo-free for now (drawn horizons and icons instead).
      When photos exist, the natural slots are the hero background, the illustrated panel in
      "Built for big rigs", and a new gallery section.
- [ ] **Site specs** — exact length/width, surface, and whether water & sewer are at every site.
      The page currently claims electric and WiFi only.
- [ ] **Opening date** — the page says "Opening soon" with no date. Add one when you have it, and
      flip `bookingOpen` when reservations open.

## Hosting

Any static host. For GitHub Pages: Settings → Pages → deploy from `main`, root folder. For the
wickfieldpark.com domain, add a `CNAME` file containing `wickfieldpark.com` and point DNS at GitHub.

---

**Note:** these files are staged here on the `claude/wickfield-park-website-xfw78p` branch only
because the Wickfield Park GitHub repo doesn't exist yet. Once `TyWickMedia/wickfield-park` exists,
the contents of this folder move to that repo's root and this folder goes away.
