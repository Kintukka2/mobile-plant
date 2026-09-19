/* ==========================================================================
   Sprout — photo capture & resizing
   --------------------------------------------------------------------------
   Phone cameras produce 3–8MB JPEGs. localStorage gives us roughly 5MB in
   total, so every photo is downscaled and re-encoded before it is stored.
   A 1000px JPEG at 72% quality lands around 90–150KB, which keeps a diary of
   a few dozen photos comfortably within budget.
   ========================================================================== */

window.Photos = (function () {

  const MAX_EDGE = 1000;
  const QUALITY  = 0.72;

  /* Open the OS picker / camera and hand back a resized data URL. */
  function pick(onDone) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // On mobile this offers the camera directly; harmless on desktop.
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) { cleanup(); return; }

      if (!/^image\//.test(file.type)) {
        UI.toast('That file is not an image', 'warn');
        cleanup();
        return;
      }

      UI.toast('Processing photo…');
      resize(file, function (err, dataUrl) {
        cleanup();
        if (err) {
          console.error(err);
          UI.toast('Could not read that image', 'warn');
          return;
        }
        onDone(dataUrl);
      });
    });

    function cleanup() {
      if (input.parentNode) input.parentNode.removeChild(input);
    }

    document.body.appendChild(input);
    input.click();
  }

  /* Downscale to fit MAX_EDGE and re-encode as JPEG. */
  function resize(file, cb) {
    const reader = new FileReader();

    reader.onerror = function () { cb(new Error('FileReader failed')); };

    reader.onload = function () {
      const img = new Image();

      img.onerror = function () { cb(new Error('Image decode failed')); };

      img.onload = function () {
        let w = img.naturalWidth  || img.width;
        let h = img.naturalHeight || img.height;

        if (!w || !h) { cb(new Error('Image had no dimensions')); return; }

        // Scale the longest edge down to MAX_EDGE, never up.
        const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Flatten onto white — JPEG has no alpha channel, and transparent
        // PNGs would otherwise come out with black backgrounds.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        try {
          cb(null, canvas.toDataURL('image/jpeg', QUALITY));
        } catch (e) {
          cb(e);
        }
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  }

  /* Rough byte size of a data URL, for storage warnings. */
  function approxBytes(dataUrl) {
    if (!dataUrl) return 0;
    const comma = dataUrl.indexOf(',');
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    return Math.round(b64.length * 0.75);
  }

  return { pick: pick, resize: resize, approxBytes: approxBytes, MAX_EDGE: MAX_EDGE };
})();
