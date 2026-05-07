// ============================================================
//  MVSA · Supabase config — vervang deze twee waarden
//  na het aanmaken van je project op supabase.com
// ============================================================
const SUPABASE_URL  = 'https://rrxglrrrijgfyvinbmwu.supabase.co';
const SUPABASE_ANON = 'sb_publishable_xlvYAi683npTSAOLz1CgRw_1HT2EZ-T';

// Supabase client (geladen via CDN in elke HTML pagina)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
//  Hulpfuncties — drop-in vervanging voor localStorage
// ============================================================
const Projects = {
  async getAll() {
    const { data, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAll:', error); return []; }
    return data;
  },
  async getByName(name) {
    const { data, error } = await db.from('projects').select('*')
      .ilike('projectnaam', name).limit(1).single();
    if (error) return null;
    return data;
  },
  async getByNumber(nummer) {
    const { data, error } = await db.from('projects').select('*')
      .eq('projectnummer', nummer).limit(1).single();
    if (error) return null;
    return data;
  },
  async upsert(project) {
    // Als projectnummer bestaat → update; anders → insert
    const { data, error } = await db.from('projects')
      .upsert(project, { onConflict: 'projectnummer' })
      .select().single();
    if (error) { console.error('upsert:', error); throw error; }
    return data;
  },
  async remove(id) {
    const { error } = await db.from('projects').delete().eq('id', id);
    if (error) { console.error('remove:', error); throw error; }
  }
};

const Employees = {
  async getAll() {
    const { data, error } = await db.from('employees').select('*').order('score', { ascending: false });
    if (error) { console.error('employees:', error); return []; }
    return data;
  }
};

// ============================================================
//  Afbeeldingen via Supabase Storage (bucket: "project-images")
// ============================================================
const Images = {
  // Upload één bestand, geeft publieke URL terug
  async upload(projectNummer, file) {
    const ext = file.name.split('.').pop();
    const path = `${projectNummer}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await db.storage.from('project-images').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if (error) throw error;
    const { data } = db.storage.from('project-images').getPublicUrl(path);
    return data.publicUrl;
  },

  // Haal alle publieke URLs op voor een project
  async getForProject(projectNummer) {
    const { data, error } = await db.storage.from('project-images').list(projectNummer, {
      sortBy: { column: 'created_at', order: 'asc' },
    });
    if (error || !data) return [];
    return data.map(f => {
      const { data: u } = db.storage.from('project-images').getPublicUrl(`${projectNummer}/${f.name}`);
      return u.publicUrl;
    });
  },

  // Verwijder één afbeelding op basis van volledige URL
  async remove(url) {
    const path = url.split('/project-images/')[1];
    if (!path) return;
    await db.storage.from('project-images').remove([path]);
  }
};

// ============================================================
//  Werknemers afbeeldingen (bucket: "employee-images")
// ============================================================
const EmployeeImages = {
  async upload(employeeId, file) {
    const ext = file.name.split('.').pop();
    const path = `${employeeId}/photo.${ext}`;
    // Verwijder eerst oude foto
    await db.storage.from('employee-images').remove([path]);
    const { error } = await db.storage.from('employee-images').upload(path, file, {
      cacheControl: '3600', upsert: true,
    });
    if (error) throw error;
    const { data } = db.storage.from('employee-images').getPublicUrl(path);
    return data.publicUrl;
  },

  getUrl(employeeId, ext = 'jpg') {
    const { data } = db.storage.from('employee-images').getPublicUrl(`${employeeId}/photo.${ext}`);
    return data.publicUrl;
  },

  async getForEmployee(employeeId) {
    const { data, error } = await db.storage.from('employee-images').list(String(employeeId));
    if (error || !data || !data.length) return null;
    const { data: u } = db.storage.from('employee-images').getPublicUrl(`${employeeId}/${data[0].name}`);
    return u.publicUrl;
  }
};

// ============================================================
//  AUTH — inloggen, registreren, sessie beheren
// ============================================================
const Auth = {
  // Huidige ingelogde gebruiker
  async getUser() {
    const { data: { user } } = await db.auth.getUser();
    return user;
  },

  // Profiel ophalen (inclusief status)
  async getProfile(userId) {
    const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  },

  // Registreren
  async register(email, password, naam, team) {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) throw error;
    // Maak profiel aan met status 'pending'
    if (data.user) {
      await db.from('profiles').insert([{
        id: data.user.id,
        naam, email, team,
        status: 'pending',
      }]);
    }
    return data;
  },

  // Inloggen
  async login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Uitloggen
  async logout() {
    await db.auth.signOut();
  },

  // Sessie bewaken
  onAuthChange(callback) {
    return db.auth.onAuthStateChange(callback);
  },

  // Check of gebruiker approved is
  async isApproved() {
    const user = await this.getUser();
    if (!user) return false;
    const profile = await this.getProfile(user.id);
    return profile?.status === 'approved';
  },
};

// ============================================================
//  BEHEER — aanmeldingen goedkeuren/afkeuren
// ============================================================
const AdminAuth = {
  // Alle aanmeldingen ophalen
  async getPending() {
    const { data } = await db.from('profiles')
      .select('*').eq('status', 'pending')
      .order('created_at', { ascending: true });
    return data || [];
  },

  async getAll() {
    const { data } = await db.from('profiles')
      .select('*').order('created_at', { ascending: false });
    return data || [];
  },

  // Goedkeuren
  async approve(profileId) {
    await db.from('profiles').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', profileId);
  },

  // Afkeuren
  async reject(profileId) {
    await db.from('profiles').update({
      status: 'rejected',
    }).eq('id', profileId);
  },

  // Verwijderen
  async remove(profileId) {
    await db.from('profiles').delete().eq('id', profileId);
  },
};
