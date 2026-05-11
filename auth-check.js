/* ============================================================
   DATA SECTIE — grote statistieken bovenaan het dashboard
   Bevat:
     - AantalProjecten   (links-1)
     - VeldenIngevuld    (links-2)
     - RandomProject     (links-3)
     - Leaderboard       (midden)
     - RecentCard        (rechts-1 en rechts-2)
     - DataSection       (samengesteld)
   ============================================================ */


/* ── AantalProjecten: grote teller bovenlinks ── */
function AantalProjecten({ projectsFilled }) {
  return (
    <div className="card stat left-1">
      <h3>Aantal projecten ingevuld</h3>
      <div className="num">{projectsFilled}</div>
      <div className="delta">van <b>104</b> totaal · <b>+6</b> deze week</div>
    </div>
  );
}


/* ── VeldenIngevuld: teller van ingevulde velden ── */
function VeldenIngevuld({ fieldsFilled }) {
  return (
    <div className="card stat left-2">
      <h3>Totaal aantal velden ingevuld</h3>
      <div className="num">{fieldsFilled.toLocaleString('nl-NL')}</div>
      <div className="delta"><b>72%</b> van mogelijke velden</div>
    </div>
  );
}


/* ── RandomProject: uitgelicht project met tags ── */
function RandomProject({ project }) {
  return (
    <div className="card random-project left-3">
      <h3>Random project uitgelicht</h3>
      <a className="rp-img" href={projectHref(project.name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <div className="name">
        <a href={projectHref(project.name)}
           style={{ color: 'inherit', textDecoration: 'none' }}
           onMouseOver={(e) => e.target.style.color = '#3d6e8a'}
           onMouseOut={(e) => e.target.style.color = 'inherit'}>
          {project.name}
        </a>
      </div>
      <div className="meta">{project.city}</div>
      <div className="rp-tags">
        {project.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
      </div>
    </div>
  );
}


/* ── Leaderboard: meeste velden ingevuld (midden kolom) ── */
function Leaderboard({ leaderboard, leaderPhoto }) {
  return (
    <div className="card middle"
         onClick={() => window.location.href = 'employees.html'}
         style={{ cursor: 'pointer' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Meeste velden ingevuld</h3>
      <div className="lead-photo"
           style={leaderPhoto
             ? { backgroundImage: `url(${leaderPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
             : {}}>
        {!leaderPhoto && <div className="ph"></div>}
        <div className="cap">
          {leaderboard && leaderboard[0] ? leaderboard[0].name + ' · #1' : 'Leader · Mei 2026'}
        </div>
      </div>
      <RankList items={leaderboard} linkEmployees />
    </div>
  );
}


/* ── RecentCard: recent toegevoegd project (kaartje rechts) ── */
function RecentCard({ project, position }) {
  const className = `card recent-card ${position === 0 ? 'right-1' : 'right-2'}`;
  return (
    <div className={className}>
      <a className={`img ${project.tone === 'cool' ? 'alt' : ''}`}
         href={`project_page.html?nr=${encodeURIComponent(project.projectnummer || '')}&p=${encodeURIComponent(project.title || '')}`}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <div className="meta">
        <span className="ttl">
          <a href={`project_page.html?nr=${encodeURIComponent(project.projectnummer || '')}&p=${encodeURIComponent(project.title || '')}`}>
            {project.title}
          </a>
        </span>
        <span className="dt">Meest recent · {project.date}</span>
      </div>
    </div>
  );
}


/* ── DataSection: samengesteld blok (alle data-widgets samen) ── */
function DataSection({ d, leaderPhoto }) {
  return (
    <>
      <SectionTitle>Data</SectionTitle>
      <div className="grid grid-data">
        <AantalProjecten projectsFilled={d.projectsFilled} />
        <VeldenIngevuld fieldsFilled={d.fieldsFilled} />
        <RandomProject project={d.randomProject} />
        <Leaderboard leaderboard={d.leaderboard} leaderPhoto={leaderPhoto} />
        {d.recent.map((r, i) => (
          <RecentCard key={i} project={r} position={i} />
        ))}
      </div>
    </>
  );
}
