// ============================================================
// MVSA — globe-app.js
// Requires: globe.gl@2.32.0, three.js, projects-data.js
// ============================================================

(function () {

  // ── Globe theme configs per layout ───────────────────────
  const THEMES = {
    A: {
      land:       '#ebe4d0',
      border:     '#b7ae96',
      ocean:      '#f5f0e3',
      atmo:       '#cfc5a9',
      atmoAlt:    0.14,
      imageUrl:   null,
      tilesEnabled: false,
      pin:        '#c8914a',
      pinGlow:    '#d4a060',
      office:     '#c94040',
      officeGlow: '#e05050',
    },
    B: {
      land:       '#1a1a22',
      border:     '#ff6a00',
      ocean:      '#0a0a10',
      atmo:       '#ff6a00',
      atmoAlt:    0.18,
      imageUrl:   null,
      tilesEnabled: false,
      pin:        '#ff6a00',
      pinGlow:    '#ff8c00',
      office:     '#ff2200',
      officeGlow: '#ff4400',
    },
    C: {
      land:       null,
      border:     'rgba(0,0,0,0)',
      ocean:      '#0d1f3c',
      atmo:       '#4fc3f7',
      atmoAlt:    0.25,
      imageUrl:   'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200408.3x5400x2700.jpg',
      imageUrlFallback: 'https://unpkg.com/three-globe@2/example/img/earth-blue-marble.jpg',
      tilesEnabled: true,   // switch to OSM tiles when zoomed in
      tileThreshold: 0.4,   // altitude below which OSM tiles activate
      pin:        '#ffffff',
      pinGlow:    'rgba(255,255,255,0.5)',
      office:     '#ff4081',
      officeGlow: '#ff80ab',
      labelStyle: true,
    },
  };

  // ── DOM refs ─────────────────────────────────────────────
  const container     = document.getElementById('globeViz');
  const loading       = document.getElementById('loading');
  const tooltip       = document.getElementById('tooltip');
  const resetBtn      = document.getElementById('reset');
  const zoomIn        = document.getElementById('zoom-in');
  const zoomOut       = document.getElementById('zoom-out');
  const statTotal     = document.getElementById('stat-total');
  const statCities    = document.getElementById('stat-cities');
  const statCountries = document.getElementById('stat-countries');
  const projectCount  = document.getElementById('project-count');

  // ── Data ─────────────────────────────────────────────────
  const { projects, stats } = window.MVSA;
  statTotal.textContent     = stats.total;
  statCities.textContent    = stats.cities;
  statCountries.textContent = stats.countries;
  if (projectCount) projectCount.textContent = stats.total;

  const hudTotal     = document.getElementById('hud-total');
  const hudCities    = document.getElementById('hud-cities');
  const hudCountries = document.getElementById('hud-countries');
  if (hudTotal)     hudTotal.textContent     = stats.total;
  if (hudCities)    hudCities.textContent    = stats.cities;
  if (hudCountries) hudCountries.textContent = stats.countries;

  // ── Globe init ───────────────────────────────────────────
  const globe = Globe({ animateIn: false })(container);

  function resize() {
    globe.width(container.clientWidth).height(container.clientHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Land data (loaded once) ──────────────────────────────
  let landFeatures = [];
  fetch('https://unpkg.com/world-atlas@2/land-110m.json')
    .then(r => r.json())
    .then(world => {
      landFeatures = topojson.feature(world, world.objects.land).features;
      applyGlobeTheme(currentLayout());
    })
    .catch(() => {});

  // ── OSM tile texture system ──────────────────────────────
  // Converts lat/lng/zoom to OSM tile XY
  function latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y, zoom };
  }

  // Build a canvas texture from OSM tiles stitched together
  // We render a grid of tiles around the current POV centre
  let tileCanvas = null;
  let tileCtx = null;
  let tileTexture = null;
  let tileTextureActive = false;
  let lastTileZoom = -1;
  let tileUpdateTimer = null;

  function osmTileUrl(x, y, z) {
    // Round-robin across OSM tile servers a/b/c
    const s = ['a','b','c'][Math.abs(x + y) % 3];
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  // Create a full-sphere equirectangular texture from OSM tiles
  // at the given zoom level. We render all tiles for that zoom.
  function buildOSMTexture(zoom) {
    const n = Math.pow(2, zoom);          // tiles per axis
    const tileSize = 256;
    const W = n * tileSize;
    const H = n * tileSize;

    // Cap canvas size to avoid GPU limits
    const MAX_PX = 8192;
    const scale  = Math.min(1, MAX_PX / Math.max(W, H));
    const cW = Math.round(W * scale);
    const cH = Math.round(H * scale);
    const ts = Math.round(tileSize * scale);

    if (!tileCanvas) {
      tileCanvas = document.createElement('canvas');
      tileCtx    = tileCanvas.getContext('2d');
    }
    tileCanvas.width  = cW;
    tileCanvas.height = cH;
    tileCtx.fillStyle = '#1a2a4a';
    tileCtx.fillRect(0, 0, cW, cH);

    let loaded = 0;
    const total = n * n;

    function onLoad() {
      loaded++;
      if (loaded >= total) applyCanvasToGlobe();
    }

    for (let tx = 0; tx < n; tx++) {
      for (let ty = 0; ty < n; ty++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          tileCtx.drawImage(img, tx * ts, ty * ts, ts, ts);
          onLoad();
        };
        img.onerror = onLoad; // count errors too so we still apply
        img.src = osmTileUrl(tx, ty, zoom);
      }
    }

    // Apply after 4s regardless (partial tiles still better than nothing)
    setTimeout(() => {
      if (loaded < total) applyCanvasToGlobe();
    }, 4000);
  }

  function applyCanvasToGlobe() {
    if (!tileCanvas) return;
    try {
      // globe.gl's globeImageUrl accepts a data URL
      const dataUrl = tileCanvas.toDataURL('image/jpeg', 0.85);
      globe.globeImageUrl(dataUrl);
      tileTextureActive = true;
    } catch(e) { console.warn('OSM tile apply failed', e); }
  }

  // ── Helpers ──────────────────────────────────────────────
  function currentLayout() {
    return document.body.getAttribute('data-layout') || 'A';
  }

  // OSM zoom level from globe altitude (0.0005 – 4)
  function altToOSMZoom(alt) {
    // altitude 0.4 → zoom 6, altitude 0.01 → zoom 12, altitude 0.0005 → zoom 17
    const z = Math.round(6 - Math.log2(alt / 0.4) * 2);
    return Math.max(2, Math.min(17, z));
  }

  // ── Apply globe theme ────────────────────────────────────
  function applyGlobeTheme(layout) {
    const t = THEMES[layout];
    tileTextureActive = false;
    lastTileZoom = -1;

    if (t.imageUrl) {
      globe
        .globeImageUrl(t.imageUrl)
        .polygonsData([])
        .showAtmosphere(true)
        .atmosphereColor(t.atmo)
        .atmosphereAltitude(t.atmoAlt)
        .backgroundColor('rgba(0,0,0,0)');

      // Fallback check
      if (t.imageUrlFallback) {
        setTimeout(() => {
          try {
            globe.scene().traverse(obj => {
              if (obj.isMesh && obj.geometry?.type === 'SphereGeometry' && obj.material?.map) {
                if (!obj.material.map.image || obj.material.map.image.width === 0) {
                  globe.globeImageUrl(t.imageUrlFallback);
                }
              }
            });
          } catch(e) {}
        }, 3000);
      }
    } else {
      globe
        .globeImageUrl(null)
        .polygonsData(landFeatures)
        .polygonCapColor(() => t.land)
        .polygonSideColor(() => t.border)
        .polygonStrokeColor(() => t.border)
        .polygonAltitude(layout === 'B' ? 0.004 : 0.002)
        .showAtmosphere(true)
        .atmosphereColor(t.atmo)
        .atmosphereAltitude(t.atmoAlt)
        .backgroundColor('rgba(0,0,0,0)');

      setTimeout(() => {
        try {
          globe.scene().traverse(obj => {
            if (obj.isMesh && obj.geometry?.type === 'SphereGeometry') {
              if (obj.material) {
                obj.material.map = null;
                obj.material.color.set(t.ocean);
                obj.material.needsUpdate = true;
              }
            }
          });
        } catch(e) {}
      }, 100);
    }

    buildPins(filteredProjects, t);
  }

  // ── LOD zoom watcher (layout C only) ────────────────────
  function onZoomChange(alt) {
    const layout = currentLayout();
    const t = THEMES[layout];
    if (!t.tilesEnabled) return;

    if (alt < t.tileThreshold) {
      // Zoomed in — use OSM tiles
      const z = altToOSMZoom(alt);
      if (z !== lastTileZoom) {
        lastTileZoom = z;
        clearTimeout(tileUpdateTimer);
        // Small delay so we don't hammer on every scroll tick
        tileUpdateTimer = setTimeout(() => {
          buildOSMTexture(z);
        }, 400);
      }
    } else {
      // Zoomed out — restore NASA photo
      if (tileTextureActive) {
        tileTextureActive = false;
        lastTileZoom = -1;
        globe.globeImageUrl(t.imageUrl);
        clearTimeout(tileUpdateTimer);
      }
    }
  }

  // ── Initial config ───────────────────────────────────────
  const t0 = THEMES['A'];
  globe
    .globeImageUrl(null)
    .backgroundColor('rgba(0,0,0,0)')
    .polygonsData([])
    .polygonCapColor(() => t0.land)
    .polygonSideColor(() => t0.border)
    .polygonStrokeColor(() => t0.border)
    .polygonAltitude(0.002)
    .showAtmosphere(true)
    .atmosphereColor(t0.atmo)
    .atmosphereAltitude(t0.atmoAlt)
    .enablePointerInteraction(true);

  const NL = { lat: 52.3, lng: 5.1, altitude: 1.6 };
  globe.pointOfView(NL, 0);
  setTimeout(() => {
    globe.pointOfView({ ...NL, altitude: 1.2 }, 1200);
    loading.classList.add('hidden');
    applyGlobeTheme('A');
  }, 600);

  // ── Pins ─────────────────────────────────────────────────
  let activePin = null;
  let filteredProjects = projects;

  function makePinEl(p, theme) {
    const el = document.createElement('div');

    if (theme.labelStyle && !p.isOffice) {
      el.className = 'pin-label';
      const lat = Math.abs(p.lat).toFixed(2);
      const lng = Math.abs(p.lng).toFixed(2);
      el.innerHTML = `
        <div class="pin-label-text">${p.city}</div>
        <div class="pin-label-coord">E ${lng} N ${lat}</div>
        <div class="pin-label-dot"></div>
      `;
      el.addEventListener('mouseenter', (e) => {
        tooltip.innerHTML = `
          <div class="ttl">${p.name}</div>
          <div class="meta">${p.city} · ${p.country} · ${p.year}</div>
          <div class="meta" style="margin-top:4px;opacity:.8">${p.type}</div>
        `;
        positionTooltip(e);
        tooltip.classList.add('show');
      });
      el.addEventListener('mousemove', positionTooltip);
      el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePin) activePin.classList.remove('active');
        el.classList.add('active');
        activePin = el;
        globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.05 }, 1000);
      });
      return el;
    }

    // Glow dot pin (layouts A + B)
    el.className = 'pin' + (p.isOffice ? ' office' : '');
    const pinColor  = p.isOffice ? theme.office    : theme.pin;
    const glowColor = p.isOffice ? theme.officeGlow: theme.pinGlow;
    el.innerHTML = `
      <div class="dot" style="background:${pinColor};box-shadow:0 0 0 1px rgba(255,255,255,0.5),0 0 6px ${glowColor},0 0 14px ${glowColor}"></div>
      <div class="halo" style="background:radial-gradient(circle,${glowColor} 0%,transparent 70%)"></div>
      <div class="halo b" style="background:radial-gradient(circle,${glowColor} 0%,transparent 70%)"></div>
    `;
    el.addEventListener('mouseenter', (e) => {
      if (p.isOffice) return;
      tooltip.innerHTML = `
        <div class="ttl">${p.name}</div>
        <div class="meta">${p.city} · ${p.country} · ${p.year}</div>
        <div class="meta" style="margin-top:4px;opacity:.8">${p.type}</div>
      `;
      positionTooltip(e);
      tooltip.classList.add('show');
    });
    el.addEventListener('mousemove', positionTooltip);
    el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (p.isOffice) return;
      if (activePin) activePin.classList.remove('active');
      el.classList.add('active');
      activePin = el;
      globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.4 }, 800);
    });
    return el;
  }

  function buildPins(list, theme) {
    const t = theme || THEMES[currentLayout()];
    globe
      .htmlElementsData(list)
      .htmlElement(p => makePinEl(p, t))
      .htmlLat(p => p.lat)
      .htmlLng(p => p.lng)
      .htmlAltitude(p => p.isOffice ? 0.012 : 0.005);
  }

  buildPins(projects);

  // ── Expose to HTML ───────────────────────────────────────
  window.setGlobeLayout = applyGlobeTheme;

  // ── Tooltip ──────────────────────────────────────────────
  function positionTooltip(e) {
    const tw = tooltip.offsetWidth || 160;
    const th = tooltip.offsetHeight || 50;
    const left = (e.clientX + tw + 20 > window.innerWidth) ? e.clientX - tw - 14 : e.clientX + 14;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = (e.clientY - th / 2) + 'px';
  }

  // ── Search ───────────────────────────────────────────────
  function handleSearch(q) {
    filteredProjects = q
      ? projects.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q))
      : projects;
    buildPins(filteredProjects);
    if (filteredProjects.length && q) {
      const first = filteredProjects.find(p => !p.isOffice) || filteredProjects[0];
      globe.pointOfView({ lat: first.lat, lng: first.lng, altitude: 0.8 }, 700);
    }
  }

  ['search-sidebar', 'search-hud'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => handleSearch(el.value.toLowerCase().trim()));
  });

  // ── Reset ────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (activePin) { activePin.classList.remove('active'); activePin = null; }
    tooltip.classList.remove('show');
    globe.pointOfView({ ...NL, altitude: 1.2 }, 900);
    ['search-sidebar', 'search-hud'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    filteredProjects = projects;
    buildPins(projects);
    // Restore NASA texture if tiles were active
    const t = THEMES[currentLayout()];
    if (t.imageUrl && tileTextureActive) {
      tileTextureActive = false;
      lastTileZoom = -1;
      globe.globeImageUrl(t.imageUrl);
    }
  });

  // ── Zoom ─────────────────────────────────────────────────
  function getAlt() { return globe.pointOfView().altitude; }
  function setAlt(a, ms) {
    const clamped = Math.max(0.0003, Math.min(4, a));
    globe.pointOfView({ ...globe.pointOfView(), altitude: clamped }, ms || 300);
    onZoomChange(clamped);
  }
  zoomIn.addEventListener('click',  () => setAlt(getAlt() * 0.5));
  zoomOut.addEventListener('click', () => setAlt(getAlt() * 2.0));

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    stopRotate();
    const newAlt = getAlt() * (e.deltaY > 0 ? 1.12 : 0.88);
    setAlt(newAlt, 80);
  }, { passive: false });

  // Also hook globe.gl's built-in zoom callback
  globe.onZoom(({ altitude }) => {
    onZoomChange(altitude);
  });

  // ── Auto-rotate ──────────────────────────────────────────
  let autoRotate = true;
  let rotateTimer = null;
  function startRotate() { autoRotate = true; }
  function stopRotate() {
    autoRotate = false;
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(startRotate, 5000);
  }
  container.addEventListener('mousedown', stopRotate);
  container.addEventListener('touchstart', stopRotate, { passive: true });
  globe.onZoom(stopRotate);

  const ROTATION_SPEED = 0.0008;
  (function rotateLoop() {
    requestAnimationFrame(rotateLoop);
    if (!autoRotate) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, lng: pov.lng + ROTATION_SPEED * (180 / Math.PI) }, 0);
  })();

})();
