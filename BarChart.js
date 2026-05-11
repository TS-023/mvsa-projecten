/* ============================================================
   ALGEMEEN SECTIE
   Bevat:
     - ProjecttypeChart     (staafdiagram: Won/Util/Mix/...)
     - FunctieDonut         (taartdiagram: Architect/Stedenbouw/...)
     - VerkregenChart       (staafdiagram: Aq/1v1/Tnd/...)
     - OntwerpOpgeleverd    (duo-stat: Ontwerp vs Opgeleverd)
     - FasesChart           (staafdiagram + legenda, klikbaar)
     - AlgemeenSection      (samengesteld)
   ============================================================ */


/* ── ProjecttypeChart: verdeling projecttypes als staafdiagram ── */
function ProjecttypeChart({ data }) {
  return (
    <div className="card chart-card">
      <div className="chart-title">Projecttype</div>
      <BarChart data={data} />
    </div>
  );
}


/* ── FunctieDonut: rol van MVSA per project als taartdiagram ── */
function FunctieDonut({ data }) {
  return (
    <div className="card chart-card">
      <div className="chart-title">Functie</div>
      <Donut data={data} />
    </div>
  );
}


/* ── VerkregenChart: hoe projecten verkregen zijn ── */
function VerkregenChart({ data }) {
  return (
    <div className="card chart-card">
      <div className="chart-title">Verkregen d.m.v.</div>
      <BarChart data={data} />
    </div>
  );
}


/* ── OntwerpOpgeleverd: twee grote getallen naast elkaar ── */
function OntwerpOpgeleverd({ ontwerp, opgeleverd }) {
  return (
    <div className="card duo-stat">
      <h3>Ontwerp / Opgeleverd</h3>
      <div className="row">
        <span className="lbl">Ontwerp</span>
        <span className="num">{ontwerp}</span>
      </div>
      <div className="row">
        <span className="lbl">Opgeleverd</span>
        <span className="num">{opgeleverd}</span>
      </div>
    </div>
  );
}


/* ── FasesChart: staafdiagram van projectfases, klikbaar voor modal ── */
function FasesChart({ fases, onBarClick }) {
  return (
    <div className="card chart-card">
      <div className="chart-title">Fases</div>
      <BarChart
        data={fases}
        height={200}
        hoverPalette={['#5a4a8a', '#3d6e8a', '#3d8a6e', '#8a7a3d', '#8a4a4a', '#6e3d8a', '#3d8a8a', '#8a6e3d']}
        onBarClick={onBarClick}
      />
      <ul className="phase-legend">
        {fases.map((f, i) => (
          <li key={i}><b>{f.label}</b><span>{f.full}</span></li>
        ))}
      </ul>
    </div>
  );
}


/* ── AlgemeenSection: samengesteld blok ── */
function AlgemeenSection({ a, onBarClick }) {
  return (
    <>
      <SectionTitle>Algemeen</SectionTitle>

      {/* Rij 1: drie grafieken */}
      <div className="grid grid-alg-1" style={{ marginBottom: 14 }}>
        <ProjecttypeChart data={a.projecttype} />
        <FunctieDonut data={a.functie} />
        <VerkregenChart data={a.verkregen} />
      </div>

      {/* Rij 2: duo-stat + fases */}
      <div className="grid grid-alg-2">
        <OntwerpOpgeleverd ontwerp={a.ontwerp} opgeleverd={a.opgeleverd} />
        <FasesChart fases={a.fases} onBarClick={onBarClick} />
      </div>
    </>
  );
}
