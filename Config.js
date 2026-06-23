/**
 * ============================================================================
 *  MOTEUR DE ROTATION PDF
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Projet      : FF Labs - Rotation PDF
 *  Rôle        : Configuration globale, constantes et service de journalisation.
 *  Version     : 2.0.1
 * ============================================================================
 */

/**
 * Objet de configuration central du projet.
 */
const CONFIG = {
  PROJECT_NAME: "Rotation PDF",
  VERSION: "2.0.1", // Format SemVer X.Y.Z obligatoire
  SHEET_NAME: "Rotation PDF",
  CDN_PDF_LIB: "https://unpkg.com/pdf-lib/dist/pdf-lib.min.js",
  DEBUG_MODE: true, // Mettre à false avant déploiement en production
  COLORS: {
    PRIMARY: "#0b57d0",
    SECONDARY: "#444746"
  }
};

/**
 * Système de journalisation unifié pour le projet.
 * 
 * @param {string} message - Message à journaliser.
 * @param {string} [level="INFO"] - Niveau de sévérité (INFO, WARN, ERROR).
 */
function logEvent(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${CONFIG.PROJECT_NAME} v${CONFIG.VERSION}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  if (level === "ERROR") {
    // Possibilité d'étendre ici pour envoyer un mail ou écrire dans un onglet d'audit
  }
}
