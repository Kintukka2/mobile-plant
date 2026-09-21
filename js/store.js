/* ==========================================================================
   Sprout — persistence
   --------------------------------------------------------------------------
   State lives in localStorage as a single JSON document. Photos are kept in
   a separate localStorage namespace, one key per photo, so that a large photo
   library never has to be serialised and rewritten every time you tick off a
   watering.

   Why not IndexedDB? This app is designed to run by double-clicking
   index.html, and Chrome's IndexedDB support on the file:// protocol is
   unreliable. localStorage works consistently there.
   ========================================================================== */

window.Store = (function () {

  const KEY = 'sprout.state.v1';
  const PHOTO_PREFIX = 'sprout.photo.';

  /* ---------- Shape ---------- */
  function blankState() {
    return {
      version: 1,
      profile: {
        name: '',
        hemisphere: null,       // 'north' | 'south' — from location, or set by hand
        location: null,         // { label, lat, lon }
        pets: [],               // ['cats','dogs']
        experience: null,       // a key from LOOKUPS.EXPERIENCE
        createdAt: UI.toISO(new Date())
      },
      rooms: [],                // { id, name, icon, light, aspect, humid, notes, shape }
      plants: [],               // see addPlant()
      /* The floor plan: one per greenhouse, and there is one greenhouse.
         Rooms drawn on it carry a `shape`; rooms added through the form do
         not, and simply are not on the plan yet. North is a bearing in
         degrees clockwise from the top of the plan, and it is only trusted
         once the reader has confirmed it — `Plan` derives every drawn room's
         light and aspect from it, so an unconfirmed north leaves those null
         rather than guessed. `cell` is metres per grid cell, set the first
         time someone types a room's real size. */
      plan: {
        north: null,
        northConfirmed: false,
        cell: 0.5,
        scaleFrom: null,        // room id the scale was taken from
        backdrop: null,         // { src, opacity, scale, x, y } while tracing
        done: false             // "Done with the floorplan" ticked
      },
      logs: [],                 // { id, plantId, date, kind, text, value, unit, photoId }
      weather: null,            // cached forecast
      settings: {
        weatherSync: true,
        seenWelcome: false,
        onboarded: false,       // the first-run questions were answered or skipped
        adjustments: {}         // plantId -> days offset accepted from a weather nudge
      }
    };
  }

  let state = null;

  /* ---------- Load / save ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { state = blankState(); return state; }
      const parsed = JSON.parse(raw);
      // Merge onto a blank state so missing keys from older versions fill in.
      state = Object.assign(blankState(), parsed);
      state.profile = Object.assign(blankState().profile, parsed.profile || {});
      state.settings = Object.assign(blankState().settings, parsed.settings || {});
      state.plan = Object.assign(blankState().plan, parsed.plan || {});
      if (!Array.isArray(state.rooms)) state.rooms = [];
      if (!Array.isArray(state.plants)) state.plants = [];
      if (!Array.isArray(state.logs)) state.logs = [];
      return state;
    } catch (e) {
      console.error('Could not read saved data, starting fresh:', e);
      state = blankState();
      return state;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        UI.toast('Storage is full — try deleting some photos', 'warn');
      } else {
        console.error('Save failed:', e);
        UI.toast('Could not save changes', 'warn');
      }
      return false;
    }
  }

  function get() {
    if (!state) load();
    return state;
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Profile ---------- */
  function updateProfile(patch) {
    Object.assign(get().profile, patch);
    // Infer hemisphere from latitude whenever we learn a location.
    if (patch.location && typeof patch.location.lat === 'number') {
      get().profile.hemisphere = patch.location.lat < 0 ? 'south' : 'north';
    }
    save();
  }

  /* A saved latitude, or an answer the reader gave outright, is knowledge.
     Failing both, the device's time zone is a good enough guess to beat the
     alternative, which was assuming north and inverting every season and
     every window aspect for everyone below the equator. 'north' remains the
     last resort for a device that reports no zone at all.

     hemisphereIsGuess() exists so the UI can say which of those three it is
     working from — an inference the reader can correct should not be
     presented in the same voice as one they gave us. */
  function hemisphere() {
    return get().profile.hemisphere ||
           LOOKUPS.hemisphereFromTimeZone() ||
           'north';
  }

  function hemisphereIsGuess() {
    return !get().profile.hemisphere;
  }

  /* ---------- Rooms ---------- */
  function addRoom(data) {
    const room = {
      id: uid('room'),
      name: data.name || 'New Room',
      /* A key into UI's own glyph table, never an emoji. The old emoji field
         was removed because a potted-plant default made every room in a new
         greenhouse look identical, and the host OS drew a different picture
         on every device. These are drawn in the app's own monoline hand, so
         a strip of them reads as one set — and null still means the initial
         in the display face, which is the honest fallback for a room the
         reader has not characterised. */
      icon: data.icon || null,
      light: data.light || null,
      aspect: data.aspect || null,
      humid: data.humid || null,
      notes: data.notes || '',
      /* { pts: [{x, y}], win: [0|1|2 per edge], outdoor } in plan cells, or
         null for a room that was described rather than drawn. */
      shape: data.shape || null
    };
    get().rooms.push(room);
    save();
    return room;
  }

  function updateRoom(id, patch) {
    const room = getRoom(id);
    if (!room) return null;
    Object.assign(room, patch);
    save();
    return room;
  }

  function getRoom(id) {
    return get().rooms.filter(function (r) { return r.id === id; })[0] || null;
  }

  /* Deleting a room leaves its plants in place, just unassigned — and off
     the plan, since a position inside a room that no longer exists points
     at nothing. */
  function deleteRoom(id) {
    const s = get();
    s.rooms = s.rooms.filter(function (r) { return r.id !== id; });
    s.plants.forEach(function (p) { if (p.roomId === id) { p.roomId = null; p.pos = null; } });
    if (s.plan.scaleFrom === id) s.plan.scaleFrom = null;
    save();
  }

  /* ---------- Plan ---------- */
  function updatePlan(patch) {
    Object.assign(get().plan, patch);
    return save();
  }

  function plantsInRoom(roomId) {
    return get().plants.filter(function (p) { return p.roomId === roomId; });
  }

  /* ---------- Plants ---------- */
  function addPlant(data) {
    const plant = {
      id: uid('plant'),
      speciesId: data.speciesId,          // key into PLANT_DATA
      nickname: data.nickname || '',
      roomId: data.roomId || null,
      pos: data.pos || null,               // { x, y } on the plan, in cells
      acquired: data.acquired || UI.toISO(new Date()),
      potCm: data.potCm || 15,
      potMaterial: data.potMaterial || 'plastic',
      drainage: data.drainage || 'good',
      /* The three above always hold a usable pot, because the schedule needs
         one to reason about. This records whether anyone actually answered:
         true means the values are Sprout's assumption, not the reader's. */
      potPending: !!data.potPending,
      coverPhotoId: null,
      lastWatered: data.lastWatered || null,
      lastFertilised: data.lastFertilised || null,
      lastRepotted: data.lastRepotted || null,
      waterOffset: 0,                     // manual/weather tweak in days
      archived: false,
      createdAt: UI.toISO(new Date())
    };
    get().plants.push(plant);
    save();
    return plant;
  }

  function updatePlant(id, patch) {
    const p = getPlant(id);
    if (!p) return null;
    Object.assign(p, patch);
    save();
    return p;
  }

  function getPlant(id) {
    return get().plants.filter(function (p) { return p.id === id; })[0] || null;
  }

  function deletePlant(id) {
    const s = get();
    // Clean up this plant's photos so they don't orphan in storage.
    s.logs.filter(function (l) { return l.plantId === id && l.photoId; })
          .forEach(function (l) { deletePhoto(l.photoId); });
    s.plants = s.plants.filter(function (p) { return p.id !== id; });
    s.logs = s.logs.filter(function (l) { return l.plantId !== id; });
    save();
  }

  function activePlants() {
    return get().plants.filter(function (p) { return !p.archived; });
  }

  /* Join a saved plant to its species record. */
  function species(plant) {
    if (!plant) return null;
    return window.PLANT_DATA.filter(function (s) { return s.id === plant.speciesId; })[0] || null;
  }

  /* Display name — nickname if set, otherwise the species common name. */
  function displayName(plant) {
    if (!plant) return '';
    if (plant.nickname) return plant.nickname;
    const sp = species(plant);
    return sp ? sp.common : 'Unknown plant';
  }

  /* ---------- Logs (the diary) ---------- */
  function addLog(data) {
    const log = {
      id: uid('log'),
      plantId: data.plantId,
      date: data.date || UI.toISO(new Date()),
      kind: data.kind || 'note',
      text: data.text || '',
      value: (typeof data.value === 'number') ? data.value : null,
      unit: data.unit || null,
      photoId: data.photoId || null,
      createdAt: new Date().toISOString()
    };
    get().logs.push(log);

    // Care actions update the plant's schedule anchors.
    if (log.kind === 'water')     updatePlant(log.plantId, { lastWatered: log.date });
    if (log.kind === 'fertilise') updatePlant(log.plantId, { lastFertilised: log.date });
    if (log.kind === 'repot')     updatePlant(log.plantId, { lastRepotted: log.date });

    save();
    return log;
  }

  function updateLog(id, patch) {
    const l = get().logs.filter(function (x) { return x.id === id; })[0];
    if (!l) return null;
    Object.assign(l, patch);
    save();
    return l;
  }

  function deleteLog(id) {
    const s = get();
    const log = s.logs.filter(function (l) { return l.id === id; })[0];
    if (log && log.photoId) deletePhoto(log.photoId);
    s.logs = s.logs.filter(function (l) { return l.id !== id; });
    save();
  }

  /* Newest first. */
  function logsFor(plantId, kind) {
    return get().logs
      .filter(function (l) {
        return l.plantId === plantId && (!kind || l.kind === kind);
      })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return (a.createdAt || '') < (b.createdAt || '') ? 1 : -1;
      });
  }

  function photosFor(plantId) {
    return logsFor(plantId).filter(function (l) { return !!l.photoId; });
  }

  /* Oldest first, for charting. */
  function growthFor(plantId) {
    return get().logs
      .filter(function (l) { return l.plantId === plantId && l.kind === 'growth' && typeof l.value === 'number'; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }

  /* ---------- Photos ----------
     Stored one key per photo so we never rewrite the whole library. */
  function savePhoto(dataUrl) {
    const id = uid('photo');
    try {
      localStorage.setItem(PHOTO_PREFIX + id, dataUrl);
      return id;
    } catch (e) {
      UI.toast('Not enough storage space for that photo', 'warn');
      return null;
    }
  }

  function getPhoto(id) {
    if (!id) return null;
    try { return localStorage.getItem(PHOTO_PREFIX + id); }
    catch (e) { return null; }
  }

  function deletePhoto(id) {
    if (!id) return;
    try { localStorage.removeItem(PHOTO_PREFIX + id); } catch (e) {}
  }

  /* Cover photo: explicit choice, else the most recent photo. */
  function coverPhoto(plant) {
    if (!plant) return null;
    if (plant.coverPhotoId) {
      const explicit = getPhoto(plant.coverPhotoId);
      if (explicit) return explicit;
    }
    const photos = photosFor(plant.id);
    return photos.length ? getPhoto(photos[0].photoId) : null;
  }

  /* ---------- Weather cache ---------- */
  function setWeather(w) { get().weather = w; save(); }
  function getWeather()  { return get().weather; }

  /* ---------- Settings ---------- */
  function updateSettings(patch) {
    Object.assign(get().settings, patch);
    save();
  }

  /* ---------- Storage diagnostics ---------- */
  function storageUsage() {
    let total = 0, photos = 0, count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || '';
        const bytes = (k.length + v.length) * 2; // UTF-16
        total += bytes;
        if (k.indexOf(PHOTO_PREFIX) === 0) { photos += bytes; count++; }
      }
    } catch (e) {}
    return {
      totalMB: (total / 1048576).toFixed(2),
      photoMB: (photos / 1048576).toFixed(2),
      photoCount: count,
      // Browsers typically allow 5–10MB for localStorage.
      pctUsed: Math.min(100, Math.round((total / (5 * 1048576)) * 100))
    };
  }

  /* ---------- Export / import ---------- */
  function exportAll() {
    const photos = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.indexOf(PHOTO_PREFIX) === 0) photos[k.slice(PHOTO_PREFIX.length)] = localStorage.getItem(k);
      }
    } catch (e) {}
    return JSON.stringify({ state: get(), photos: photos, exportedAt: new Date().toISOString() }, null, 2);
  }

  function importAll(json) {
    const parsed = JSON.parse(json);
    if (!parsed.state) throw new Error('That does not look like a Sprout backup file.');
    state = Object.assign(blankState(), parsed.state);
    if (parsed.photos) {
      Object.keys(parsed.photos).forEach(function (id) {
        try { localStorage.setItem(PHOTO_PREFIX + id, parsed.photos[id]); } catch (e) {}
      });
    }
    save();
  }

  function resetAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k === KEY || k.indexOf(PHOTO_PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    state = blankState();
    save();
  }

  return {
    load: load, save: save, get: get, uid: uid,
    updatePlan: updatePlan,
    updateProfile: updateProfile, hemisphere: hemisphere,
    hemisphereIsGuess: hemisphereIsGuess,
    addRoom: addRoom, updateRoom: updateRoom, getRoom: getRoom, deleteRoom: deleteRoom,
    plantsInRoom: plantsInRoom,
    addPlant: addPlant, updatePlant: updatePlant, getPlant: getPlant, deletePlant: deletePlant,
    activePlants: activePlants, species: species, displayName: displayName,
    addLog: addLog, updateLog: updateLog, deleteLog: deleteLog,
    logsFor: logsFor, photosFor: photosFor, growthFor: growthFor,
    savePhoto: savePhoto, getPhoto: getPhoto, deletePhoto: deletePhoto, coverPhoto: coverPhoto,
    setWeather: setWeather, getWeather: getWeather,
    updateSettings: updateSettings, storageUsage: storageUsage,
    exportAll: exportAll, importAll: importAll, resetAll: resetAll
  };
})();
