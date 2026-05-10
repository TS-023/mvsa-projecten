/* ═══════════════════════════════════════════════════════════
   MVSA Projecten — Sidebar navigatie
   Laad dit op elke pagina NA supabase.js
   ═══════════════════════════════════════════════════════════ */
(async function(){
  const container = document.getElementById('sidebar');
  if (!container) return;

  // Bepaal actieve pagina
  const path = window.location.pathname;
  const isActive = (page) => path.includes(page) ? 'active' : '';

  // Check login status
  let userName = null;
  let userInitials = '';
  let userPhoto = null;
  let isApproved = false;

  try {
    const { data: { user } } = await db.auth.getUser();
    if (user) {
      const { data: profile } = await db.from('profiles')
        .select('*').eq('id', user.id).maybeSingle();
      if (profile && profile.status === 'approved') {
        isApproved = true;
        userName = profile.naam;
        userInitials = (profile.naam||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();

        // Auto-link werknemer
        if (!profile.employee_id) {
          try {
            let { data: emp } = await db.from('employees')
              .select('id').ilike('naam', profile.naam.trim()).maybeSingle();
            if (!emp) {
              const { data: newEmp } = await db.from('employees').insert([{
                naam: profile.naam, rol: '', team: profile.team || 'Ontwerp',
                score: 0, projecten: 0,
              }]).select('id').single();
              emp = newEmp;
            }
            if (emp) {
              await db.from('profiles').update({ employee_id: emp.id }).eq('id', user.id);
              profile.employee_id = emp.id;
            }
          } catch(e) {}
        }

        // Foto laden
        if (profile.employee_id && typeof EmployeeImages !== 'undefined') {
          try {
            const url = await EmployeeImages.getForEmployee(profile.employee_id);
            if (url) userPhoto = url;
          } catch(e) {}
        }
      }
    }
  } catch(e) {}

  const avatarHtml = userPhoto
    ? `<img src="${userPhoto}" alt="">`
    : (userInitials || '?');

  container.innerHTML = `
    <div class="sidebar-brand">
      <div class="logo">MVSA</div>
      <div class="sub">Projecten Overzicht</div>
    </div>

    <nav class="sidebar-nav">
      <a href="projects_dashboard.html" class="${isActive('dashboard')}">
        <span class="icon">📊</span> Dashboard
      </a>
      <a href="projects_list.html" class="${isActive('list')}">
        <span class="icon">📋</span> Projecten
      </a>
      <a href="projects_map.html" class="${isActive('map')}">
        <span class="icon">🗺</span> Kaart
      </a>
      <a href="employees.html" class="${isActive('employees')}">
        <span class="icon">👥</span> Team
      </a>

      <div class="sep"></div>

      ${isApproved ? `
        <a href="new_project.html" class="${isActive('new_project')}">
          <span class="icon">➕</span> Nieuw project
        </a>
      ` : ''}

      <a href="admin.html" class="${isActive('admin')}">
        <span class="icon">⚙️</span> Beheer
      </a>
    </nav>

    ${userName ? `
      <div class="sidebar-profile">
        <a href="profile.html" class="sp-avatar" style="text-decoration:none;color:#fff;" title="Mijn profiel">${avatarHtml}</a>
        <div class="sp-info">
          <a href="profile.html" class="sp-name" style="text-decoration:none;color:inherit;">${userName}</a>
          <div class="sp-role">Ingelogd</div>
        </div>
        <button class="sp-logout" onclick="Auth.logout().then(()=>location.reload())" title="Uitloggen">⏻</button>
      </div>
    ` : `
      <div class="sidebar-profile">
        <a href="login.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:600;font-size:13px;width:100%;">
          <span class="icon">🔒</span> Inloggen →
        </a>
      </div>
    `}
  `;
})();
