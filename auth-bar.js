/* ═══════════════════════════════════════════════════════════
   MVSA Projecten — Auth bar (inlog/uitlog balk)
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
      .select('naam,status,employee_id')
      .eq('id', user.id).maybeSingle();

    if (!profile || profile.status !== 'approved') {
      bar.innerHTML = '<a class="ab-login" href="login.html">Inloggen →</a>';
      bar.style.display = 'flex';
      return;
    }

    // Initialen voor avatar
    const initials = (profile.naam || '?')
      .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    // Probeer foto te laden
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
    // Bij fout — toon inlogknop
    bar.innerHTML = '<a class="ab-login" href="login.html">Inloggen →</a>';
    bar.style.display = 'flex';
  }
})();
