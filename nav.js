/* ── Gedeelde navigatiebalk voor alle MVSA pagina's ──────────────────────── */
(function() {
  const NAV_ITEMS = [
    { label: '🗺 Kaart',       href: 'projects_map.html' },
    { label: '📊 Dashboard',   href: 'projects_dashboard.html' },
    { label: '📋 Projecten',   href: 'projects_list.html' },
    { label: '👥 Team',        href: 'employees.html' },
    { label: '🕸 Netwerk',     href: '#netwerk', id: 'nav-netwerk' },
  ];

  const current = location.pathname.split('/').pop() || 'projects_map.html';

  const bar = document.createElement('nav');
  bar.id = 'mvsa-nav';
  bar.innerHTML = `
    <style>
      #mvsa-nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 9000;
        display: flex; align-items: center; gap: 6px;
        padding: 10px 16px;
        background: rgba(244,241,236,0.82);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(17,20,24,0.07);
        font-family: 'Inter', system-ui, sans-serif;
      }
      [data-theme="dark"] #mvsa-nav {
        background: rgba(15,17,20,0.88);
        border-bottom-color: rgba(255,255,255,0.06);
      }
      #mvsa-nav .nav-logo {
        font-weight: 800; font-size: 13px; letter-spacing: .06em;
        color: var(--ink, #111418); text-decoration: none; margin-right: 8px;
        flex-shrink: 0;
      }
      #mvsa-nav .nav-pill {
        text-decoration: none; padding: 6px 12px;
        border-radius: 999px; font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        border: 1px solid transparent;
        color: var(--muted, #8a8d93);
        transition: background .12s, color .12s;
        cursor: pointer; background: none;
        font-family: inherit;
      }
      #mvsa-nav .nav-pill:hover {
        background: rgba(17,20,24,0.06);
        color: var(--ink, #111418);
      }
      [data-theme="dark"] #mvsa-nav .nav-pill:hover {
        background: rgba(255,255,255,0.07);
        color: #e8ecf0;
      }
      #mvsa-nav .nav-pill.active {
        background: var(--ink, #111418);
        color: #fff !important;
        border-color: transparent;
      }
      [data-theme="dark"] #mvsa-nav .nav-pill.active {
        background: #e8ecf0; color: #111418 !important;
      }
      #mvsa-nav .nav-spacer { flex: 1; }
      #mvsa-nav .nav-new {
        text-decoration: none; padding: 7px 14px;
        border-radius: 999px; font-size: 11px; font-weight: 700;
        letter-spacing: .1em; text-transform: uppercase;
        background: var(--ink, #111418); color: #fff;
        transition: opacity .12s;
      }
      #mvsa-nav .nav-new:hover { opacity: .8; }
      #mvsa-nav .nav-auth { display: flex; align-items: center; gap: 6px; }

      /* Push page content below nav */
      body { padding-top: 52px !important; }
    </style>
    <a class="nav-logo" href="projects_map.html">MVSA</a>
    ${NAV_ITEMS.map(item => {
      const isActive = item.href === current || item.href === current.replace(/\?.*/, '');
      const tag = item.id ? 'button' : 'a';
      const href = item.id ? '' : `href="${item.href}"`;
      return `<${tag} ${href} class="nav-pill${isActive ? ' active' : ''}" ${item.id ? `id="${item.id}"` : ''}>${item.label}</${tag}>`;
    }).join('')}
    <div class="nav-spacer"></div>
    <div class="nav-auth" id="nav-auth-slot"></div>
    <a class="nav-new" href="new_project.html">+ Nieuw project</a>
  `;

  // Wacht tot DOM klaar is
  if (document.body) {
    document.body.prepend(bar);
    init();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.prepend(bar);
      init();
    });
  }

  function init() {
    // Netwerk knop — overlay op andere pagina's, actief op network_nodes zelf
    const netwerkBtn = document.getElementById('nav-netwerk');
    if (netwerkBtn) {
      if (current === 'network_nodes.html') {
        netwerkBtn.classList.add('active');
      } else {
        netwerkBtn.addEventListener('click', () => {
          const existing = document.getElementById('mvsa-network-overlay');
          if (existing) { existing.remove(); return; }
          const overlay = document.createElement('div');
          overlay.id = 'mvsa-network-overlay';
          overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#07080b;display:flex;flex-direction:column;';
          overlay.innerHTML = `
            <div style="position:absolute;top:16px;right:20px;z-index:10;">
              <button onclick="document.getElementById('mvsa-network-overlay').remove()"
                style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:999px;color:#e8eef7;font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:8px 16px;cursor:pointer;backdrop-filter:blur(8px);">
                ✕ Sluiten
              </button>
            </div>
            <iframe src="network_nodes.html" style="flex:1;border:none;width:100%;height:100%;" title="Netwerk"></iframe>
          `;
          document.body.appendChild(overlay);
        });
      }
    }

    // Auth slot vullen
    loadAuth();
  }

  async function loadAuth() {
    const slot = document.getElementById('nav-auth-slot');
    if (!slot) return;
    try {
      if (typeof db === 'undefined') { setTimeout(loadAuth, 300); return; }
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        slot.innerHTML = `<a href="login.html" style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:6px 12px;border-radius:999px;border:1px solid rgba(17,20,24,.15);color:var(--ink,#111418);">🔒 Inloggen</a>`;
        return;
      }
      const { data: profile } = await db.from('profiles').select('naam,is_admin').eq('id', user.id).maybeSingle();
      if (profile) {
        slot.innerHTML =
          `<a href="profile.html" style="font-size:12px;font-weight:600;text-decoration:none;padding:6px 12px;border-radius:999px;border:1px solid rgba(17,20,24,.12);color:var(--ink,#111418);">${profile.naam}</a>`
          + (profile.is_admin ? `<a href="admin.html" style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:6px 10px;border-radius:999px;border:1px solid rgba(17,20,24,.12);color:var(--ink,#111418);">⚙️</a>` : '')
          + `<button onclick="db.auth.signOut().then(()=>location.reload())" style="background:none;border:1px solid rgba(17,20,24,.12);border-radius:999px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:var(--muted,#8a8d93);padding:6px 10px;">Uit</button>`;
      }
    } catch(e) {}
  }
})();
