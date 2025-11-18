# Initialisation SAMS - Guide complet

## Structure des données JSON

### 1. blippers.json
```json
[
  {
    "id": "police",
    "label": "🚔 Police",
    "icon": "🚔",
    "color": "#0066cc",
    "description": "Station de police"
  },
  ...
]
```
- **Champs**: id, label, icon, color, description
- **Total**: 8 blippers

### 2. categories.json
```json
[
  {
    "id": 1,
    "name": "Formations",
    "color": "#ef4444",
    "visible": true
  },
  ...
]
```
- **Champs**: id, name, color, visible
- **Total**: 5 catégories

### 3. grades.json
```json
[
  {
    "grade": "Directeur",
    "membres": [
      "Jean Dupont | 53931"
    ]
  },
  ...
]
```
- **Champs**: grade, membres (array de "Nom | ID")
- **Total**: 7 grades
- **Structure spéciale**: Crée des entrées dans `membres_grades`

### 4. specialites.json
```json
[
  {
    "specialite": "Pilote Héliporté",
    "membres": [
      "Hayk Lutter | 52232",
      "Maxime Hebert | 51387"
    ]
  },
  ...
]
```
- **Champs**: specialite, membres (array de "Nom | ID")
- **Total**: 5 spécialités
- **Structure spéciale**: Crée des entrées dans `specialite_membres`

### 5. manuels.json
```json
[
  {
    "title": "Manuel du SAMS",
    "desc": "Les règles générales...",
    "link": "https://...",
    "importance": 10,
    "categorie": "Formations",
    "catColor": "#ef4444",
    "auteur": "SAMS"
  },
  ...
]
```
- **Champs**: title, desc, link, importance, categorie, catColor, auteur
- **Total**: 34 manuels

### 6. gta5-zones.json
```json
{
  "zones": [
    {
      "id": 1,
      "name": "Downtown Vinewood",
      "description": "Centre-ville..."
    },
    ...
  ]
}
```
- **Format**: Objet avec clé "zones" contenant un tableau
- **Champs**: id, name, description
- **Total**: 10 zones

## Installation en production

### Étape 1: Upload
Transférez tous les fichiers sur votre serveur Infomaniak.

### Étape 2: Vérifier la configuration
Assurez-vous que `/config/config.json` contient les bonnes identifiants:
```json
{
  "db_host": "we01io.myd.infomaniak.com",
  "db_user": "we01io_sams",
  "db_password": "...",
  "db_name": "we01io_sams"
}
```

### Étape 3: Initialiser la base de données
Visitez l'URL: `https://votre-domaine.com/AideSAMS/api/init-from-json.php`

Réponse attendue:
```json
{
  "status": "success",
  "message": "Base de données initialisée avec succès depuis les JSON",
  "results": {
    "blippers": "8 blippers importés",
    "categories": "5 catégories importées",
    "grades": "7 grades et 6 membres importés",
    "specialites": "5 spécialités et 11 membres importés",
    "manuels": "34 manuels importés",
    "gta5_zones": "10 zones importées"
  }
}
```

### Étape 4: Vérifier l'application
- Ouvrir: `https://votre-domaine.com/AideSAMS/`
- Ouvrir la console (F12) pour voir les logs
- Vous devriez voir: `✅ Connexion BDD établie - Synchronisation active`

### Étape 5: Test complet
Visitez: `https://votre-domaine.com/AideSAMS/api/test-system.php`

## Fichiers API disponibles

| Endpoint | Description |
|----------|-------------|
| `/api/init-from-json.php` | Initialise TOUTES les données depuis JSON ⭐ |
| `/api/ping.php` | Test simple de connexion BDD |
| `/api/db.php?action=check` | Test détaillé avec infos système |
| `/api/test-system.php` | Test complet du système |

## Structure des tables BDD

```
blippers
├── id (PK)
├── bliper_id (UNIQUE)
├── label
├── icon
├── color
└── description

categories
├── id (PK)
├── name (UNIQUE)
├── color
└── visible

specialites
├── id (PK)
└── name (UNIQUE)

specialite_membres
├── id (PK)
├── specialite_id (FK) → specialites.id
├── nom
└── char_id (UNIQUE with specialite_id)

grades
├── id (PK)
├── grade (UNIQUE)
└── order

membres_grades
├── id (PK)
├── grade_id (FK) → grades.id
├── nom
└── char_id (UNIQUE with grade_id)

manuels
├── id (PK)
├── title
├── description
├── link
├── importance
├── categorie
├── cat_color
└── auteur

gta5_zones
├── id (PK)
├── name
└── zone_data (JSON)
```

## Réinitialisation complète

Si vous devez recharger toutes les données:
1. Visitez: `/api/init-from-json.php`
2. Tous les tableaux seront vidés et reloadés

## Debugging

### Si erreur de connexion:
```bash
curl https://votre-domaine.com/AideSAMS/api/ping.php
```

### Si erreur d'initialisation:
1. Vérifier les logs PHP du serveur
2. Vérifier que `config/config.json` existe
3. Vérifier les permissions (644 pour JSON, etc.)

### Vérifier le statut complet:
```bash
curl https://votre-domaine.com/AideSAMS/api/test-system.php | json_pp
```
