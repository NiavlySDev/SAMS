-- ============================================================================
-- SAMS DATABASE - COMPLETE STRUCTURE & DATA IMPORT
-- Database: we01io_sams
-- Created: 18/11/2025
-- Purpose: Full database setup with all JSON data imported
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `color` VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    `visible` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_visible` (`visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name`, `color`, `visible`) VALUES
(1, 'Formations', '#ef4444', TRUE),
(2, 'Spécialités', '#05f3f7', TRUE),
(3, 'Procédures', '#22c55e', TRUE),
(4, 'Guides', '#3b82f6', TRUE),
(5, 'Administration', '#8b5cf6', TRUE);

-- ============================================================================
-- 2. MANUELS (DOCUMENTS) TABLE
-- ============================================================================
DROP TABLE IF EXISTS `manuels`;
CREATE TABLE `manuels` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `link` VARCHAR(500) NOT NULL,
    `importance` INT DEFAULT 5 CHECK(importance >= 0 AND importance <= 10),
    `categorie` VARCHAR(255) NOT NULL,
    `cat_color` VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    `auteur` VARCHAR(255) DEFAULT 'SAMS',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_categorie` (`categorie`),
    KEY `idx_importance` (`importance`),
    FOREIGN KEY (`categorie`) REFERENCES `categories`(`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `manuels` (`title`, `description`, `link`, `importance`, `categorie`, `cat_color`, `auteur`) VALUES
('Manuel du SAMS', 'Les règles générales et procédures à suivre pour les SAMS.', 'https://docs.google.com/presentation/d/1nXpJSDwB6mAclumSZf0nf_i1tgvOE0vyb-nQc6bnFEk/edit?slide=id.g2088f8e897e_0_16#slide=id.g2088f8e897e_0_16', 10, 'Formations', '#ef4444', 'SAMS'),
('Manuel PH', 'Le manuel de la spécialité PH.', 'https://docs.google.com/presentation/d/1aBDyQUdX3Sznbofb8nGfI7HQOR3_OBkWYCF2_7FjjQw/edit?slide=id.g33fcf5659b2_2_75#slide=id.g33fcf5659b2_2_75', 6, 'Spécialités', '#05f3f7', 'SAMS'),
('Manuel Prof', 'Le manuel de la spécialité Professeur.', 'https://docs.google.com/document/d/1FccUT7-WjxQk8drfC3XySjfKA5KKsrlQdUfi-GZjhas/edit?tab=t.0', 6, 'Spécialités', '#05f3f7', 'SAMS'),
('Manuel Coroner', 'Le manuel de la spécialité Coroner.', 'https://docs.google.com/presentation/d/1A6ox1IScSV4pOrYZFA3yFvlMW__uC7FzQ3xf6SpC32w/edit', 6, 'Spécialités', '#05f3f7', 'SAMS'),
('Manuel Infirmier', 'Les règles et procédures spécifiques pour les infirmiers SAMS.', 'https://docs.google.com/presentation/d/1cAyUyOm8U4bwpwL_bwf-wugcTb_mzhIAfrcf1ZEXYLc/edit?usp=sharing', 10, 'Formations', '#ef4444', 'SAMS'),
('Manuel Discord', 'Guide d''utilisation du serveur Discord SAMS.', 'https://docs.google.com/presentation/d/1YHhDSkRUwjdpcbHCPM6T8DLxRq995aqXPEzlLCJ628o/edit?slide=id.p#slide=id.p', 6, 'Formations', '#ef4444', 'SAMS'),
('Manuel Paramédic', 'Règles et procédures pour les Paramédics SAMS.', 'https://docs.google.com/presentation/d/14LL9pFunQ_RMreCMrlfdkhRTB9S6jr_zbrnPdvncaJw/edit#slide=id.p', 10, 'Formations', '#ef4444', 'SAMS'),
('Manuel Paramédic Chef', 'Règles et procédures pour les Paramédics Chefs SAMS.', 'https://docs.google.com/presentation/d/1uI1Pau6MiVMr7D0R1yKQ3rUQNsLhnwcz_n9wsmGxsZ4/edit?usp=sharing', 10, 'Formations', '#ef4444', 'SAMS'),
('Manuel Médecin', 'Règles et procédures pour les Médecins SAMS.', 'https://docs.google.com/presentation/d/1A5wicNea6WUA6R3OgqijPys9YoBHSHHtnOFOcwkuT_Q/edit?slide=id.g35f5ae29866_0_66#slide=id.g35f5ae29866_0_66', 10, 'Formations', '#ef4444', 'SAMS'),
('Manuel de Pratique Médicale', 'Guide de pratique médicale pour les SAMS.', 'https://docs.google.com/presentation/d/1dOCIAeYl896eKJe5w6gPsf9_OGhiIZPVndQxcfZ_ivc/edit?usp=sharing', 4, 'Guides', '#3b82f6', 'SAMS'),
('Formation Infirmier Blessures Graves', 'Formation spécifique pour les infirmiers sur les blessures graves.', 'https://docs.google.com/presentation/d/1KzysH2PJTW6HZ9GzsxAv5bEgadVrhvqp-Ych0rJtbvs/edit?usp=sharing', 2, 'Guides', '#3b82f6', 'SAMS');

-- ============================================================================
-- 3. GRADES TABLE
-- ============================================================================
DROP TABLE IF EXISTS `grades`;
CREATE TABLE `grades` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `grades` (`name`) VALUES
('Directeur'),
('Directeur Adjoint'),
('Superviseur'),
('CDS Médecin'),
('CDS Paramedic'),
('CDS Infirmier'),
('Secrétaire');

-- ============================================================================
-- 4. GRADE_MEMBRES TABLE (Pivot table for grades and members)
-- ============================================================================
DROP TABLE IF EXISTS `grade_membres`;
CREATE TABLE `grade_membres` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `grade_id` INT NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `discord_id` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_grade_member` (`grade_id`, `discord_id`),
    FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Directeur
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Jean Dupont', '53931' FROM `grades` WHERE `name` = 'Directeur';

-- Superviseur
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Vera Tyr', '56912' FROM `grades` WHERE `name` = 'Superviseur';

-- CDS Médecin
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Silvia Dupont', '51337' FROM `grades` WHERE `name` = 'CDS Médecin';

-- CDS Paramedic
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'John Gordon', '54690' FROM `grades` WHERE `name` = 'CDS Paramedic';

-- CDS Infirmier
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Hayk Lutter', '52232' FROM `grades` WHERE `name` = 'CDS Infirmier';

-- Secrétaire
INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Xavier Gordon', '54689' FROM `grades` WHERE `name` = 'Secrétaire';

INSERT INTO `grade_membres` (`grade_id`, `nom`, `discord_id`) 
SELECT `id`, 'Arthur Lenz', '45346' FROM `grades` WHERE `name` = 'Secrétaire';

-- ============================================================================
-- 5. SPECIALITES TABLE
-- ============================================================================
DROP TABLE IF EXISTS `specialites`;
CREATE TABLE `specialites` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `specialites` (`name`) VALUES
('Pilote Héliporté'),
('Professeur'),
('Médecin Légiste'),
('Psychologue'),
('Assistant Direction');

-- ============================================================================
-- 6. SPECIALITE_MEMBRES TABLE (Pivot table for specialties and members)
-- ============================================================================
DROP TABLE IF EXISTS `specialite_membres`;
CREATE TABLE `specialite_membres` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `specialite_id` INT NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `discord_id` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_specialite_member` (`specialite_id`, `discord_id`),
    FOREIGN KEY (`specialite_id`) REFERENCES `specialites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pilote Héliporté
INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Hayk Lutter', '52232' FROM `specialites` WHERE `name` = 'Pilote Héliporté';

INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Maxime Hebert', '51387' FROM `specialites` WHERE `name` = 'Pilote Héliporté';

-- Professeur
INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'John Gordon', '54690' FROM `specialites` WHERE `name` = 'Professeur';

INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Valantino Smith', '55982' FROM `specialites` WHERE `name` = 'Professeur';

-- Médecin Légiste
INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Vera Tyr', '56912' FROM `specialites` WHERE `name` = 'Médecin Légiste';

INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Valandor Theronis', '58460' FROM `specialites` WHERE `name` = 'Médecin Légiste';

-- Psychologue
INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Silvia Dupont', '51337' FROM `specialites` WHERE `name` = 'Psychologue';

-- Assistant Direction
INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `discord_id`) 
SELECT `id`, 'Arthur Lenz', '45346' FROM `specialites` WHERE `name` = 'Assistant Direction';

-- ============================================================================
-- 7. BLIPPERS TABLE (GTA5 Map)
-- ============================================================================
DROP TABLE IF EXISTS `blippers`;
CREATE TABLE `blippers` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `bliper_id` VARCHAR(100) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(10) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_bliper_id` (`bliper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. GTA5_ZONES TABLE (GTA5 Map)
-- ============================================================================
DROP TABLE IF EXISTS `gta5_zones`;
CREATE TABLE `gta5_zones` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `zone_data` JSON NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `opacity` FLOAT DEFAULT 0.5,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. ADMIN_CONFIG TABLE
-- ============================================================================
DROP TABLE IF EXISTS `admin_config`;
CREATE TABLE `admin_config` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `config_key` VARCHAR(255) NOT NULL UNIQUE,
    `config_value` JSON NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_config` (`config_key`, `config_value`) VALUES
('password', JSON_OBJECT('password', 'admin123', 'lastChanged', '2025-11-04T00:00:00.000Z', 'attempts', 0, 'lockoutUntil', NULL)),
('system', JSON_OBJECT('version', 'v1.15.0', 'lastUpdate', NOW()));

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================
-- Uncomment these queries to verify the imports:

-- SELECT '=== CATEGORIES ===' as info;
-- SELECT COUNT(*) as total, COUNT(DISTINCT visible) as visible_states FROM categories;
-- 
-- SELECT '=== MANUELS ===' as info;
-- SELECT COUNT(*) as total, COUNT(DISTINCT categorie) as categories FROM manuels;
-- SELECT importance, COUNT(*) as count FROM manuels GROUP BY importance ORDER BY importance DESC;
-- 
-- SELECT '=== GRADES ===' as info;
-- SELECT COUNT(*) as total_grades FROM grades;
-- SELECT g.name, COUNT(gm.id) as membres FROM grades g LEFT JOIN grade_membres gm ON g.id = gm.grade_id GROUP BY g.id, g.name;
-- 
-- SELECT '=== SPECIALITES ===' as info;
-- SELECT COUNT(*) as total_specialites FROM specialites;
-- SELECT s.name, COUNT(sm.id) as membres FROM specialites s LEFT JOIN specialite_membres sm ON s.id = sm.specialite_id GROUP BY s.id, s.name;
-- 
-- SELECT '=== CONFIG ===' as info;
-- SELECT * FROM admin_config;

-- ============================================================================
-- DATABASE IMPORT COMPLETE
-- ============================================================================
