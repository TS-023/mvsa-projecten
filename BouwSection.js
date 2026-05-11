/* ============================================================
   METRAGE SECTIE
   Bevat:
     - TypeProgrammaDonut   (taartdiagram: Wonen/Kantoor/...)
     - TotaalGerealiseerd   (grote teller m²)
     - GerenoveerDstat      (grote teller gerenoveerd)
     - NieuwStat            (grote teller nieuw)
     - GeslooptStat         (grote teller gesloopt)
     - GrootsteGebouw       (foto + ranglijst met breakdown)
     - BvoLijst             (grid van functie-kaartjes)
     - MetrageSection       (samengesteld)
   ============================================================ */

const fmtM2 = (n) => Number(n).toLocaleString('nl-NL');


/* ── TypeProgrammaDonut: verdeling type programma ── */
function TypeProgrammaDonut({ data }) {
  return (
    <div className="card chart-card type-prog">
      <div className="chart-title">Type programma</div>
      <Donut data={data} height={220} />
    </div>
  );
}


/* ── TotaalGerealiseerd: totaal m² gerealiseerd ── */
function TotaalGerealiseerd({ waarde }) {
  return (
    <div className="card stat">
      <h3>Totaal gerealiseerd m²</h3>
      <div className="num">{fmtM2(waarde)}</div>
    </div>
  );
}


/* ── GerenoveerDstat: gerenoveerde m² ── */
function GerenoveerDstat({ waarde }) {
  return (
    <div className="card stat">
      <h3>Gerenoveerd (m²)</h3>
      <div className="num">{fmtM2(waarde)}</div>
    </div>
  );
}


/* ── NieuwStat: nieuwbouw m² ── */
function NieuwStat({ waarde }) {
  return (
    <div className="card stat">
      <h3>Nieuw</h3>
      <div className="num">{fmtM2(waarde)}</div>
    </div>
  );
}


/* ── GeslooptStat: gesloopte m² ── */
function GeslooptStat({ waarde }) {
  return (
    <div className="card stat">
      <h3>Gesloopt</h3>
      <div className="num">{fmtM2(waarde)}</div>
    </div>
  );
}


/* ── GrootsteGebouw: foto + ranglijst van grootste projecten met breakdown ── */
function GrootsteGebouw({ data }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>{data.title}</h3>
      <a className="bg-img" href={projectHref(data.ranks[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList
        items={data.ranks}
        breakdown
        linkProjects
        suffix=" m²"
        scoreFormatter={(v) => v.toLocaleString('nl-NL')}
      />
    </div>
  );
}


/* ── BvoKaartje: één functie-kaartje met top 3 ── */
function BvoKaartje({ row }) {
  return (
    <div className="bvo-card">
      <span className="ftn">Functie</span>
      <span className="ttl">{row.type}</span>
      <div className="tot">{row.totaal}</div>
      <ol className="top3">
        {row.ranks.map((r, j) => (
          <li key={j}>
            <span className="rk">{j + 1}.</span>
            <span className="nm">
              <a href={`project_page.html?nr=${encodeURIComponent(r.projectnummer || '')}&p=${encodeURIComponent(r.name || '')}`}>
                {r.name}
              </a>
            </span>
            <span className="v">{r.v}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}


/* ── BvoLijst: grid van alle functie-kaartjes ── */
function BvoLijst({ lijst }) {
  return (
    <div className="bvo-list">
      {lijst.map((row, i) => <BvoKaartje key={i} row={row} />)}
    </div>
  );
}


/* ── MetrageSection: samengesteld blok ── */
function MetrageSection({ m }) {
  return (
    <>
      <SectionTitle>Metrage</SectionTitle>

      {/* Rij 1: donut + 4 stats */}
      <div className="grid grid-metrage" style={{ marginBottom: 14 }}>
        <TypeProgrammaDonut data={m.typeProgramma} />
        <TotaalGerealiseerd waarde={m.totaalGerealiseerd} />
        <GerenoveerDstat waarde={m.gerenoveerd} />
        <NieuwStat waarde={m.nieuw} />
        <GeslooptStat waarde={m.gesloopt} />
      </div>

      {/* Rij 2: grootste gebouw + BVO kaartjes */}
      <div className="grid grid-bvo">
        <GrootsteGebouw data={m.grootsteGebouw} />
        <BvoLijst lijst={m.bvoLijst} />
      </div>
    </>
  );
}
