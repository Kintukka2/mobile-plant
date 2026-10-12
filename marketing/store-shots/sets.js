// The store listing's copy and layout, one record per frame. Read by
// frame.html in the browser and by render.js in Node.
//
// screen  a capture in raw/ (capture.js)
// eyebrow the green line over the headline
// head    the headline; *stars* mark the phrase drawn in --glow
// sub     an optional line under it
// glow    the light behind the phone: leaf, sun or terra, as on the site
// layout  'centre' (phone upright, under the words) or 'tilt' (words left,
//         phone leaning in from the right)
// fit     show the whole phone instead of letting it run off the foot
// pop     a crop in raw/ lifted out over the phone's edge (tilt only)
// sprout  'corner': the corner cut-out, on openers only. The face follows
//         the voice zoning, so it never sits beside care data, toxicity
//         or a diagnosis: frames on plant, discover and diagnose carry none.
//
// Copy rules: British English, no exclamation marks, one contraction a
// line, and every privacy sentence true to native/store-privacy.md. No
// counts: the species list grows, so like the site the listing never says
// how many there are or how many are pet safe. "These" points at the
// pet-safe results on the screen instead, which stay true as the list does.
(function (root) {
  const SETS = {
    a: { name: 'Final', note: 'The listing. Upload order matches native/store-listing.md.', frames: [
      { screen: 'today', eyebrow: 'Every morning', head: 'A list that is short *because it\'s right.*', glow: 'leaf', layout: 'centre', sprout: 'corner' },
      { screen: 'greenhouse', eyebrow: 'Room by room', head: 'Care worked out from *where each plant lives.*', glow: 'leaf', layout: 'centre' },
      { screen: 'plan', eyebrow: 'Draw your home', head: 'It knows which rooms are bright, *because you showed it.*', glow: 'sun', layout: 'centre' },
      { screen: 'plant', eyebrow: 'Worth keeping', head: 'A record of the plant, *not just a reminder.*', glow: 'leaf', layout: 'centre' },
      { screen: 'discover', eyebrow: 'Pet safe', head: 'These are safe *for cats and dogs.*', glow: 'leaf', layout: 'centre' },
      { screen: 'diagnose', eyebrow: 'When something looks wrong', head: 'A clinic, *not a search box.*', glow: 'terra', layout: 'centre' },
      { screen: 'caught-up', eyebrow: 'Private by design', head: 'No account. *Your plants stay on your phone.*', glow: 'leaf', layout: 'centre' }
    ] },
    b: { name: 'Private by design', note: 'Experiment: lead with what does not leave the phone.', frames: [
      { screen: 'today', eyebrow: 'Private by design', head: 'No account. *Nothing to sign in to.*', sub: 'Your plants, rooms and photos stay on your phone.', glow: 'leaf', layout: 'centre', sprout: 'corner' },
      { screen: 'plan', eyebrow: 'Draw your home', head: 'Your floor plan *never leaves the house.*', sub: 'Light is worked out on the phone, from the windows you mark.', glow: 'sun', layout: 'centre' },
      { screen: 'plant', eyebrow: 'Worth keeping', head: 'Photos and a diary, *kept on the device.*', sub: 'A backup goes only where you send it.', glow: 'leaf', layout: 'centre' },
      { screen: 'discover', eyebrow: 'Pet safe', head: 'Rated for cats, dogs *and people, separately.*', sub: 'The pet-safe ones are a tap away.', glow: 'leaf', layout: 'centre' },
      { screen: 'diagnose', eyebrow: 'Works offline', head: 'A diagnosis *with no signal at all.*', sub: 'Only the weather forecast needs a connection.', glow: 'terra', layout: 'centre' },
      { screen: 'caught-up', eyebrow: 'Reminders', head: 'Reminders from your phone, *not from a server.*', sub: 'Your phone schedules them itself. There\'s no account behind them.', glow: 'leaf', layout: 'centre' }
    ] },
    c: { name: 'Lifted', note: 'Experiment: words left, the phone leaning in, one card lifted off the screen.', frames: [
      { screen: 'today', eyebrow: 'Every morning', head: 'Water the ones *that need it.*', glow: 'leaf', layout: 'tilt', pop: 'today-task', sprout: 'corner' },
      { screen: 'greenhouse', eyebrow: 'Room by room', head: 'Every room *knows its light.*', glow: 'leaf', layout: 'tilt' },
      { screen: 'plan', eyebrow: 'Draw your home', head: 'Not dying, *just in the wrong room.*', glow: 'sun', layout: 'tilt' },
      { screen: 'plant', eyebrow: 'Worth keeping', head: 'Toxic to cats? *It says so up front.*', glow: 'leaf', layout: 'tilt', pop: 'plant-chips' },
      { screen: 'discover', eyebrow: 'Pet safe', head: 'These are safe *for cats and dogs.*', glow: 'leaf', layout: 'tilt' },
      { screen: 'diagnose', eyebrow: 'When something looks wrong', head: 'Yellow leaves? *Causes ranked for that plant.*', glow: 'terra', layout: 'tilt', pop: 'diagnose-cause' },
      { screen: 'caught-up', eyebrow: 'All caught up', head: 'Some days, *nothing needs you.*', glow: 'leaf', layout: 'tilt' }
    ] }
  };
  const SIZES = {
    'android-phone': { w: 1080, h: 1920 },
    'ios-6.9': { w: 1320, h: 2868 }
  };
  root.SETS = SETS; root.SIZES = SIZES;
  if (typeof module !== 'undefined') module.exports = { SETS, SIZES };
})(typeof window !== 'undefined' ? window : globalThis);
