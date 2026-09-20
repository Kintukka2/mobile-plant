/* ==========================================================================
   Sprout — weather sync
   --------------------------------------------------------------------------
   Uses Open-Meteo: free, no API key, no sign-up, and it sends
   Access-Control-Allow-Origin: * so it works even from a file:// page.

   Two endpoints:
     · geocoding-api.open-meteo.com  — turn a place name into coordinates
     · api.open-meteo.com/v1/forecast — the actual forecast

   Everything degrades gracefully: no network, no permission or a failed
   request simply means the app runs without weather features.
   ========================================================================== */

window.Weather = (function () {

  const GEO_URL  = 'https://geocoding-api.open-meteo.com/v1/search';
  const FCST_URL = 'https://api.open-meteo.com/v1/forecast';
  const CACHE_HOURS = 3;

  /* WMO weather interpretation codes → [label, icon name].
     There was a middle slot holding an emoji, kept "for plain-text contexts",
     and nothing ever read it — so every forecast tile carried a system-drawn
     cloud that changed shape depending on whose machine you were on. The
     interface draws the hairline glyph named here and nothing else.
     Twenty-odd codes collapse onto six glyphs, deliberately: the forecast
     strip renders at 20px, and distinguishing "drizzle" from "light rain"
     pictorially at that size is a fiction. The label does that work. */
  const WMO = {
    0:  ['Clear sky', 'sun'],           1:  ['Mainly clear', 'cloudSun'],
    2:  ['Partly cloudy', 'cloudSun'],  3:  ['Overcast', 'cloud'],
    45: ['Fog', 'mist'],                48: ['Freezing fog', 'mist'],
    51: ['Light drizzle', 'rain'],      53: ['Drizzle', 'rain'],
    55: ['Heavy drizzle', 'rain'],      56: ['Freezing drizzle', 'rain'],
    57: ['Freezing drizzle', 'rain'],
    61: ['Light rain', 'rain'],         63: ['Rain', 'rain'],
    65: ['Heavy rain', 'rain'],         66: ['Freezing rain', 'rain'],
    67: ['Freezing rain', 'rain'],
    71: ['Light snow', 'snow'],         73: ['Snow', 'snow'],
    75: ['Heavy snow', 'snow'],         77: ['Snow grains', 'snow'],
    80: ['Light showers', 'rain'],      81: ['Showers', 'rain'],
    82: ['Heavy showers', 'storm'],     85: ['Snow showers', 'snow'],
    86: ['Snow showers', 'snow'],
    95: ['Thunderstorm', 'storm'],      96: ['Thunderstorm', 'storm'],
    99: ['Severe thunderstorm', 'storm']
  };

  function describeCode(code) {
    return WMO[code] || ['Unknown', 'thermo'];
  }

  /* ---------- Fetch with timeout ----------
     A hung request should not leave the UI in a loading state forever. */
  function fetchJSON(url, cb) {
    if (typeof fetch !== 'function') {
      cb(new Error('This browser cannot fetch weather data.'));
      return;
    }

    let settled = false;
    const timer = setTimeout(function () {
      if (!settled) { settled = true; cb(new Error('The weather service timed out.')); }
    }, 12000);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Weather service returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cb(null, data);
      })
      .catch(function (err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cb(err);
      });
  }

  /* ---------- Search for a place by name ---------- */
  function searchPlace(query, cb) {
    const q = String(query || '').trim();
    if (q.length < 2) { cb(null, []); return; }

    const url = GEO_URL + '?name=' + encodeURIComponent(q) + '&count=6&language=en&format=json';
    fetchJSON(url, function (err, data) {
      if (err) { cb(err); return; }
      const results = (data && data.results) || [];
      cb(null, results.map(function (r) {
        const bits = [r.name];
        if (r.admin1 && r.admin1 !== r.name) bits.push(r.admin1);
        if (r.country) bits.push(r.country);
        return {
          label: bits.join(', '),
          name: r.name,
          country: r.country || '',
          lat: r.latitude,
          lon: r.longitude
        };
      }));
    });
  }

  /* ---------- Browser geolocation ---------- */
  function locateMe(cb) {
    if (!navigator.geolocation) {
      cb(new Error('This browser does not support location lookup.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        // Reverse-geocode for a friendly label; fall back to coordinates.
        const url = GEO_URL + '?name=&latitude=' + lat + '&longitude=' + lon + '&count=1&format=json';
        fetchJSON(url, function (err, data) {
          const r = (data && data.results && data.results[0]) || null;
          cb(null, {
            label: r ? (r.name + (r.country ? ', ' + r.country : ''))
                     : (lat.toFixed(2) + ', ' + lon.toFixed(2)),
            lat: lat,
            lon: lon
          });
        });
      },
      function (err) {
        const msgs = {
          1: 'Location permission was denied. You can type your city instead.',
          2: 'Your location is unavailable right now.',
          3: 'The location request timed out.'
        };
        cb(new Error(msgs[err.code] || 'Could not determine your location.'));
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  }

  /* ---------- Forecast ---------- */
  function fetchForecast(lat, lon, cb) {
    const url = FCST_URL +
      '?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max' +
      '&timezone=auto&forecast_days=14';

    fetchJSON(url, function (err, data) {
      if (err) { cb(err); return; }
      if (!data || !data.daily || !data.daily.time) {
        cb(new Error('The weather service returned unexpected data.'));
        return;
      }

      const daily = data.daily;
      const days = daily.time.map(function (t, i) {
        return {
          date: t,
          code: daily.weather_code[i],
          tMax: daily.temperature_2m_max[i],
          tMin: daily.temperature_2m_min[i],
          rain: daily.precipitation_sum[i],
          rainChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null
        };
      });

      const cur = data.current || {};
      cb(null, {
        fetchedAt: new Date().toISOString(),
        lat: lat, lon: lon,
        current: {
          temp: cur.temperature_2m,
          humidity: cur.relative_humidity_2m,
          code: cur.weather_code
        },
        days: days
      });
    });
  }

  /* Refresh if the cache is stale. Calls back with the cached copy
     immediately if it is still fresh. */
  function refresh(cb, force) {
    const profile = Store.get().profile;
    if (!profile.location) { cb(new Error('No location set.')); return; }
    if (!Store.get().settings.weatherSync) { cb(new Error('Weather sync is switched off.')); return; }

    const cached = Store.getWeather();
    if (!force && cached && cached.fetchedAt) {
      const age = (Date.now() - new Date(cached.fetchedAt).getTime()) / 3600000;
      if (age < CACHE_HOURS) { cb(null, cached, true); return; }
    }

    fetchForecast(profile.location.lat, profile.location.lon, function (err, data) {
      if (err) {
        // Serve a stale cache rather than nothing.
        if (cached) { cb(null, cached, true); return; }
        cb(err);
        return;
      }
      Store.setWeather(data);
      cb(null, data, false);
    });
  }

  /* ======================================================================
     Insights — turning a forecast into care advice
     ====================================================================== */

  /* A dry spell: consecutive days from today with negligible rain. */
  function drySpell(weather) {
    if (!weather || !weather.days) return 0;
    let count = 0;
    for (let i = 0; i < weather.days.length; i++) {
      const d = weather.days[i];
      if ((d.rain || 0) < 1 && (d.rainChance === null || d.rainChance < 40)) count++;
      else break;
    }
    return count;
  }

  /* A wet spell: consecutive days with meaningful rain. */
  function wetSpell(weather) {
    if (!weather || !weather.days) return 0;
    let count = 0;
    for (let i = 0; i < weather.days.length; i++) {
      const d = weather.days[i];
      if ((d.rain || 0) >= 2 || (d.rainChance !== null && d.rainChance >= 60)) count++;
      else break;
    }
    return count;
  }

  function avgMax(weather, n) {
    if (!weather || !weather.days || !weather.days.length) return null;
    const slice = weather.days.slice(0, n || 7);
    const sum = slice.reduce(function (a, d) { return a + (d.tMax || 0); }, 0);
    return sum / slice.length;
  }

  function minLow(weather, n) {
    if (!weather || !weather.days || !weather.days.length) return null;
    const slice = weather.days.slice(0, n || 7);
    return Math.min.apply(null, slice.map(function (d) { return d.tMin; }));
  }

  /* Generate actionable nudges. Each has an optional `apply` that mutates
     watering offsets, so the user can accept the suggestion in one tap. */
  function insights() {
    const weather = Store.getWeather();
    if (!weather) return [];

    const out = [];
    const plants = Store.activePlants();
    const heat = avgMax(weather, 7);
    const cold = minLow(weather, 7);
    const dry = drySpell(weather);
    const wet = wetSpell(weather);
    const season = LOOKUPS.SEASON_META[Schedule.currentSeason()];

    /* --- Hot, dry stretch: water more often --- */
    if (dry >= 7 && heat !== null && heat >= 24 && plants.length) {
      const alreadyAdjusted = plants.every(function (p) { return p.waterOffset < 0; });
      if (!alreadyAdjusted) {
        out.push({
          id: 'dry-spell',
          ico: 'thermo',
          title: 'Dry spell ahead — ' + dry + ' days without meaningful rain',
          text: 'Highs are averaging ' + Math.round(heat) + '°C. Warm dry air pulls moisture out of soil ' +
                'and leaves noticeably faster, so let\'s shorten the gap between waterings by two days?',
          action: 'Shorten by 2 days',
          apply: function () {
            plants.forEach(function (p) { Store.updatePlant(p.id, { waterOffset: -2 }); });
            UI.toast('Shortened watering by two days', 'leaf');
          }
        });
      }
    }

    /* --- Cool wet stretch: water less --- */
    if (wet >= 4 && heat !== null && heat < 20 && plants.length) {
      const alreadyAdjusted = plants.every(function (p) { return p.waterOffset > 0; });
      if (!alreadyAdjusted) {
        out.push({
          id: 'wet-spell',
          ico: 'rain',
          title: wet + ' days of rain coming',
          text: 'Cool damp weather means higher indoor humidity and slower drying. Soil stays wet for longer, ' +
                'which is exactly when overwatering happens. Shall I stretch the gap by two days?',
          action: 'Stretch by 2 days',
          apply: function () {
            plants.forEach(function (p) { Store.updatePlant(p.id, { waterOffset: 2 }); });
            UI.toast('Stretched watering by two days', 'leaf');
          }
        });
      }
    }

    /* --- Existing adjustment no longer warranted --- */
    const adjusted = plants.filter(function (p) { return p.waterOffset !== 0; });
    if (adjusted.length && dry < 5 && wet < 3) {
      out.push({
        id: 'reset-offset',
        ico: 'rotate',
        title: 'Weather has settled down',
        text: 'There is still a weather adjustment running on ' + UI.plural(adjusted.length, 'plant') +
              ', but the forecast has evened out. Shall I put them back to normal?',
        action: 'Reset schedules',
        apply: function () {
          adjusted.forEach(function (p) { Store.updatePlant(p.id, { waterOffset: 0 }); });
          UI.toast('Back to normal schedules', 'leaf');
        }
      });
    }

    /* --- Frost / cold warning for plants near windows --- */
    if (cold !== null && cold <= 5) {
      const tender = plants.filter(function (p) {
        const sp = Store.species(p);
        return sp && sp.minC >= 12;
      });
      if (tender.length) {
        out.push({
          id: 'cold-warning',
          ico: 'snow',
          title: 'Cold nights ahead — down to ' + Math.round(cold) + '°C',
          text: UI.plural(tender.length, 'plant') + ' in your greenhouse would suffer below 12°C. ' +
                'Move them back from windowsills overnight and draw the curtains between plant and glass — ' +
                'the air against a cold pane is far colder than the room.',
          dismissable: true
        });
      }
    }

    /* --- Heat warning --- */
    if (heat !== null && heat >= 32) {
      out.push({
        id: 'heat-warning',
        ico: 'thermo',
        title: 'Serious heat coming — around ' + Math.round(heat) + '°C',
        text: 'Move plants back from windows where the sun magnifies through glass, and check the soil daily ' +
              'rather than waiting for me. Do not mist in strong sun — droplets act as tiny lenses and scorch leaves.',
        dismissable: true
      });
    }

    /* --- Seasonal transition --- */
    const month = new Date().getMonth();
    const isSeasonStart = [2, 5, 8, 11].indexOf(month) !== -1;
    if (isSeasonStart && season) {
      out.push({
        id: 'season-' + season.label,
        ico: season.ico,
        title: season.label + ' has arrived',
        text: season.note,
        dismissable: true
      });
    }

    return out;
  }

  /* Short current-conditions line for the header chip. */
  function currentLine() {
    const w = Store.getWeather();
    if (!w || !w.current || typeof w.current.temp !== 'number') return null;
    const d = describeCode(w.current.code);
    return {
      temp: Math.round(w.current.temp),
      label: d[0],
      ico: d[1],
      humidity: w.current.humidity
    };
  }

  return {
    searchPlace: searchPlace, locateMe: locateMe, fetchForecast: fetchForecast,
    refresh: refresh, describeCode: describeCode,
    drySpell: drySpell, wetSpell: wetSpell, avgMax: avgMax, minLow: minLow,
    insights: insights, currentLine: currentLine
  };
})();
