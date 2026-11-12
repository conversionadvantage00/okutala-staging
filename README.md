# Okutala Etosha Lodge: staging

Review build (v4) of the new Okutala Etosha Lodge website by Conversion Advantage. Static HTML, CSS and JS, no build step.

## Structure

```
index.html              the whole site (home + the three room pages, routed with #/room-name)
assets/css/style.css    theme, layout and motion
assets/js/main.js       site behaviour (scroll, reveals, room pages, accordions, gallery, form)
assets/js/lenis.min.js  smooth scrolling (Lenis 1.3.15, MIT)
assets/fonts/           heading serif (Cormorant Garamond, SIL Open Font License)
assets/img/             photos and the linen background texture
```

## Run locally

Open `index.html` in a browser, or serve the folder: `python3 -m http.server` and go to http://localhost:8000.

## Staging notes

- The site is set to `noindex` (meta tag + robots.txt). Remove both before launch.
- The "Heading font" switch (bottom right) is for client review only. Remove the `#typeToggle` element before launch.
- Enquiry email is set in `assets/js/main.js` (`CONFIG.ENQUIRY_TO`). To confirm with the client: reservations@okutala.com or reservations@okutalalodge.com.
- Booking links go to Nightsbridge (`CONFIG.NIGHTSBRIDGE_URL`).
- Hero is ready for the December video: see the comment in the hero section of `index.html`.
