/* ═══════════════════════════════════════════════════════════
   MVSA Projecten — Auth bar + automatische werknemer-koppeling
   Laad dit op elke pagina NA supabase.js
   ═══════════════════════════════════════════════════════════ */
(async function(){
  const bar = document.getElementById('auth-bar');
  if (!bar || typeof db === 'undefined') return;

  try {
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      bar.innerHTML = '<a class="ab-login" href="login.html">Inloggen →</a>';
      bar.style.display = 'flex';
      return;
    }

    const { data: profile } = await db.from('profiles')
      .select('*')
      .eq('id', user.id).maybeSingle();

    if (!profile || profile.status !== 'approved') {
      bar.innerHTML = '<a class="ab-login" href="login.html">Inloggen →</a>';
      bar.style.display = 'flex';
      return;
    }

    // ── Automatische werknemer-koppeling ──
    if (!profile.employee_id) {
      try {
        // Zoek bestaande werknemer op naam
        let { data: emp } = await db.from('employees')
          .select('id').ilike('naam', profile.naam.trim()).maybeSingle();

        // Maak nieuwe werknemer als die niet bestaat
        if (!emp) {
          const { data: newEmp } = await db.from('employees').insert([{
            naam: profile.naam,
            rol: '',
            team: profile.team || 'Ontwerp',
            score: 0,
            projecten: 0,
          }]).select('id').single();
          emp = newEmp;
        }

        // Koppel profiel aan werknemer
        if (emp) {
          await db.from('profiles').update({ employee_id: emp.id }).eq('id', user.id);
          profile.employee_id = emp.id;
        }
      } catch(e) {
        console.warn('Werknemer koppeling mislukt:', e);
      }
    }

    // ── Avatar opbouwen ──
    const initials = (profile.naam || '?')
      .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    let photoHtml = initials;
    if (profile.employee_id && typeof EmployeeImages !== 'undefined') {
      try {
        const url = await EmployeeImages.getForEmployee(profile.employee_id);
        if (url) photoHtml = '<img src="' + url + '" alt="">';
      } catch(e) {}
    }

    bar.innerHTML =
      '<a href="profile.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;" title="Mijn profiel">'
      + '<div class="ab-avatar">' + photoHtml + '</div>'
      + '<span class="ab-name">' + profile.naam + '</span></a>'
      + '<button class="ab-logout" onclick="Auth.logout().then(()=>location.reload())">Uitloggen</button>';

    bar.style.display = 'flex';
  } catch(e) {
    bar.innerHTML = '<a class="ab-login" href="login.html">Inloggen →</a>';
    bar.style.display = 'flex';
  }
})();
