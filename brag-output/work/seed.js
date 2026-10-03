// The reel greenhouse: the store seeder's plants, with the keys the current data
// model uses ('bright-indirect', aspect 'N'), no weather fetch, and nothing to
// fertilise today — so the greeting's count is waterings only and is true.
module.exports = function seedState() {
  const iso = d => d.toISOString().slice(0, 10);
  const ago = n => { const d = new Date('2026-10-03T12:00:00Z'); /* noon UTC: 3 Oct in Sydney and in UTC alike */ d.setDate(d.getDate() - n); return iso(d); };
  return {
    v: 1,
    profile: { name: 'Daniel', pets: ['cats'], experience: 3, hemisphere: 'south' },
    settings: { remind: true, remindHour: 8, weatherSync: false, seenWelcome: true, onboarded: true },
    rooms: [
      { id: 'room_a', name: 'Living Room', icon: 'sofa',   light: 'bright-indirect', aspect: 'N', humid: 'normal', notes: '' },
      { id: 'room_b', name: 'Kitchen',     icon: 'kettle', light: 'medium',          aspect: 'E', humid: 'humid',  notes: '' },
      { id: 'room_c', name: 'Study',       icon: 'desk',   light: 'low',             aspect: 'S', humid: 'dry',    notes: '' }
    ],
    plants: [
      { id: 'p1', speciesId: 'monstera-deliciosa',     nickname: 'Monny',   roomId: 'room_a', potCm: 24, potMaterial: 'terracotta', drainage: 'good', lastWatered: ago(9),  lastFertilised: ago(3), acquired: ago(420) },
      { id: 'p2', speciesId: 'calathea-orbifolia',     nickname: '',        roomId: 'room_b', potCm: 16, potMaterial: 'plastic',    drainage: 'good', lastWatered: ago(5),  lastFertilised: ago(3), acquired: ago(150) },
      { id: 'p3', speciesId: 'dracaena-trifasciata',   nickname: 'Spike',   roomId: 'room_c', potCm: 18, potMaterial: 'ceramic',    drainage: 'poor', lastWatered: ago(9),  lastFertilised: ago(3), acquired: ago(700) },
      { id: 'p4', speciesId: 'epipremnum-aureum',      nickname: '',        roomId: 'room_a', potCm: 14, potMaterial: 'plastic',    drainage: 'good', lastWatered: ago(7),  lastFertilised: ago(3), acquired: ago(200) },
      { id: 'p5', speciesId: 'ficus-lyrata',           nickname: 'Big Fig', roomId: 'room_a', potCm: 30, potMaterial: 'terracotta', drainage: 'good', lastWatered: ago(4),  lastFertilised: ago(3), acquired: ago(310) },
      { id: 'p6', speciesId: 'spathiphyllum-wallisii', nickname: '',        roomId: 'room_b', potCm: 20, potMaterial: 'plastic',    drainage: 'good', lastWatered: ago(7),  lastFertilised: ago(3), acquired: ago(95) }
    ],
    logs: [
      { id: 'l1', plantId: 'p1', kind: 'milestone', date: ago(30), note: 'Put out a new leaf, the biggest one yet.' },
      { id: 'l2', plantId: 'p1', kind: 'measure', date: ago(120), heightCm: 62 },
      { id: 'l3', plantId: 'p1', kind: 'measure', date: ago(80),  heightCm: 71 },
      { id: 'l4', plantId: 'p1', kind: 'measure', date: ago(40),  heightCm: 83 },
      { id: 'l5', plantId: 'p1', kind: 'measure', date: ago(5),   heightCm: 94 }
    ],
    plan: null, diary: []
  };
};
