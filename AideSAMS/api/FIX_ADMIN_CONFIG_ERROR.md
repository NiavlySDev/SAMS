# Erreur de Contrainte admin_config - Solution

## Erreur Rencontrée
```
CONSTRAINT `admin_config.config_value` failed for `we01io_sams`.`admin_config`
```

## Cause
La table `admin_config` a été créée avec une contrainte incompatible avec Infomaniak. Probablement une limite de taille ou une contrainte CHECK.

## Solutions

### Solution 1: Réparation Automatique (Recommandée)

Visitez cette URL pour corriger automatiquement la structure de la table :
```
https://votre-domaine.com/AideSAMS/api/fix-admin-config-table.php
```

Cette page va :
1. ✅ Supprimer l'ancienne table
2. ✅ Recréer la table avec `TEXT` au lieu de `LONGTEXT`
3. ✅ Insérer les valeurs par défaut
4. ✅ Vérifier l'état final

### Solution 2: Réparation via PhpMyAdmin (Manuel)

1. Connectez-vous à PhpMyAdmin
2. Sélectionnez votre base de données `we01io_sams`
3. Allez dans la table `admin_config`
4. Cliquez sur "Structure"
5. Supprimez la table (`Drop` en bas)
6. Exécutez cette requête SQL :

```sql
CREATE TABLE IF NOT EXISTS `admin_config` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL UNIQUE,
    `config_value` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_config (config_key, config_value) VALUES ('password', 'admin123');
INSERT INTO admin_config (config_key, config_value) VALUES ('lastChanged', NOW());
INSERT INTO admin_config (config_key, config_value) VALUES ('attempts', '0');
INSERT INTO admin_config (config_key, config_value) VALUES ('lockoutUntil', 'null');
```

## Après Correction

Vous pourrez vous connecter au panel admin avec :
- **Mot de passe** : `admin123`

## Changements Effectués

1. **db.php** : Utilise maintenant `TEXT` au lieu de `LONGTEXT`
2. **Nouveau fichier** : `/api/fix-admin-config-table.php` pour la réparation automatique

## Fichiers Modifiés

- `/AideSAMS/api/db.php` - Correction de la définition de la table
- `/AideSAMS/api/fix-admin-config-table.php` - Nouvel outil de réparation
