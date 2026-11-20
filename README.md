# Okutala Etosha Lodge: staging

Review build (v5, client feedback 17-18 Nov) of the new Okutala Etosha Lodge website by Conversion Advantage. Static HTML, CSS and JS, no build step.

## Structure

```
index.html              the whole site (one page; room details open in panels, old #/room links still work)
assets/css/style.css    theme, layout and motion
assets/js/main.js       site behaviour (scroll, reveals, room pages, accordions, gallery, form)
assets/js/lenis.min.js  smooth scrolling (Lenis 1.3.15, MIT)
assets/fonts/           heading serif (Cormorant Garamond, SIL Open Font License)
assets/img/             photos and the giraffe line-pattern background
```

## Run locally

Open `index.html` in a browser, or serve the folder: `python3 -m http.server` and go to http://localhost:8000.

## Staging notes

- The site is set to `noindex` (meta tag + robots.txt). Remove both before launch.
- Forms: every enquiry opens a form (no email-app links). Accommodation, transfers and general enquiries go to reservations@okutalalodge.com; fly-in arrivals go to foh@okutala.com (`CONFIG` in `assets/js/main.js`).
- Forms are NOT connected on staging (`CONFIG.FORMS_LIVE = false`): they show a thank-you note and send nothing. To go live, set `FORMS_LIVE: true` (uses FormSubmit; each inbox gets a one-time activation email) or point `FORM_SERVICE` at another form service.
- Booking links go to Nightsbridge (`CONFIG.NIGHTSBRIDGE_URL`).
- Hero is ready for the December video: see the comment in the hero section of `index.html`.
