/**
 * ============================================================================
 *  MOTEUR DE ROTATION PDF
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Projet      : FF Labs - Rotation PDF
 *  Rôle        : Fonctions utilitaires et d'accès aux ressources Google Drive et PDF.
 *  Version     : 2.0.1
 * ============================================================================
 */

/**
 * Inclut le contenu d'un fichier HTML directement dans un template.
 * Utile pour modulariser les fichiers Stylesheet.html et JavaScript.html.
 * 
 * @param {string} filename - Le nom du fichier à inclure (sans extension .html).
 * @return {string} Le contenu textuel brut du fichier.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Récupère un dossier Google Drive par son ID ou, à défaut, par son nom.
 * Si le dossier est trouvé par nom et que l'ID n'était pas renseigné, 
 * l'ID est écrit dans la cellule de configuration correspondante.
 * 
 * @param {string} idOrName - L'identifiant ou le nom du dossier.
 * @param {string} configKey - La clé de configuration ("Dossier Source" ou "Dossier Cible").
 * @returns {GoogleAppsScript.Drive.Folder} Le dossier trouvé.
 */
function getFolderByConfig(idOrName, configKey) {
  idOrName = String(idOrName).trim();
  
  if (idOrName === "") {
    throw new Error(`L'identifiant ou le nom du dossier pour "${configKey}" est vide.`);
  }

  // 1. Tenter d'ouvrir par ID (si la chaîne ressemble à un ID Drive)
  if (idOrName.length > 20 && !idOrName.includes(" ")) {
    try {
      return DriveApp.getFolderById(idOrName);
    } catch (e) {
      throw new Error(`Impossible d'accéder au dossier avec l'ID "${idOrName}". Vérifiez qu'il existe et que vous y avez accès. (Détail: ${e.message})`);
    }
  }

  // 2. Recherche par nom (Fallback héritage ou initialisation)
  const dossiers = DriveApp.getFoldersByName(idOrName);
  if (!dossiers.hasNext()) {
    throw new Error(
      `Impossible de trouver un dossier nommé "${idOrName}" ou avec cet ID dans votre Google Drive.\n\n` +
      `Veuillez saisir un ID de dossier Google Drive valide dans l'onglet 'Configuration'.`
    );
  }
  
  const dossier = dossiers.next();
  
  // Tenter d'écrire l'ID dans la feuille de configuration pour simplifier la vie de l'utilisateur
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Configuration");
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const range = sheet.getRange(2, 1, lastRow - 1, 2);
        const values = range.getValues();
        for (let i = 0; i < values.length; i++) {
          if (String(values[i][0]).trim().toLowerCase() === configKey.toLowerCase()) {
            sheet.getRange(i + 2, 2).setValue(dossier.getId());
            break;
          }
        }
      }
    }
  } catch (writeError) {
    console.warn("Impossible de sauvegarder l'ID automatiquement : " + writeError.message);
  }

  return dossier;
}

/**
 * Récupère ou crée le dossier cible par son ID ou son nom.
 * 
 * @param {string} idOrName - L'identifiant ou le nom du dossier cible.
 * @param {GoogleAppsScript.Drive.Folder} parentFolder - Le dossier parent pour la création éventuelle si recherche par nom.
 * @returns {GoogleAppsScript.Drive.Folder} Le dossier cible.
 */
function getTargetFolderByConfig(idOrName, parentFolder) {
  idOrName = String(idOrName).trim();
  
  if (idOrName === "") {
    idOrName = "Traités"; // Fallback par défaut
  }

  // 1. Tenter d'ouvrir par ID
  if (idOrName.length > 20 && !idOrName.includes(" ")) {
    try {
      return DriveApp.getFolderById(idOrName);
    } catch (e) {
      throw new Error(`Impossible d'accéder au dossier cible avec l'ID "${idOrName}". (Détail: ${e.message})`);
    }
  }

  // 2. Recherche ou création par nom
  const dossiers = parentFolder
    ? parentFolder.getFoldersByName(idOrName)
    : DriveApp.getFoldersByName(idOrName);

  let dossier;
  if (dossiers.hasNext()) {
    dossier = dossiers.next();
  } else {
    dossier = parentFolder
      ? parentFolder.createFolder(idOrName)
      : DriveApp.createFolder(idOrName);
  }

  // Tenter d'écrire l'ID généré/trouvé dans la feuille de configuration
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Configuration");
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const range = sheet.getRange(2, 1, lastRow - 1, 2);
        const values = range.getValues();
        for (let i = 0; i < values.length; i++) {
          const key = String(values[i][0]).trim().toLowerCase();
          if (key === "dossier cible") {
            sheet.getRange(i + 2, 2).setValue(dossier.getId());
            break;
          }
        }
      }
    }
  } catch (writeError) {
    console.warn("Impossible de sauvegarder l'ID automatiquement : " + writeError.message);
  }

  return dossier;
}

/**
 * Charge la bibliothèque pdf-lib depuis le cache ou l'URL CDN en utilisant une mise en cache segmentée.
 * 
 * @returns {Object} La bibliothèque PDFLib globale.
 */
function loadPdfLib() {
  const cache = CacheService.getScriptCache();
  const cachedChunksCount = cache.get("pdf_lib_chunks_count");
  let jsContent = "";

  if (cachedChunksCount) {
    const count = parseInt(cachedChunksCount, 10);
    let cacheHit = true;
    for (let i = 0; i < count; i++) {
      const chunk = cache.get(`pdf_lib_chunk_${i}`);
      if (chunk === null) {
        cacheHit = false;
        break;
      }
      jsContent += chunk;
    }
    if (cacheHit && jsContent) {
      eval(jsContent);
      if (typeof PDFLib !== "undefined") {
        return PDFLib;
      }
    }
  }

  // Si non présent ou incomplet dans le cache, téléchargement
  const response = UrlFetchApp.fetch(CONFIG.CDN_PDF_LIB);
  jsContent = response.getContentText();
  eval(jsContent);

  // Mise en cache par morceaux de 90 Ko (limite technique de 100 Ko par clé de cache)
  const chunkSize = 90 * 1024;
  const chunks = [];
  for (let i = 0; i < jsContent.length; i += chunkSize) {
    chunks.push(jsContent.substring(i, i + chunkSize));
  }

  try {
    cache.put("pdf_lib_chunks_count", String(chunks.length), 21600); // Expiration de 6 heures
    chunks.forEach((chunk, i) => {
      cache.put(`pdf_lib_chunk_${i}`, chunk, 21600);
    });
  } catch (cacheError) {
    console.warn("Impossible de mettre la bibliothèque en cache : " + cacheError.message);
  }

  return PDFLib;
}
