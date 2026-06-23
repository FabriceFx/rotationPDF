# 🔄 Moteur de Rotation PDF pour Google Sheets & Drive

Une solution professionnelle et ergonomique intégrée à Google Sheets pour lister, prévisualiser et appliquer des rotations de pages sur des fichiers PDF stockés dans Google Drive.

Ce projet utilise Google Apps Script, une interface HTML5/CSS3 latérale interactive (Sidebar), et la bibliothèque de manipulation PDF cliente `pdf-lib`.

---

## 🌟 Fonctionnalités Clés

* **Tableau de bord Google Sheets** : Un onglet dédié `"Rotation PDF"` centralise la liste des fichiers en attente de traitement, leur angle sélectionné, et leur statut de traitement en temps réel.
* **Volet latéral de prévisualisation (Sidebar)** : 
  * Affiche en direct le premier feuillet du fichier PDF sélectionné dans la feuille de calcul.
  * Permet d'appliquer des rotations visuelles en temps réel (0°, 90°, 180°, 270°) avec des transitions fluides.
  * Synchronise instantanément le choix de l'utilisateur avec le tableau de bord.
* **Suggestions de rotation intelligentes** : 
  * Analyse les métadonnées de rotation physique internes du PDF (`physicalRotation`) et propose un angle de correction pour redresser le document si une rotation est déjà appliquée.
  * Détecte le format paysage (width > height) sur les documents à plat et suggère automatiquement une rotation à 90° pour les redresser au format portrait.
* **Configuration dynamique des dossiers** : 
  * Un onglet de configuration dédié `"Configuration"` permet de paramétrer les dossiers Google Drive sources et cibles.
  * Prend en charge les **identifiants uniques (IDs) de dossiers Drive** (hautement recommandé, notamment pour l'utilisation au sein de **Drives partagés**).
  * Système d'**auto-configuration intelligent** : si l'utilisateur saisit un nom de dossier texte (ex: `"À pivoter"`), le script localise le dossier et remplace automatiquement le nom par son ID unique pour les exécutions futures.
* **Performances optimisées (Mise en cache)** : 
  * La bibliothèque `pdf-lib` (~600 Ko) est automatiquement mise en cache dans le `CacheService` de Google Apps Script par blocs segmentés de 90 Ko. Les exécutions suivantes démarrent instantanément sans solliciter le réseau CDN externe.

---

## 🛠️ Structure du Projet

```text
├── Code.js              # Code serveur Google Apps Script (Logique métier, API, gestion Drive et validation)
├── Sidebar.html         # Interface HTML/CSS/JS du volet d'aperçu dynamique
├── appsscript.json      # Configuration Apps Script (manifeste)
├── .clasp.json          # Configuration locale de déploiement (ignorée par Git)
├── .gitignore           # Fichiers exclus du suivi Git
└── README.md            # Documentation du projet (ce fichier)
```

---

## 🚀 Installation & Déploiement

### Prérequis
* Un compte Google avec accès à Google Drive et Google Sheets.
* [Optionnel] Node.js et l'outil de ligne de commande `@google/clasp` configuré pour le déploiement.

### Déploiement local (avec Clasp)
1. Clonez ce dépôt sur votre machine.
2. Configurez votre fichier `.clasp.json` avec l'ID de votre script Apps Script :
   ```json
   {
     "scriptId": "VOTRE_SCRIPT_ID",
     "rootDir": "."
   }
   ```
3. Poussez le code vers Google Apps Script :
   ```bash
   clasp push
   ```

### Installation manuelle
1. Dans votre feuille de calcul Google Sheets, ouvrez l'éditeur de scripts : **Extensions** -> **Apps Script**.
2. Créez un fichier de script nommé `Code.gs` et collez-y le contenu de [Code.js](Code.js).
3. Créez un fichier HTML nommé `Sidebar.html` et collez-y le contenu de [Sidebar.html](Sidebar.html).
4. Enregistrez le projet de script.

---

## 📖 Mode d'emploi pas à pas

### 1. Initialisation
* Déposez vos PDF dans un dossier de votre Google Drive (par défaut, créez un dossier nommé `"À pivoter"` à la racine).
* Ouvrez votre feuille de calcul Sheets. Un nouveau menu **`🔄 Moteur PDF`** apparaît dans la barre d'outils.
* Sélectionnez **`1. Lister les PDF du dossier "À pivoter"`**.
* Cela crée automatiquement :
  1. L'onglet **`Rotation PDF`** (tableau de bord des fichiers).
  2. L'onglet **`Configuration`** (avec les dossiers par défaut).

### 2. Configuration des dossiers (Recommandé pour les Drives partagés)
* Allez sur l'onglet **`Configuration`**.
* Dans la colonne **Valeur**, remplacez les noms de dossiers par les **identifiants de dossiers (IDs)** de vos dossiers Google Drive. *(Note : Si vous lancez le script avec des noms de dossier, il découvrira l'ID et mettra automatiquement à jour la cellule avec l'ID Drive).*

### 3. Choix des angles & Rotation
* Ouvrez le volet d'aperçu depuis le menu : **`🔄 Moteur PDF`** -> **`👁️ Ouvrir le volet d'aperçu`**.
* Cliquez sur n'importe quelle ligne de fichier dans l'onglet **`Rotation PDF`** : l'aperçu du document s'affiche dans la barre latérale.
* Si le document est de travers, cliquez sur l'angle de rotation souhaité (`90°`, `180°`, `270°`) ou utilisez la suggestion automatique.
* Cliquez sur **`💾 Appliquer l'angle`** pour valider votre choix dans le tableau de bord.
* Une fois tous vos fichiers configurés, lancez le traitement global : **`🔄 Moteur PDF`** -> **`2. Pivoter les PDF selon le tableau`**.
* Les fichiers pivotés sont créés dans le dossier cible, et les originaux sont placés dans la corbeille.

---

## 🔒 Droits requis (OAuth Scopes)
Le script requiert les autorisations suivantes pour fonctionner :
* `https://www.googleapis.com/auth/spreadsheets` : pour lire et écrire dans le tableau de bord Sheets.
* `https://www.googleapis.com/auth/drive` : pour accéder aux fichiers PDF, lire leurs miniatures, les copier dans le dossier cible et supprimer les fichiers traités.
* `https://www.googleapis.com/auth/script.container.ui` : pour afficher le volet latéral et la boîte de dialogue d'aide.