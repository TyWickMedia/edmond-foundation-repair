# Wickfield Park — Website

Marketing site for **Wickfield Park**, an RV park at 1919 N Jardot Rd, Stillwater, OK.

11 oversized pull-through sites · 50 amp electric · free WiFi · dog park · chipping green ·
daily, weekly and monthly rates.

## Stack

A single static page — `index.html` with inline CSS and a few lines of vanilla JS. No build step,
no dependencies. Open the file in a browser to preview, or:

```
python3 -m http.server 8000    # then visit http://localhost:8000
```

## Files

```
index.html                       the whole site
assets/logo-placeholder.svg      PLACEHOLDER logo (header + footer + favicon)
assets/img/hero.svg              PLACEHOLDER hero image
assets/img/pull-through.svg      PLACEHOLDER photo
assets/img/dog-park.svg          PLACEHOLDER photo
assets/img/chipping-green.svg    PLACEHOLDER photo
assets/img/sunset.svg            PLACEHOLDER photo
robots.txt / sitemap.xml         basic SEO files (update the domain)
```

## Connecting Firefly Reservations

The booking section (`#book`) is wired up and waiting on one value. At the bottom of `index.html`:

```js
const FIREFLY = {
  bookingUrl: "",   // ← paste the Firefly booking URL here
  embed: true
};
```

1. In Firefly, find your public online-booking URL (Settings → Online Booking).
2. Paste it into `bookingUrl`.
3. Leave `embed: true` to load the calendar in an iframe on the page, or set it to `false` to
   send every "Book" button straight out to Firefly in a new tab.

Every booking button on the page (top bar, header, hero, sites, game-day, rates) is marked
`data-book`, so this one value drives all of them.

If Firefly provides a `<script>` widget snippet rather than a plain URL, paste the snippet inside
`#firefly-frame` in place of `#firefly-fallback`, and still set `bookingUrl` so the nav buttons work.

## Before launch — placeholders to replace

Search the file for `TODO` and `PLACEHOLDER`. In short:

- [ ] **Logo** — replace `assets/logo-placeholder.svg` with the real logo (keep the filename, or
      update the two `<img>` refs). SVG preferred; PNG ~600×180 with transparency also fine.
- [ ] **Photos** — swap the five placeholder SVGs in `assets/img/` for real photos (~1600px wide).
- [ ] **Phone number** — appears in the top bar, booking fallback, contact section, footer and the
      JSON-LD block. Currently `(405) 000-0000`.
- [ ] **Email address** — currently `info@wickfieldpark.com`.
- [ ] **Rates** — the three rate cards show `$—`. Drop in real starting rates.
- [ ] **Firefly booking URL** — see above.
- [ ] **Contact form** — the form posts to a Formspree placeholder
      (`https://formspree.io/f/REPLACE_WITH_FORM_ID`). Create a free Formspree form and paste the ID,
      or swap in another handler.
- [ ] **Domain** — `wickfieldpark.com` is assumed in the canonical tag, Open Graph tags,
      `robots.txt` and `sitemap.xml`.
- [ ] **ZIP code** — 74075 assumed for N Jardot Rd; confirm.
- [ ] **Site specs** — exact site length/width, surface, and whether water & sewer are full hookup
      at every site.
- [ ] **Drive times** — the location section lists approximate times to campus, the stadium and
      downtown; verify before launch.
- [ ] **Check-in / check-out times and park rules** — the "Before you arrive" section is generic.

## Hosting

Any static host works. For GitHub Pages: Settings → Pages → deploy from `main`, root folder. A
custom domain is set by adding a `CNAME` file containing the domain and pointing DNS at GitHub.

---

**Note:** these files are staged here on the `claude/wickfield-park-website-xfw78p` branch only
because the Wickfield Park GitHub repo doesn't exist yet — the GitHub app in this session can't
create repositories. Once `TyWickMedia/wickfield-park` exists, the contents of this folder move to
that repo's root and this folder goes away.
