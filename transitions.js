// ============================================================
//  MVSA · Vloeiende paginaovergangen
//  Fix: werkt nu ook correct met de browser terugknop
// ============================================================
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mvsa-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes mvsa-fade-out {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(-6px); }
    }
    body.mvsa-entering {
      animation: mvsa-fade-in .3s cubic-bezier(.22,1,.36,1) both;
    }
    body.mvsa-leaving {
      animation: mvsa-fade-out .18s ease forwards;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Fade in bij laden
  document.body.classList.add('mvsa-entering');

  // Herstel bij terugknop (pageshow = ook vanuit cache)
  window.addEventListener('pageshow', function(e) {
    document.body.classList.remove('mvsa-leaving');
    document.body.classList.remove('mvsa-entering');
    void document.body.offsetWidth; // force reflow
    document.body.classList.add('mvsa-entering');
  });

  // Intercept alleen interne links
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href
      || href.startsWith('http')
      || href.startsWith('mailto')
      || href.startsWith('tel')
      || href.startsWith('#')
      || href.startsWith('javascript')
      || a.target === '_blank'
      || e.ctrlKey || e.metaKey || e.shiftKey) return;

    e.preventDefault();
    document.body.classList.remove('mvsa-entering');
    document.body.classList.add('mvsa-leaving');

    setTimeout(() => {
      window.location.href = href;
    }, 180);
  });
})();
