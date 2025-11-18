# Configuration de SAMS

## Setup Initial

### 1. Copier le fichier de configuration

```bash
cp config/config.example.json config/config.json
```

### 2. Éditer `config/config.json`

Remplacer les valeurs par vos identifiants réels:

```json
{
  "db_host": "we01io.myd.infomaniak.com",
  "db_user": "votre_utilisateur",
  "db_password": "votre_mot_de_passe",
  "db_name": "votre_base_de_donnees",
  ...
}
```

### 3. Sécurité

Le fichier `config/config.json` est **ignoré par Git** (voir `.gitignore`).
Ne pas versionner vos identifiants!

## Utilisation

Les fichiers PHP chargent automatiquement `config.json`:

- `api/db.php` - Synchronisation BDD
- `api/diagnostic.php` - Diagnostic de connexion
- `api/test-connection-v2.php` - Tests de connexion

## Structure

```
SAMS/
├── config/
│   ├── config.json           (IGNORÉ par Git)
│   └── config.example.json   (Template)
├── AideSAMS/
│   └── api/
│       ├── db.php
│       ├── diagnostic.php
│       └── test-connection-v2.php
└── .gitignore               (Ignore config.json)
```
