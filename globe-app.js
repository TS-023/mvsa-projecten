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
      // High-res NASA Blue Marble (8192px) via NASA servers
      imageUrl:   'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200408.3x5400x2700.jpg',
      imageUrlFallback: 'https://unpkg.com/three-globe@2/example/img/earth-blue-marble.jpg',
      pin:        '#ffffff',
      pinGlow:    'rgba(255,255,255,0.5)',
      office:     '#ff4081',
      officeGlow: '#ff80ab',
      labelStyle: true,   // use coordinate label pins instead of dots
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

  // Update HUD stats
  const hudTotal = document.getElementById('hud-total');
  const hudCities = document.getElementById('hud-cities');
  const hudCountries = document.getElementById('hud-countries');
  if (hudTotal) hudTotal.textContent = stats.total;
  if (hudCities) hudCities.textContent = stats.cities;
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

  // ── Helpers ──────────────────────────────────────────────
  function currentLayout() {
    return document.body.getAttribute('data-layout') || 'A';
  }

  // ── Apply globe theme ────────────────────────────────────
  function applyGlobeTheme(layout) {
    const t = THEMES[layout];

    if (t.imageUrl) {
      // Satellite texture mode — try high-res, fallback on error
      globe
        .globeImageUrl(t.imageUrl)
        .polygonsData([])
        .showAtmosphere(true)
        .atmosphereColor(t.atmo)
        .atmosphereAltitude(t.atmoAlt)
        .backgroundColor('rgba(0,0,0,0)');

      // Fallback if NASA image fails to load
      if (t.imageUrlFallback) {
        setTimeout(() => {
          try {
            const renderer = globe.renderer();
            // Check if texture loaded by looking at the globe material
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
      // Polygon mode
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

      // Tint ocean sphere
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
      // ── Layout C: coordinate label tag (like reference image) ──
      el.className = 'pin-label';
      const lat  = p.lat.toFixed(2);
      const lng  = p.lng.toFixed(2);
      const latS = p.lat >= 0 ? 'N' : 'S';
      const lngS = p.lng >= 0 ? 'E' : 'W';
      el.innerHTML = `
        <div class="pin-label-text">${p.city}</div>
        <div class="pin-label-coord">E ${Math.abs(lng).toFixed(2)} N ${Math.abs(lat).toFixed(2)}</div>
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
        globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.4 }, 800);
      });

      return el;
    }

    // ── Layout A/B: glow dot pin ──
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

  // Wire up both search inputs (sidebar A = 'search-sidebar', HUD B/C = 'search-hud')
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
  });

  // ── Zoom ─────────────────────────────────────────────────
  function getAlt() { return globe.pointOfView().altitude; }
  function setAlt(a, ms) {
    globe.pointOfView({ ...globe.pointOfView(), altitude: Math.max(0.15, Math.min(4, a)) }, ms || 300);
  }
  zoomIn.addEventListener('click',  () => setAlt(getAlt() * 0.65));
  zoomOut.addEventListener('click', () => setAlt(getAlt() * 1.5));

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    stopRotate();
    setAlt(getAlt() * (e.deltaY > 0 ? 1.12 : 0.88), 80);
  }, { passive: false });

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
