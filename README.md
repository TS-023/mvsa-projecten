# MVSA Projecten — Codestructuur

## Bestandsoverzicht

```
mvsa-lower/
├── index.html              → Redirect naar dashboard
├── projects_dashboard.html → Hoofdpagina met alle statistieken
├── projects_list.html      → Lijst + kaartweergave van alle projecten
├── projects_map.html       → Interactieve kaart met alle projectlocaties
├── project_page.html       → Detailpagina van één project
├── new_project.html        → Formulier: nieuw project invoeren / bewerken
├── employees.html          → Leaderboard werknemers + visitekaartje
├── supabase.js             → Database configuratie + hulpfuncties
├── transitions.js          → Vloeiende paginaovergangen
└── database-setup.sql      → SQL om tabellen aan te maken in Supabase
```

---

## supabase.js — de databaselaag

Alle communicatie met Supabase zit hier. Aanpassen hoeft alleen als de
URL of sleutel verandert.

```
Projects.getAll()              → alle projecten ophalen
Projects.getByName(naam)       → één project op naam
Projects.getByNumber(nummer)   → één project op nummer
Projects.upsert(project)       → opslaan of bijwerken
Projects.remove(id)            → verwijderen

Employees.getAll()             → alle werknemers ophalen

Images.upload(nummer, file)    → foto uploaden naar Storage
Images.getForProject(nummer)   → foto-URLs ophalen voor een project
Images.remove(url)             → foto verwijderen

EmployeeImages.upload(id, file)         → werknemerfoto uploaden
EmployeeImages.getForEmployee(id)       → werknemerfoto ophalen
```

---

## projects_dashboard.html — structuur

```
CSS
  ├── Layout (page, topbar, grid)
  ├── Widget stijlen
  │   ├── Data sectie (grote nummers)
  │   ├── Leaderboard / RankList
  │   ├── Charts (BarChart, Donut)
  │   ├── Breakdown balk
  │   └── Kaartjes per sectie
  ├── Zoekbalk & dropdown
  ├── Periode filter
  ├── Recent gewijzigd
  └── Modals (fase-modal)

JavaScript componenten
  ├── BarChart          → staafdiagram (fases, functies)
  ├── Donut             → taartdiagram (verdeling)
  ├── RankList          → genummerde ranglijst
  ├── SectionTitle      → blauwe koptitel met lijn
  ├── DataSection       → grote statistieken bovenaan
  ├── AlgemeenSection   → fases, functies, opgave
  ├── MetrageSection    → BVO verdeling
  ├── MobiliteitRatioSection → parkeren
  ├── DuurzaamheidSection    → labels en scores
  ├── BouwOverigSection      → hoogte, awards
  ├── LocatieSection         → steden, provincies
  └── App               → hoofdcomponent, beheert alle state
        ├── State
        │   ├── liveData / liveAlgemeen / ... → Supabase data per sectie
        │   ├── allProjects                   → ruwe projectenlijst
        │   ├── period                        → Altijd / Dit jaar / Deze maand
        │   ├── searchQ / searchOpen          → zoekbalk
        │   ├── faseModal                     → welke fase is open
        │   └── darkMode                      → donkere modus
        ├── filterByPeriod()   → filtert op opleverdatum
        ├── computeStats()     → berekent alle widgetdata
        └── exportCSV()        → download als CSV
```

---

## projects_list.html — structuur

```
State (gewone JS, geen React)
  ├── currentView     → 'list' of 'grid'
  ├── selected        → Set van geselecteerde project-ids
  └── allProjects     → array van projecten uit Supabase

Functies
  ├── render()         → herlaadt uit Supabase
  ├── renderTable()    → tekent lijst of kaartweergave
  ├── renderBulkBar()  → toont bulk-bewerkbalk
  ├── setView()        → schakelt weergave
  └── showCompare()    → vergelijkingsmodal
```

---

## Supabase tabellen

### projects
Alle projectvelden — zie database-setup.sql voor de volledige lijst.
Belangrijkste kolommen:
```
id, projectnummer, projectnaam, stad, provincie, land
fase, opgave, project_type, functie
totaal_bvo, m_wonen, m_kantoor, m_commercieel
opdrachtgever, opleverdatum
created_at, updated_at
```

### employees
```
id, naam, rol, team, score, projecten, awards
```

### Storage buckets
```
project-images/   → foto's per project (map = projectnummer)
employee-images/  → foto's per werknemer (map = werknemer-id)
```
