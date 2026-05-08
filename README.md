# MVSA Projecten Overzicht

Intern projectmanagementsysteem voor MVSA Architects.

## Bestandsstructuur

### Gedeelde bestanden
| Bestand | Functie |
|---|---|
| `styles.css` | Alle gedeelde CSS (variabelen, topbar, knoppen, kaarten, auth-bar, toast) |
| `supabase.js` | Database configuratie + Auth/Projects/Employees/Images helpers |
| `auth-bar.js` | Inlog/uitlog balk — wordt op elke pagina geladen |
| `auth-check.js` | Beveiligingscheck — alleen op schrijf-pagina's (new_project) |
| `dark-mode.js` | Donkere modus herstellen bij laden |
| `transitions.js` | Paginaovergangen (fade in/out) |

### Pagina's
| Bestand | Functie |
|---|---|
| `index.html` | Redirect naar dashboard |
| `projects_dashboard.html` | Hoofdpagina met statistieken en widgets |
| `projects_list.html` | Lijst + kaartweergave van alle projecten |
| `projects_map.html` | Leaflet kaart met alle projecten |
| `project_page.html` | Projectdetail + vergelijkfunctie + PDF export |
| `new_project.html` | Formulier nieuw/bewerk project (beveiligd) |
| `employees.html` | Leaderboard |
| `login.html` | Inloggen / aanmelden / wachtwoord vergeten |
| `profile.html` | Persoonlijk profiel bewerken |
| `admin.html` | Beheerpagina (wachtwoord: beheerder) |

### Database
| Bestand | Functie |
|---|---|
| `database-setup.sql` | SQL voor Supabase tabellen + RLS policies |

## Hoe een pagina is opgebouwd

```html
<head>
  <link href="fonts..." />
  <link rel="stylesheet" href="styles.css" />  <!-- Gedeeld -->
  <style>/* Pagina-specifieke CSS */</style>
</head>
<body>
  <!-- Pagina content -->

  <!-- Scripts (altijd in deze volgorde) -->
  <script src="supabase.js"></script>
  <script src="auth-check.js"></script>  <!-- Alleen op beveiligde pagina's -->
  <script src="dark-mode.js"></script>
  <script src="transitions.js"></script>

  <!-- Auth bar (op elke publieke pagina) -->
  <div class="auth-bar" id="auth-bar"></div>
  <script src="auth-bar.js"></script>
</body>
```

## Hosting
- **GitHub Pages**: https://ts-023.github.io/mvsa-projecten/
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (project-images, employee-images)
