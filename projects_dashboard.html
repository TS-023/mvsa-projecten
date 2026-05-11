// ============================================================
//  AUTH CHECK — verberg pagina direct, check dan sessie
// ============================================================
(function() {
  // Verberg de pagina direct zodat er niks te zien is tijdens check
  document.documentElement.style.visibility = 'hidden';
})();

(async function() {
  try {
    if (typeof db === 'undefined') {
      document.documentElement.style.visibility = '';
      return;
    }

    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const { data: profile } = await db.from('profiles')
      .select('status, naam')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.status === 'pending' || profile.status === 'rejected') {
      window.location.replace('login.html');
      return;
    }

    // Goedgekeurd — toon pagina
    document.documentElement.style.visibility = '';

    // Vul gebruikersnaam in
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = profile.naam;

  } catch(e) {
    // Bij fout — toch tonen zodat site niet vastloopt
    document.documentElement.style.visibility = '';
  }
})();
