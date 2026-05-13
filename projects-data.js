// ============================================================
// MVSA — Dummy project data
// 100 projects clustered around Dutch cities, plus some EU.
// ============================================================

(function () {
  const cities = [
    // Netherlands — heavy concentration around Randstad
    { name: 'Amsterdam',     country: 'Nederland', lat: 52.3676, lng: 4.9041,  count: 18, spread: 0.025 },
    { name: 'Rotterdam',     country: 'Nederland', lat: 51.9244, lng: 4.4777,  count: 9,  spread: 0.030 },
    { name: 'Den Haag',      country: 'Nederland', lat: 52.0705, lng: 4.3007,  count: 7,  spread: 0.025 },
    { name: 'Utrecht',       country: 'Nederland', lat: 52.0907, lng: 5.1214,  count: 8,  spread: 0.025 },
    { name: 'Eindhoven',     country: 'Nederland', lat: 51.4416, lng: 5.4697,  count: 5,  spread: 0.025 },
    { name: 'Groningen',     country: 'Nederland', lat: 53.2194, lng: 6.5665,  count: 4,  spread: 0.020 },
    { name: 'Maastricht',    country: 'Nederland', lat: 50.8514, lng: 5.6909,  count: 2,  spread: 0.015 },
    { name: 'Tilburg',       country: 'Nederland', lat: 51.5555, lng: 5.0913,  count: 3,  spread: 0.020 },
    { name: 'Breda',         country: 'Nederland', lat: 51.5719, lng: 4.7683,  count: 2,  spread: 0.020 },
    { name: 'Nijmegen',      country: 'Nederland', lat: 51.8126, lng: 5.8372,  count: 3,  spread: 0.020 },
    { name: 'Apeldoorn',     country: 'Nederland', lat: 52.2112, lng: 5.9699,  count: 3,  spread: 0.020 },
    { name: 'Haarlem',       country: 'Nederland', lat: 52.3874, lng: 4.6462,  count: 3,  spread: 0.018 },
    { name: 'Enschede',      country: 'Nederland', lat: 52.2215, lng: 6.8937,  count: 2,  spread: 0.020 },
    { name: 'Arnhem',        country: 'Nederland', lat: 51.9851, lng: 5.8987,  count: 3,  spread: 0.020 },
    { name: 'Zwolle',        country: 'Nederland', lat: 52.5168, lng: 6.0830,  count: 2,  spread: 0.020 },
    { name: 'Leiden',        country: 'Nederland', lat: 52.1601, lng: 4.4970,  count: 3,  spread: 0.018 },
    { name: 'Delft',         country: 'Nederland', lat: 52.0116, lng: 4.3571,  count: 2,  spread: 0.015 },
    { name: 'Almere',        country: 'Nederland', lat: 52.3508, lng: 5.2647,  count: 2,  spread: 0.020 },
    { name: 'Amersfoort',    country: 'Nederland', lat: 52.1561, lng: 5.3878,  count: 2,  spread: 0.018 },
    { name: 's-Hertogenbosch', country: 'Nederland', lat: 51.6978, lng: 5.3037, count: 2, spread: 0.018 },

    // Europe — sprinkled across
    { name: 'Brussel',       country: 'België',      lat: 50.8503, lng: 4.3517,  count: 3, spread: 0.025 },
    { name: 'Antwerpen',     country: 'België',      lat: 51.2194, lng: 4.4025,  count: 2, spread: 0.020 },
    { name: 'Parijs',        country: 'Frankrijk',   lat: 48.8566, lng: 2.3522,  count: 2, spread: 0.025 },
    { name: 'Berlijn',       country: 'Duitsland',   lat: 52.5200, lng: 13.4050, count: 2, spread: 0.030 },
    { name: 'Keulen',        country: 'Duitsland',   lat: 50.9375, lng: 6.9603,  count: 2, spread: 0.020 },
    { name: 'Hamburg',       country: 'Duitsland',   lat: 53.5511, lng: 9.9937,  count: 1, spread: 0.020 },
    { name: 'Düsseldorf',    country: 'Duitsland',   lat: 51.2277, lng: 6.7735,  count: 1, spread: 0.020 },
    { name: 'Kopenhagen',    country: 'Denemarken',  lat: 55.6761, lng: 12.5683, count: 1, spread: 0.020 },
    { name: 'Wenen',         country: 'Oostenrijk',  lat: 48.2082, lng: 16.3738, count: 1, spread: 0.020 },
    { name: 'Londen',        country: 'Verenigd Koninkrijk', lat: 51.5074, lng: -0.1278, count: 2, spread: 0.025 },
  ];

  // Project names — a mix of evocative Dutch architecture-y references.
  const namePool = [
    'De Brink', 'Westerpark Wonen', 'Houthaven Kade', 'Borneo Eiland', 'IJburg Fase II',
    'Sluisbuurt Toren', 'Zuidas Plot 12', 'Oosterdok Hub', 'Cruquius Werf', 'NDSM Loods 27',
    'Buiksloterham', 'Kop van Zuid', 'Wilhelminapier', 'Lloydkwartier', 'Katendrecht',
    'Spangen Blok', 'Vondelpark Lyceum', 'Jordaan Renovatie', 'De Pijp Hofje', 'Plantage Bibliotheek',
    'Rivierenbuurt 33', 'Mariënburg Veld', 'Leidsche Rijn Centrum', 'Vaartsche Rijn Brug',
    'Strijp-S Atelier', 'Philipsdorp Update', 'Woensel Plein', 'Helmond West', 'Heuvel Galerie',
    'Boschveld Park', 'Stadshart Almere', 'Floriade Paviljoen', 'Hoog Catharijne', 'Tivoli Vredenburg',
    'Markthal Atrium', 'Boijmans Depot', 'Erasmus MC', 'Spoorzone Tilburg', 'Piushaven Steiger',
    'Eindhoven Centrum', 'Heuvelgalerie 4', 'Genneper Parken', 'De Kempen Hof', 'Vesteda Tower',
    'Kanaalzone', 'De Hallen', 'Marineterrein', 'Zeeburgereiland', 'Centrumeiland',
    'Strandeiland', 'Pampusbuurt', 'De Hoef', 'Vathorst Lyceum', 'Soesterkwartier',
    'Berkenkamp', 'Het Loo Paviljoen', 'Wagnerplein', 'Bossche Broek', 'Paleiskwartier',
    'Stationskwartier', 'Hart van Zuid', 'De Mortel', 'Tongelreep', 'Helmond Brandevoort',
    'Centrumplan Veghel', 'Rivierpark Wonen', 'IJsselbiënnale', 'Hanzelijn Halte', 'Spoorpark Atelier',
    'De Esch', 'Lloyd Hotel', 'A12 Corridor', 'Park Lingezegen', 'Stadshart Zoetermeer',
    'Nieuwe Driemanspolder', 'Bleizo Halte', 'Westflank Haarlemmermeer', 'Schiphol Trade Park',
    'Zaanse Helden', 'Wormerveer Mill', 'Volendam Haven', 'Texel Veerhuis', 'Lauwersmeer Pier',
    'Boschplaat Cabane', 'Oranjewoud Atelier', 'Veluwe Lodge', 'Drents Museum Wing', 'Kunsthal Tilburg',
    'Hortus Botanicus', 'Theater De Krakeling', 'Concertgebouw Foyer', 'Stedelijk Annex', 'EYE Filmmuseum',
    'Centraal Museum', 'Naturalis Studie', 'Mauritshuis Park', 'Markthal Bxl', 'Tour & Taxis',
    'Canal Quay', 'Rive Gauche Atelier', 'Île Seguin Hub', 'Spree Bogen', 'Hafencity Lab',
    'Medienhafen', 'Nyhavn Studio', 'MuseumsQuartier', 'Battersea Studio', 'King\'s Cross Yard',
  ];

  const types = [
    'Woningbouw', 'Renovatie', 'Kantoor', 'Stedenbouw', 'School',
    'Cultureel', 'Zorg', 'Transformatie', 'Interieur', 'Openbare Ruimte'
  ];

  // Deterministic pseudo-random so the layout is stable across reloads.
  let _seed = 1337;
  function rnd() {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
  }

  const projects = [];

  // Office first (id 0)
  projects.push({
    id: 0,
    name: 'MVSA Architects',
    city: 'Amsterdam',
    country: 'Nederland',
    type: 'Kantoor',
    year: 1985,
    lat: 52.3414,
    lng: 4.8721,        // Olympic Stadium / Zuid area-ish
    isOffice: true
  });

  let nIdx = 0;
  for (const c of cities) {
    for (let k = 0; k < c.count; k++) {
      const lat = c.lat + (rnd() - 0.5) * c.spread;
      const lng = c.lng + (rnd() - 0.5) * c.spread * 1.4;
      const name = namePool[nIdx % namePool.length];
      nIdx++;
      projects.push({
        id: projects.length,
        name: name,
        city: c.name,
        country: c.country,
        type: types[Math.floor(rnd() * types.length)],
        year: 2008 + Math.floor(rnd() * 18),
        lat, lng,
        isOffice: false
      });
    }
  }

  // Expose globally
  window.MVSA = {
    projects,
    cities,
    stats: {
      total: projects.length - 1,
      cities: cities.length,
      countries: new Set(projects.map(p => p.country)).size
    }
  };
})();
