/* ============================================================
   MOBILITEIT & RATIO SECTIE
   Bevat:
     - AutoParkeren       (ranglijst autoparkeerplekken)
     - FietsParkeren      (ranglijst fietsparkeerplekken)
     - RatioWonen         (foto + ranglijst beste ratio wonen)
     - RatioKantoor       (foto + ranglijst beste ratio kantoor)
     - MobiliteitRatioSection (samengesteld)
   ============================================================ */


/* ── AutoParkeren: ranglijst van meeste autoparkeerplekken ── */
function AutoParkeren({ items }) {
  return (
    <div className="card">
      <h3>Aantal autoparkeerplekken</h3>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── FietsParkeren: ranglijst van meeste fietsparkeerplekken ── */
function FietsParkeren({ items }) {
  return (
    <div className="card">
      <h3>Aantal fietsparkeerplekken</h3>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── RatioWonen: beste parkeerratio voor wonen ── */
function RatioWonen({ items }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Beste ratio · wonen</h3>
      <a className="bg-img" href={projectHref(items[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── RatioKantoor: beste parkeerratio voor kantoor ── */
function RatioKantoor({ items }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Beste ratio · kantoor</h3>
      <a className="bg-img" href={projectHref(items[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── MobiliteitRatioSection: samengesteld blok ── */
function MobiliteitRatioSection({ mob, ratio }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginTop: 28 }}>
        <SectionTitle>Mobiliteit</SectionTitle>
        <SectionTitle>Efficiëntie / ratio</SectionTitle>
      </div>
      <div className="grid grid-mob-ratio">
        <div className="mob-col">
          <AutoParkeren items={mob.auto} />
          <FietsParkeren items={mob.fiets} />
        </div>
        <RatioWonen items={ratio.wonen} />
        <RatioKantoor items={ratio.kantoor} />
      </div>
    </>
  );
}
