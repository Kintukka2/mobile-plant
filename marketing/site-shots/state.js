// The marketing greenhouse: the reels' six plants and Daniel
// (marketing/reels/build/seed.js), housed in the tour's sample flat with
// north confirmed. Shared by site-shots and store-shots so the site and the
// store listing photograph the same home.
const seed = require('../reels/build/seed.js');

const W = 0, WIN = 1, OPEN = 2;

function state() {
  const st = seed();
  // The tour's flat (js/tour.js FLAT), corners as {x, y} cells. North is
  // confirmed at 270, to the left of the plan, so the top edge faces east;
  // with the seed in the southern hemisphere that gives the plan every rung
  // of the light ladder: bright indirect through the living room's east
  // window, the bedroom's south one dimmer, the kitchen borrowing across its
  // doorway, a hallway with no window, and a balcony in full sun.
  st.rooms = [
    { id: 'living',  name: 'Living Room', icon: 'sofa',   humid: 'normal', notes: '', shape: { pts: [{x:8,y:6},{x:18,y:6},{x:18,y:14},{x:8,y:14}],   win: [WIN, OPEN, OPEN, W], outdoor: false } },
    { id: 'bedroom', name: 'Bedroom',     icon: 'bed',    humid: 'normal', notes: '', shape: { pts: [{x:18,y:6},{x:26,y:6},{x:26,y:13},{x:18,y:13}], win: [W, WIN, OPEN, OPEN], outdoor: false } },
    { id: 'kitchen', name: 'Kitchen',     icon: 'kettle', humid: 'humid',  notes: '', shape: { pts: [{x:8,y:14},{x:15,y:14},{x:15,y:20},{x:8,y:20}], win: [OPEN, W, W, W],     outdoor: false } },
    { id: 'hall',    name: 'Hallway',     icon: 'door',   humid: 'normal', notes: '', shape: { pts: [{x:15,y:14},{x:18,y:14},{x:18,y:20},{x:15,y:20}], win: [W, W, W, W],      outdoor: false } },
    { id: 'balcony', name: 'Balcony',     icon: 'sun',    humid: 'normal', notes: '', shape: { pts: [{x:18,y:13},{x:26,y:13},{x:26,y:17},{x:18,y:17}], win: [OPEN, W, W, W],   outdoor: true } }
  ];
  const at = { p1: ['living', 11, 8], p2: ['kitchen', 10, 16], p3: ['hall', 16, 18], p4: ['living', 15, 12], p5: ['living', 13, 7], p6: ['bedroom', 22, 9] };
  st.plants.forEach(p => { const a = at[p.id]; if (a) { p.roomId = a[0]; p.pos = { x: a[1], y: a[2] }; } });
  st.plan = { north: 270, northConfirmed: true, cell: 0.5, scaleFrom: 'living', backdrop: null, done: true };
  return st;
}

module.exports = state;
