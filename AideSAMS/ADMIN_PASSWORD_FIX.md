# Correction du Mot de Passe Admin - Guide Complet

## Problème Identifié

Vous aviez une erreur où la configuration admin dans la BDD contenait l'objet JSON entier au lieu des valeurs individuelles :

**État actuel (mauvais):**
```
config_key: {"password": "admin123", "lastChanged": "2025-11-04T00:00:00.000Z", ...}
config_value: (incorrect)
```

**État attendu (correct):**
```
config_key: password         | config_value: admin123
config_key: lastChanged      | config_value: 2025-11-04T00:00:00.000Z
config_key: attempts         | config_value: 0
config_key: lockoutUntil     | config_value: null
```

## Solution Appliquée

### 1. **Amélioration du Code JavaScript**
- `loadAdminConfig()` : Peut maintenant gérer les valeurs JSON mal formées
- `saveAdminConfig()` : Assure que les valeurs sont scalaires avant d'envoyer à l'API
- Détection automatique des objets imbriqués

### 2. **Amélioration du Code PHP**
- `saveAdminConfig($key, $value)` : Sauvegarde les clés individuelles correctement
- Gestion appropriée des valeurs null et objets

### 3. **Nouveaux Outils de Diagnostic**
- `/api/admin-config-repair.php` - Diagnostic + réparation automatique
- `/api/reset-admin-config.php` - Réinitialisation complète
- Bouton "🔧 Réparer la config admin" dans le panel

## Comment Utiliser

### Option 1: Via le Panel Admin (Recommandé)
1. Connectez-vous au panel admin avec le mot de passe actuel
2. Allez dans "🔧 Outils d'administration"
3. Cliquez sur "🔧 Réparer la config admin"
4. Confirmez l'action
5. Le système se réinitialise automatiquement

### Option 2: Via URL Directe
1. Visitez : `https://votre-domaine.com/AideSAMS/api/admin-config-repair.php`
2. Attendez la confirmation de réparation
3. Revenez au panel admin

### Option 3: Réinitialisation Complète
1. Visitez : `https://votre-domaine.com/AideSAMS/api/reset-admin-config.php`
2. La config est réinitialisée à :
   - Mot de passe: `admin123`
   - lastChanged: Timestamp actuel
   - attempts: 0
   - lockoutUntil: null

## Après la Réparation

### Connexion
- Mot de passe: `admin123`
- Compte: admin

### Changement de Mot de Passe (Optionnel)
1. Connectez-vous avec `admin123`
2. Allez à "🔒 Changer le mot de passe"
3. Entrez:
   - Mot de passe actuel: `admin123`
   - Nouveau mot de passe: Votre choix
   - Confirmation: Votre choix
4. Cliquez "Changer le mot de passe"
5. Le nouveau mot de passe est sauvegardé dans la BDD

## Vérification

Pour vérifier que tout fonctionne correctement, visitez:
```
https://votre-domaine.com/AideSAMS/api/db.php?action=load&type=admin-config
```

Vous devez voir une réponse JSON avec:
```json
{
  "success": true,
  "source": "database",
  "data": [
    {"config_key": "password", "config_value": "admin123"},
    {"config_key": "lastChanged", "config_value": "2025-11-18T..."},
    {"config_key": "attempts", "config_value": "0"},
    {"config_key": "lockoutUntil", "config_value": "null"}
  ]
}
```

## Fichiers Modifiés

1. **admin-panel-v2.js**
   - `loadAdminConfig()` - Meilleure gestion du JSON mal formé
   - `saveAdminConfig()` - Assure les valeurs scalaires
   - `repairAdminConfig()` - Nouvelle fonction de réparation

2. **db.php**
   - Table `admin_config` créée
   - Fonctions `loadAdminConfig()` et `saveAdminConfig()`
   - Endpoint `save-admin-config`

3. **admin.html**
   - Bouton "🔧 Réparer la config admin"

4. **Nouveaux fichiers**
   - `api/admin-config-repair.php` - Diagnostic et réparation
   - `api/reset-admin-config.php` - Réinitialisation
   - `api/ADMIN_CONFIG_REPAIR.md` - Documentation technique

## Support

Si vous rencontrez toujours des problèmes:
1. Vérifiez que la table `admin_config` existe dans la BDD
2. Videz le localStorage du navigateur (DevTools > Application > Clear)
3. Videz le cache du navigateur
4. Essayez à nouveau
