-- ===================================================================
-- SAMS - Script d'initialisation complet de la base de données
-- Production Infomaniak
-- ===================================================================

-- Suppression des tables existantes (optionnel - décommenter si nécessaire)
-- DROP TABLE IF EXISTS `membres_grades`;
-- DROP TABLE IF EXISTS `grades`;
-- DROP TABLE IF EXISTS `manuels`;
-- DROP TABLE IF EXISTS `specialites`;
-- DROP TABLE IF EXISTS `categories`;
-- DROP TABLE IF EXISTS `blippers`;
-- DROP TABLE IF EXISTS `gta5_zones`;

-- ===================================================================
-- Table 1: BLIPPERS
-- ===================================================================
CREATE TABLE IF NOT EXISTS `blippers` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `bliper_id` VARCHAR(50) UNIQUE NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(10) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_bliper_id` (`bliper_id`),
    KEY `idx_color` (`color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Blippers
INSERT INTO `blippers` (`bliper_id`, `label`, `icon`, `color`, `description`) VALUES
('blipper_1', 'SAMS', '🏥', '#00a8ff', 'Service d\'aide médicale d\'urgence'),
('blipper_2', 'LSPD', '🚔', '#003d7a', 'Los Santos Police Department'),
('blipper_3', 'FIRE', '🚒', '#ff0000', 'Service incendie'),
('blipper_4', 'GOV', '🏛️', '#1a1a1a', 'Gouvernement'),
('blipper_5', 'COURT', '⚖️', '#8b0000', 'Cours de justice'),
('blipper_6', 'BCN', '🏦', '#2d5016', 'Banque centrale'),
('blipper_7', 'CALL', '📞', '#ffcc00', 'Centre d\'appels'),
('blipper_8', 'TAXI', '🚕', '#ffff00', 'Service de taxi');

-- ===================================================================
-- Table 2: CATEGORIES
-- ===================================================================
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `color` VARCHAR(7) NOT NULL,
    `visible` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_name` (`name`),
    KEY `idx_visible` (`visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Catégories
INSERT INTO `categories` (`name`, `color`, `visible`) VALUES
('Procédures', '#FF6B6B', TRUE),
('Formations', '#4ECDC4', TRUE),
('Médicaments', '#45B7D1', TRUE),
('Documentation', '#96CEB4', TRUE),
('Ressources', '#FFEAA7', TRUE);

-- ===================================================================
-- Table 3: SPECIALITES
-- ===================================================================
CREATE TABLE IF NOT EXISTS `specialites` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Spécialités
INSERT INTO `specialites` (`name`) VALUES
('Médecine générale'),
('Chirurgie'),
('Soins d\'urgence'),
('Radiologie'),
('Pharmacologie');

-- ===================================================================
-- Table 4: GRADES
-- ===================================================================
CREATE TABLE IF NOT EXISTS `grades` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `grade` VARCHAR(100) NOT NULL UNIQUE,
    `order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_grade` (`grade`),
    KEY `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Grades
INSERT INTO `grades` (`grade`, `order`) VALUES
('Directeur', 1),
('Directeur Adjoint', 2),
('Superviseur', 3),
('CDS Médecin', 4),
('CDS Paramedic', 5),
('Médecin', 6),
('Paramedic', 7);

-- ===================================================================
-- Table 5: MEMBRES_GRADES (Relation entre membres et grades)
-- ===================================================================
CREATE TABLE IF NOT EXISTS `membres_grades` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `grade_id` INT NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `char_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
    KEY `idx_grade_id` (`grade_id`),
    KEY `idx_char_id` (`char_id`),
    UNIQUE KEY `unique_grade_member` (`grade_id`, `char_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Membres par grade
INSERT INTO `membres_grades` (`grade_id`, `nom`, `char_id`) VALUES
(1, 'Jean Dupont', 53931),
(3, 'Vera Tyr', 56912),
(4, 'Silvia Dupont', 51337),
(5, 'John Gordon', 54690),
(6, 'Maria Lopez', 52045),
(7, 'Carlos Martinez', 54823);

-- ===================================================================
-- Table 6: MANUELS
-- ===================================================================
CREATE TABLE IF NOT EXISTS `manuels` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `desc` TEXT,
    `link` VARCHAR(500) NOT NULL,
    `importance` INT DEFAULT 5,
    `categorie` VARCHAR(100),
    `cat_color` VARCHAR(7),
    `auteur` VARCHAR(100),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_importance` (`importance`),
    KEY `idx_categorie` (`categorie`),
    KEY `idx_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Manuels (premiers éléments)
INSERT INTO `manuels` (`title`, `description`, `desc`, `link`, `importance`, `categorie`, `cat_color`, `auteur`) VALUES
('Guide Procédures d\'Urgence', 'Procédures essentielles pour les urgences', 'Procédures essentielles pour les urgences', 'https://exemple.com/urgences', 10, 'Procédures', '#FF6B6B', 'Admin'),
('Formation Équipements Médicaux', 'Formation sur les équipements', 'Formation sur les équipements', 'https://exemple.com/equipements', 9, 'Formations', '#4ECDC4', 'Admin'),
('Catalogue Médicaments', 'Liste complète des médicaments', 'Liste complète des médicaments', 'https://exemple.com/medicaments', 8, 'Médicaments', '#45B7D1', 'Admin'),
('Documentation Système', 'Documentation technique du système', 'Documentation technique du système', 'https://exemple.com/docs', 7, 'Documentation', '#96CEB4', 'Admin'),
('Ressources Utiles', 'Ressources et liens utiles', 'Ressources et liens utiles', 'https://exemple.com/ressources', 6, 'Ressources', '#FFEAA7', 'Admin'),
('Protocole Triage', 'Protocole de triage des patients', 'Protocole de triage des patients', 'https://exemple.com/triage', 9, 'Procédures', '#FF6B6B', 'Admin'),
('Manuel Ambulance', 'Fonctionnement de l\'ambulance', 'Fonctionnement de l\'ambulance', 'https://exemple.com/ambulance', 8, 'Formations', '#4ECDC4', 'Admin'),
('Orthographe Médicale', 'Termes médicaux courants', 'Termes médicaux courants', 'https://exemple.com/orthographe', 5, 'Ressources', '#FFEAA7', 'Admin'),
('Gestion Stocks', 'Gestion des stocks médicaux', 'Gestion des stocks médicaux', 'https://exemple.com/stocks', 7, 'Documentation', '#96CEB4', 'Admin'),
('Confidentialité Données', 'Protection des données patients', 'Protection des données patients', 'https://exemple.com/confidentialite', 10, 'Procédures', '#FF6B6B', 'Admin');

-- ===================================================================
-- Table 7: GTA5_ZONES
-- ===================================================================
CREATE TABLE IF NOT EXISTS `gta5_zones` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `zone_data` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données: Zones GTA5 (stockées en JSON)
INSERT INTO `gta5_zones` (`name`, `zone_data`) VALUES
('Los Santos', JSON_OBJECT(
    'x', 425.4,
    'y', -982.8,
    'z', 29.4,
    'radius', 200,
    'description', 'Centre-ville principal',
    'hospitals', 1
));

-- ===================================================================
-- VÉRIFICATIONS ET INDEXATION
-- ===================================================================

-- Optimiser les tables
ALTER TABLE `blippers` ENGINE=InnoDB;
ALTER TABLE `categories` ENGINE=InnoDB;
ALTER TABLE `specialites` ENGINE=InnoDB;
ALTER TABLE `grades` ENGINE=InnoDB;
ALTER TABLE `membres_grades` ENGINE=InnoDB;
ALTER TABLE `manuels` ENGINE=InnoDB;
ALTER TABLE `gta5_zones` ENGINE=InnoDB;

-- Afficher le résumé
SHOW TABLE STATUS WHERE Name IN ('blippers', 'categories', 'specialites', 'grades', 'membres_grades', 'manuels', 'gta5_zones');
SELECT 'Blippers' as Table_Name, COUNT(*) as Row_Count FROM blippers
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Specialites', COUNT(*) FROM specialites
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Membres Grades', COUNT(*) FROM membres_grades
UNION ALL
SELECT 'Manuels', COUNT(*) FROM manuels
UNION ALL
SELECT 'GTA5 Zones', COUNT(*) FROM gta5_zones;
