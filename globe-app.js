// ============================================================
// MVSA — globe-app.js
// Requires: globe.gl@2.32.0, three.js, projects-data.js
// ============================================================

(function () {

  // ── Theme configs ─────────────────────────────────────────
  const THEMES = {
    A: {
      land: '#ebe4d0', border: '#b7ae96', ocean: '#f5f0e3',
      atmo: '#cfc5a9', atmoAlt: 0.14,
      pin: '#c8914a', pinGlow: '#d4a060',
      office: '#c94040', officeGlow: '#e05050',
    },
    B: {
      land: '#1a1a22', border: '#ff6a00', ocean: '#0a0a10',
      atmo: '#ff6a00', atmoAlt: 0.18,
      pin: '#ff6a00', pinGlow: '#ff8c00',
      office: '#ff2200', officeGlow: '#ff4400',
    },
    C: {
      ocean: '#0d1f3c', atmo: '#4fc3f7', atmoAlt: 0.25,
      // Reliable high-res image via three-globe CDN
      imageUrl: 'https://unpkg.com/three-globe@2/example/img/earth-blue-marble.jpg',
      pin: '#ffffff', pinGlow: 'rgba(255,255,255,0.5)',
      office: '#ff4081', officeGlow: '#ff80ab',
      labelStyle: true,
    },
  };

  // ── DOM refs ──────────────────────────────────────────────
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

  // ── Data ──────────────────────────────────────────────────
  const { projects, stats } = window.MVSA;
  statTotal.textContent     = stats.total;
  statCities.textContent    = stats.cities;
  statCountries.textContent = stats.countries;
  if (projectCount) projectCount.textContent = stats.total;
  ['hud-total','hud-cities','hud-countries'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = [stats.total, stats.cities, stats.countries][i];
  });

  // ── Globe init ────────────────────────────────────────────
  const globe = Globe({ animateIn: false })(container);
  function resize() { globe.width(container.clientWidth).height(container.clientHeight); }
  resize();
  window.addEventListener('resize', resize);

  // ── Land data ─────────────────────────────────────────────
  let landFeatures = [];
  fetch('https://unpkg.com/world-atlas@2/land-110m.json')
    .then(r => r.json())
    .then(world => {
      landFeatures = topojson.feature(world, world.objects.land).features;
      applyGlobeTheme(currentLayout());
    }).catch(() => {});

  function currentLayout() {
    return document.body.getAttribute('data-layout') || 'A';
  }

  // ── Street-level overlay (Leaflet on top of globe) ────────
  // When zoomed in past threshold in layout C, show a Leaflet
  // overlay that fades in over the globe for street-level detail.
  let leafletMap = null;
  let leafletOverlay = null;
  let streetMode = false;

  function initLeafletOverlay() {
    if (leafletOverlay) return;

    // Create overlay div on top of globe
    leafletOverlay = document.createElement('div');
    leafletOverlay.id = 'street-overlay';
    leafletOverlay.style.cssText = `
      position:absolute;inset:0;z-index:10;
      opacity:0;pointer-events:none;
      transition:opacity 600ms ease;
      border-radius:0;
    `;
    container.appendChild(leafletOverlay);

    // Init Leaflet inside overlay
    leafletMap = L.map(leafletOverlay, {
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      crossOrigin: true,
    }).addTo(leafletMap);

    // Dark overlay tiles for layout B feel
    leafletMap.on('load', () => {});
  }

  function showStreetMode(lat, lng, altitudeApprox) {
    if (!window.L) return; // Leaflet not loaded

    initLeafletOverlay();
    streetMode = true;

    // Convert altitude to zoom (rough: alt 0.02→z14, 0.005→z16, 0.001→z18)
    const z = Math.round(14 - Math.log2(altitudeApprox / 0.02) * 1.5);
    const zoom = Math.max(10, Math.min(19, z));

    leafletMap.setView([lat, lng], zoom);
    leafletMap.invalidateSize();

    leafletOverlay.style.pointerEvents = 'auto';
    requestAnimationFrame(() => { leafletOverlay.style.opacity = '1'; });
  }

  function hideStreetMode() {
    if (!leafletOverlay) return;
    streetMode = false;
    leafletOverlay.style.opacity = '0';
    leafletOverlay.style.pointerEvents = 'none';
  }

  // ── Apply globe theme ─────────────────────────────────────
  function applyGlobeTheme(layout) {
    const t = THEMES[layout];
    hideStreetMode();

    if (layout === 'C') {
      globe
        .globeImageUrl(t.imageUrl)
        .polygonsData([])
        .showAtmosphere(true)
        .atmosphereColor(t.atmo)
        .atmosphereAltitude(t.atmoAlt)
        .backgroundColor('rgba(0,0,0,0)');
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
            if (obj.isMesh && obj.geometry?.type === 'SphereGeometry' && obj.material) {
              obj.material.map = null;
              obj.material.color.set(t.ocean);
              obj.material.needsUpdate = true;
            }
          });
        } catch(e) {}
      }, 100);
    }

    buildPins(filteredProjects, t);
  }

  // ── Zoom threshold watcher for layout C ───────────────────
  const STREET_THRESHOLD = 0.04; // below this → show leaflet

  function handleZoomChange() {
    if (currentLayout() !== 'C') return;
    const pov = globe.pointOfView();
    if (pov.altitude < STREET_THRESHOLD && !streetMode) {
      showStreetMode(pov.lat, pov.lng, pov.altitude);
    } else if (pov.altitude >= STREET_THRESHOLD && streetMode) {
      hideStreetMode();
    } else if (streetMode && leafletMap) {
      // Update leaflet view while in street mode
      const z = Math.round(14 - Math.log2(pov.altitude / 0.02) * 1.5);
      leafletMap.setView([pov.lat, pov.lng], Math.max(10, Math.min(19, z)), { animate: false });
    }
  }

  // ── Initial setup ─────────────────────────────────────────
  const t0 = THEMES['A'];
  globe
    .globeImageUrl(null).backgroundColor('rgba(0,0,0,0)')
    .polygonsData([])
    .polygonCapColor(() => t0.land).polygonSideColor(() => t0.border)
    .polygonStrokeColor(() => t0.border).polygonAltitude(0.002)
    .showAtmosphere(true).atmosphereColor(t0.atmo).atmosphereAltitude(t0.atmoAlt)
    .enablePointerInteraction(true);

  const NL = { lat: 52.3, lng: 5.1, altitude: 1.6 };
  globe.pointOfView(NL, 0);
  setTimeout(() => {
    globe.pointOfView({ ...NL, altitude: 1.2 }, 1200);
    loading.classList.add('hidden');
    applyGlobeTheme('A');
  }, 600);

  // ── Pins ──────────────────────────────────────────────────
  let activePin = null;
  let filteredProjects = projects;

  function makePinEl(p, theme) {
    const el = document.createElement('div');

    if (theme.labelStyle && !p.isOffice) {
      el.className = 'pin-label';
      el.innerHTML = `
        <div class="pin-label-text">${p.city}</div>
        <div class="pin-label-coord">E ${Math.abs(p.lng).toFixed(2)} N ${Math.abs(p.lat).toFixed(2)}</div>
        <div class="pin-label-dot"></div>
      `;
      el.addEventListener('mouseenter', e => {
        tooltip.innerHTML = `<div class="ttl">${p.name}</div><div class="meta">${p.city} · ${p.country} · ${p.year}</div><div class="meta" style="margin-top:4px;opacity:.8">${p.type}</div>`;
        positionTooltip(e); tooltip.classList.add('show');
      });
      el.addEventListener('mousemove', positionTooltip);
      el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (activePin) activePin.classList.remove('active');
        el.classList.add('active'); activePin = el;
        // Fly in and trigger street mode
        globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.02 }, 1400);
        setTimeout(handleZoomChange, 1500);
      });
      return el;
    }

    el.className = 'pin' + (p.isOffice ? ' office' : '');
    const pc = p.isOffice ? theme.office    : theme.pin;
    const gc = p.isOffice ? theme.officeGlow: theme.pinGlow;
    el.innerHTML = `
      <div class="dot" style="background:${pc};box-shadow:0 0 0 1px rgba(255,255,255,0.5),0 0 6px ${gc},0 0 14px ${gc}"></div>
      <div class="halo" style="background:radial-gradient(circle,${gc} 0%,transparent 70%)"></div>
      <div class="halo b" style="background:radial-gradient(circle,${gc} 0%,transparent 70%)"></div>
    `;
    el.addEventListener('mouseenter', e => {
      if (p.isOffice) return;
      tooltip.innerHTML = `<div class="ttl">${p.name}</div><div class="meta">${p.city} · ${p.country} · ${p.year}</div><div class="meta" style="margin-top:4px;opacity:.8">${p.type}</div>`;
      positionTooltip(e); tooltip.classList.add('show');
    });
    el.addEventListener('mousemove', positionTooltip);
    el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (p.isOffice) return;
      if (activePin) activePin.classList.remove('active');
      el.classList.add('active'); activePin = el;
      globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.4 }, 800);
    });
    return el;
  }

  function buildPins(list, theme) {
    const t = theme || THEMES[currentLayout()];
    globe
      .htmlElementsData(list)
      .htmlElement(p => makePinEl(p, t))
      .htmlLat(p => p.lat).htmlLng(p => p.lng)
      .htmlAltitude(p => p.isOffice ? 0.012 : 0.005);
  }
  buildPins(projects);

  window.setGlobeLayout = applyGlobeTheme;

  // ── Tooltip ───────────────────────────────────────────────
  function positionTooltip(e) {
    const tw = tooltip.offsetWidth || 160, th = tooltip.offsetHeight || 50;
    const left = (e.clientX + tw + 20 > window.innerWidth) ? e.clientX - tw - 14 : e.clientX + 14;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = (e.clientY - th / 2) + 'px';
  }

  // ── Search ────────────────────────────────────────────────
  function handleSearch(q) {
    filteredProjects = q
      ? projects.filter(p =>
          p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
      : projects;
    buildPins(filteredProjects);
    if (filteredProjects.length && q) {
      const first = filteredProjects.find(p => !p.isOffice) || filteredProjects[0];
      globe.pointOfView({ lat: first.lat, lng: first.lng, altitude: 0.8 }, 700);
    }
  }
  ['search-sidebar','search-hud'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => handleSearch(el.value.toLowerCase().trim()));
  });

  // ── Reset ─────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (activePin) { activePin.classList.remove('active'); activePin = null; }
    tooltip.classList.remove('show');
    hideStreetMode();
    globe.pointOfView({ ...NL, altitude: 1.2 }, 900);
    ['search-sidebar','search-hud'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    filteredProjects = projects;
    buildPins(projects);
  });

  // ── Zoom ──────────────────────────────────────────────────
  function getAlt() { return globe.pointOfView().altitude; }
  function setAlt(a, ms) {
    const clamped = Math.max(0.0003, Math.min(4, a));
    globe.pointOfView({ ...globe.pointOfView(), altitude: clamped }, ms || 300);
    setTimeout(handleZoomChange, (ms || 300) + 50);
  }
  zoomIn.addEventListener('click',  () => setAlt(getAlt() * 0.5));
  zoomOut.addEventListener('click', () => setAlt(getAlt() * 2.0));

  container.addEventListener('wheel', e => {
    e.preventDefault();
    stopRotate();
    setAlt(getAlt() * (e.deltaY > 0 ? 1.12 : 0.88), 60);
  }, { passive: false });

  globe.onZoom(({ altitude }) => {
    if (currentLayout() === 'C') handleZoomChange();
  });

  // ── Auto-rotate ───────────────────────────────────────────
  let autoRotate = true, rotateTimer = null;
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
