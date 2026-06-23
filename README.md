# 📦 rotationPDF

[🇫🇷 Version Française](#-version-française) | [🇬🇧 English Version](#-english-version)

---

## 🇫🇷 Version Française

> Solution professionnelle et ergonomique intégrée à Google Sheets pour lister, prévisualiser et faire pivoter en masse des fichiers PDF stockés dans Google Drive.

<a href="https://developers.google.com/apps-script"><img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-indigo?style=for-the-badge" alt="License: MIT"></a>
<a href="README.md"><img src="https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge" alt="Status: Production"></a>

---

### ✨ Fonctionnalités clés

- 📊 **Tableau de bord ergonomique** : Centralisation des fichiers en attente, de leur angle et de leur statut de traitement dans Google Sheets.
- 👁️ **Volet de prévisualisation interactif (Sidebar)** : Affiche le premier feuillet du PDF sélectionné et applique des rotations fluides en direct (HTML5/CSS3).
- 💡 **Suggestions automatiques** : Détecte l'orientation physique actuelle du PDF ou les formats paysages pour proposer le meilleur angle de redressement.
- ⚙️ **Paramétrage par ID** : Configuration des dossiers Google Drive par identifiants uniques (IDs), assurant une compatibilité totale avec les **Drives partagés**.
- ⚡ **Performance & Cache** : Utilisation de la bibliothèque `pdf-lib` découpée en blocs et stockée dans `CacheService` pour un chargement serveur instantané.
- 🎨 **Design Google Workspace** : Interface soignée s'intégrant nativement à Google Workspace, respectant la charte Material Design 3 de FF Labs.
- 🌐 **Bilinguisme natif** : Traduction dynamique de l'interface (Français/Anglais) selon la langue de l'utilisateur.

---

### 🚀 Installation & configuration

#### 1. Déclaration des fichiers dans votre projet
Importez les fichiers du dépôt dans votre projet Google Apps Script :
* Copiez le contenu de `Code.js`, `Config.js` et `Utils.js` dans des fichiers `.gs` correspondants.
* Copiez le contenu de `Sidebar.html`, `Stylesheet.html` et `JavaScript.html` dans des fichiers `.html` correspondants.

#### 2. Déclaration des scopes requis (`appsscript.json`)
Assurez-vous de configurer votre manifeste avec les autorisations de sécurité requises :
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

---

### 📖 Exemples d'utilisation

#### Initialisation des dossiers et listage
1. Sélectionnez **`1. Lister les PDF du dossier "À pivoter"`** dans le menu personnalisé **`🔄 Moteur PDF`**.
2. Renseignez les identifiants (IDs) de vos dossiers Google Drive dans l'onglet **`Configuration`** nouvellement créé.
3. Déposez des PDF dans votre dossier source et relancez le listage.

#### Aperçu et application de rotation
1. Sélectionnez une ligne de PDF dans le tableau.
2. Ouvrez la barre d'aperçu : **`🔄 Moteur PDF`** -> **`👁️ Ouvrir le volet d'aperçu`**.
3. Choisissez l'angle souhaité sur l'aperçu dynamique, puis cliquez sur **`Appliquer l'angle`** pour l'écrire dans la feuille de calcul.
4. Lancez le traitement final : **`🔄 Moteur PDF`** -> **`2. Pivoter les PDF selon le tableau`**.

---

### 👤 Auteur

- **[Fabrice Faucheux](https://faucheux.bzh)** (FF Labs) — [GitHub](https://github.com/FabriceFx)

---

### 📄 Licence

Ce projet est sous licence MIT. Pour plus d'informations, veuillez consulter le fichier [LICENSE](LICENSE).

---

## 🇬🇧 English Version

> Professional and user-friendly Google Sheets solution to list, preview, and batch-rotate PDF files stored in Google Drive.

<a href="https://developers.google.com/apps-script"><img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-indigo?style=for-the-badge" alt="License: MIT"></a>
<a href="README.md"><img src="https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge" alt="Status: Production"></a>

---

### ✨ Key Features

- 📊 **Ergonomic Dashboard**: Centralizes pending files, selected angles, and processing statuses in a Google Sheets sheet.
- 👁️ **Interactive Preview Sidebar**: Displays the first page of the selected PDF and applies smooth CSS rotations in real-time.
- 💡 **Smart Suggestions**: Analyzes the physical rotation and landscape layouts to automatically suggest the best correction angle.
- ⚙️ **ID-Based Configuration**: Manages Google Drive folder inputs and outputs by unique IDs, ensuring native support for **Shared Drives**.
- ⚡ **Performance & Caching**: Splits and caches `pdf-lib` in `CacheService` to prevent external network requests on subsequent runs.
- 🎨 **Workspace Design**: Built using the official Google Workspace Material Design 3 rules from FF Labs.
- 🌐 **Native Bilingual Support**: Automatically translates the sidebar UI (French/English) based on the active user locale.

---

### 🚀 Installation & Setup

#### 1. Integrating Files
Add the repository source code to your Google Apps Script project:
* Copy the contents of `Code.js`, `Config.js`, and `Utils.js` into their respective server-side `.gs` files.
* Copy the contents of `Sidebar.html`, `Stylesheet.html`, and `JavaScript.html` into their respective client-side `.html` templates.

#### 2. Declaring OAuth Scopes (`appsscript.json`)
Ensure your manifest contains the required permissions to access sheets and Google Drive:
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

---

### 📖 Usage Examples

#### Initializing folders and listing files
1. Select **`1. Lister les PDF du dossier "À pivoter"`** from the custom **`🔄 Moteur PDF`** menu.
2. Enter the Google Drive folder IDs in the newly created **`Configuration`** sheet tab.
3. Add PDF files to your source folder and list them again.

#### Previewing and applying rotations
1. Click on a file row in the spreadsheet.
2. Open the sidebar: **`🔄 Moteur PDF`** -> **`👁️ Ouvrir le volet d'aperçu`**.
3. Choose the desired rotation angle or apply the automatic recommendation.
4. Click **`Apply angle`** to write it to the sheet.
5. Process the queue: **`🔄 Moteur PDF`** -> **`2. Pivoter les PDF selon le tableau`**.

---

### 👤 Author

- **[Fabrice Faucheux](https://faucheux.bzh)** (FF Labs) — [GitHub](https://github.com/FabriceFx)

---

### 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
<p align="center"><a href="https://faucheux.bzh" target="_blank" style="color: inherit; text-decoration: none;">&lt;&gt; par Fabrice Faucheux</a></p>