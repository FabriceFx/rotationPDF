/**
 * Configuration globale du script.
 */
const CONFIG = {
  FOLDER_INPUT: "À pivoter",
  FOLDER_OUTPUT: "Traités",
  SHEET_NAME: "Rotation PDF",
  CDN_PDF_LIB: "https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"
};

/**
 * Crée le menu personnalisé à l'ouverture du tableur.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Moteur PDF')
    .addItem('1. Lister les PDF du dossier "À pivoter"', 'listerFichiersPdf')
    .addItem('2. Pivoter les PDF selon le tableau', 'pivoterPdfDepuisTableau')
    .addSeparator()
    .addItem('👁️ Ouvrir le volet d\'aperçu', 'ouvrirSidebar')
    .addItem('💡 Mode d\'emploi / Aide', 'afficherAide')
    .addToUi();
}

/**
 * Étape 1 : Parcourt le dossier d'entrée, vide la feuille active et liste les fichiers PDF.
 * Configure également la liste déroulante pour le choix de l'angle et applique un style professionnel.
 */
function listerFichiersPdf() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Si la feuille n'existe pas, on la crée automatiquement
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  // Rendre cette feuille active pour l'utilisateur
  ss.setActiveSheet(sheet);

  // 1. Récupération du dossier source
  const folderConfig = getFolderConfig();
  let dossierSource;
  try {
    dossierSource = getFolder(folderConfig.FOLDER_INPUT);
  } catch (error) {
    ui.alert("Dossier introuvable", error.message, ui.ButtonSet.OK);
    return;
  }

  // 2. Nettoyage complet de la feuille
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  // Écriture des en-têtes
  const headers = [
    "Nom du fichier",
    "Angle de rotation (90, 180, 270)",
    "Statut",
    "ID du fichier (Technique)"
  ];
  sheet.getRange(1, 1, 1, 4).setValues([headers]);

  // 3. Lecture des fichiers PDF
  const fichiers = dossierSource.getFilesByType(MimeType.PDF);
  const listeFichiers = [];
  while (fichiers.hasNext()) {
    const fichier = fichiers.next();
    listeFichiers.push([
      fichier.getName(),
      "", // Angle (vide par défaut)
      "En attente", // Statut initial
      fichier.getId()
    ]);
  }

  if (listeFichiers.length === 0) {
    formatSheetHeaders(sheet);
    ui.alert(
      "Aucun PDF trouvé",
      `Le dossier "${folderConfig.FOLDER_INPUT}" est vide ou ne contient aucun fichier PDF.`,
      ui.ButtonSet.OK
    );
    return;
  }

  // 4. Écriture des données
  const rangeDestination = sheet.getRange(2, 1, listeFichiers.length, 4);
  rangeDestination.setValues(listeFichiers);

  // 5. Ajout de la validation des données (dropdown) pour la colonne B (Angle)
  const validationAngle = SpreadsheetApp.newDataValidation()
    .requireValueInList(["90", "180", "270"])
    .setAllowInvalid(false)
    .setHelpText("Veuillez sélectionner 90, 180 ou 270 degrés.")
    .build();
  
  sheet.getRange(2, 2, listeFichiers.length, 1).setDataValidation(validationAngle);

  // 6. Style visuel du tableau
  formatSheet(sheet, listeFichiers.length);
  sheet.hideColumns(4); // Masque la colonne ID pour l'esthétique

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `${listeFichiers.length} fichier(s) listés avec succès.`,
    "✅ Terminé",
    3
  );
}

/**
 * Étape 2 : Lit le tableau de bord, pivote les PDF configurés par l'utilisateur
 * et enregistre les résultats dans le dossier de destination.
 */
async function pivoterPdfDepuisTableau() {
  const ui = SpreadsheetApp.getUi();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    ui.alert(
      "Feuille introuvable",
      `La feuille de calcul nommée "${CONFIG.SHEET_NAME}" est introuvable.\n\nVeuillez d'abord exécuter l'étape 1 : 'Lister les PDF' pour la créer.`,
      ui.ButtonSet.OK
    );
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    ui.alert(
      "Tableau vide",
      "Aucun fichier n'est présent dans le tableau de bord.\n\nVeuillez d'abord exécuter l'étape 1 : 'Lister les PDF'.",
      ui.ButtonSet.OK
    );
    return;
  }

  // Lecture de toutes les lignes (sans en-tête)
  const rangeDonnees = sheet.getRange(2, 1, lastRow - 1, 4);
  const valeurs = rangeDonnees.getValues();

  // Filtrer les lignes prêtes à être traitées (angle spécifié et non encore traitées avec succès)
  const lignesATraiter = [];
  for (let i = 0; i < valeurs.length; i++) {
    const angleRaw = valeurs[i][1];
    const statut = valeurs[i][2];
    const fileId = valeurs[i][3];
    
    if (angleRaw !== "" && statut !== "Succès" && fileId !== "") {
      lignesATraiter.push({
        indexLigne: i + 2, // ligne réelle dans le sheet
        nomFichier: valeurs[i][0],
        angle: parseInt(angleRaw, 10),
        fileId: fileId
      });
    }
  }

  if (lignesATraiter.length === 0) {
    ui.alert(
      "Rien à traiter",
      "Aucun fichier n'a d'angle de rotation spécifié (colonne B) ou tous les fichiers ont déjà été traités (statut 'Succès').",
      ui.ButtonSet.OK
    );
    return;
  }

  // Récupération ou création du dossier de destination "Traités"
  const folderConfig = getFolderConfig();
  let dossierSource;
  try {
    dossierSource = getFolder(folderConfig.FOLDER_INPUT);
  } catch (error) {
    ui.alert("Dossier source introuvable", error.message, ui.ButtonSet.OK);
    return;
  }

  let dossierParent = null;
  const parents = dossierSource.getParents();
  if (parents.hasNext()) {
    dossierParent = parents.next();
  }
  const dossierDest = getOrCreateFolder(folderConfig.FOLDER_OUTPUT, dossierParent);

  // Chargement de la bibliothèque PDF
  spreadsheet.toast("Chargement du moteur de rotation PDF...", "🔄 Initialisation", 5);
  let pdfLib;
  try {
    pdfLib = loadPdfLib();
  } catch (err) {
    console.error("Erreur de chargement pdf-lib :", err);
    ui.alert(
      "Erreur de connexion",
      "Impossible de charger le moteur de rotation PDF. Vérifiez votre connexion internet.",
      ui.ButtonSet.OK
    );
    return;
  }

  let compteurSucces = 0;
  let compteurErreur = 0;

  // Boucle de traitement
  for (let i = 0; i < lignesATraiter.length; i++) {
    const item = lignesATraiter[i];
    const cellStatut = sheet.getRange(item.indexLigne, 3);
    
    const infoProgres = `Traitement : ${i + 1}/${lignesATraiter.length} (${item.nomFichier})`;
    spreadsheet.toast(infoProgres, "🔄 En cours", 5);
    console.log(infoProgres);

    try {
      const fichier = DriveApp.getFileById(item.fileId);
      
      // Rotation et enregistrement
      await rotatePdfFile(fichier, item.angle, dossierDest, pdfLib);
      
      // Mise à jour de la ligne en vert (Succès)
      cellStatut.setValue("Succès")
                .setBackground("#d4edda")
                .setFontColor("#155724")
                .setFontWeight("bold");
      compteurSucces++;
    } catch (e) {
      console.error(`Erreur lors du traitement de "${item.nomFichier}" (ID: ${item.fileId}) :`, e);
      
      // Mise à jour de la ligne en rouge (Erreur)
      cellStatut.setValue("Erreur")
                .setBackground("#f8d7da")
                .setFontColor("#721c24")
                .setFontWeight("bold");
      compteurErreur++;
    }
  }

  spreadsheet.toast("Traitement terminé !", "✅ Terminé", 3);

  let messageBilan = `${compteurSucces} PDF ont été pivotés et enregistrés dans le dossier "${folderConfig.FOLDER_OUTPUT}".`;
  if (compteurErreur > 0) {
    messageBilan += `\n\n⚠️ Attention : ${compteurErreur} fichier(s) ont rencontré une erreur. Vérifiez les statuts dans le tableau.`;
  }

  ui.alert("Traitement terminé", messageBilan, ui.ButtonSet.OK);
}

/**
 * Formate uniquement les en-têtes (conserve le style par défaut de Google Sheets).
 */
function formatSheetHeaders(sheet) {
  const headerRange = sheet.getRange("A1:D1");
  headerRange.setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 26);
  sheet.setFrozenRows(1); // Fige la première ligne
  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(2);
  sheet.autoResizeColumn(3);
}

/**
 * Applique un formatage minimal (alignements et hauteurs de lignes) en conservant le style par défaut.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - La feuille active.
 * @param {number} numRows - Le nombre de lignes de données.
 */
function formatSheet(sheet, numRows) {
  formatSheetHeaders(sheet);

  if (numRows > 0) {
    const dataRange = sheet.getRange(2, 1, numRows, 4);
    dataRange.setVerticalAlignment("middle");
             
    // Hauteur de ligne confortable
    sheet.setRowHeights(2, numRows, 22);

    // Alignements
    sheet.getRange(2, 2, numRows, 2).setHorizontalAlignment("center"); // Centre Angle et Statut
    sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment("left");   // Aligne à gauche le nom

    // Style du statut par défaut (texte gras et gris)
    for (let i = 2; i <= numRows + 1; i++) {
      const cellStatut = sheet.getRange(i, 3);
      cellStatut.setFontWeight("bold")
                .setFontColor("#7f8c8d");
    }
  }

  // Ajustement automatique des colonnes
  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(2);
  sheet.autoResizeColumn(3);
  sheet.setColumnWidth(4, 50); // Colonne ID masquée
}

/**
 * Récupère un dossier Google Drive par son nom.
 * Lève une exception si le dossier est introuvable.
 * 
 * @param {string} nomDossier - Le nom du dossier recherché.
 * @returns {GoogleAppsScript.Drive.Folder} Le dossier trouvé.
 */
function getFolder(nomDossier) {
  const dossiers = DriveApp.getFoldersByName(nomDossier);
  if (!dossiers.hasNext()) {
    throw new Error(
      `Impossible de trouver un dossier nommé "${nomDossier}" dans votre Google Drive.\n\n` +
      `Veuillez créer ce dossier à la racine de votre Drive et réessayer.`
    );
  }
  return dossiers.next();
}

/**
 * Récupère ou crée un dossier par son nom dans un dossier parent donné.
 * Si aucun dossier parent n'est fourni, il est créé/recherché à la racine.
 * 
 * @param {string} nomDossier - Le nom du dossier.
 * @param {GoogleAppsScript.Drive.Folder} [dossierParent] - Le dossier parent.
 * @returns {GoogleAppsScript.Drive.Folder} Le dossier trouvé ou créé.
 */
function getOrCreateFolder(nomDossier, dossierParent) {
  const dossiers = dossierParent
    ? dossierParent.getFoldersByName(nomDossier)
    : DriveApp.getFoldersByName(nomDossier);

  if (dossiers.hasNext()) {
    return dossiers.next();
  }

  return dossierParent
    ? dossierParent.createFolder(nomDossier)
    : DriveApp.createFolder(nomDossier);
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

/**
 * Applique la rotation spécifiée à toutes les pages d'un fichier PDF,
 * l'enregistre dans le dossier de destination et met l'original à la corbeille.
 * 
 * @param {GoogleAppsScript.Drive.File} fichier - Le fichier d'origine.
 * @param {number} angleChoisi - L'angle de rotation (90, 180, 270).
 * @param {GoogleAppsScript.Drive.Folder} dossierDest - Le dossier de destination.
 * @param {Object} pdfLib - L'instance de la bibliothèque PDFLib.
 */
async function rotatePdfFile(fichier, angleChoisi, dossierDest, pdfLib) {
  const bytes = fichier.getBlob().getBytes();
  const uint8Bytes = new Uint8Array(bytes);

  // Chargement du document dans pdf-lib
  const pdfDoc = await pdfLib.PDFDocument.load(uint8Bytes);
  const pages = pdfDoc.getPages();

  // Appliquer la rotation choisie à chaque page et normaliser l'angle sur [0, 90, 180, 270] (ex: 360%360 = 0)
  for (let i = 0; i < pages.length; i++) {
    const angleActuel = pages[i].getRotation().angle;
    const newAngle = (angleActuel + angleChoisi) % 360;
    pages[i].setRotation(pdfLib.degrees(newAngle));
  }

  // Sauvegarde du document modifié
  const pdfBytes = await pdfDoc.save();
  const blobModifie = Utilities.newBlob(pdfBytes, 'application/pdf', fichier.getName());

  // Création du nouveau fichier pivoté dans le dossier de destination
  dossierDest.createFile(blobModifie);

  // Envoi de l'ancien fichier d'origine à la corbeille pour éviter le retraitement
  fichier.setTrashed(true);
}

/**
 * Affiche une boîte de dialogue modale expliquant le fonctionnement du script
 * avec une interface HTML claire et professionnelle.
 */
function afficherAide() {
  const htmlOutput = HtmlService.createHtmlOutput(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #2c3e50;
            margin: 15px;
            font-size: 13px;
            line-height: 1.6;
          }
          h2 {
            color: #1a73e8;
            margin-top: 0;
            border-bottom: 1px solid #e8eaed;
            padding-bottom: 8px;
            font-size: 16px;
            font-weight: 500;
          }
          ol {
            padding-left: 20px;
            margin-top: 8px;
            margin-bottom: 15px;
          }
          li {
            margin-bottom: 12px;
          }
          .folder {
            background-color: #f1f3f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 11px;
            color: #202124;
          }
          .highlight {
            font-weight: bold;
            color: #202124;
          }
          .footer {
            margin-top: 20px;
            font-size: 11px;
            color: #5f6368;
            border-top: 1px solid #e8eaed;
            padding-top: 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h2>💡 Comment fonctionne le Moteur PDF ?</h2>
        <p>Ce script permet de faire pivoter plusieurs fichiers PDF à des angles différents directement depuis cette feuille Google Sheets.</p>
        <ol>
          <li>Configurez le nom de vos dossiers Drive dans l'onglet <span class="folder">Configuration</span> (par défaut : <span class="folder">À pivoter</span> et <span class="folder">Traités</span>).</li>
          <li>Déposez vos PDF dans votre dossier source.</li>
          <li>Sélectionnez <b>1. Lister les PDF...</b> dans le menu <b>🔄 Moteur PDF</b>. Cela crée l'onglet <span class="folder">Rotation PDF</span> et liste les fichiers en attente.</li>
          <li>Dans la colonne <b>Angle de rotation</b>, choisissez l'angle pour chaque fichier (<b>90</b>, <b>180</b> ou <b>270</b>).</li>
          <li>Sélectionnez <b>2. Pivoter les PDF...</b> pour lancer le traitement.</li>
        </ol>
        <p>Les fichiers modifiés seront enregistrés dans votre dossier cible et les originaux seront envoyés à la corbeille de votre Drive.</p>
        <div class="footer">
          Assistant de Rotation PDF v2.0 - Professionnel & Automatisé
        </div>
      </body>
    </html>`
  )
  .setWidth(450)
  .setHeight(360);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Aide & Mode d'emploi");
}

/**
 * Ouvre la barre latérale (Sidebar) pour afficher l'aperçu dynamique du PDF sélectionné.
 */
function ouvrirSidebar() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle("Moteur PDF - Aperçu");
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Récupère les métadonnées du fichier sélectionné (nom, angle actuel, statut, ID, miniature encodée en Base64, et rotation physique).
 * Appelée régulièrement par le volet latéral (polling).
 * 
 * @returns {Object|null} Les détails du fichier, ou null si aucune ligne valide n'est sélectionnée.
 */
async function getActiveFileDetails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // Vérifier qu'on est sur le bon onglet
  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    return null;
  }
  
  const activeCell = sheet.getActiveCell();
  const row = activeCell.getRow();
  
  // Ignorer l'en-tête
  if (row <= 1) {
    return null;
  }
  
  const values = sheet.getRange(row, 1, 1, 4).getValues()[0];
  const name = values[0];
  const angle = values[1];
  const status = values[2];
  const fileId = values[3];
  
  // Si pas d'ID technique, ce n'est pas un fichier valide
  if (!fileId) {
    return null;
  }
  
  let base64Image = "";
  let physicalRotation = 0;
  let suggestedAngle = 0;
  let debugLog = [];
  
  debugLog.push("1. Fichier trouvé dans la feuille.");
  try {
    debugLog.push(`2. Récupération du fichier Drive (ID: ${fileId.substring(0, 8)}...)`);
    const file = DriveApp.getFileById(fileId);
    
    // Lire la rotation physique du PDF
    debugLog.push("3. Lecture de la rotation physique du PDF...");
    try {
      const pdfLib = loadPdfLib();
      const bytes = file.getBlob().getBytes();
      const uint8Bytes = new Uint8Array(bytes);
      const pdfDoc = await pdfLib.PDFDocument.load(uint8Bytes);
      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const page = pages[0];
        physicalRotation = page.getRotation().angle;
        debugLog.push(`4. Rotation physique lue : ${physicalRotation}°`);
        
        // Règle 1 : Si le fichier a déjà une rotation interne, on propose de la ramener à 0°
        if (physicalRotation !== 0) {
          suggestedAngle = (360 - physicalRotation) % 360;
          debugLog.push(`5. Rotation interne non nulle. Suggère correction de ${suggestedAngle}°`);
        } else {
          // Règle 2 : Si la rotation interne est 0, mais que le format est paysage,
          // on propose 90° pour le redresser en portrait.
          const { width, height } = page.getSize();
          if (width > height) {
            suggestedAngle = 90;
            debugLog.push("5. Format Paysage détecté. Suggère rotation de 90°");
          }
        }
      }
    } catch (pdfError) {
      debugLog.push(`ATTENTION: Impossible de lire la rotation du PDF : ${pdfError.message}`);
    }

    debugLog.push("6. Appel de l'API REST Drive v3 pour récupérer le lien de miniature...");
    const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink`;
    const apiResponse = UrlFetchApp.fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });
    
    debugLog.push(`7. Réponse API Drive : HTTP ${apiResponse.getResponseCode()}`);
    
    if (apiResponse.getResponseCode() === 200) {
      const apiData = JSON.parse(apiResponse.getContentText());
      const thumbnailUrl = apiData.thumbnailLink;
      
      if (thumbnailUrl) {
        debugLog.push(`8. Lien miniature obtenu (longueur: ${thumbnailUrl.length})`);
        
        // Ajuster pour obtenir une résolution décente selon le format d'URL rencontré
        let highResUrl = thumbnailUrl;
        if (thumbnailUrl.includes("=s")) {
          highResUrl = thumbnailUrl.replace(/=s\d+/, "=s400");
        } else if (thumbnailUrl.includes("sz=w")) {
          highResUrl = thumbnailUrl.replace(/sz=w\d+/, "sz=w400");
        } else if (thumbnailUrl.includes("=w")) {
          highResUrl = thumbnailUrl.replace(/=w\d+/, "=w400").replace(/-h\d+/, "-h500");
        }
        
        debugLog.push("9. Téléchargement de l'image de miniature...");
        let response = UrlFetchApp.fetch(highResUrl, { muteHttpExceptions: true });
        let code = response.getResponseCode();
        debugLog.push(`10. Réponse Essai 1 : HTTP ${code}`);
        
        if (code !== 200) {
          debugLog.push("11. Essai 1 échoué. Tentative Essai 2 avec jeton OAuth...");
          response = UrlFetchApp.fetch(highResUrl, {
            headers: {
              'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
            },
            muteHttpExceptions: true
          });
          code = response.getResponseCode();
          debugLog.push(`12. Réponse Essai 2 : HTTP ${code}`);
        }
        
        if (code === 200) {
          const contentType = response.getBlob().getContentType() || "image/png";
          const bytes = response.getBlob().getBytes();
          debugLog.push(`13. Image téléchargée avec succès (${bytes.length} octets, Type: ${contentType})`);
          base64Image = `data:${contentType};base64,${Utilities.base64Encode(bytes)}`;
          debugLog.push("14. Encodage Base64 terminé.");
        } else {
          debugLog.push(`ERREUR: Impossible de télécharger l'image (HTTP ${code})`);
        }
      } else {
        debugLog.push("ATTENTION: L'API Drive n'a renvoyé aucun lien de miniature.");
      }
    } else {
      debugLog.push(`ERREUR: API Drive inaccessible (HTTP ${apiResponse.getResponseCode()})`);
    }
  } catch (e) {
    debugLog.push(`EXCEPTION: ${e.message}`);
    console.error(`Erreur de miniature pour ${fileId} : ${e.message}`);
  }
  
  return {
    id: fileId,
    name: name,
    angle: angle,
    status: status,
    base64Image: base64Image,
    physicalRotation: physicalRotation,
    suggestedAngle: suggestedAngle,
    debugInfo: debugLog.join("\n")
  };
}

/**
 * Écrit l'angle sélectionné par la sidebar dans la colonne B de la ligne active.
 * 
 * @param {string} angle - L'angle à insérer ("90", "180", "270" ou "").
 */
function updateActiveRowAngle(angle) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // Sécurité : s'assurer qu'on est sur le bon onglet
  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    throw new Error("L'action doit être effectuée sur l'onglet 'Rotation PDF'.");
  }
  
  const activeCell = sheet.getActiveCell();
  const row = activeCell.getRow();
  
  if (row <= 1) {
    throw new Error("Sélectionnez une ligne de fichier valide.");
  }
  
  // Mettre à jour la colonne B (Angle) de la ligne active
  const cell = sheet.getRange(row, 2);
  if (angle === "" || angle === null || angle === undefined || angle === 0 || angle === "0") {
    cell.clearContent();
  } else {
    const val = parseInt(angle, 10);
    if (!isNaN(val)) {
      cell.setValue(val);
    } else {
      cell.setValue(angle);
    }
  }
}

/**
 * Récupère la configuration des dossiers depuis l'onglet "Configuration".
 * Si l'onglet n'existe pas, il est créé avec les valeurs par défaut.
 * 
 * @returns {{FOLDER_INPUT: string, FOLDER_OUTPUT: string}}
 */
function getFolderConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Configuration");
  
  const defaults = {
    FOLDER_INPUT: "À pivoter",
    FOLDER_OUTPUT: "Traités"
  };
  
  if (!sheet) {
    sheet = ss.insertSheet("Configuration");
    
    // Formater l'onglet Configuration
    sheet.getRange("A1:C1").setValues([["Paramètre", "Valeur", "Description"]])
         .setFontWeight("bold")
         .setBackground("#2c3e50")
         .setFontColor("#ffffff")
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle");
         
    sheet.setRowHeight(1, 26);
    sheet.setRowHeights(2, 2, 22);
    
    sheet.getRange("A2:C3").setValues([
      ["Dossier Source", defaults.FOLDER_INPUT, "Nom du dossier Google Drive contenant les fichiers PDF à traiter"],
      ["Dossier Cible", defaults.FOLDER_OUTPUT, "Nom du dossier Google Drive où enregistrer les fichiers pivotés"]
    ]);
    
    // Alignements et styles
    sheet.getRange("A2:C3").setVerticalAlignment("middle");
    sheet.getRange("A2:A3").setFontWeight("bold").setHorizontalAlignment("left");
    sheet.getRange("B2:B3").setHorizontalAlignment("left");
    sheet.getRange("C2:C3").setFontColor("#5f6368").setHorizontalAlignment("left");
    
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
    sheet.autoResizeColumn(3);
  }
  
  // Lire les valeurs
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return defaults;
  }
  
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const config = { ...defaults };
  
  for (let i = 0; i < values.length; i++) {
    const key = String(values[i][0]).trim().toLowerCase();
    const val = String(values[i][1]).trim();
    
    if (key === "dossier source" && val !== "") {
      config.FOLDER_INPUT = val;
    } else if (key === "dossier cible" && val !== "") {
      config.FOLDER_OUTPUT = val;
    }
  }
  
  return config;
}