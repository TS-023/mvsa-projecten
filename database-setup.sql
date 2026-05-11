/* ============================================================
   DUURZAAMHEID SECTIE
   Bevat:
     - DuurzaamheidsScore   (foto + ranglijst NPG-score)
     - DaktuinWidget        (foto + ranglijst m² daktuin)
     - ZonnepanelenWidget   (foto + ranglijst zonnepanelen)
     - DuurzaamheidSection  (samengesteld)
   ============================================================ */


/* ── DuurzaamheidsScore: ranglijst op duurzaamheidsscore (NPG) ── */
function DuurzaamheidsScore({ items }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Duurzaamheidsscore (NPG?)</h3>
      <a className="bg-img" href={projectHref(items[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── DaktuinWidget: ranglijst op m² binnentuin / daktuin ── */
function DaktuinWidget({ items }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>M² binnentuin / daktuin</h3>
      <a className="bg-img" href={projectHref(items[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── ZonnepanelenWidget: ranglijst op aantal zonnepanelen ── */
function ZonnepanelenWidget({ items }) {
  return (
    <div className="card grootste-gebouw">
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Meeste zonnepanelen</h3>
      <a className="bg-img" href={projectHref(items[0].name)}>
        <span className="label">PLACE IMAGE HERE</span>
      </a>
      <RankList items={items} linkProjects />
    </div>
  );
}


/* ── DuurzaamheidSection: samengesteld blok ── */
function DuurzaamheidSection({ d }) {
  return (
    <>
      <SectionTitle>Duurzaamheid</SectionTitle>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
        <DuurzaamheidsScore items={d.score} />
        <DaktuinWidget items={d.daktuin} />
        <ZonnepanelenWidget items={d.zonnepanelen} />
      </div>
    </>
  );
}
