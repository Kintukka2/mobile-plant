/* ==========================================================================
   Sprout — UI helpers
   ========================================================================== */

window.UI = (function () {

  /* ---------- Escaping ----------
     Everything user-typed goes through esc() before reaching innerHTML. */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Escape for use inside a single-quoted HTML attribute. */
  function attr(s) { return esc(s); }

  /* ---------- Icons (inline SVG, no dependencies) ---------- */
  const PATHS = {
    home:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/>',

    /* --- Room marks ---
       A room can wear one of these instead of its initial. Same 24x24
       artboard, same 1.35 stroke, same round joins as everything above:
       drawn as furniture seen straight on, so a strip of them reads as one
       set rather than twelve separate pictures. Two or three paths each —
       at 22px inside the room plate, a fourth stops being legible and starts
       being texture. */
    sofa:      '<path d="M5 12V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V12"/><rect x="3" y="12" width="18" height="6" rx="2"/><path d="M6 18v1.8M18 18v1.8"/>',
    bed:       '<path d="M3 19V7"/><path d="M3 13h13a5 5 0 0 1 5 5v1"/><path d="M3 19h18"/><rect x="5" y="9.4" width="5.4" height="3.6" rx="1.5"/>',
    hob:       '<path d="M4 11h15"/><path d="M5.5 11v4a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-4"/><path d="M19 12h1.6a1.6 1.6 0 0 1 0 3.2H19"/><path d="M9 7.6c0-1.1 1-1.6 1-2.7M13.5 7.6c0-1.1 1-1.6 1-2.7"/>',
    bath:      '<path d="M5 11V6.6A2.1 2.1 0 0 1 9.2 6"/><path d="M3 11h18v2.2a4.8 4.8 0 0 1-4.8 4.8H7.8A4.8 4.8 0 0 1 3 13.2Z"/><path d="M7 18v1.8M17 18v1.8"/>',
    book:      '<path d="M4 19V6a2 2 0 0 1 2-2h12v15"/><path d="M6 19h12"/><path d="M6 19a2 2 0 0 1 0-4h12"/>',
    /* A coat rail was the first drawing for a hallway and it did not survive
       the size: three stems with a hook on the end came out as three bars
       with a smudge, closer to a crown than to anything you hang a coat on.
       Stairs read at 22px because the shape is the whole of the meaning. */
    stairs:    '<path d="M4 20v-3.5h4v-3.5h4V9.5h4V6"/><path d="M3 20h18"/>',
    railing:   '<path d="M3 20h18"/><path d="M4.5 20v-7h15v7"/><path d="M4.5 13h15"/><path d="M9 13v7M15 13v7"/>',
    glasshouse:'<path d="M3 20V10l9-6 9 6v10"/><path d="M2 20h20"/><path d="M12 4.5V20M3 12.5h18"/>',
    cutlery:   '<path d="M6 3v5a2.4 2.4 0 0 0 4.8 0V3"/><path d="M8.4 10.4V21"/><path d="M17.4 3c-1.3 1.7-1.9 3.4-1.9 5.4 0 1.7.8 2.7 1.9 2.9V21"/>',
    door:      '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="15.6" cy="12.4" r="1"/>',
    parasol:   '<path d="M12 11.5V21"/><path d="M4 11.5a8 8 0 0 1 16 0Z"/><path d="M3 21h18"/>',
    monitor:   '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6"/><path d="M12 16v4"/>',

    leaf:      '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16Z"/><path d="M4 20c4-4 7-6 11-7"/>',
    grid:      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    stethoscope: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v3a4 4 0 0 0 8 0v-2"/><circle cx="19" cy="12" r="2"/>',
    user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    check:     '<path d="M4 12.5 9 17.5 20 6.5"/>',
    x:         '<path d="M6 6l12 12M18 6 6 18"/>',
    back:      '<path d="M15 5l-7 7 7 7"/>',
    chevron:   '<path d="M9 5l7 7-7 7"/>',
    drop:      '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    camera:    '<path d="M3 8.5A2 2 0 0 1 5 6.5h1.8l1.2-2h8l1.2 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    ruler:     '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M7 8v3M12 8v4M17 8v3"/>',
    note:      '<path d="M5 4h11l3.5 3.5V20H5Z"/><path d="M8 10h8M8 14h6"/>',
    trash:     '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit:      '<path d="M4 20h4L20 8l-4-4L4 16Z"/>',
    /* A circle with eight radial spokes — which is exactly how `sun` is
       built, and at 18px the two are the same picture. Keep that in mind
       before reaching for it beside a theme toggle; `sliders` below is the
       settings mark for anywhere the two could meet. */
    gear:      '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
    sliders:   '<path d="M4 7h9M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 12h3M11 12h9"/><circle cx="9" cy="12" r="2"/><path d="M4 17h9M17 17h3"/><circle cx="15" cy="17" r="2"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    pin:       '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    sprout:    '<path d="M12 20.5V9.5"/><path d="M12 14C8.5 14 6.5 11.75 6.5 8.5c3.5 0 5.5 2.25 5.5 5.5Z"/><path d="M12 11c3.5 0 5.5-2.25 5.5-5.5-3.5 0-5.5 2.25-5.5 5.5Z"/>',
    scissors:  '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 18M8 16.5 20 6"/>',
    bell:      '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    info:      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8.2v.1"/>',
    warn:      '<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4.5M12 17.4v.1"/>',
    cloud:     '<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 18Z"/>',
    compass:   '<circle cx="12" cy="12" r="8.5"/><path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5Z"/>',
    arrowDown: '<path d="M12 4.5v15"/><path d="M6.5 14l5.5 5.5L17.5 14"/>',
    arrowUp:   '<path d="M12 19.5v-15"/><path d="M6.5 10 12 4.5 17.5 10"/>',
    window:    '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M12 3.5v17M4 12h16"/>',
    moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    rain:      '<path d="M7 15a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 15Z"/><path d="M8.5 18.5 7.5 21M12 18.5 11 21M15.5 18.5 14.5 21"/>',
    flask:     '<path d="M9 3h6M10 3v5L5 19a1.5 1.5 0 0 0 1.4 2h11.2A1.5 1.5 0 0 0 19 19l-5-11V3"/><path d="M7.4 14h9.2"/>',
    star:      '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.3-4.1 5.9-.8Z"/>',
    heart:     '<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z"/>',
    paw:       '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="17" cy="9" r="2"/><path d="M12 11c3 0 5 2 5 4.2S14.8 20 12 20s-5-2.6-5-4.8S9 11 12 11Z"/>',
    thermo:    '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z"/><circle cx="12" cy="18" r="1.4"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3.4 2.2"/>',
    calendar:  '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
    archive:   '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1"/><path d="M5 9v10.5h14V9M9.8 13h4.4"/>',
    download:  '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>',
    upload:    '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 19.5h15"/>',
    sparkle:   '<path d="M12 3.5l1.7 4.8L18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7Z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/>',

    /* --- Care, environment and condition glyphs ---
       Added for the de-emoji pass: every lookup table that used to carry a
       colour emoji now names one of these instead. */
    droplets:  '<path d="M8 3.5s3.2 3.6 3.2 6a3.2 3.2 0 0 1-6.4 0c0-2.4 3.2-6 3.2-6Z"/><path d="M16.5 10s3.5 4 3.5 6.6a3.5 3.5 0 0 1-7 0c0-2.6 3.5-6.6 3.5-6.6Z"/>',
    arid:      '<path d="M3 17.5h18"/><path d="M6.5 17.5c1.5-2.6 3.6-4 5.5-4s4 1.4 5.5 4"/><path d="M12 10V6M9.5 7.5 12 6l2.5 1.5"/>',
    wheat:     '<path d="M12 21V9"/><path d="M12 9c0-2.4 1.4-4 3.5-4.6C15.5 6.8 14.1 8.4 12 9Z"/><path d="M12 9c0-2.4-1.4-4-3.5-4.6C8.5 6.8 9.9 8.4 12 9Z"/><path d="M12 14c0-2.2 1.3-3.6 3.2-4.2C15.2 12 13.9 13.4 12 14Z"/><path d="M12 14c0-2.2-1.3-3.6-3.2-4.2C8.8 12 10.1 13.4 12 14Z"/>',
    rotate:    '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
    mist:      '<path d="M4 8.5h10M7 12.5h11M5 16.5h9"/><path d="M18.5 5.5c1.2.6 1.8 1.6 1.8 2.6"/>',
    pot:       '<path d="M5 9h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8Z"/><path d="M4 9h16"/><path d="M12 9c0-2.6 1.6-4.4 4.4-4.8C16.4 6.6 14.8 8.6 12 9Z"/>',
    skull:     '<path d="M12 3a7.5 7.5 0 0 1 7.5 7.5c0 2.6-1.3 3.8-2 4.6-.5.6-.5 1.4-.5 2.4a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5c0-1 0-1.8-.5-2.4-.7-.8-2-2-2-4.6A7.5 7.5 0 0 1 12 3Z"/><circle cx="9.3" cy="11" r="1.3"/><circle cx="14.7" cy="11" r="1.3"/>',
    ban:       '<circle cx="12" cy="12" r="8.5"/><path d="M6.4 17.6 17.6 6.4"/>',
    shield:    '<path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.2-7 9.4-4.1-2.2-7-5.2-7-9.4V6Z"/><path d="M9 12.2l2.2 2.2L15.4 10"/>',
    dial:      '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 17l4.2-4.8"/><circle cx="12" cy="17" r="1.2"/>',
    flower:    '<circle cx="12" cy="11" r="2.2"/><path d="M12 8.8c0-2 .8-3.4 2.6-3.4 0 2-1 3-2.6 3.4Z"/><path d="M12 8.8c0-2-.8-3.4-2.6-3.4 0 2 1 3 2.6 3.4Z"/><path d="M14.2 11c2 0 3.4.8 3.4 2.6-2 0-3-1-3.4-2.6Z"/><path d="M9.8 11c-2 0-3.4.8-3.4 2.6 2 0 3-1 3.4-2.6Z"/><path d="M12 13.2V21"/>',
    snow:      '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
    fall:      '<path d="M20 5c0 7-4.5 11-9.5 11S4 13.5 4 10.5"/><path d="M4 20c3.5-2 6.5-5.5 8.5-9.5"/>',
    cloudSun:  '<circle cx="8" cy="7.5" r="3"/><path d="M8 2.2v1.4M8 11.4v1.4M2.8 7.5h1.4M11.8 7.5h1.4M4.3 3.8l1 1M10.7 10.2l1 1M11.7 3.8l-1 1M5.3 10.2l-1 1"/><path d="M10 20a3.6 3.6 0 0 1 .3-7.2 4.8 4.8 0 0 1 9 1.4A3 3 0 0 1 18.5 20Z"/>',
    storm:     '<path d="M7 16.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.4 1.6A3.4 3.4 0 0 1 17 16.5"/><path d="M13 12.5 10 17h3l-1 4 4-6h-3Z"/>',
    globe:     '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.4 4 5.4 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.4-4-9s1.4-6.6 4-9Z"/>',
    /* Cats get the paw; dogs get a head in profile. Using one paw for both
       would make the two rows indistinguishable at 13px, which defeats the
       point of a per-species toxicity row. */
    dog:       '<path d="M5.5 5.5 8 8.2V13a4 4 0 0 0 4 4 4 4 0 0 0 4-4V8.2l2.5-2.7c.6 1.6.8 3.2.8 4.8 0 1 .4 1.6 1.2 2.2-1 .6-1.6 1.4-1.8 2.6-.4 2.6-2.6 4.4-6.7 4.4s-6.3-1.8-6.7-4.4c-.2-1.2-.8-2-1.8-2.6.8-.6 1.2-1.2 1.2-2.2 0-1.6.2-3.2.8-4.8Z"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="11" r="1"/>',
    person:    '<circle cx="12" cy="7" r="3.4"/><path d="M5.5 20.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>',

    /* The brand mark, drawn on the icon grid so it can sit in a row of
       glyphs. The favicon, the install icon and the sidebar lockup are the
       same three paths at other scales — one drawing, four placements,
       where there used to be four drawings. */
    mark:      '<path d="M12 20.5V9.5"/><path d="M12 14C8.5 14 6.5 11.75 6.5 8.5c3.5 0 5.5 2.25 5.5 5.5Z"/><path d="M12 11c3.5 0 5.5-2.25 5.5-5.5-3.5 0-5.5 2.25-5.5 5.5Z"/>',

    /* --- Diagnosis glyphs ---
       Every cause in PROBLEM_DATA names one of these. They are deliberately
       shared within a family — the five pests draw from `bug`/`fly`/`web`/
       `cloud`/`bumps`, the three fungi from `spore`/`target`, the watering
       faults from `drop`/`dropOff`/`droplets`/`wave` — so the glyph tells you
       what *kind* of problem you are looking at before you read the name.
       Forty unique pictograms would have been forty pieces of decoration;
       this way the mark carries a category. */
    dropOff:   '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M4 20 20 4"/>',
    wave:      '<path d="M3 14c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 19h18"/>',
    tap:       '<path d="M4 8h7v3H4Z"/><path d="M11 9.5h4a3 3 0 0 1 3 3V14"/><path d="M7.5 11v3"/><path d="M7.5 17.5s2-2 2-3.2a2 2 0 0 0-4 0c0 1.2 2 3.2 2 3.2Z"/>',
    crystal:   '<path d="M12 3 20 9v6l-8 6-8-6V9Z"/><path d="M4 9h16M12 3v18"/>',
    sunOff:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/><path d="M4 20 20 4"/>',
    flame:     '<path d="M12 21c3.6 0 6-2.3 6-5.4 0-4.4-6-12.6-6-12.6S6 11.2 6 15.6C6 18.7 8.4 21 12 21Z"/><path d="M12 21c-1.7 0-2.8-1.2-2.8-2.8 0-2 2.8-5 2.8-5s2.8 3 2.8 5c0 1.6-1.1 2.8-2.8 2.8Z"/>',
    spiral:    '<path d="M12 12a2 2 0 1 1 2 2 4 4 0 0 1-4-4 6 6 0 0 1 6-6 8 8 0 0 1 8 8 10 10 0 0 1-10 10c-4.2 0-7.6-2.2-9.4-5.4"/>',
    layers:    '<path d="M12 3.5 21 8l-9 4.5L3 8Z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/>',
    wind:      '<path d="M3 8.5h9.5a2.8 2.8 0 1 0-2.8-2.8"/><path d="M3 13h14a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 17.5h7"/>',
    sleep:     '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/><path d="M14.5 4h4l-4 4.5h4"/>',
    trellis:   '<path d="M6 21V4M18 21V4"/><path d="M6 8h12M6 13h12M6 18h12"/>',
    dna:       '<path d="M8 3c0 6 8 12 8 18"/><path d="M16 3c0 6-8 12-8 18"/><path d="M9.2 7h5.6M8.2 11.5h7.6M9.2 16h5.6"/>',
    move:      '<path d="M12 3v18M3 12h18"/><path d="M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
    bug:       '<path d="M12 8a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0v-2a4 4 0 0 1 4-4Z"/><path d="M12 8V5"/><path d="M10.2 3.5 12 5l1.8-1.5"/><path d="M8 11 4.5 9.5M8 14H4.5M8 16.5 5 18.5M16 11l3.5-1.5M16 14h3.5M16 16.5l3 2"/>',
    fly:       '<ellipse cx="12" cy="14.5" rx="2.2" ry="4"/><path d="M10 11.5C7 8.5 4 8 3 9.5c-1 1.5 2 3.5 7 3"/><path d="M14 11.5c3-3 6-3.5 7-2 1 1.5-2 3.5-7 3"/><path d="M11 10.2 10 8M13 10.2 14 8"/>',
    web:       '<path d="M3.5 3.5 21 21"/><path d="M13 3.5a9.5 9.5 0 0 1 7.5 7.5"/><path d="M8.5 3.5a14 14 0 0 1 12 12"/><path d="M3.5 8.5a14 14 0 0 1 12 12"/><path d="M3.5 13a9.5 9.5 0 0 1 7.5 7.5"/>',
    bumps:     '<path d="M3 17.5h18"/><path d="M4.5 17.5a3 3 0 0 1 6 0"/><path d="M11.5 17.5a3.6 3.6 0 0 1 7.2 0"/><path d="M7.5 11.5a2.4 2.4 0 0 1 4.8 0"/>',
    spore:     '<circle cx="12" cy="12" r="3.2"/><circle cx="6" cy="7" r="1.6"/><circle cx="18.2" cy="7.4" r="1.3"/><circle cx="17.6" cy="17.4" r="1.7"/><circle cx="6.6" cy="17" r="1.2"/>',
    target:    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2"/>',
    microbe:   '<path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z"/><path d="M12 1.5v3M12 19.5v3M4.5 12h-3M22.5 12h-3M6.7 6.7 4.6 4.6M19.4 19.4l-2.1-2.1M17.3 6.7l2.1-2.1M4.6 19.4l2.1-2.1"/><circle cx="10" cy="10.5" r="1.1"/><circle cx="14" cy="13.5" r="1.1"/>'
  };

  /* Every icon carries the `ico` class purely so the stylesheet can give it a
     fallback size. An inline SVG with no width stretches to fill its flex
     parent, so an icon dropped somewhere without a matching container rule
     would otherwise render hundreds of pixels tall. Container rules such as
     `.btn svg` are more specific and still win where they exist. */
  /* Stroke weight is the single biggest tell in an icon set. At 1.9 the
     glyphs read as a utility app; at 1.35 they sit as hairline engravings
     next to the high-contrast serif, which is the whole point of the
     Viridium direction. Container rules may override per context. */
  function icon(name, cls) {
    /* A misspelled name used to render as an invisible nothing, which is the
       one failure mode you cannot see in a screenshot. It now draws the info
       mark and says so, so a typo surfaces in the console instead of leaving
       a hole in a row of otherwise perfect icons. */
    if (!PATHS[name] && typeof console !== 'undefined' && console.warn) {
      console.warn('UI.icon: no glyph named "' + name + '"');
    }
    const p = PATHS[name] || PATHS.info;
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ---------- Dates ---------- */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function toISO(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return dt.getFullYear() + '-' + m + '-' + day;
  }

  function fromISO(s) {
    if (!s) return null;
    const parts = String(s).split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(a, b) {
    const MS = 86400000;
    return Math.round((b.getTime() - a.getTime()) / MS);
  }

  function addDays(d, n) {
    const out = new Date(d.getTime());
    out.setDate(out.getDate() + n);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  function fmtDate(d) {
    const dt = (d instanceof Date) ? d : fromISO(d);
    if (!dt) return '';
    const now = today();
    const s = dt.getDate() + ' ' + MONTHS[dt.getMonth()];
    return dt.getFullYear() === now.getFullYear() ? s : s + ' ' + dt.getFullYear();
  }

  /* Human-friendly relative day, e.g. "in 3 days", "2 days overdue". */
  function relDays(n) {
    if (n === 0)  return 'today';
    if (n === 1)  return 'tomorrow';
    if (n === -1) return 'yesterday';
    if (n > 0)    return 'in ' + n + ' days';
    return Math.abs(n) + ' days ago';
  }

  function relDue(n) {
    if (n === 0)  return 'Due today';
    if (n === 1)  return 'Due tomorrow';
    if (n > 1)    return 'In ' + n + ' days';
    if (n === -1) return '1 day overdue';
    return Math.abs(n) + ' days overdue';
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : (many || one + 's'));
  }

  /* A temperature, with the degree mark set apart from the figure.
     Cormorant draws U+00B0 as a high-contrast lowercase o — lovely inside a
     paragraph, but at the 44px the home screen sets its current temperature,
     it reads as a stray letter hanging off the number rather than as a unit.
     Wrapping it lets the stylesheet set the mark in the sans, small and
     raised, where it is a plain even ring that recedes into the figure.
     Only worth doing where the number is in the display serif; body copy
     uses the character directly and is right to. */
  function deg(n, unit) {
    return n + '<span class="deg">\u00B0' + (unit || '') + '</span>';
  }

  /* ---------- Toast ----------
     Only ever three on screen at once. Beyond that the stack turns into a
     wall and the newest — the one that actually relates to what the user
     just did — gets pushed out of the reading position. */
  const TOAST_MAX = 3;

  function toast(msg, kind) {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;

    while (wrap.children.length >= TOAST_MAX) {
      wrap.removeChild(wrap.firstChild);
    }

    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast-' + kind : '');
    const ico = kind === 'warn' ? 'warn' : kind === 'leaf' ? 'check' : 'info';
    t.innerHTML = '<span class="toast-ico">' + icon(ico) + '</span>' +
                  '<span>' + esc(msg) + '</span>';
    wrap.appendChild(t);

    let gone = false;
    function dismiss() {
      if (gone) return;
      gone = true;
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 360);
    }

    // Tapping a toast should get rid of it — it is in the way by definition.
    t.addEventListener('click', dismiss);
    setTimeout(dismiss, kind === 'warn' ? 4200 : 2800);
  }

  /* ---------- Sheet (modal) ---------- */
  let sheetOnClose = null;

  /* Move a sheet's closing row of buttons out of the scrolling body and into
     the pinned footer.

     Every sheet in the app builds its actions the same way — a trailing
     `.row` of nothing but `.btn`s — so the shape is reliable enough to detect
     rather than declare, and detecting it fixes all eleven sheets at once
     without eleven edits that could each be forgotten. The alternative was a
     new `actions` argument on openSheet, which means every call site has to
     be found and changed, and any missed one silently keeps the old
     behaviour.

     The test is deliberately strict: last element child, is a `.row`, has at
     least one child, and *every* child is a `.btn`. A row mixing a button
     with a hint or a chip is a content row that happens to end the sheet, not
     an action bar, and pinning it would be wrong. When nothing matches, the
     footer stays empty and collapses — the sheet behaves exactly as before.

     Note this runs before onMount, and onMount is handed the whole `.sheet`
     rather than the body, so callers' querySelector('#r-save') still reaches
     the button after it has been relocated. */
  function liftSheetActions(body, foot) {
    const last = body.lastElementChild;
    if (!last || !last.classList.contains('row')) return;
    const kids = last.children;
    if (!kids.length) return;
    for (let i = 0; i < kids.length; i++) {
      if (!kids[i].classList.contains('btn')) return;
    }
    /* The inline margin-top these rows carry (6, 12, 18 and 20px across the
       call sites — the drift you get from spacing a component by hand at each
       use) is meaningless once the row is its own panel with its own padding,
       and would just push the buttons off-centre. */
    last.style.marginTop = '';
    foot.appendChild(last);
  }

  function openSheet(title, bodyHTML, onMount, onClose) {
    const backdrop = document.getElementById('sheet-backdrop');
    document.getElementById('sheet-title').textContent = title;
    const body = document.getElementById('sheet-body');
    const foot = document.getElementById('sheet-foot');
    foot.innerHTML = '';
    body.innerHTML = bodyHTML;
    liftSheetActions(body, foot);
    body.scrollTop = 0;
    /* If a previous sheet is still animating out, cancel that and reuse the
       node — otherwise the exit animation plays over the new content. */
    backdrop.classList.remove('is-closing');
    closing = false;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    sheetOnClose = onClose || null;
    /* The whole plate, not the body: the action row now lives in the footer,
       which is a sibling of the body, so a mount callback handed the body
       could no longer find its own Save button. Every one of these callbacks
       only ever reads via querySelector (nothing mutates the container), so
       widening the scope is safe and keeps all eleven call sites untouched. */
    if (typeof onMount === 'function') onMount(document.getElementById('sheet'));
    /* Focus stays scoped to the body deliberately — the first field, not the
       first button. Searching the plate would match a footer button whenever
       a sheet's controls come after it in document order. */
    const first = body.querySelector('input, select, textarea, button');
    if (first && !first.classList.contains('chip')) {
      setTimeout(function () { first.focus(); }, 120);
    }
  }

  /* Let the sheet animate out before it is torn down. The body is cleared
     only after the exit finishes, otherwise the plate visibly empties
     itself on the way down. `closing` guards against a double-close while
     the animation is still running. */
  let closing = false;

  function closeSheet() {
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop.hidden || closing) return;
    closing = true;
    backdrop.classList.add('is-closing');

    const cb = sheetOnClose;
    sheetOnClose = null;
    document.body.style.overflow = '';

    setTimeout(function () {
      backdrop.classList.remove('is-closing');
      backdrop.hidden = true;
      document.getElementById('sheet-body').innerHTML = '';
      /* The footer holds relocated nodes, so it has to be emptied with the
         body. Left behind, the previous sheet's buttons would still be wired
         to the previous sheet's handlers and would flash under the next one's
         content for as long as it took that sheet to add its own. */
      document.getElementById('sheet-foot').innerHTML = '';
      closing = false;
      if (typeof cb === 'function') cb();
    }, 200);
  }

  function sheetIsOpen() {
    return !document.getElementById('sheet-backdrop').hidden;
  }

  /* ---------- Confirm dialog ---------- */
  function confirmSheet(title, message, confirmLabel, onConfirm, danger) {
    openSheet(title,
      '<p class="dim" style="margin:0 0 20px;line-height:1.6">' + esc(message) + '</p>' +
      '<div class="row" style="gap:8px">' +
        '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>' +
        '<button class="btn ' + (danger ? 'btn-blood' : '') + '" data-act="confirm-yes" style="flex:1">' +
          esc(confirmLabel || 'Confirm') + '</button>' +
      '</div>',
      function (body) {
        body.querySelector('[data-act="confirm-yes"]').addEventListener('click', function () {
          closeSheet();
          onConfirm();
        });
        body.querySelector('[data-act="sheet-cancel"]').addEventListener('click', closeSheet);
      }
    );
  }

  /* ---------- Lightbox ---------- */
  function lightbox(src, caption) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img src="' + attr(src) + '" alt="">' +
      (caption ? '<div class="lightbox-cap">' + esc(caption) + '</div>' : '');

    function shut() {
      box.classList.add('is-closing');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 190);
    }
    function onKey(e) { if (e.key === 'Escape') shut(); }

    box.addEventListener('click', shut);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
  }

  /* ---------- Empty state ----------
     There was a translation table here mapping emoji to icon names, so that
     call sites could keep passing a seedling glyph and still get a hairline
     icon out. It was a kindness that cost us: a wilted-rose glyph with no
     entry in the table fell through to the literal branch and shipped a
     cartoon into a production error screen — invisible to every sweep of the
     views, because the offending character lived in ui.js. Call sites now
     pass an icon name and no fallback path can render a glyph at all.
     (Deliberately written without the characters themselves, so this comment
     does not trip the audit that found them.) */
  function empty(name, title, text, actionHTML) {
    return '<div class="empty">' +
      '<span class="empty-mark">' + icon(name) + '</span>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(text) + '</p>' +
      (actionHTML || '') +
      '</div>';
  }

  /* ---------- Misc ---------- */
  function pill(text, variant, iconName) {
    return '<span class="pill' + (variant ? ' pill-' + variant : '') + '">' +
      (iconName ? icon(iconName) : '') + esc(text) + '</span>';
  }

  /* Simple sparkline-style line chart for growth logs. */
  /* Drawn at a fixed aspect and scaled to fit. It used to stretch to the
     box with preserveAspectRatio="none", which turned every dot into an egg
     and every label into a taller face than the rest of the page; the chart
     looked wrong without anyone being able to say why. A single reading
     draws too — one dot on its line — and no readings draw the empty frame,
     so the tab always has the shape of what it is for. */
  function lineChart(points, unit) {
    points = points || [];
    const W = 320, H = 150, PAD_L = 30, PAD_R = 8, PAD_T = 12, PAD_B = 22;
    const one = points.length === 1;
    if (!points.length) {
      return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
        '<line class="chart-grid" x1="' + PAD_L + '" y1="' + PAD_T + '" x2="' + (W - PAD_R) + '" y2="' + PAD_T + '"/>' +
        '<line class="chart-grid" x1="' + PAD_L + '" y1="' + ((H - PAD_B + PAD_T) / 2) + '" x2="' + (W - PAD_R) + '" y2="' + ((H - PAD_B + PAD_T) / 2) + '"/>' +
        '<line class="chart-grid" x1="' + PAD_L + '" y1="' + (H - PAD_B) + '" x2="' + (W - PAD_R) + '" y2="' + (H - PAD_B) + '"/>' +
        '<path class="chart-ghost" d="M' + PAD_L + ' ' + (H - PAD_B - 8) + ' C 110 ' + (H - PAD_B - 20) + ', 170 ' + (PAD_T + 40) + ', ' + (W - PAD_R) + ' ' + (PAD_T + 14) + '"/>' +
        '<text class="chart-lbl" x="' + PAD_L + '" y="' + (H - 6) + '">First reading</text>' +
        '<text class="chart-lbl" x="' + (W - PAD_R) + '" y="' + (H - 6) + '" text-anchor="end">Today</text>' +
        '</svg>' +
        '<p class="tiny muted center" style="margin:4px 0 0">Measured in ' + esc(unit || 'cm') + '</p>';
    }
    const xs = points.map(function (p) { return p.x; });
    const ys = points.map(function (p) { return p.y; });
    let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (minY === maxY) { minY = minY - 1; maxY = maxY + 1; }
    if (one) { minX = minX - 1; maxX = maxX + 1; }
    const spanX = (maxX - minX) || 1;
    const spanY = (maxY - minY) || 1;

    function px(x) { return PAD_L + ((x - minX) / spanX) * (W - PAD_L - PAD_R); }
    function py(y) { return PAD_T + (1 - (y - minY) / spanY) * (H - PAD_T - PAD_B); }

    const d = points.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + px(p.x).toFixed(1) + ' ' + py(p.y).toFixed(1);
    }).join(' ');

    const area = d + ' L' + px(maxX).toFixed(1) + ' ' + (H - PAD_B) +
                 ' L' + px(minX).toFixed(1) + ' ' + (H - PAD_B) + ' Z';

    const dots = points.map(function (p) {
      return '<circle class="chart-dot" cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="3.5"/>';
    }).join('');

    const yTop = one ? points[0].y : maxY, yBot = one ? null : minY;
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      /* The gradient has to be declared in SVG-land, so it cannot read a CSS
         custom property for its stops. This is the lit emerald from the
         token ramp, hand-carried: on the dark ground the old .22 top stop
         disappeared entirely, so it opens at .34 and fades to nothing. */
      /* Pinned to the plot's own top and floor rather than the area's
         bounding box. Measured against the box, the wash was strongest at
         the highest reading and gone a third of the way down, so a curve
         that climbed steeply showed a fill under its last leg and nothing
         under the rest — the chart looked half-drawn. */
      '<defs><linearGradient id="gGrad" gradientUnits="userSpaceOnUse" x1="0" y1="' + PAD_T + '" x2="0" y2="' + (H - PAD_B) + '">' +
        '<stop offset="0%" stop-color="#3FBE8B" stop-opacity=".30"/>' +
        '<stop offset="100%" stop-color="#3FBE8B" stop-opacity=".05"/>' +
      '</linearGradient></defs>' +
      '<line class="chart-grid" x1="' + PAD_L + '" y1="' + py(yTop).toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + py(yTop).toFixed(1) + '"/>' +
      (yBot === null ? '' : '<line class="chart-grid" x1="' + PAD_L + '" y1="' + py(yBot).toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + py(yBot).toFixed(1) + '"/>') +
      (one ? '' : '<path class="chart-area" d="' + area + '"/>' + '<path class="chart-line" d="' + d + '"/>') + dots +
      '<text class="chart-lbl" x="2" y="' + (py(yTop) + 3).toFixed(1) + '">' + yTop + '</text>' +
      (yBot === null ? '' : '<text class="chart-lbl" x="2" y="' + (py(yBot) + 3).toFixed(1) + '">' + yBot + '</text>') +
      (one
        ? '<text class="chart-lbl" x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(fmtDate(new Date(points[0].x))) + ' · one reading so far</text>'
        : '<text class="chart-lbl" x="' + PAD_L + '" y="' + (H - 6) + '">' + esc(fmtDate(new Date(minX))) + '</text>' +
          '<text class="chart-lbl" x="' + (W - PAD_R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fmtDate(new Date(maxX))) + '</text>') +
      '</svg>' +
      '<p class="tiny muted center" style="margin:4px 0 0">Measured in ' + esc(unit || 'cm') + '</p>';
  }

  /* Stable placeholder wash derived from the plant's name, so a photoless
     plant still reads as its own object rather than one of a row of
     identical grey tiles.

     This returns two custom properties, not a finished gradient, and the
     division of labour is the whole point. The hash decides *identity* — a
     hue in the green band, plus a small lift so two plants that land on the
     same hue stay distinguishable. The theme decides *palette* — how
     saturated, how light, how the raking highlight is coloured. Getting
     that boundary wrong is what shipped a wall of near-black postage stamps
     into the ivory theme: the old version baked 11% lightness into the
     gradient here, where no stylesheet could reach it, so every tile in
     Conservatory was a hole punched in the page.

     It used to compute a hue: 100–143°, forty-four steps off the same hash.
     That band is too narrow and too dark to carry forty-four values — two
     plants could land a degree apart and render identically, so the identity
     it promised was not delivered. Six hand-picked pairs are a number the eye
     can genuinely separate, and they vary in lightness as well as hue, which
     is what does most of the work at this luminance.

     Returning an index rather than a colour is the important part. The class
     resolves through the theme's own tokens, so switching theme re-tints
     every plate on screen — where an inline literal would have gone stale,
     since views are only redrawn on navigation and a theme switch is not one. */
  function tintClass(str) {
    const s = String(str);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1021;
    return 'tmark-' + (h % 6);
  }

  /* Contents of a plant tile: the photo if there is one, otherwise a tinted
     plate with a single hairline leaf. Every site that shows a plant calls
     this, so a plant without a photo looks identical in the task list, the
     lookbook grid, the room strip and the diagnose picker — and the fix for
     all four is one function.

     The caller supplies the container (which owns the size and the radius);
     this fills it. The container needs `position: relative` — see .tmark. */
  function plantTile(photoSrc, seed, label) {
    if (photoSrc) return '<img src="' + attr(photoSrc) + '" alt="">';

    /* The letter, not a leaf. A row of six identical hairline leaves in six
       near-identical dark tints reads as six empty placeholders; a row of
       initials reads as a guest list, and at 34px a letterform survives
       where a 15px icon turns to mush. It also ties the plant back to the
       room monogram, so the two use one vocabulary instead of two. */
    const s = String(label || '').trim();
    const ch = s ? s.charAt(0).toUpperCase() : '·';
    return '<span class="tmark ' + tintClass(seed || 'plant') + '">' +
           '<span class="tmark-t">' + esc(ch) + '</span></span>';
  }

  /* An initial set in the display face inside a hairline square — what a room
     gets instead of a pictogram.

     Rooms used to carry an emoji the user picked from a grid — a sofa, a
     shower, a stack of books, sixteen of them in a palette. The trouble is
     that no two platforms draw those the same way, they arrive
     pre-coloured in someone else's palette, and a sofa glyph tells you
     nothing the word "Living Room" underneath it has not already said. A
     monogram says the same thing in the app's own voice, and a wall of them
     reads as a set rather than as a ransom note. */
  /* A room's plate: its chosen icon, or its initial when it has none. The
     two share the .mono frame so a greenhouse of mixed rooms still reads as
     one column — only what is inside the square changes. */
  function roomMark(room, extra) {
    const name = room && room.name ? room.name : '';
    if (room && room.icon && PATHS[room.icon]) {
      return '<span class="mono mono-ico' + (extra ? ' ' + extra : '') + '" aria-hidden="true">' +
             icon(room.icon) + '</span>';
    }
    return monogram(name, extra);
  }

  function monogram(str, extra) {
    const s = String(str || '').trim();
    const ch = s ? s.charAt(0).toUpperCase() : '·';
    return '<span class="mono' + (extra ? ' ' + extra : '') + '" aria-hidden="true">' +
           esc(ch) + '</span>';
  }

  /* ---------- Premium composition helpers ----------
     Small, repeatable pieces of ornament. They exist as functions rather
     than as copy-pasted markup so the flourishes stay consistent across
     seven view files — the moment a hairline rule is hand-written twice,
     the two start drifting apart. */

  /* Eyebrow: wide-tracked micro caps that label a block without competing
     with the display serif above or beside it. */
  function eyebrow(text) {
    return '<span class="eyebrow">' + esc(text) + '</span>';
  }

  /* The looping script from the wordmark. Reserved for genuine warmth —
     greetings, a plant's nickname, an encouraging aside. Anything
     functional stays in the sans. */
  function script(text) {
    return '<span class="script">' + esc(text) + '</span>';
  }

  /* Ornamental rule: a hairline with a centred diamond. Used to separate
     movements within a view where a full .divider would be too loud. */
  function ornament() {
    return '<div class="ornament" aria-hidden="true"><i></i></div>';
  }

  /* Section head with optional right-hand action markup. */
  function sectionHead(title, note, actionHTML) {
    return '<div class="section-head">' +
      '<h2 class="section-title">' + esc(title) + '</h2>' +
      (note ? '<span class="section-note">' + esc(note) + '</span>' : '') +
      (actionHTML || '') +
      '</div>';
  }

  /* A single figure with its label beneath, serif numerals, tabular so a
     row of them stays on a common baseline grid. */
  function stat(value, label) {
    return '<div class="fact">' +
      '<span class="fact-v num">' + esc(value) + '</span>' +
      '<span class="fact-k">' + esc(label) + '</span>' +
      '</div>';
  }

  /* Spec sheet. Takes [iconName, label, value, note] rows and prints them as
     full-measure lines — icon, small-caps label in its own column, serif
     value and prose to the right — separated by hairlines.

     This exists because the same rows used to go into `.facts`, which is an
     auto-fit grid at minmax(140px, 1fr). That is right for UI.stat figures
     and wrong for prose: seven facts across a 1005px measure became seven
     columns, each leaving about 66px for text, and "Chunky and free-draining
     — two parts potting mix, one part perlite, one part orchid bark" wrapped
     into a ten-line ribbon. Widening the minmax only moves the problem, and
     brings a new one — the fact count is data-driven and often prime, so any
     multi-column layout leaves orphan cells, which on `.facts` show the
     container's hairline fill as a solid slab.

     One column per fact solves both at once and is the more editorial
     presentation anyway: a spec sheet, not a tile mosaic. */
  function specSheet(rows) {
    return '<div class="facts facts-rows">' + rows.filter(Boolean).map(function (r) {
      return '<div class="fact">' +
        '<span class="fact-ico">' + icon(r[0]) + '</span>' +
        '<div class="fact-k">' + esc(r[1]) + '</div>' +
        '<div class="fact-body">' +
          '<div class="fact-v">' + esc(r[2]) + '</div>' +
          (r[3] ? '<p class="hint">' + esc(r[3]) + '</p>' : '') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Bring the selected key of a scrolling segmented control into view.
     --------------------------------------------------------------------
     A plant's five tabs measure wider than a phone, so .tabs scrolls inside
     itself. Choosing a tab calls App.refresh(), which rebuilds the strip
     from scratch — and a fresh strip starts at scrollLeft 0. Tap PROPAGATE
     at 414px and what comes back is scrolled hard left with the tab you just
     chose sitting off the right edge: the gesture reads as having *cleared*
     the selection rather than made one, and the only lit key on screen is
     whichever happens to be leftmost. Same story on a deep link straight to
     a right-hand tab.

     scrollIntoView() is the wrong instrument here even though it is the
     obvious one: it walks every scrollable ancestor, so it would also scroll
     the document — yanking the page down past the hero at the instant the
     view mounts, on every navigation. This moves the one scroller that needs
     moving and leaves the page where the reader put it.

     Rects rather than offsetLeft, because .tabs is not a positioned element:
     a tab's offsetParent is whichever ancestor happens to be one, so that
     arithmetic would silently change meaning with an unrelated layout edit.
     The delta between two bounding boxes is true in any containing block. */
  function syncTabScroll(root) {
    const strips = (root || document).querySelectorAll('.tabs');
    for (let i = 0; i < strips.length; i++) {
      const strip = strips[i];
      /* No-op when the keys fit, which is what keeps the two-tab Greenhouse
         switcher — same markup, same helper — from being touched at all. */
      if (strip.scrollWidth <= strip.clientWidth + 1) continue;
      const on = strip.querySelector('.tab-btn.is-on');
      if (!on) continue;
      const sr = strip.getBoundingClientRect();
      const br = on.getBoundingClientRect();
      strip.scrollLeft += (br.left - sr.left) - (sr.width - br.width) / 2;
    }
  }

  /* Keep the tab strip in view after switching tabs.

     App.refresh() now holds the reader's scroll position, which is right for
     every in-place update but not for a tab switch: going from a long Diary
     to a short Care tab would leave them parked below the whole of the new
     content, and the browser's clamp would show them the bottom of a page
     they had never seen the top of. Resetting to 0 is no better — it throws
     them above the hero, which is the behaviour this change exists to undo.

     So: scroll only when the strip has gone above the reading area, and only
     far enough to bring it back. Someone who switches tabs while already
     looking at them does not move at all. The offset clears the sticky
     topbar plus a few pixels for the fade at the bottom of its gradient, so
     the first row of the new tab lands in clear space rather than half under
     a blur. */
  function keepTabsInView(root) {
    const strip = (root || document).querySelector('.tabs');
    if (!strip) return;
    const bar = document.querySelector('.topbar');
    const floor = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
    const top = strip.getBoundingClientRect().top;
    if (top >= floor - 1) return;
    const y = window.scrollY || window.pageYOffset || 0;
    window.scrollTo(0, Math.max(0, y + top - floor));
  }

  return {
    esc: esc, attr: attr, icon: icon,
    today: today, toISO: toISO, fromISO: fromISO, daysBetween: daysBetween, addDays: addDays,
    fmtDate: fmtDate, relDays: relDays, relDue: relDue, plural: plural, deg: deg,
    MONTHS: MONTHS, DAYS: DAYS,
    toast: toast, openSheet: openSheet, closeSheet: closeSheet, sheetIsOpen: sheetIsOpen,
    roomMark: roomMark,
    confirmSheet: confirmSheet, lightbox: lightbox, empty: empty, pill: pill,
    lineChart: lineChart, plantTile: plantTile, monogram: monogram, tintClass: tintClass,
    eyebrow: eyebrow, script: script, ornament: ornament,
    sectionHead: sectionHead, stat: stat, specSheet: specSheet,
    syncTabScroll: syncTabScroll, keepTabsInView: keepTabsInView
  };
})();
