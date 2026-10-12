// The promo's home: the site's (marketing/site-shots/state.js, the reels'
// plants in the tour's flat), plus Monty, a second Monstera in a 24cm plastic
// pot in the dim kitchen, so the two Monsteras are on different schedules
// for reasons the app states (10 days and 16), and a hot, dry fortnight
// cached as the forecast, which is what puts the dry-spell offer on Today.
// `moved` is the home after the plan beat, Monty in the living room;
// `fresher` waters everything two days later, so shortening the gap by two
// days brings waterings due rather than leaving them overdue.
const site = require('../../site-shots/state.js');

module.exports = function home(opts) {
  const o = opts || {}, st = site();
  st.plants.push({ id: 'p7', speciesId: 'monstera-deliciosa', nickname: 'Monty', roomId: o.moved ? 'living' : 'kitchen',
    pos: o.moved ? { x: 13.5, y: 6.75 } : { x: 12.5, y: 18 }, potCm: 24, potMaterial: 'plastic', drainage: 'good',
    lastWatered: '2026-09-27', lastFertilised: '2026-09-30', acquired: '2026-03-01' });
  // Spike, the snake plant, out of the windowless hallway: one plant in the
  // wrong light, Monty, so the light beat and the resting screen name one.
  const spike = st.plants.find(p => p.id === 'p3'); spike.roomId = 'bedroom'; spike.pos = { x: 24.5, y: 11.5 };
  if (o.fresher) st.plants.forEach(p => { const d = new Date(p.lastWatered + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 2); p.lastWatered = d.toISOString().slice(0, 10); });
  st.profile.location = { label: 'Sydney', lat: -33.87, lon: 151.21 };
  st.settings.weatherSync = true;
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.UTC(2026, 9, 3 + i));
    days.push({ date: d.toISOString().slice(0, 10), code: i % 3 ? 0 : 1, tMax: 29 + (i % 4), tMin: 17 + (i % 3), rain: 0, rainChance: 5 });
  }
  st.weather = { fetchedAt: '2026-10-02T22:00:00.000Z', lat: -33.87, lon: 151.21, current: { temp: 27, humidity: 38, code: 0 }, days };
  if (o.caughtUp) {
    // Everything watered this morning and the forecast offer already
    // answered, so Today is the resting screen.
    st.plants.forEach(p => { p.lastWatered = '2026-10-03'; p.lastFertilised = '2026-10-01'; });
    st.settings.dismissed = ['dry-spell'];
  }
  return st;
};
