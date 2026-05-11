/* ============================================================
   LOCATIE SECTIE
   Bevat:
     - BinnenBuitenland   (binnenland vs buitenland teller)
     - TopProvincies      (ranglijst top 5 provincies)
     - TopSteden          (ranglijst top 5 steden)
     - LocatieSection     (samengesteld)
   ============================================================ */


/* ── BinnenBuitenland: twee grote getallen (NL vs buitenland) ── */
function BinnenBuitenland({ binnenland, buitenland }) {
  return (
    <div className="card">
      <h3>Binnen- vs. buitenland</h3>
      <div className="loc-split">
        <div className="cell">
          <div className="lbl">Binnenland</div>
          <div className="num">{binnenland}</div>
        </div>
        <div className="cell">
          <div className="lbl">Buitenland</div>
          <div className="num">{buitenland}</div>
        </div>
      </div>
    </div>
  );
}


/* ── TopProvincies: klikbare ranglijst, opent kaart gefilterd op provincie ── */
function TopProvincies({ provincies }) {
  return (
    <div className="card">
      <h3>Top 5 provincies (NL)</h3>
      <RankList
        items={provincies.map(p => ({ name: p.name, score: p.v }))}
        onItemClick={(name) => {
          window.location.href = `projects_map.html?provincie=${encodeURIComponent(name)}`;
        }}
      />
    </div>
  );
}


/* ── TopSteden: klikbare ranglijst, opent kaart gefilterd op stad ── */
function TopSteden({ steden }) {
  return (
    <div className="card">
      <h3>Top 5 steden (NL)</h3>
      <RankList
        items={steden.map(c => ({ name: c.name, score: c.v }))}
        onItemClick={(name) => {
          window.location.href = `projects_map.html?stad=${encodeURIComponent(name)}`;
        }}
      />
    </div>
  );
}


/* ── LocatieSection: samengesteld blok ── */
function LocatieSection({ l }) {
  return (
    <>
      <SectionTitle>Locatie</SectionTitle>
      <div className="grid grid-loc">
        <BinnenBuitenland binnenland={l.binnenland} buitenland={l.buitenland} />
        <TopProvincies provincies={l.provincies} />
        <TopSteden steden={l.steden} />
      </div>
    </>
  );
}
