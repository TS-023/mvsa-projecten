// ============================================================
// MVSA — globe-app.js
// Requires: globe.gl@2.32.0, three.js, projects-data.js
// ============================================================

(function () {
  // ── CSS variable colours resolved at runtime ─────────────
  const style   = getComputedStyle(document.documentElement);
  const C_PIN    = '#c8914a';   // warm amber — matches --pin oklch
  const C_OFFICE = '#c94040';   // coral/red  — matches --office oklch
  const C_BG     = '#efe9da';
  const C_LAND   = '#ebe4d0';
  const C_OCEAN  = '#f5f0e3';
  const C_BORDER = '#b7ae96';

  // ── DOM refs ─────────────────────────────────────────────
  const container   = document.getElementById('globeViz');
  const loading     = document.getElementById('loading');
  const tooltip     = document.getElementById('tooltip');
  const resetBtn    = document.getElementById('reset');
  const zoomIn      = document.getElementById('zoom-in');
  const zoomOut     = document.getElementById('zoom-out');
  const searchInput = document.getElementById('search');
  const statTotal   = document.getElementById('stat-total');
  const statCities  = document.getElementById('stat-cities');
  const statCountries = document.getElementById('stat-countries');
  const projectCount  = document.getElementById('project-count');

  // ── Data ─────────────────────────────────────────────────
  const { projects, stats } = window.MVSA;

  // Fill stats
  statTotal.textContent    = stats.total;
  statCities.textContent   = stats.cities;
  statCountries.textContent = stats.countries;
  if (projectCount) projectCount.textContent = stats.total;

  // ── Globe init ───────────────────────────────────────────
  const globe = Globe({ animateIn: false })(container);

  // Size globe to container
  function resize() {
    globe.width(container.clientWidth).height(container.clientHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Globe visual config ──────────────────────────────────
  globe
    .globeImageUrl(null)
    .backgroundColor('rgba(0,0,0,0)')
    // Land polygons via topojson
    .polygonsData([])          // populated after fetch
    .polygonCapColor(() => C_LAND)
    .polygonSideColor(() => C_BORDER)
    .polygonStrokeColor(() => C_BORDER)
    .polygonAltitude(0.002)
    // Atmosphere
    .showAtmosphere(true)
    .atmosphereColor(C_BORDER)
    .atmosphereAltitude(0.14)
    // Controls
    .enablePointerInteraction(true);

  // Fetch world land polygons
  fetch('https://unpkg.com/world-atlas@2/land-110m.json')
    .then(r => r.json())
    .then(world => {
      const land = topojson.feature(world, world.objects.land);
      globe.polygonsData(land.features);
    })
    .catch(() => {
      // Fallback: solid globe if fetch fails
      globe.globeImageUrl(
        'https://unpkg.com/three-globe@2/example/img/earth-day.jpg'
      );
    });

  // ── Initial camera position — centred on Netherlands ─────
  const NL = { lat: 52.3, lng: 5.1, altitude: 1.6 };
  globe.pointOfView(NL, 0);

  // Small delay so globe renders before flying in
  setTimeout(() => {
    globe.pointOfView({ ...NL, altitude: 1.2 }, 1200);
    loading.classList.add('hidden');
  }, 600);

  // ── Points (HTML pins via htmlElementsData) ───────────────
  let activePin = null;
  let filteredProjects = projects;

  function makePinEl(p) {
    const el = document.createElement('div');
    el.className = 'pin' + (p.isOffice ? ' office' : '');
    el.innerHTML = `
      <div class="dot"></div>
      <div class="halo"></div>
      <div class="halo b"></div>
    `;

    // Hover tooltip
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

    // Click — fly to project
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (p.isOffice) return;

      // Reset previous active
      if (activePin) activePin.classList.remove('active');
      el.classList.add('active');
      activePin = el;

      globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.4 }, 800);
    });

    return el;
  }

  function buildPins(list) {
    globe
      .htmlElementsData(list)
      .htmlElement(p => makePinEl(p))
      .htmlLat(p => p.lat)
      .htmlLng(p => p.lng)
      .htmlAltitude(p => p.isOffice ? 0.012 : 0.005);
  }

  buildPins(projects);

  // ── Tooltip positioning ──────────────────────────────────
  function positionTooltip(e) {
    const x = e.clientX, y = e.clientY;
    const tw = tooltip.offsetWidth || 160;
    const th = tooltip.offsetHeight || 50;
    // Flip left if too close to right edge
    const left = (x + tw + 20 > window.innerWidth) ? x - tw - 14 : x + 14;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = (y - th / 2) + 'px';
  }

  // ── Search ───────────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      filteredProjects = projects;
    } else {
      filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
    }
    buildPins(filteredProjects);

    // Fly to first result
    if (filteredProjects.length && q) {
      const first = filteredProjects.find(p => !p.isOffice) || filteredProjects[0];
      globe.pointOfView({ lat: first.lat, lng: first.lng, altitude: 0.8 }, 700);
    }
  });

  // ── Reset ─────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (activePin) { activePin.classList.remove('active'); activePin = null; }
    tooltip.classList.remove('show');
    globe.pointOfView({ ...NL, altitude: 1.2 }, 900);
    searchInput.value = '';
    filteredProjects = projects;
    buildPins(projects);
  });

  // ── Zoom buttons ─────────────────────────────────────────
  function getAlt()   { return globe.pointOfView().altitude; }
  function setAlt(a)  { globe.pointOfView({ ...globe.pointOfView(), altitude: Math.max(0.15, Math.min(4, a)) }, 300); }
  zoomIn.addEventListener('click',  () => setAlt(getAlt() * 0.65));
  zoomOut.addEventListener('click', () => setAlt(getAlt() * 1.5));

  // ── Auto-rotate (stops on interaction) ───────────────────
  let autoRotate = true;
  let rotateTimer = null;

  function startRotate() {
    autoRotate = true;
  }
  function stopRotate() {
    autoRotate = false;
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(startRotate, 5000); // resume after 5s
  }

  container.addEventListener('mousedown', stopRotate);
  container.addEventListener('touchstart', stopRotate, { passive: true });

  // Rotation tick via Three.js camera
  const ROTATION_SPEED = 0.0008; // radians/frame
  globe.onZoom(stopRotate);

  // Hijack the render loop via requestAnimationFrame
  (function rotateLoop() {
    requestAnimationFrame(rotateLoop);
    if (!autoRotate) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, lng: pov.lng + ROTATION_SPEED * (180 / Math.PI) }, 0);
  })();

  // ── Globe background sphere colour ───────────────────────
  // Access the Three.js scene to tint the globe sphere
  setTimeout(() => {
    try {
      const threeObj = globe.scene();
      threeObj.traverse(obj => {
        if (obj.isMesh && obj.geometry?.type === 'SphereGeometry') {
          if (obj.material && !obj.material.map) {
            obj.material.color.set(C_OCEAN);
          }
        }
      });
    } catch(e) {}
  }, 800);

})();
