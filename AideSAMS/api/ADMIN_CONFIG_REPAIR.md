# Réparation de la Configuration Admin

## Problème
La configuration admin dans la BDD a été sauvegardée de manière incorrecte. La clé du mot de passe contient tout l'objet JSON au lieu du mot de passe seul.

## Solution

### Étape 1: Diagnostic et Réparation Automatique
Visitez cette URL pour réparer automatiquement :
```
https://votre-domaine.com/AideSAMS/api/admin-config-repair.php
```

Cette page va :
1. Détecter les données mal formées
2. Nettoyer la table `admin_config`
3. Réinsérer les valeurs correctes
4. Vérifier l'état final

### Étape 2: Réinitialisation Simple (Alternative)
Si vous préférez une réinitialisation complète avec les valeurs par défaut :
```
https://votre-domaine.com/AideSAMS/api/reset-admin-config.php
```

Cette page réinitialise la configuration admin avec :
- Mot de passe: `admin123`
- lastChanged: Timestamp actuel
- attempts: 0
- lockoutUntil: null

### Étape 3: Vérification
Après la réparation, connectez-vous au panel admin avec :
- Mot de passe: `admin123`

## Format Correct de la Table admin_config

La table doit avoir cette structure :

| config_key  | config_value                    |
|-------------|--------------------------------|
| password    | admin123                       |
| lastChanged | 2025-11-18T14:30:00.000Z       |
| attempts    | 0                              |
| lockoutUntil| null                           |

## Amélioration du Code

Les modifications suivantes ont été faites :

1. **admin-panel-v2.js** : La fonction `loadAdminConfig()` peut maintenant gérer les valeurs JSON mal formées et extraire correctement le mot de passe.

2. **db.php** : La fonction `saveAdminConfig()` sauvegarde maintenant chaque clé séparément avec les bonnes valeurs.

3. **Nouveaux endpoints** :
   - `/api/admin-config-repair.php` - Diagnostic et réparation automatique
   - `/api/reset-admin-config.php` - Réinitialisation simple

## Télécommande pour l'avenir

Quand vous changez le mot de passe, assurez-vous que :
1. Le formulaire envoie `password` et `lastChanged` comme des valeurs scalaires
2. Le serveur PHP les sauvegarde avec les bonnes clés
3. Le chargement récupère les clés individuelles
