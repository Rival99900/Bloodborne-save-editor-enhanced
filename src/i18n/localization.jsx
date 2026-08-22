import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "bloodborne-save-editor.language.v1";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "ru", label: "Русский" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "sv", label: "Svenska" },
  { code: "cs", label: "Čeština" },
  { code: "ro", label: "Română" },
  { code: "el", label: "Ελληνικά" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "hu", label: "Magyar" },
  { code: "nb", label: "Norsk bokmål" },
];

const en = {
  language: {
    label: "Language",
  },
  preferences: {
    compact: "Compact view",
    comfortable: "Comfortable view",
  },
  revision: {
    controls: "Revision controls",
    eyebrow: "Local review",
    title: "Change log",
    description: "Review in-memory changes before saving. Undo and redo never write to the file automatically.",
    changes: "{{count}} changes",
    genericChange: "Edited save data",
    quantityChanged: "Updated item quantity",
    weaponLevelChanged: "Updated weapon level",
    itemAdded: "Added an inventory item",
    equipmentAdded: "Added equipment directly",
    upgradeAdded: "Added a Gem or Rune directly",
    itemReplaced: "Replaced an inventory item",
    upgradeEdited: "Updated a Gem or Rune",
    upgradeConverted: "Converted a Gem or Rune",
    slotShapeChanged: "Updated an equipment slot shape",
    slotGemChanged: "Updated equipment slot content",
    statsUpdated: "Updated character statistics",
    characterUpdated: "Updated character data",
    bossUpdated: "Updated boss progress",
    flagUpdated: "Applied an advanced save Flag",
    undo: "Undo",
    redo: "Redo",
    close: "Close change log",
    empty: "No in-memory changes have been recorded yet.",
    notice: "Saving writes the current revision only. Keep the automatic .bak backup until the save has been verified in-game.",
    summaryTitle: "Changes since the last file checkpoint",
    summaryStats: "{{count}} statistic value(s) changed",
    summaryUsername: "Character name changed",
    summaryPlaytime: "Playtime changed",
    summaryPosition: "Position or destination changed",
    summaryBosses: "Boss progress changed",
    summaryItems: "{{count}} inventory item record(s) added or removed",
    summaryUpgrades: "{{count}} Gem or Rune record(s) added or removed",
  },
  nav: {
    controls: "Save file controls",
    activeSave: "Active save",
    noSaveLoaded: "No save loaded",
    openFileToBegin: "Open a decrypted character file to begin",
    openSave: "Open save",
    saveChanges: "Save changes",
  },
  home: {
    eyebrow: "Offline character management",
    title: "Edit deliberately. Preserve your hunt.",
    lead: "Open a decrypted Bloodborne character save to inspect inventory, attributes, character settings, bosses and flags. The editor creates a backup when a file is opened; always retain it until you have checked the result in-game.",
    stepOneTitle: "Use a decrypted save",
    stepOneDescription: "PlayStation exports must be decrypted before they can be read by the editor.",
    stepTwoTitle: "Make focused edits",
    stepTwoDescription: "Review each change and avoid using modified saves in online play.",
    stepThreeTitle: "Verify before replacing",
    stepThreeDescription: "Test the exported file before removing the automatic .bak copy.",
    guide: "Read the decryption guide",
  },
  operation: {
    preparing: "Preparing editor",
    eyebrow: "Working with save data",
    title: "Please keep this window open.",
  },
  saveFlow: {
    unsavedStatus: "Unsaved changes",
    loadedStatus: "Save loaded. A backup was created before editing.",
    savedStatus: "Changes saved.",
    discardOpenTitle: "Discard unsaved changes?",
    discardOpenDescription: "You have unsaved changes. Opening another save will discard the current edits.",
    discardAndOpen: "Discard and open",
    keepEditing: "Keep editing",
    openTitle: "Open decrypted Bloodborne save",
    openFailedTitle: "Unable to open save",
    openFailedDescription: "The selected file could not be parsed. Choose a decrypted Bloodborne character save and try again.",
    close: "Close",
    saveTitle: "Save edited character",
    confirmSaveTitle: "Confirm save",
    confirmSaveDescription: "This writes the current edits to the selected file. Keep the automatic .bak backup until you have verified the save in-game.",
    saveCompletedTitle: "Save completed",
    saveCompletedDescription: "Keep your .bak backup until the edited save has been verified.",
    saveFailedTitle: "Unable to save",
    saveFailedDescription: "The edited save could not be written. Check the destination and available permissions, then try again.",
  },
  unsaved: {
    eyebrow: "Unsaved changes",
    title: "Save before closing?",
    description: "Your current edits have not been written to a save file. Choose Save changes to keep them, or close without saving to discard them.",
    cancel: "Cancel",
    discard: "Close without saving",
    save: "Save changes",
    saving: "Saving…",
  },
  sidebar: {
    workspace: "Editor workspace",
    characterData: "Character data",
    inventory: "Inventory",
    inventoryDescription: "Items and equipment",
    storage: "Storage",
    storageDescription: "Stored items",
    stats: "Stats",
    statsDescription: "Attributes and echoes",
    character: "Character",
    characterDescription: "Identity and position",
    bosses: "Bosses",
    bossesDescription: "Progress state",
    flags: "Flags",
    flagsDescription: "Advanced settings",
    backupTitle: "Backup-first workflow",
    backupDescription: "Opening a save creates a .bak copy before edits are made.",
  },
  flags: {
    eyebrow: "Advanced save settings",
    title: "Known Flags",
    introduction: "Only independently documented byte patterns are shown here. Unknown offsets are deliberately excluded to protect the save from accidental corruption.",
    listLabel: "Known save flags",
    safetyTitle: "Before applying a flag",
    safetyDescription: "Apply one change at a time, then use Save changes. Keep the automatically created backup until the character loads normally.",
  },
  forge: {
    runePresetPlaceholder: "Select a rune preset",
    dialogLabel: "Edit {{subject}}",
    editing: "Editing:",
    gemForge: "Gem Forge",
    runeForge: "Rune Forge",
    presetName: "Preset name",
    personalPresetName: "Personal {{subject}} preset name",
    saveAsPreset: "Save as preset",
    savedStatus: "Saved “{{name}}” in My presets for Gem Forge and Rune Forge.",
    convertTo: "Convert to {{subject}}",
    convertConfirm: "Convert this {{source}} into a {{destination}}? Keep the automatic backup until you have tested the save.",
    cancel: "Cancel",
    confirm: "Confirm",
    confirming: "Confirming…",
    unableToApply: "Unable to apply this change.",
    title: "Validated effects and custom sets",
    close: "Close",
    closeLabel: "Close {{subject}} Forge",
    notice: "Loading a preset only updates the visible draft. Select Confirm in the editor to write it to the save. Every effect below comes from the editor’s embedded validated catalogue. Personal presets are shared by Gem Forge and Rune Forge; the destination editor keeps its own valid Shape or Type.",
    modeLabel: "{{subject}} Forge mode",
    presets: "Presets",
    customSet: "Custom set",
    myPresets: "My presets",
    presetCategories: "Preset categories",
    loadIntoDraft: "Load into draft",
    customSetLabel: "Custom {{subject}} effect set",
    buildSixEffect: "Build a six-effect {{subject}}",
    customSetDescription: "Choose up to six validated effects. Empty slots stay as No Effect. The editor validates every selected ID again when you confirm.",
    effect: "Effect {{index}}",
    noEffect: "No Effect",
    draftPreview: "Draft preview",
    draftEmpty: "Choose at least one effect to load a custom draft.",
    loadCustomDraft: "Load custom set into draft",
    personalPresetsLabel: "Personal {{subject}} presets",
    sharedPresetsTitle: "Personal presets shared by both forges",
    sharedPresetsDescription: "Save an edited gem or rune once, then load the same preset from Gem Forge or Rune Forge.",
    personal: "Personal",
    personalPresetDescription: "Personal Forge preset shared by Gem Forge and Rune Forge.",
    delete: "Delete",
    deleteConfirm: "Delete the personal preset “{{name}}”?",
    noPersonalPreset: "No personal preset has been saved yet.",
    noPersonalPresetDescription: "Edit a gem or rune, then use Save as preset to make it available in both forges.",
    duplicate: "Duplicate",
    duplicateCreated: "Created a copy named “{{name}}”.",
    importPresets: "Import JSON",
    exportPresets: "Export JSON",
    importTitle: "Import Forge presets",
    exportTitle: "Export Forge presets",
    importedStatus: "Imported {{count}} new preset(s).",
    exportedStatus: "Preset library exported successfully.",
    libraryFailed: "The preset library operation could not be completed.",
    customName: "Custom {{subject}} Forge",
    customDescription: "Custom set — {{count}} selected effect(s).",
    runePresetDescription: "Validated Caryll Rune preset.",
    categories: { All: "All", Attack: "Attack", Elemental: "Elemental", Recovery: "Recovery", Experimental: "Experimental", Personal: "Personal", Custom: "Custom", Rune: "Rune" },
    builtIn: {
      "apex-physical": { name: "Apex Physical", description: "Physical damage, full-health pressure and durability support." },
      "apex-nourishing": { name: "Apex Nourishing", description: "All-damage amplification with full-health pressure and recovery." },
      "bloodtinge-hunter": { name: "Bloodtinge Hunter", description: "High Bloodtinge damage with all-damage and recovery support." },
      "blunt-breaker": { name: "Blunt Breaker", description: "High blunt damage with all-damage and durability support." },
      "thrust-specialist": { name: "Thrust Specialist", description: "High thrust damage with all-damage and durability support." },
      "all-damage-vanguard": { name: "Vanguard", description: "All-damage amplification with physical pressure and a high recovery bonus." },
      "arcane-surge": { name: "Arcane Surge", description: "Arcane damage with recovery and durability support." },
      "flame-surge": { name: "Flame Surge", description: "Fire damage with all-damage and recovery support." },
      "bolt-surge": { name: "Bolt Surge", description: "Bolt damage with all-damage and durability support." },
      "elemental-ascendant": { name: "Elemental Ascendant", description: "Arcane, fire and bolt effects in one deliberately experimental loadout." },
      "sustained-hunt": { name: "Sustained Hunt", description: "Recovery, durability and all-damage support for long exploration sessions." },
      "abyssal-vitality": { name: "Abyssal Vitality +75", description: "Uses the embedded +75 continuous HP recovery effect with durability and damage support." },
      "forged-endurance": { name: "Forged Endurance", description: "The strongest known bundled durability bonus paired with high recovery and physical damage." },
      "last-stand": { name: "Last Stand", description: "High near-death and full-health multipliers. Keep this loadout offline." },
      "glass-cannon": { name: "Glass Cannon", description: "Stacks physical, all-damage and near-death multipliers for testing only." },
      "endless-hunt": { name: "Endless Hunt", description: "Maximum known recovery and durability effects with a full-health damage bonus." },
    },
  },
  update: {
    available: "Update available",
    version: "Version {{version}}",
    notNow: "Not now",
    updateAndRestart: "Update and restart",
    startingDownload: "Starting secure download…",
    downloadingSigned: "Downloading signed update…",
    downloadingProgress: "Downloading: {{percentage}}%",
    downloadedMegabytes: "{{megabytes}} MB downloaded",
    installing: "Installing update…",
    installedRestarting: "Update installed. Restarting editor…",
    installFailed: "The update could not be installed. Your current version is unchanged.",
  },
  actions: {
    reset: "Reset",
    confirm: "Confirm",
    changesConfirmed: "Changes confirmed",
    back: "Back",
    change: "Change",
    edit: "Edit",
  },
  characterForm: {
    name: "Name:",
    coordinates: "Coordinates:",
    playtime: "Playtime:",
    teleport: "Teleport:",
    selectLocation: "Select a location",
    exportFace: "Export face",
    importFace: "Import face",
    saveFaceFile: "Save face file",
    selectFaceFile: "Select a face file",
    faceExported: "Face exported successfully.",
    faceImported: "Face imported successfully.",
    faceActionFailed: "The face action could not be completed.",
    iszStatus: "Isz status:",
    fixIsz: "Fix Isz",
    iszFixed: "Isz status was updated.",
    iszFixFailed: "Isz status could not be updated.",
  },
  bosses: {
    alive: "Alive",
    dead: "Dead",
  },
  inventory: {
    title: "Inventory",
    addItem: "Add an item",
    replaceItem: "Replace item",
    catalog: "Catalog",
    searchCatalog: "Search catalogue",
    searchItems: "Search {{type}} items",
    quantity: "Quantity",
    addSelected: "Add selected item",
    cancel: "Cancel",
    close: "Close",
    item: "item",
    type: { item: "item", key: "item", chalice: "item", weapon: "weapon", armor: "armor" },
    replacing: "Replacing",
    replaceDialogLabel: "Replace selected item",
    closeReplaceLabel: "Close Replace item",
    replaceDescription: "Choose a compatible {{type}} from the catalogue. The slot position is preserved.",
    selectNew: "Select a new {{type}}",
    addDialogLabel: "Add catalogued item",
    closeAddLabel: "Close Add item",
    addDescription: "Select an item from a safe catalogue and choose its quantity.",
    addNotice: "Weapons and armor keep additional slot data. Use Replace on an existing weapon or armor instead of Add so that this data remains valid.",
    catalogItems: "Items and consumables",
    catalogKeyItems: "Key items",
    catalogChaliceItems: "Chalice items",
    matchingItems: "Matching items",
    noMatchingItem: "No matching item found.",
    catalogWeapons: "Weapons",
    catalogArmors: "Armor",
    catalogGems: "Blood Gems (experimental direct add)",
    catalogRunes: "Caryll Runes (experimental direct add)",
    addDirectUpgrade: "Add a finished gem or rune",
    addDirectEquipment: "Add a weapon or armor",
    directUpgradeDescription: "Create a finished Blood Gem or Caryll Rune directly from validated effects when a safe reusable record is available in the save.",
    directEquipmentDescription: "Create a catalogued weapon or armor directly when the save contains a safe reusable equipment-slot block.",
    directUpgradeBuilder: "Direct gem and rune builder",
    directUpgradeNotice: "Experimental: this operation reuses only a safe orphaned upgrade record. It never shifts the save layout. Keep the automatic backup until the character has loaded normally.",
    directEquipmentNotice: "Experimental: this operation reuses only a safe orphaned equipment-slot block and creates five closed gem slots. Open the slots later with Gems if needed.",
    directUpgradePrimaryRequired: "Choose a validated first effect before adding a gem or rune.",
    directAddFailed: "The direct add could not be completed safely.",
    directUpgradeUnavailable: "This save has no safe reusable Gem/Rune record. No change was made. Create a compatible slot in game, then try again.",
    addDirect: "Add directly",
    addEquipment: "Add equipment",
    gemShape: "Gem shape",
    runeType: "Rune type",
    itemQuantity: "Item quantity:",
    weaponLevel: "Weapon level:",
    setValue: "Set",
    edit: "Edit",
    gems: "Gems",
    searchInventory: "Search inventory",
    searchPlaceholder: "Name, type, effect…",
    clearSearch: "Clear",
    favoritesOnly: "Favorites only",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    runeOriginEffect: "Rune-origin effect",
  },
};

const resources = {
  en,
  fr: {
    language: { label: "Langue" },
    nav: {
      controls: "Contrôles du fichier de sauvegarde",
      activeSave: "Sauvegarde active",
      noSaveLoaded: "Aucune sauvegarde chargée",
      openFileToBegin: "Ouvrez un fichier de personnage déchiffré pour commencer",
      openSave: "Ouvrir une sauvegarde",
      saveChanges: "Enregistrer les modifications",
    },
  home: {
    eyebrow: "Gestion de personnage hors ligne",
    title: "Modifiez avec soin. Préservez votre chasse.",
    lead: "Ouvrez une sauvegarde de personnage Bloodborne déchiffrée pour consulter l’inventaire, les attributs, les paramètres du personnage, les boss et les flags. L’éditeur crée une copie de sauvegarde à l’ouverture ; conservez-la jusqu’à avoir vérifié le résultat en jeu.",
    stepOneTitle: "Utilisez une sauvegarde déchiffrée",
    stepOneDescription: "Les exports PlayStation doivent être déchiffrés avant d’être lus par l’éditeur.",
    stepTwoTitle: "Effectuez des modifications ciblées",
    stepTwoDescription: "Vérifiez chaque modification et évitez d’utiliser une sauvegarde modifiée en ligne.",
    stepThreeTitle: "Vérifiez avant de remplacer",
    stepThreeDescription: "Testez le fichier exporté avant de supprimer la copie automatique .bak.",
    guide: "Lire le guide de déchiffrement",
  },
  operation: {
    preparing: "Préparation de l’éditeur",
    eyebrow: "Traitement des données de sauvegarde",
    title: "Veuillez garder cette fenêtre ouverte.",
  },
  saveFlow: {
    unsavedStatus: "Modifications non enregistrées",
    loadedStatus: "Sauvegarde chargée. Une copie de sauvegarde a été créée avant toute modification.",
    savedStatus: "Modifications enregistrées.",
    discardOpenTitle: "Abandonner les modifications non enregistrées ?",
    discardOpenDescription: "Vous avez des modifications non enregistrées. Ouvrir une autre sauvegarde abandonnera les modifications actuelles.",
    discardAndOpen: "Abandonner et ouvrir",
    keepEditing: "Continuer la modification",
    openTitle: "Ouvrir une sauvegarde Bloodborne déchiffrée",
    openFailedTitle: "Impossible d’ouvrir la sauvegarde",
    openFailedDescription: "Le fichier sélectionné n’a pas pu être analysé. Choisissez une sauvegarde de personnage Bloodborne déchiffrée et réessayez.",
    close: "Fermer",
    saveTitle: "Enregistrer le personnage modifié",
    confirmSaveTitle: "Confirmer l’enregistrement",
    confirmSaveDescription: "Cette opération écrit les modifications dans le fichier sélectionné. Conservez la copie automatique .bak jusqu’à avoir vérifié la sauvegarde en jeu.",
    saveCompletedTitle: "Enregistrement terminé",
    saveCompletedDescription: "Conservez votre copie .bak jusqu’à ce que la sauvegarde modifiée ait été vérifiée.",
    saveFailedTitle: "Impossible d’enregistrer",
    saveFailedDescription: "La sauvegarde modifiée n’a pas pu être écrite. Vérifiez la destination et les autorisations disponibles, puis réessayez.",
  },
  unsaved: {
    eyebrow: "Modifications non enregistrées",
      title: "Enregistrer avant de fermer ?",
      description: "Vos modifications actuelles n’ont pas été écrites dans un fichier de sauvegarde. Choisissez Enregistrer les modifications pour les conserver, ou fermez sans enregistrer pour les abandonner.",
      cancel: "Annuler",
      discard: "Fermer sans enregistrer",
      save: "Enregistrer les modifications",
      saving: "Enregistrement…",
    },
    sidebar: {
      workspace: "Espace de travail",
      characterData: "Données du personnage",
      inventory: "Inventaire",
      inventoryDescription: "Objets et équipement",
      storage: "Stockage",
      storageDescription: "Objets stockés",
      stats: "Statistiques",
      statsDescription: "Attributs et échos",
      character: "Personnage",
      characterDescription: "Identité et position",
      bosses: "Boss",
      bossesDescription: "État de progression",
      flags: "Flags",
      flagsDescription: "Paramètres avancés",
      backupTitle: "Sauvegarde prioritaire",
      backupDescription: "L’ouverture d’une sauvegarde crée une copie .bak avant toute modification.",
    },
    flags: {
      eyebrow: "Paramètres avancés de sauvegarde",
      title: "Flags connus",
      introduction: "Seuls les modèles d’octets documentés de façon indépendante sont affichés. Les offsets inconnus sont exclus afin de protéger la sauvegarde contre toute corruption accidentelle.",
      listLabel: "Flags de sauvegarde connus",
      safetyTitle: "Avant d’appliquer un flag",
      safetyDescription: "Appliquez une modification à la fois, puis utilisez Enregistrer les modifications. Conservez la sauvegarde automatique jusqu’au chargement normal du personnage.",
    },
    forge: {
      runePresetPlaceholder: "Sélectionnez un preset de rune",
      dialogLabel: "Modifier {{subject}}",
      editing: "MODIFICATION :",
      gemForge: "Forge de gemmes",
      runeForge: "Forge de runes",
      presetName: "Nom du preset",
      personalPresetName: "Nom du preset personnel {{subject}}",
      saveAsPreset: "Enregistrer comme preset",
      savedStatus: "« {{name}} » a été enregistré dans Mes presets pour les deux forges.",
      convertTo: "Convertir en {{subject}}",
      convertConfirm: "Convertir cette {{source}} en {{destination}} ? Conservez la sauvegarde automatique jusqu’à avoir testé la sauvegarde.",
      cancel: "Annuler",
      confirm: "Confirmer",
      confirming: "Confirmation…",
      unableToApply: "Impossible d’appliquer cette modification.",
      title: "Effets validés et ensembles personnalisés",
      close: "Fermer",
      closeLabel: "Fermer la Forge de {{subject}}",
      notice: "Le chargement d’un preset met uniquement à jour le brouillon visible. Sélectionnez Confirmer dans l’éditeur pour l’écrire dans la sauvegarde. Chaque effet provient du catalogue validé intégré à l’éditeur. Les presets personnels sont partagés entre les deux forges ; l’éditeur de destination conserve sa Shape ou son Type valide.",
      modeLabel: "Mode de Forge de {{subject}}",
      presets: "Presets",
      customSet: "Ensemble personnalisé",
      myPresets: "Mes presets",
      presetCategories: "Catégories de presets",
      loadIntoDraft: "Charger dans le brouillon",
      customSetLabel: "Ensemble d’effets personnalisé {{subject}}",
      buildSixEffect: "Créer une {{subject}} à six effets",
      customSetDescription: "Choisissez jusqu’à six effets validés. Les emplacements vides restent Sans effet. L’éditeur valide à nouveau chaque identifiant sélectionné lors de la confirmation.",
      effect: "Effet {{index}}",
      noEffect: "Sans effet",
      draftPreview: "Aperçu du brouillon",
      draftEmpty: "Choisissez au moins un effet pour charger un brouillon personnalisé.",
      loadCustomDraft: "Charger l’ensemble personnalisé dans le brouillon",
      personalPresetsLabel: "Presets personnels {{subject}}",
      sharedPresetsTitle: "Presets personnels partagés entre les deux forges",
      sharedPresetsDescription: "Enregistrez une gemme ou une rune modifiée, puis chargez le même preset depuis Gem Forge ou Rune Forge.",
      personal: "Personnel",
      personalPresetDescription: "Preset de forge personnel partagé par Gem Forge et Rune Forge.",
      delete: "Supprimer",
      deleteConfirm: "Supprimer le preset personnel « {{name}} » ?",
      noPersonalPreset: "Aucun preset personnel n’a encore été enregistré.",
      noPersonalPresetDescription: "Modifiez une gemme ou une rune, puis utilisez Enregistrer comme preset pour le rendre disponible dans les deux forges.",
    customName: "Forge personnalisée de {{subject}}",
    customDescription: "Ensemble personnalisé — {{count}} effet(s) sélectionné(s).",
    runePresetDescription: "Preset de rune de Caryll validé.",
    categories: { All: "Tous", Attack: "Attaque", Elemental: "Élémentaire", Recovery: "Récupération", Experimental: "Expérimental", Personal: "Personnel", Custom: "Personnalisé", Rune: "Rune" },
    builtIn: {
      "apex-physical": { name: "Physique suprême", description: "Dégâts physiques, pression à vie pleine et soutien de durabilité." },
      "apex-nourishing": { name: "Nourrissant suprême", description: "Amplification de tous les dégâts avec pression à vie pleine et récupération." },
      "bloodtinge-hunter": { name: "Chasseur de teinte de sang", description: "Dégâts de teinte de sang élevés avec soutien à tous les dégâts et à la récupération." },
      "blunt-breaker": { name: "Briseur contondant", description: "Dégâts contondants élevés avec soutien à tous les dégâts et à la durabilité." },
      "thrust-specialist": { name: "Spécialiste d’estoc", description: "Dégâts d’estoc élevés avec soutien à tous les dégâts et à la durabilité." },
      "all-damage-vanguard": { name: "Avant-garde", description: "Amplification de tous les dégâts avec pression physique et bonus de récupération élevé." },
      "arcane-surge": { name: "Vague arcanique", description: "Dégâts arcaniques avec soutien à la récupération et à la durabilité." },
      "flame-surge": { name: "Vague de feu", description: "Dégâts de feu avec soutien à tous les dégâts et à la récupération." },
      "bolt-surge": { name: "Vague de foudre", description: "Dégâts de foudre avec soutien à tous les dégâts et à la durabilité." },
      "elemental-ascendant": { name: "Ascendant élémentaire", description: "Effets arcaniques, de feu et de foudre dans un équipement volontairement expérimental." },
      "sustained-hunt": { name: "Chasse durable", description: "Récupération, durabilité et soutien à tous les dégâts pour les longues explorations." },
      "abyssal-vitality": { name: "Vitalité abyssale +75", description: "Utilise l’effet intégré de récupération continue de PV +75 avec soutien à la durabilité et aux dégâts." },
      "forged-endurance": { name: "Endurance forgée", description: "Le meilleur bonus de durabilité connu, associé à une récupération et des dégâts physiques élevés." },
      "last-stand": { name: "Dernier rempart", description: "Multiplicateurs élevés à faible vie et à vie pleine. Gardez cet équipement hors ligne." },
      "glass-cannon": { name: "Canon de verre", description: "Cumule les multiplicateurs physiques, de tous les dégâts et de faible vie pour les tests uniquement." },
      "endless-hunt": { name: "Chasse sans fin", description: "Effets de récupération et de durabilité maximum connus avec un bonus de dégâts à vie pleine." },
    },
    },
    update: {
      available: "Mise à jour disponible",
      version: "Version {{version}}",
      notNow: "Pas maintenant",
      updateAndRestart: "Mettre à jour et redémarrer",
      startingDownload: "Préparation du téléchargement sécurisé…",
      downloadingSigned: "Téléchargement de la mise à jour signée…",
      downloadingProgress: "Téléchargement : {{percentage}} %",
      downloadedMegabytes: "{{megabytes}} Mo téléchargés",
      installing: "Installation de la mise à jour…",
      installedRestarting: "Mise à jour installée. Redémarrage de l’éditeur…",
      installFailed: "La mise à jour n’a pas pu être installée. Votre version actuelle reste inchangée.",
    },
    actions: {
      reset: "Réinitialiser",
      confirm: "Confirmer",
      changesConfirmed: "Modifications confirmées",
      back: "Retour",
      change: "Changer",
      edit: "Modifier",
    },
    characterForm: {
      name: "Nom :",
      coordinates: "Coordonnées :",
      playtime: "Temps de jeu :",
      teleport: "Téléportation :",
      selectLocation: "Sélectionnez une destination",
    },
    bosses: {
      alive: "En vie",
      dead: "Vaincu",
    },
    inventory: {
      title: "Inventaire",
      addItem: "Ajouter un objet",
      replaceItem: "Remplacer un objet",
      catalog: "Catalogue",
      searchCatalog: "Rechercher dans le catalogue",
      searchItems: "Rechercher des objets {{type}}",
      quantity: "Quantité",
      addSelected: "Ajouter l’objet sélectionné",
      cancel: "Annuler",
      close: "Fermer",
      item: "objet",
      type: { item: "objet", key: "objet", chalice: "objet", weapon: "arme", armor: "armure" },
      replacing: "REMPLACEMENT",
      replaceDialogLabel: "Remplacer l’objet sélectionné",
      closeReplaceLabel: "Fermer le remplacement d’objet",
      replaceDescription: "Choisissez une {{type}} compatible dans le catalogue. La position de l’emplacement est conservée.",
      selectNew: "Sélectionner une nouvelle {{type}}",
      addDialogLabel: "Ajouter un objet catalogué",
      closeAddLabel: "Fermer l’ajout d’objet",
      addDescription: "Sélectionnez un objet dans un catalogue sûr et choisissez sa quantité.",
      addNotice: "Les armes et armures conservent des données d’emplacement supplémentaires. Utilisez Remplacer sur une arme ou une armure existante plutôt qu’Ajouter afin de conserver la validité de ces données.",
      catalogItems: "Objets et consommables",
      catalogKeyItems: "Objets clés",
      catalogChaliceItems: "Objets de calice",
      matchingItems: "Objets correspondants",
      noMatchingItem: "Aucun objet correspondant trouvé.",
      catalogWeapons: "Armes",
      catalogArmors: "Armures",
      catalogGems: "Gemmes de sang (ajout direct expérimental)",
      catalogRunes: "Runes de Caryll (ajout direct expérimental)",
      addDirectUpgrade: "Ajouter une gemme ou une rune finale",
      addDirectEquipment: "Ajouter une arme ou une armure",
      directUpgradeDescription: "Créez directement une gemme de sang ou une rune de Caryll finale depuis des effets validés lorsqu’un record réutilisable sûr est disponible dans la sauvegarde.",
      directEquipmentDescription: "Créez directement une arme ou une armure du catalogue lorsqu’un bloc de slots d’équipement réutilisable sûr est disponible dans la sauvegarde.",
      directUpgradeBuilder: "Créateur direct de gemmes et runes",
      directUpgradeNotice: "Expérimental : cette opération réutilise uniquement un record d’upgrade orphelin sûr. Elle ne déplace jamais la structure de la sauvegarde. Conservez la copie automatique jusqu’au chargement normal du personnage.",
      directEquipmentNotice: "Expérimental : cette opération réutilise uniquement un bloc de slots d’équipement orphelin sûr et crée cinq slots de gemmes fermés. Ouvrez les slots plus tard avec Gemmes si nécessaire.",
      directUpgradePrimaryRequired: "Choisissez un premier effet validé avant d’ajouter une gemme ou une rune.",
      directAddFailed: "L’ajout direct n’a pas pu être effectué de façon sûre.",
      directUpgradeUnavailable: "Cette sauvegarde ne possède aucun enregistrement Gemme/Rune réutilisable en toute sécurité. Aucune modification n’a été effectuée. Créez un emplacement compatible en jeu, puis réessayez.",
      addDirect: "Ajouter directement",
      addEquipment: "Ajouter l’équipement",
      gemShape: "Forme de gemme",
      runeType: "Type de rune",
      itemQuantity: "Quantité d’objet :",
      weaponLevel: "Niveau d’arme :",
      setValue: "Définir",
      edit: "Modifier",
      gems: "Gemmes",
    },
  },
  es: {
    language: { label: "Idioma" },
    nav: { controls: "Controles del archivo de guardado", activeSave: "Guardado activo", noSaveLoaded: "No hay guardado cargado", openFileToBegin: "Abre un archivo de personaje descifrado para comenzar", openSave: "Abrir guardado", saveChanges: "Guardar cambios" },
    unsaved: { eyebrow: "Cambios sin guardar", title: "¿Guardar antes de cerrar?", description: "Tus cambios actuales no se han escrito en un archivo de guardado. Elige Guardar cambios para conservarlos o cierra sin guardar para descartarlos.", cancel: "Cancelar", discard: "Cerrar sin guardar", save: "Guardar cambios", saving: "Guardando…" },
    sidebar: { workspace: "Espacio del editor", characterData: "Datos del personaje", inventory: "Inventario", inventoryDescription: "Objetos y equipo", storage: "Almacén", storageDescription: "Objetos guardados", stats: "Estadísticas", statsDescription: "Atributos y ecos", character: "Personaje", characterDescription: "Identidad y posición", bosses: "Jefes", bossesDescription: "Estado de progreso", flags: "Flags", flagsDescription: "Ajustes avanzados", backupTitle: "Flujo con copia de seguridad", backupDescription: "Abrir un guardado crea una copia .bak antes de editar." },
    flags: { eyebrow: "Ajustes avanzados de guardado", title: "Flags conocidos", introduction: "Aquí solo se muestran patrones de bytes documentados de forma independiente. Los offsets desconocidos se excluyen para proteger el guardado de una corrupción accidental.", listLabel: "Flags de guardado conocidos", safetyTitle: "Antes de aplicar un flag", safetyDescription: "Aplica un cambio cada vez y después usa Guardar cambios. Conserva la copia automática hasta que el personaje cargue normalmente." },
    forge: { runePresetPlaceholder: "Selecciona un preset de runa" },
    inventory: { title: "Inventario", addItem: "Añadir un objeto", replaceItem: "Reemplazar objeto", catalog: "Catálogo", searchCatalog: "Buscar en el catálogo", searchItems: "Buscar objetos {{type}}", quantity: "Cantidad", addSelected: "Añadir el objeto seleccionado", cancel: "Cancelar", close: "Cerrar" },
  },
  "pt-PT": {
    language: { label: "Idioma" },
    nav: { controls: "Controlos do ficheiro de gravação", activeSave: "Gravação ativa", noSaveLoaded: "Nenhuma gravação carregada", openFileToBegin: "Abra um ficheiro de personagem desencriptado para começar", openSave: "Abrir gravação", saveChanges: "Guardar alterações" },
    unsaved: { eyebrow: "Alterações não guardadas", title: "Guardar antes de fechar?", description: "As alterações atuais não foram escritas num ficheiro de gravação. Escolha Guardar alterações para as manter ou feche sem guardar para as descartar.", cancel: "Cancelar", discard: "Fechar sem guardar", save: "Guardar alterações", saving: "A guardar…" },
    sidebar: { workspace: "Área do editor", characterData: "Dados da personagem", inventory: "Inventário", inventoryDescription: "Itens e equipamento", storage: "Armazenamento", storageDescription: "Itens guardados", stats: "Estatísticas", statsDescription: "Atributos e ecos", character: "Personagem", characterDescription: "Identidade e posição", bosses: "Chefes", bossesDescription: "Estado de progresso", flags: "Flags", flagsDescription: "Definições avançadas", backupTitle: "Fluxo com cópia de segurança", backupDescription: "Abrir uma gravação cria uma cópia .bak antes das alterações." },
    flags: { eyebrow: "Definições avançadas de gravação", title: "Flags conhecidos", introduction: "Apenas são mostrados padrões de bytes documentados de forma independente. Offsets desconhecidos são excluídos para proteger a gravação de corrupção acidental.", listLabel: "Flags de gravação conhecidos", safetyTitle: "Antes de aplicar um flag", safetyDescription: "Aplique uma alteração de cada vez e depois use Guardar alterações. Mantenha a cópia automática até a personagem carregar normalmente." },
    forge: { runePresetPlaceholder: "Selecione um preset de runa" },
    inventory: { title: "Inventário", addItem: "Adicionar um item", replaceItem: "Substituir item", catalog: "Catálogo", searchCatalog: "Pesquisar no catálogo", searchItems: "Pesquisar itens {{type}}", quantity: "Quantidade", addSelected: "Adicionar o item selecionado", cancel: "Cancelar", close: "Fechar" },
  },
  "pt-BR": {
    language: { label: "Idioma" },
    nav: { controls: "Controles do arquivo de save", activeSave: "Save ativo", noSaveLoaded: "Nenhum save carregado", openFileToBegin: "Abra um arquivo de personagem descriptografado para começar", openSave: "Abrir save", saveChanges: "Salvar alterações" },
    unsaved: { eyebrow: "Alterações não salvas", title: "Salvar antes de fechar?", description: "Suas alterações atuais não foram gravadas em um arquivo de save. Escolha Salvar alterações para mantê-las ou feche sem salvar para descartá-las.", cancel: "Cancelar", discard: "Fechar sem salvar", save: "Salvar alterações", saving: "Salvando…" },
    sidebar: { workspace: "Área do editor", characterData: "Dados do personagem", inventory: "Inventário", inventoryDescription: "Itens e equipamentos", storage: "Armazenamento", storageDescription: "Itens armazenados", stats: "Atributos", statsDescription: "Atributos e ecos", character: "Personagem", characterDescription: "Identidade e posição", bosses: "Chefes", bossesDescription: "Estado de progresso", flags: "Flags", flagsDescription: "Configurações avançadas", backupTitle: "Fluxo com backup", backupDescription: "Abrir um save cria uma cópia .bak antes das alterações." },
    flags: { eyebrow: "Configurações avançadas de save", title: "Flags conhecidos", introduction: "Apenas padrões de bytes documentados independentemente são exibidos. Offsets desconhecidos são excluídos para proteger o save contra corrupção acidental.", listLabel: "Flags de save conhecidos", safetyTitle: "Antes de aplicar um flag", safetyDescription: "Aplique uma alteração de cada vez e depois use Salvar alterações. Mantenha o backup automático até o personagem carregar normalmente." },
    forge: { runePresetPlaceholder: "Selecione um preset de runa" },
    inventory: { title: "Inventário", addItem: "Adicionar item", replaceItem: "Substituir item", catalog: "Catálogo", searchCatalog: "Pesquisar catálogo", searchItems: "Pesquisar itens {{type}}", quantity: "Quantidade", addSelected: "Adicionar item selecionado", cancel: "Cancelar", close: "Fechar" },
  },
  ru: {
    language: { label: "Язык" },
    nav: { controls: "Управление файлом сохранения", activeSave: "Активное сохранение", noSaveLoaded: "Сохранение не загружено", openFileToBegin: "Откройте расшифрованный файл персонажа, чтобы начать", openSave: "Открыть сохранение", saveChanges: "Сохранить изменения" },
    unsaved: { eyebrow: "Несохранённые изменения", title: "Сохранить перед закрытием?", description: "Текущие изменения не записаны в файл сохранения. Нажмите «Сохранить изменения», чтобы оставить их, или закройте без сохранения, чтобы отменить их.", cancel: "Отмена", discard: "Закрыть без сохранения", save: "Сохранить изменения", saving: "Сохранение…" },
    sidebar: { workspace: "Рабочая область редактора", characterData: "Данные персонажа", inventory: "Инвентарь", inventoryDescription: "Предметы и снаряжение", storage: "Хранилище", storageDescription: "Сохранённые предметы", stats: "Характеристики", statsDescription: "Атрибуты и эхо", character: "Персонаж", characterDescription: "Личность и положение", bosses: "Боссы", bossesDescription: "Состояние прогресса", flags: "Флаги", flagsDescription: "Расширенные настройки", backupTitle: "Сначала резервная копия", backupDescription: "При открытии сохранения создаётся копия .bak до внесения изменений." },
    flags: { eyebrow: "Расширенные настройки сохранения", title: "Известные флаги", introduction: "Здесь показаны только независимо документированные шаблоны байтов. Неизвестные смещения намеренно исключены, чтобы защитить сохранение от случайного повреждения.", listLabel: "Известные флаги сохранения", safetyTitle: "Перед применением флага", safetyDescription: "Применяйте по одному изменению, затем выберите «Сохранить изменения». Храните автоматическую копию, пока персонаж не загрузится нормально." },
    forge: { runePresetPlaceholder: "Выберите набор рун" },
    inventory: { title: "Инвентарь", addItem: "Добавить предмет", replaceItem: "Заменить предмет", catalog: "Каталог", searchCatalog: "Поиск по каталогу", searchItems: "Искать предметы {{type}}", quantity: "Количество", addSelected: "Добавить выбранный предмет", cancel: "Отмена", close: "Закрыть" },
  },
  de: {
    language: { label: "Sprache" },
    nav: { controls: "Steuerung der Speicherdatei", activeSave: "Aktiver Speicherstand", noSaveLoaded: "Kein Speicherstand geladen", openFileToBegin: "Öffne eine entschlüsselte Charakterdatei, um zu beginnen", openSave: "Speicherstand öffnen", saveChanges: "Änderungen speichern" },
    unsaved: { eyebrow: "Ungespeicherte Änderungen", title: "Vor dem Schließen speichern?", description: "Deine aktuellen Änderungen wurden nicht in eine Speicherdatei geschrieben. Wähle Änderungen speichern, um sie zu behalten, oder schließe ohne Speichern, um sie zu verwerfen.", cancel: "Abbrechen", discard: "Ohne Speichern schließen", save: "Änderungen speichern", saving: "Wird gespeichert…" },
    sidebar: { workspace: "Editor-Arbeitsbereich", characterData: "Charakterdaten", inventory: "Inventar", inventoryDescription: "Gegenstände und Ausrüstung", storage: "Lager", storageDescription: "Gelagerte Gegenstände", stats: "Werte", statsDescription: "Attribute und Echos", character: "Charakter", characterDescription: "Identität und Position", bosses: "Bosse", bossesDescription: "Fortschrittsstatus", flags: "Flags", flagsDescription: "Erweiterte Einstellungen", backupTitle: "Backup zuerst", backupDescription: "Beim Öffnen eines Speicherstands wird vor Änderungen eine .bak-Kopie erstellt." },
    flags: { eyebrow: "Erweiterte Speicher-Einstellungen", title: "Bekannte Flags", introduction: "Hier werden nur unabhängig dokumentierte Byte-Muster angezeigt. Unbekannte Offsets sind absichtlich ausgeschlossen, um den Speicherstand vor versehentlicher Beschädigung zu schützen.", listLabel: "Bekannte Speicher-Flags", safetyTitle: "Vor dem Anwenden eines Flags", safetyDescription: "Wende jeweils nur eine Änderung an und wähle dann Änderungen speichern. Bewahre das automatische Backup auf, bis der Charakter normal geladen wird." },
    forge: { runePresetPlaceholder: "Runen-Preset auswählen" },
    inventory: { title: "Inventar", addItem: "Gegenstand hinzufügen", replaceItem: "Gegenstand ersetzen", catalog: "Katalog", searchCatalog: "Katalog durchsuchen", searchItems: "{{type}}-Gegenstände suchen", quantity: "Menge", addSelected: "Ausgewählten Gegenstand hinzufügen", cancel: "Abbrechen", close: "Schließen" },
  },
};

const baseUiOverrides = {
  it: {
    language: { label: "Lingua" },
    nav: { controls: "Controlli del file di salvataggio", activeSave: "Salvataggio attivo", noSaveLoaded: "Nessun salvataggio caricato", openFileToBegin: "Apri un file del personaggio decrittato per iniziare", openSave: "Apri salvataggio", saveChanges: "Salva modifiche" },
    unsaved: { eyebrow: "Modifiche non salvate", title: "Salvare prima di chiudere?", description: "Le modifiche correnti non sono state scritte in un file di salvataggio. Scegli Salva modifiche per conservarle oppure chiudi senza salvare per scartarle.", cancel: "Annulla", discard: "Chiudi senza salvare", save: "Salva modifiche", saving: "Salvataggio…" },
    sidebar: { workspace: "Area di lavoro dell’editor", characterData: "Dati del personaggio", inventory: "Inventario", inventoryDescription: "Oggetti ed equipaggiamento", storage: "Deposito", storageDescription: "Oggetti conservati", stats: "Statistiche", statsDescription: "Attributi ed echi", character: "Personaggio", characterDescription: "Identità e posizione", bosses: "Boss", bossesDescription: "Stato di avanzamento", flags: "Flag", flagsDescription: "Impostazioni avanzate", backupTitle: "Prima il backup", backupDescription: "L’apertura di un salvataggio crea una copia .bak prima delle modifiche." },
    flags: { eyebrow: "Impostazioni avanzate del salvataggio", title: "Flag noti", introduction: "Qui sono mostrati solo schemi di byte documentati in modo indipendente. Gli offset sconosciuti sono esclusi intenzionalmente per proteggere il salvataggio da corruzioni accidentali.", listLabel: "Flag di salvataggio noti", safetyTitle: "Prima di applicare un flag", safetyDescription: "Applica una modifica alla volta, poi usa Salva modifiche. Conserva il backup automatico finché il personaggio non si carica normalmente." },
  },
  nl: {
    language: { label: "Taal" },
    nav: { controls: "Bediening van opslagbestand", activeSave: "Actieve opslag", noSaveLoaded: "Geen opslag geladen", openFileToBegin: "Open een ontsleuteld personagebestand om te beginnen", openSave: "Opslag openen", saveChanges: "Wijzigingen opslaan" },
    unsaved: { eyebrow: "Niet-opgeslagen wijzigingen", title: "Opslaan voordat u sluit?", description: "Uw huidige wijzigingen zijn niet naar een opslagbestand geschreven. Kies Wijzigingen opslaan om ze te behouden of sluit zonder op te slaan om ze te verwerpen.", cancel: "Annuleren", discard: "Sluiten zonder opslaan", save: "Wijzigingen opslaan", saving: "Opslaan…" },
    sidebar: { workspace: "Werkruimte van de editor", characterData: "Personagegegevens", inventory: "Inventaris", inventoryDescription: "Voorwerpen en uitrusting", storage: "Opslag", storageDescription: "Opgeslagen voorwerpen", stats: "Statistieken", statsDescription: "Attributen en echo’s", character: "Personage", characterDescription: "Identiteit en positie", bosses: "Bazen", bossesDescription: "Voortgangsstatus", flags: "Flags", flagsDescription: "Geavanceerde instellingen", backupTitle: "Eerst een back-up", backupDescription: "Bij het openen van een opslag wordt vóór wijzigingen een .bak-kopie gemaakt." },
    flags: { eyebrow: "Geavanceerde opslaginstellingen", title: "Bekende flags", introduction: "Hier worden alleen onafhankelijk gedocumenteerde bytepatronen getoond. Onbekende offsets zijn bewust uitgesloten om de opslag tegen onopzettelijke beschadiging te beschermen.", listLabel: "Bekende opslagflags", safetyTitle: "Voordat u een flag toepast", safetyDescription: "Pas één wijziging tegelijk toe en kies daarna Wijzigingen opslaan. Bewaar de automatische back-up totdat het personage normaal is geladen." },
  },
  pl: {
    language: { label: "Język" },
    nav: { controls: "Sterowanie plikiem zapisu", activeSave: "Aktywny zapis", noSaveLoaded: "Nie wczytano zapisu", openFileToBegin: "Otwórz odszyfrowany plik postaci, aby rozpocząć", openSave: "Otwórz zapis", saveChanges: "Zapisz zmiany" },
    unsaved: { eyebrow: "Niezapisane zmiany", title: "Zapisać przed zamknięciem?", description: "Bieżące zmiany nie zostały zapisane w pliku zapisu. Wybierz Zapisz zmiany, aby je zachować, lub zamknij bez zapisywania, aby je odrzucić.", cancel: "Anuluj", discard: "Zamknij bez zapisywania", save: "Zapisz zmiany", saving: "Zapisywanie…" },
    sidebar: { workspace: "Obszar roboczy edytora", characterData: "Dane postaci", inventory: "Ekwipunek", inventoryDescription: "Przedmioty i wyposażenie", storage: "Magazyn", storageDescription: "Przechowywane przedmioty", stats: "Statystyki", statsDescription: "Atrybuty i echa", character: "Postać", characterDescription: "Tożsamość i pozycja", bosses: "Bossowie", bossesDescription: "Stan postępu", flags: "Flagi", flagsDescription: "Ustawienia zaawansowane", backupTitle: "Najpierw kopia zapasowa", backupDescription: "Otwarcie zapisu tworzy kopię .bak przed wprowadzeniem zmian." },
    flags: { eyebrow: "Zaawansowane ustawienia zapisu", title: "Znane flagi", introduction: "Wyświetlane są tutaj wyłącznie niezależnie udokumentowane wzorce bajtów. Nieznane offsety są celowo wykluczone, aby chronić zapis przed przypadkowym uszkodzeniem.", listLabel: "Znane flagi zapisu", safetyTitle: "Przed zastosowaniem flagi", safetyDescription: "Wprowadzaj po jednej zmianie, a następnie wybierz Zapisz zmiany. Zachowaj automatyczną kopię zapasową, aż postać wczyta się poprawnie." },
  },
  tr: {
    language: { label: "Dil" },
    nav: { controls: "Kayıt dosyası denetimleri", activeSave: "Etkin kayıt", noSaveLoaded: "Kayıt yüklenmedi", openFileToBegin: "Başlamak için şifresi çözülmüş bir karakter dosyası açın", openSave: "Kayıt aç", saveChanges: "Değişiklikleri kaydet" },
    unsaved: { eyebrow: "Kaydedilmemiş değişiklikler", title: "Kapatmadan önce kaydedilsin mi?", description: "Geçerli düzenlemeleriniz bir kayıt dosyasına yazılmadı. Korumak için Değişiklikleri kaydet’i seçin veya atmak için kaydetmeden kapatın.", cancel: "İptal", discard: "Kaydetmeden kapat", save: "Değişiklikleri kaydet", saving: "Kaydediliyor…" },
    sidebar: { workspace: "Düzenleyici çalışma alanı", characterData: "Karakter verileri", inventory: "Envanter", inventoryDescription: "Eşyalar ve ekipman", storage: "Depolama", storageDescription: "Depolanan eşyalar", stats: "İstatistikler", statsDescription: "Nitelikler ve yankılar", character: "Karakter", characterDescription: "Kimlik ve konum", bosses: "Bosslar", bossesDescription: "İlerleme durumu", flags: "Bayraklar", flagsDescription: "Gelişmiş ayarlar", backupTitle: "Önce yedek", backupDescription: "Bir kayıt açmak, düzenlemelerden önce .bak kopyası oluşturur." },
    flags: { eyebrow: "Gelişmiş kayıt ayarları", title: "Bilinen bayraklar", introduction: "Burada yalnızca bağımsız olarak belgelenmiş bayt kalıpları gösterilir. Bilinmeyen ofsetler, kaydı kazara bozulmadan korumak için bilinçli olarak hariç tutulur.", listLabel: "Bilinen kayıt bayrakları", safetyTitle: "Bir bayrak uygulamadan önce", safetyDescription: "Her seferinde tek bir değişiklik uygulayın, ardından Değişiklikleri kaydet’i kullanın. Karakter normal yüklendiğinde kadar otomatik yedeği saklayın." },
  },
  uk: {
    language: { label: "Мова" },
    nav: { controls: "Керування файлом збереження", activeSave: "Активне збереження", noSaveLoaded: "Збереження не завантажено", openFileToBegin: "Відкрийте розшифрований файл персонажа, щоб почати", openSave: "Відкрити збереження", saveChanges: "Зберегти зміни" },
    unsaved: { eyebrow: "Незбережені зміни", title: "Зберегти перед закриттям?", description: "Поточні зміни не записано до файлу збереження. Виберіть Зберегти зміни, щоб залишити їх, або закрийте без збереження, щоб відкинути.", cancel: "Скасувати", discard: "Закрити без збереження", save: "Зберегти зміни", saving: "Збереження…" },
    sidebar: { workspace: "Робоча область редактора", characterData: "Дані персонажа", inventory: "Інвентар", inventoryDescription: "Предмети та спорядження", storage: "Сховище", storageDescription: "Збережені предмети", stats: "Характеристики", statsDescription: "Атрибути й відлуння", character: "Персонаж", characterDescription: "Ідентичність і позиція", bosses: "Боси", bossesDescription: "Стан прогресу", flags: "Прапорці", flagsDescription: "Розширені налаштування", backupTitle: "Спочатку резервна копія", backupDescription: "Відкриття збереження створює копію .bak перед змінами." },
    flags: { eyebrow: "Розширені налаштування збереження", title: "Відомі прапорці", introduction: "Тут показано лише незалежно задокументовані шаблони байтів. Невідомі зміщення навмисно виключено, щоб захистити збереження від випадкового пошкодження.", listLabel: "Відомі прапорці збереження", safetyTitle: "Перед застосуванням прапорця", safetyDescription: "Застосовуйте по одній зміні, а потім виберіть Зберегти зміни. Зберігайте автоматичну копію, доки персонаж не завантажиться нормально." },
  },
  ja: {
    language: { label: "言語" },
    nav: { controls: "セーブファイル操作", activeSave: "使用中のセーブ", noSaveLoaded: "セーブが読み込まれていません", openFileToBegin: "開始するには復号済みのキャラクターファイルを開いてください", openSave: "セーブを開く", saveChanges: "変更を保存" },
    unsaved: { eyebrow: "未保存の変更", title: "閉じる前に保存しますか？", description: "現在の編集内容はセーブファイルに書き込まれていません。保持するには変更を保存を選択し、破棄するには保存せずに閉じてください。", cancel: "キャンセル", discard: "保存せずに閉じる", save: "変更を保存", saving: "保存中…" },
    sidebar: { workspace: "エディターの作業領域", characterData: "キャラクターデータ", inventory: "インベントリ", inventoryDescription: "アイテムと装備", storage: "保管庫", storageDescription: "保管中のアイテム", stats: "ステータス", statsDescription: "能力値とエコー", character: "キャラクター", characterDescription: "識別情報と位置", bosses: "ボス", bossesDescription: "進行状況", flags: "フラグ", flagsDescription: "高度な設定", backupTitle: "バックアップを優先", backupDescription: "セーブを開くと、編集前に .bak コピーが作成されます。" },
    flags: { eyebrow: "高度なセーブ設定", title: "既知のフラグ", introduction: "ここには独自に文書化されたバイトパターンのみを表示します。不明なオフセットは、セーブを偶発的な破損から保護するため意図的に除外されています。", listLabel: "既知のセーブフラグ", safetyTitle: "フラグを適用する前に", safetyDescription: "一度に適用する変更は一つだけにし、その後で変更を保存を使用してください。キャラクターが正常に読み込まれるまで自動バックアップを保管してください。" },
  },
  ko: {
    language: { label: "언어" },
    nav: { controls: "저장 파일 제어", activeSave: "활성 저장", noSaveLoaded: "불러온 저장이 없습니다", openFileToBegin: "시작하려면 해독된 캐릭터 파일을 여세요", openSave: "저장 열기", saveChanges: "변경 사항 저장" },
    unsaved: { eyebrow: "저장되지 않은 변경 사항", title: "닫기 전에 저장할까요?", description: "현재 편집 내용이 저장 파일에 기록되지 않았습니다. 유지하려면 변경 사항 저장을 선택하고, 버리려면 저장하지 않고 닫으세요.", cancel: "취소", discard: "저장하지 않고 닫기", save: "변경 사항 저장", saving: "저장 중…" },
    sidebar: { workspace: "편집기 작업 공간", characterData: "캐릭터 데이터", inventory: "인벤토리", inventoryDescription: "아이템 및 장비", storage: "보관함", storageDescription: "보관된 아이템", stats: "능력치", statsDescription: "속성과 메아리", character: "캐릭터", characterDescription: "신원 및 위치", bosses: "보스", bossesDescription: "진행 상태", flags: "플래그", flagsDescription: "고급 설정", backupTitle: "백업 우선", backupDescription: "저장을 열면 편집 전에 .bak 사본이 생성됩니다." },
    flags: { eyebrow: "고급 저장 설정", title: "알려진 플래그", introduction: "여기에는 독립적으로 문서화된 바이트 패턴만 표시됩니다. 알 수 없는 오프셋은 저장을 우발적 손상으로부터 보호하기 위해 의도적으로 제외됩니다.", listLabel: "알려진 저장 플래그", safetyTitle: "플래그를 적용하기 전에", safetyDescription: "한 번에 하나의 변경만 적용한 다음 변경 사항 저장을 사용하세요. 캐릭터가 정상적으로 로드될 때까지 자동 백업을 보관하세요." },
  },
  "zh-CN": {
    language: { label: "语言" },
    nav: { controls: "存档文件控制", activeSave: "当前存档", noSaveLoaded: "未加载存档", openFileToBegin: "请打开已解密的角色文件以开始", openSave: "打开存档", saveChanges: "保存更改" },
    unsaved: { eyebrow: "未保存的更改", title: "关闭前保存吗？", description: "当前编辑尚未写入存档文件。选择保存更改以保留它们，或选择不保存并关闭以放弃它们。", cancel: "取消", discard: "不保存并关闭", save: "保存更改", saving: "正在保存…" },
    sidebar: { workspace: "编辑器工作区", characterData: "角色数据", inventory: "物品栏", inventoryDescription: "物品和装备", storage: "仓库", storageDescription: "已储存的物品", stats: "属性", statsDescription: "属性和血之回响", character: "角色", characterDescription: "身份和位置", bosses: "首领", bossesDescription: "进度状态", flags: "标志", flagsDescription: "高级设置", backupTitle: "优先备份", backupDescription: "打开存档会在编辑前创建 .bak 副本。" },
    flags: { eyebrow: "高级存档设置", title: "已知标志", introduction: "这里只显示独立记录的字节模式。未知偏移量会被刻意排除，以保护存档免受意外损坏。", listLabel: "已知存档标志", safetyTitle: "应用标志之前", safetyDescription: "一次只应用一项更改，然后使用保存更改。请保留自动备份，直到角色正常加载。" },
  },
  sv: {
    language: { label: "Språk" },
    nav: { controls: "Kontroller för sparfil", activeSave: "Aktiv sparning", noSaveLoaded: "Ingen sparning har lästs in", openFileToBegin: "Öppna en dekrypterad karaktärsfil för att börja", openSave: "Öppna sparning", saveChanges: "Spara ändringar" },
    unsaved: { eyebrow: "Osparade ändringar", title: "Spara innan du stänger?", description: "Dina aktuella ändringar har inte skrivits till en sparfil. Välj Spara ändringar för att behålla dem eller stäng utan att spara för att förkasta dem.", cancel: "Avbryt", discard: "Stäng utan att spara", save: "Spara ändringar", saving: "Sparar…" },
    sidebar: { workspace: "Redigerarens arbetsyta", characterData: "Karaktärsdata", inventory: "Inventarie", inventoryDescription: "Föremål och utrustning", storage: "Förvaring", storageDescription: "Förvarade föremål", stats: "Statistik", statsDescription: "Attribut och ekon", character: "Karaktär", characterDescription: "Identitet och position", bosses: "Bossar", bossesDescription: "Förloppsstatus", flags: "Flaggor", flagsDescription: "Avancerade inställningar", backupTitle: "Säkerhetskopia först", backupDescription: "När en sparning öppnas skapas en .bak-kopia före ändringar." },
    flags: { eyebrow: "Avancerade sparinställningar", title: "Kända flaggor", introduction: "Här visas endast oberoende dokumenterade bytemönster. Okända offsetvärden utesluts medvetet för att skydda sparningen från oavsiktlig skada.", listLabel: "Kända sparflaggor", safetyTitle: "Innan du tillämpar en flagga", safetyDescription: "Tillämpa en ändring i taget och använd sedan Spara ändringar. Behåll den automatiska säkerhetskopian tills karaktären har lästs in normalt." },
  },
  cs: {
    language: { label: "Jazyk" },
    nav: { controls: "Ovládání souboru uložené hry", activeSave: "Aktivní uložená hra", noSaveLoaded: "Není načtena žádná uložená hra", openFileToBegin: "Chcete-li začít, otevřete dešifrovaný soubor postavy", openSave: "Otevřít uloženou hru", saveChanges: "Uložit změny" },
    unsaved: { eyebrow: "Neuložené změny", title: "Uložit před zavřením?", description: "Aktuální úpravy nebyly zapsány do souboru uložené pozice. Chcete-li je zachovat, vyberte Uložit změny, nebo je zavřením bez uložení zahoďte.", cancel: "Zrušit", discard: "Zavřít bez uložení", save: "Uložit změny", saving: "Ukládání…" },
    sidebar: { workspace: "Pracovní prostor editoru", characterData: "Data postavy", inventory: "Inventář", inventoryDescription: "Předměty a vybavení", storage: "Úložiště", storageDescription: "Uložené předměty", stats: "Statistiky", statsDescription: "Vlastnosti a ozvěny", character: "Postava", characterDescription: "Identita a pozice", bosses: "Bossové", bossesDescription: "Stav postupu", flags: "Příznaky", flagsDescription: "Pokročilá nastavení", backupTitle: "Nejdřív záloha", backupDescription: "Otevřením uložené hry se před změnami vytvoří kopie .bak." },
    flags: { eyebrow: "Pokročilá nastavení uložené hry", title: "Známé příznaky", introduction: "Zde jsou zobrazeny pouze nezávisle zdokumentované vzory bajtů. Neznámé offsety jsou záměrně vynechány, aby byla uložená hra chráněna před náhodným poškozením.", listLabel: "Známé příznaky uložené hry", safetyTitle: "Před použitím příznaku", safetyDescription: "Používejte vždy jednu změnu a potom zvolte Uložit změny. Automatickou zálohu ponechte, dokud se postava nenačte normálně." },
  },
  ro: {
    language: { label: "Limbă" },
    nav: { controls: "Comenzi pentru fișierul de salvare", activeSave: "Salvare activă", noSaveLoaded: "Nu este încărcată nicio salvare", openFileToBegin: "Deschide un fișier de personaj decriptat pentru a începe", openSave: "Deschide salvarea", saveChanges: "Salvează modificările" },
    unsaved: { eyebrow: "Modificări nesalvate", title: "Salvezi înainte de închidere?", description: "Modificările curente nu au fost scrise într-un fișier de salvare. Alege Salvează modificările pentru a le păstra sau închide fără salvare pentru a le elimina.", cancel: "Anulează", discard: "Închide fără salvare", save: "Salvează modificările", saving: "Se salvează…" },
    sidebar: { workspace: "Spațiu de lucru al editorului", characterData: "Datele personajului", inventory: "Inventar", inventoryDescription: "Obiecte și echipament", storage: "Depozit", storageDescription: "Obiecte stocate", stats: "Statistici", statsDescription: "Atribute și ecouri", character: "Personaj", characterDescription: "Identitate și poziție", bosses: "Șefi", bossesDescription: "Starea progresului", flags: "Marcaje", flagsDescription: "Setări avansate", backupTitle: "Mai întâi copia de rezervă", backupDescription: "Deschiderea unei salvări creează o copie .bak înainte de modificări." },
    flags: { eyebrow: "Setări avansate de salvare", title: "Marcaje cunoscute", introduction: "Aici sunt afișate doar modele de octeți documentate independent. Offseturile necunoscute sunt excluse intenționat pentru a proteja salvarea împotriva coruperii accidentale.", listLabel: "Marcaje de salvare cunoscute", safetyTitle: "Înainte de a aplica un marcaj", safetyDescription: "Aplică o singură modificare o dată, apoi folosește Salvează modificările. Păstrează copia automată până când personajul se încarcă normal." },
  },
  el: {
    language: { label: "Γλώσσα" },
    nav: { controls: "Χειριστήρια αρχείου αποθήκευσης", activeSave: "Ενεργή αποθήκευση", noSaveLoaded: "Δεν έχει φορτωθεί αποθήκευση", openFileToBegin: "Ανοίξτε ένα αποκρυπτογραφημένο αρχείο χαρακτήρα για να ξεκινήσετε", openSave: "Άνοιγμα αποθήκευσης", saveChanges: "Αποθήκευση αλλαγών" },
    unsaved: { eyebrow: "Μη αποθηκευμένες αλλαγές", title: "Αποθήκευση πριν το κλείσιμο;", description: "Οι τρέχουσες αλλαγές δεν έχουν γραφτεί σε αρχείο αποθήκευσης. Επιλέξτε Αποθήκευση αλλαγών για να τις κρατήσετε ή κλείστε χωρίς αποθήκευση για να τις απορρίψετε.", cancel: "Ακύρωση", discard: "Κλείσιμο χωρίς αποθήκευση", save: "Αποθήκευση αλλαγών", saving: "Αποθήκευση…" },
    sidebar: { workspace: "Χώρος εργασίας επεξεργαστή", characterData: "Δεδομένα χαρακτήρα", inventory: "Απόθεμα", inventoryDescription: "Αντικείμενα και εξοπλισμός", storage: "Αποθήκη", storageDescription: "Αποθηκευμένα αντικείμενα", stats: "Στατιστικά", statsDescription: "Χαρακτηριστικά και ηχώ", character: "Χαρακτήρας", characterDescription: "Ταυτότητα και θέση", bosses: "Αφεντικά", bossesDescription: "Κατάσταση προόδου", flags: "Σημαίες", flagsDescription: "Προηγμένες ρυθμίσεις", backupTitle: "Πρώτα αντίγραφο ασφαλείας", backupDescription: "Το άνοιγμα αποθήκευσης δημιουργεί αντίγραφο .bak πριν από τις αλλαγές." },
    flags: { eyebrow: "Προηγμένες ρυθμίσεις αποθήκευσης", title: "Γνωστές σημαίες", introduction: "Εδώ εμφανίζονται μόνο ανεξάρτητα τεκμηριωμένα μοτίβα byte. Οι άγνωστες μετατοπίσεις εξαιρούνται σκόπιμα, ώστε να προστατεύεται η αποθήκευση από τυχαία αλλοίωση.", listLabel: "Γνωστές σημαίες αποθήκευσης", safetyTitle: "Πριν την εφαρμογή μιας σημαίας", safetyDescription: "Εφαρμόστε μία αλλαγή τη φορά και έπειτα χρησιμοποιήστε Αποθήκευση αλλαγών. Κρατήστε το αυτόματο αντίγραφο ασφαλείας μέχρι να φορτώσει κανονικά ο χαρακτήρας." },
  },
  id: {
    language: { label: "Bahasa" },
    nav: { controls: "Kontrol berkas simpanan", activeSave: "Simpanan aktif", noSaveLoaded: "Belum ada simpanan yang dimuat", openFileToBegin: "Buka berkas karakter yang telah didekripsi untuk memulai", openSave: "Buka simpanan", saveChanges: "Simpan perubahan" },
    unsaved: { eyebrow: "Perubahan belum disimpan", title: "Simpan sebelum menutup?", description: "Suntingan saat ini belum ditulis ke berkas simpanan. Pilih Simpan perubahan untuk mempertahankannya, atau tutup tanpa menyimpan untuk membuangnya.", cancel: "Batal", discard: "Tutup tanpa menyimpan", save: "Simpan perubahan", saving: "Menyimpan…" },
    sidebar: { workspace: "Ruang kerja editor", characterData: "Data karakter", inventory: "Inventaris", inventoryDescription: "Item dan perlengkapan", storage: "Penyimpanan", storageDescription: "Item tersimpan", stats: "Statistik", statsDescription: "Atribut dan gema", character: "Karakter", characterDescription: "Identitas dan posisi", bosses: "Boss", bossesDescription: "Status kemajuan", flags: "Penanda", flagsDescription: "Pengaturan lanjutan", backupTitle: "Cadangan terlebih dahulu", backupDescription: "Membuka simpanan membuat salinan .bak sebelum perubahan dilakukan." },
    flags: { eyebrow: "Pengaturan simpanan lanjutan", title: "Penanda yang diketahui", introduction: "Hanya pola byte yang terdokumentasi secara mandiri yang ditampilkan di sini. Offset yang tidak diketahui sengaja dikecualikan untuk melindungi simpanan dari kerusakan tidak disengaja.", listLabel: "Penanda simpanan yang diketahui", safetyTitle: "Sebelum menerapkan penanda", safetyDescription: "Terapkan satu perubahan setiap kali, lalu gunakan Simpan perubahan. Simpan cadangan otomatis sampai karakter dimuat secara normal." },
  },
};

Object.entries(baseUiOverrides).forEach(([language, ui]) => {
  resources[language] = {
    ...(resources[language] ?? {}),
    language: { ...en.language, ...(resources[language]?.language ?? {}), ...ui.language },
    nav: { ...en.nav, ...(resources[language]?.nav ?? {}), ...ui.nav },
    unsaved: { ...en.unsaved, ...(resources[language]?.unsaved ?? {}), ...ui.unsaved },
    sidebar: { ...en.sidebar, ...(resources[language]?.sidebar ?? {}), ...ui.sidebar },
    flags: { ...en.flags, ...(resources[language]?.flags ?? {}), ...ui.flags },
  };
});

const forgeOverrides = {
  es: { editing: "EDITANDO:", gemForge: "Forja de gemas", runeForge: "Forja de runas", presetName: "Nombre del preset", saveAsPreset: "Guardar como preset", cancel: "Cancelar", confirm: "Confirmar", confirming: "Confirmando…", title: "Efectos validados y conjuntos personalizados", close: "Cerrar", customSet: "Conjunto personalizado", myPresets: "Mis presets", loadIntoDraft: "Cargar en borrador", loadCustomDraft: "Cargar conjunto personalizado en borrador", delete: "Eliminar", noEffect: "Sin efecto" },
  "pt-PT": { editing: "A EDITAR:", gemForge: "Forja de gemas", runeForge: "Forja de runas", presetName: "Nome do preset", saveAsPreset: "Guardar como preset", cancel: "Cancelar", confirm: "Confirmar", confirming: "A confirmar…", title: "Efeitos validados e conjuntos personalizados", close: "Fechar", customSet: "Conjunto personalizado", myPresets: "Os meus presets", loadIntoDraft: "Carregar no rascunho", loadCustomDraft: "Carregar conjunto personalizado no rascunho", delete: "Eliminar", noEffect: "Sem efeito" },
  "pt-BR": { editing: "EDITANDO:", gemForge: "Forja de gemas", runeForge: "Forja de runas", presetName: "Nome do preset", saveAsPreset: "Salvar como preset", cancel: "Cancelar", confirm: "Confirmar", confirming: "Confirmando…", title: "Efeitos validados e conjuntos personalizados", close: "Fechar", customSet: "Conjunto personalizado", myPresets: "Meus presets", loadIntoDraft: "Carregar no rascunho", loadCustomDraft: "Carregar conjunto personalizado no rascunho", delete: "Excluir", noEffect: "Sem efeito" },
  ru: { editing: "РЕДАКТИРОВАНИЕ:", gemForge: "Кузница камней", runeForge: "Кузница рун", presetName: "Имя набора", saveAsPreset: "Сохранить как набор", cancel: "Отмена", confirm: "Подтвердить", confirming: "Подтверждение…", title: "Проверенные эффекты и пользовательские наборы", close: "Закрыть", customSet: "Пользовательский набор", myPresets: "Мои наборы", loadIntoDraft: "Загрузить в черновик", loadCustomDraft: "Загрузить набор в черновик", delete: "Удалить", noEffect: "Нет эффекта" },
  de: { editing: "BEARBEITUNG:", gemForge: "Edelstein-Schmiede", runeForge: "Runen-Schmiede", presetName: "Preset-Name", saveAsPreset: "Als Preset speichern", cancel: "Abbrechen", confirm: "Bestätigen", confirming: "Wird bestätigt…", title: "Validierte Effekte und benutzerdefinierte Sets", close: "Schließen", customSet: "Benutzerdefiniertes Set", myPresets: "Meine Presets", loadIntoDraft: "In Entwurf laden", loadCustomDraft: "Benutzerdefiniertes Set in Entwurf laden", delete: "Löschen", noEffect: "Kein Effekt" },
  it: { editing: "MODIFICA:", gemForge: "Forgia gemme", runeForge: "Forgia rune", presetName: "Nome preset", saveAsPreset: "Salva come preset", cancel: "Annulla", confirm: "Conferma", confirming: "Conferma in corso…", title: "Effetti convalidati e set personalizzati", close: "Chiudi", customSet: "Set personalizzato", myPresets: "I miei preset", loadIntoDraft: "Carica nella bozza", loadCustomDraft: "Carica il set personalizzato nella bozza", delete: "Elimina", noEffect: "Nessun effetto" },
  nl: { editing: "BEWERKEN:", gemForge: "Edelsteensmederij", runeForge: "Runensmederij", presetName: "Presetnaam", saveAsPreset: "Opslaan als preset", cancel: "Annuleren", confirm: "Bevestigen", confirming: "Bevestigen…", title: "Gevalideerde effecten en aangepaste sets", close: "Sluiten", customSet: "Aangepaste set", myPresets: "Mijn presets", loadIntoDraft: "In concept laden", loadCustomDraft: "Aangepaste set in concept laden", delete: "Verwijderen", noEffect: "Geen effect" },
  pl: { editing: "EDYCJA:", gemForge: "Kuźnia klejnotów", runeForge: "Kuźnia run", presetName: "Nazwa presetu", saveAsPreset: "Zapisz jako preset", cancel: "Anuluj", confirm: "Potwierdź", confirming: "Potwierdzanie…", title: "Zweryfikowane efekty i zestawy własne", close: "Zamknij", customSet: "Zestaw własny", myPresets: "Moje presety", loadIntoDraft: "Wczytaj do szkicu", loadCustomDraft: "Wczytaj zestaw własny do szkicu", delete: "Usuń", noEffect: "Brak efektu" },
  tr: { editing: "DÜZENLEME:", gemForge: "Kan taşı atölyesi", runeForge: "Rün atölyesi", presetName: "Hazır ayar adı", saveAsPreset: "Hazır ayar olarak kaydet", cancel: "İptal", confirm: "Onayla", confirming: "Onaylanıyor…", title: "Doğrulanmış etkiler ve özel setler", close: "Kapat", customSet: "Özel set", myPresets: "Hazır ayarlarım", loadIntoDraft: "Taslağa yükle", loadCustomDraft: "Özel seti taslağa yükle", delete: "Sil", noEffect: "Etki yok" },
  uk: { editing: "РЕДАГУВАННЯ:", gemForge: "Кузня каменів", runeForge: "Кузня рун", presetName: "Назва набору", saveAsPreset: "Зберегти як набір", cancel: "Скасувати", confirm: "Підтвердити", confirming: "Підтвердження…", title: "Перевірені ефекти та власні набори", close: "Закрити", customSet: "Власний набір", myPresets: "Мої набори", loadIntoDraft: "Завантажити до чернетки", loadCustomDraft: "Завантажити власний набір до чернетки", delete: "Видалити", noEffect: "Без ефекту" },
  ja: { editing: "編集中:", gemForge: "血晶石の鍛冶", runeForge: "カレル文字の鍛冶", presetName: "プリセット名", saveAsPreset: "プリセットとして保存", cancel: "キャンセル", confirm: "確認", confirming: "確認中…", title: "検証済みの効果とカスタムセット", close: "閉じる", customSet: "カスタムセット", myPresets: "マイプリセット", loadIntoDraft: "下書きに読み込む", loadCustomDraft: "カスタムセットを下書きに読み込む", delete: "削除", noEffect: "効果なし" },
  ko: { editing: "편집 중:", gemForge: "혈정석 대장간", runeForge: "카릴 문자 대장간", presetName: "프리셋 이름", saveAsPreset: "프리셋으로 저장", cancel: "취소", confirm: "확인", confirming: "확인 중…", title: "검증된 효과 및 사용자 세트", close: "닫기", customSet: "사용자 세트", myPresets: "내 프리셋", loadIntoDraft: "초안에 불러오기", loadCustomDraft: "사용자 세트를 초안에 불러오기", delete: "삭제", noEffect: "효과 없음" },
  "zh-CN": { editing: "正在编辑：", gemForge: "血宝石熔炉", runeForge: "符文熔炉", presetName: "预设名称", saveAsPreset: "保存为预设", cancel: "取消", confirm: "确认", confirming: "确认中…", title: "已验证效果和自定义套装", close: "关闭", customSet: "自定义套装", myPresets: "我的预设", loadIntoDraft: "载入草稿", loadCustomDraft: "将自定义套装载入草稿", delete: "删除", noEffect: "无效果" },
  sv: { editing: "REDIGERAR:", gemForge: "Ädelstenssmedja", runeForge: "Runsmedja", presetName: "Förinställningsnamn", saveAsPreset: "Spara som förinställning", cancel: "Avbryt", confirm: "Bekräfta", confirming: "Bekräftar…", title: "Validerade effekter och anpassade set", close: "Stäng", customSet: "Anpassat set", myPresets: "Mina förinställningar", loadIntoDraft: "Ladda i utkast", loadCustomDraft: "Ladda anpassat set i utkast", delete: "Ta bort", noEffect: "Ingen effekt" },
  cs: { editing: "ÚPRAVY:", gemForge: "Kovárna drahokamů", runeForge: "Kovárna run", presetName: "Název předvolby", saveAsPreset: "Uložit jako předvolbu", cancel: "Zrušit", confirm: "Potvrdit", confirming: "Potvrzování…", title: "Ověřené efekty a vlastní sady", close: "Zavřít", customSet: "Vlastní sada", myPresets: "Moje předvolby", loadIntoDraft: "Načíst do návrhu", loadCustomDraft: "Načíst vlastní sadu do návrhu", delete: "Odstranit", noEffect: "Bez efektu" },
  ro: { editing: "EDITARE:", gemForge: "Forja de pietre", runeForge: "Forja de rune", presetName: "Nume preset", saveAsPreset: "Salvează ca preset", cancel: "Anulează", confirm: "Confirmă", confirming: "Se confirmă…", title: "Efecte validate și seturi personalizate", close: "Închide", customSet: "Set personalizat", myPresets: "Presetările mele", loadIntoDraft: "Încarcă în schiță", loadCustomDraft: "Încarcă setul personalizat în schiță", delete: "Șterge", noEffect: "Fără efect" },
  el: { editing: "ΕΠΕΞΕΡΓΑΣΙΑ:", gemForge: "Σφυρηλάτηση πολύτιμων λίθων", runeForge: "Σφυρηλάτηση ρούνων", presetName: "Όνομα προεπιλογής", saveAsPreset: "Αποθήκευση ως προεπιλογή", cancel: "Ακύρωση", confirm: "Επιβεβαίωση", confirming: "Επιβεβαίωση…", title: "Επικυρωμένα εφέ και προσαρμοσμένα σύνολα", close: "Κλείσιμο", customSet: "Προσαρμοσμένο σύνολο", myPresets: "Οι προεπιλογές μου", loadIntoDraft: "Φόρτωση στο πρόχειρο", loadCustomDraft: "Φόρτωση προσαρμοσμένου συνόλου στο πρόχειρο", delete: "Διαγραφή", noEffect: "Χωρίς εφέ" },
  id: { editing: "MENGEDIT:", gemForge: "Tempa permata", runeForge: "Tempa rune", presetName: "Nama preset", saveAsPreset: "Simpan sebagai preset", cancel: "Batal", confirm: "Konfirmasi", confirming: "Mengonfirmasi…", title: "Efek tervalidasi dan set khusus", close: "Tutup", customSet: "Set khusus", myPresets: "Preset saya", loadIntoDraft: "Muat ke draf", loadCustomDraft: "Muat set khusus ke draf", delete: "Hapus", noEffect: "Tanpa efek" },
};

Object.entries(forgeOverrides).forEach(([language, forge]) => {
  resources[language] = {
    ...(resources[language] ?? {}),
    forge: {
      ...en.forge,
      ...(resources[language]?.forge ?? {}),
      ...forge,
    },
  };
});

const inventoryOverrides = {
  es: { item: "objeto", type: { item: "objeto", key: "objeto", chalice: "objeto", weapon: "arma", armor: "armadura" }, replacing: "REEMPLAZANDO", replaceDialogLabel: "Reemplazar objeto seleccionado", closeReplaceLabel: "Cerrar reemplazo de objeto", replaceDescription: "Elige un {{type}} compatible del catálogo. Se conserva la posición de la ranura.", selectNew: "Selecciona un nuevo {{type}}", addDialogLabel: "Añadir objeto del catálogo", closeAddLabel: "Cerrar añadir objeto", addDescription: "Selecciona un objeto de un catálogo seguro y elige su cantidad.", addNotice: "Las armas y armaduras conservan datos de ranura adicionales. Usa Reemplazar en un arma o armadura existente en lugar de Añadir para mantener estos datos válidos.", catalogItems: "Objetos y consumibles", catalogKeyItems: "Objetos clave", catalogChaliceItems: "Objetos de cáliz", matchingItems: "Objetos coincidentes", noMatchingItem: "No se encontró ningún objeto coincidente." },
  "pt-PT": { item: "item", type: { item: "item", key: "item", chalice: "item", weapon: "arma", armor: "armadura" }, replacing: "A SUBSTITUIR", replaceDialogLabel: "Substituir item selecionado", closeReplaceLabel: "Fechar substituição de item", replaceDescription: "Escolha uma {{type}} compatível do catálogo. A posição do espaço é preservada.", selectNew: "Selecionar uma nova {{type}}", addDialogLabel: "Adicionar item do catálogo", closeAddLabel: "Fechar adição de item", addDescription: "Selecione um item de um catálogo seguro e escolha a quantidade.", addNotice: "Armas e armaduras mantêm dados adicionais do espaço. Use Substituir numa arma ou armadura existente em vez de Adicionar para manter estes dados válidos.", catalogItems: "Itens e consumíveis", catalogKeyItems: "Itens-chave", catalogChaliceItems: "Itens de cálice", matchingItems: "Itens correspondentes", noMatchingItem: "Não foi encontrado nenhum item correspondente." },
  "pt-BR": { item: "item", type: { item: "item", key: "item", chalice: "item", weapon: "arma", armor: "armadura" }, replacing: "SUBSTITUINDO", replaceDialogLabel: "Substituir item selecionado", closeReplaceLabel: "Fechar substituição de item", replaceDescription: "Escolha uma {{type}} compatível do catálogo. A posição do slot é preservada.", selectNew: "Selecionar uma nova {{type}}", addDialogLabel: "Adicionar item do catálogo", closeAddLabel: "Fechar adição de item", addDescription: "Selecione um item de um catálogo seguro e escolha sua quantidade.", addNotice: "Armas e armaduras mantêm dados adicionais de slot. Use Substituir em uma arma ou armadura existente em vez de Adicionar para manter esses dados válidos.", catalogItems: "Itens e consumíveis", catalogKeyItems: "Itens-chave", catalogChaliceItems: "Itens de cálice", matchingItems: "Itens correspondentes", noMatchingItem: "Nenhum item correspondente foi encontrado." },
  ru: { item: "предмет", type: { item: "предмет", key: "предмет", chalice: "предмет", weapon: "оружие", armor: "броня" }, replacing: "ЗАМЕНА", replaceDialogLabel: "Заменить выбранный предмет", closeReplaceLabel: "Закрыть замену предмета", replaceDescription: "Выберите совместимый {{type}} из каталога. Позиция ячейки сохраняется.", selectNew: "Выбрать новый {{type}}", addDialogLabel: "Добавить предмет из каталога", closeAddLabel: "Закрыть добавление предмета", addDescription: "Выберите предмет из безопасного каталога и его количество.", addNotice: "Оружие и броня хранят дополнительные данные ячейки. Используйте Заменить для существующего оружия или брони вместо Добавить, чтобы эти данные оставались действительными.", catalogItems: "Предметы и расходники", catalogKeyItems: "Ключевые предметы", catalogChaliceItems: "Предметы чаши", matchingItems: "Подходящие предметы", noMatchingItem: "Подходящий предмет не найден." },
  de: { item: "Gegenstand", type: { item: "Gegenstand", key: "Gegenstand", chalice: "Gegenstand", weapon: "Waffe", armor: "Rüstung" }, replacing: "ERSETZEN", replaceDialogLabel: "Ausgewählten Gegenstand ersetzen", closeReplaceLabel: "Gegenstand ersetzen schließen", replaceDescription: "Wähle einen kompatiblen {{type}} aus dem Katalog. Die Slot-Position bleibt erhalten.", selectNew: "Neuen {{type}} auswählen", addDialogLabel: "Katalog-Gegenstand hinzufügen", closeAddLabel: "Gegenstand hinzufügen schließen", addDescription: "Wähle einen Gegenstand aus einem sicheren Katalog und seine Menge.", addNotice: "Waffen und Rüstungen behalten zusätzliche Slot-Daten. Verwende bei vorhandenen Waffen oder Rüstungen Ersetzen statt Hinzufügen, damit diese Daten gültig bleiben.", catalogItems: "Gegenstände und Verbrauchsartikel", catalogKeyItems: "Schlüsselgegenstände", catalogChaliceItems: "Kelchgegenstände", matchingItems: "Passende Gegenstände", noMatchingItem: "Kein passender Gegenstand gefunden." },
  it: { item: "oggetto", type: { item: "oggetto", key: "oggetto", chalice: "oggetto", weapon: "arma", armor: "armatura" }, replacing: "SOSTITUZIONE", replaceDialogLabel: "Sostituisci oggetto selezionato", closeReplaceLabel: "Chiudi sostituzione oggetto", replaceDescription: "Scegli un {{type}} compatibile dal catalogo. La posizione dello slot viene mantenuta.", selectNew: "Seleziona un nuovo {{type}}", addDialogLabel: "Aggiungi oggetto dal catalogo", closeAddLabel: "Chiudi aggiunta oggetto", addDescription: "Seleziona un oggetto da un catalogo sicuro e scegline la quantità.", addNotice: "Armi e armature mantengono dati aggiuntivi dello slot. Usa Sostituisci su un’arma o armatura esistente invece di Aggiungi per mantenere validi questi dati.", catalogItems: "Oggetti e consumabili", catalogKeyItems: "Oggetti chiave", catalogChaliceItems: "Oggetti del calice", matchingItems: "Oggetti corrispondenti", noMatchingItem: "Nessun oggetto corrispondente trovato." },
  nl: { item: "item", type: { item: "item", key: "item", chalice: "item", weapon: "wapen", armor: "pantser" }, replacing: "VERVANGEN", replaceDialogLabel: "Geselecteerd item vervangen", closeReplaceLabel: "Item vervangen sluiten", replaceDescription: "Kies een compatibel {{type}} uit de catalogus. De slotpositie blijft behouden.", selectNew: "Nieuw {{type}} selecteren", addDialogLabel: "Catalogusitem toevoegen", closeAddLabel: "Item toevoegen sluiten", addDescription: "Selecteer een item uit een veilige catalogus en kies de hoeveelheid.", addNotice: "Wapens en pantsers behouden aanvullende slotgegevens. Gebruik Vervangen op een bestaand wapen of pantser in plaats van Toevoegen zodat deze gegevens geldig blijven.", catalogItems: "Items en verbruiksartikelen", catalogKeyItems: "Sleutelitems", catalogChaliceItems: "Kelkitems", matchingItems: "Overeenkomende items", noMatchingItem: "Geen overeenkomend item gevonden." },
  pl: { item: "przedmiot", type: { item: "przedmiot", key: "przedmiot", chalice: "przedmiot", weapon: "broń", armor: "zbroja" }, replacing: "ZAMIANA", replaceDialogLabel: "Zamień wybrany przedmiot", closeReplaceLabel: "Zamknij zamianę przedmiotu", replaceDescription: "Wybierz zgodny {{type}} z katalogu. Pozycja slotu zostanie zachowana.", selectNew: "Wybierz nowy {{type}}", addDialogLabel: "Dodaj przedmiot z katalogu", closeAddLabel: "Zamknij dodawanie przedmiotu", addDescription: "Wybierz przedmiot z bezpiecznego katalogu i jego ilość.", addNotice: "Broń i zbroje zachowują dodatkowe dane slotu. Użyj Zamień dla istniejącej broni lub zbroi zamiast Dodaj, aby dane pozostały prawidłowe.", catalogItems: "Przedmioty i materiały zużywalne", catalogKeyItems: "Przedmioty kluczowe", catalogChaliceItems: "Przedmioty kielicha", matchingItems: "Pasujące przedmioty", noMatchingItem: "Nie znaleziono pasującego przedmiotu." },
  tr: { item: "eşya", type: { item: "eşya", key: "eşya", chalice: "eşya", weapon: "silah", armor: "zırh" }, replacing: "DEĞİŞTİRME", replaceDialogLabel: "Seçili eşyayı değiştir", closeReplaceLabel: "Eşya değiştirmeyi kapat", replaceDescription: "Katalogdan uyumlu bir {{type}} seçin. Yuva konumu korunur.", selectNew: "Yeni {{type}} seçin", addDialogLabel: "Katalog eşyası ekle", closeAddLabel: "Eşya eklemeyi kapat", addDescription: "Güvenli katalogdan bir eşya seçin ve miktarını belirleyin.", addNotice: "Silahlar ve zırhlar ek yuva verilerini korur. Bu verilerin geçerli kalması için Ekle yerine mevcut silah veya zırhta Değiştir’i kullanın.", catalogItems: "Eşyalar ve sarf malzemeleri", catalogKeyItems: "Anahtar eşyalar", catalogChaliceItems: "Kadeh eşyaları", matchingItems: "Eşleşen eşyalar", noMatchingItem: "Eşleşen eşya bulunamadı." },
  uk: { item: "предмет", type: { item: "предмет", key: "предмет", chalice: "предмет", weapon: "зброя", armor: "обладунок" }, replacing: "ЗАМІНА", replaceDialogLabel: "Замінити вибраний предмет", closeReplaceLabel: "Закрити заміну предмета", replaceDescription: "Виберіть сумісний {{type}} з каталогу. Позиція комірки зберігається.", selectNew: "Вибрати новий {{type}}", addDialogLabel: "Додати предмет із каталогу", closeAddLabel: "Закрити додавання предмета", addDescription: "Виберіть предмет із безпечного каталогу та його кількість.", addNotice: "Зброя й обладунки зберігають додаткові дані комірки. Використовуйте Замінити для наявної зброї або обладунку замість Додати, щоб ці дані залишалися дійсними.", catalogItems: "Предмети та витратні матеріали", catalogKeyItems: "Ключові предмети", catalogChaliceItems: "Предмети чаші", matchingItems: "Відповідні предмети", noMatchingItem: "Відповідного предмета не знайдено." },
  ja: { item: "アイテム", type: { item: "アイテム", key: "アイテム", chalice: "アイテム", weapon: "武器", armor: "防具" }, replacing: "置換中", replaceDialogLabel: "選択したアイテムを置換", closeReplaceLabel: "アイテム置換を閉じる", replaceDescription: "カタログから互換性のある{{type}}を選択してください。スロット位置は保持されます。", selectNew: "新しい{{type}}を選択", addDialogLabel: "カタログのアイテムを追加", closeAddLabel: "アイテム追加を閉じる", addDescription: "安全なカタログからアイテムを選び、数量を指定してください。", addNotice: "武器と防具は追加のスロットデータを保持します。データを有効に保つため、追加ではなく既存の武器または防具で置換を使用してください。", catalogItems: "アイテムと消耗品", catalogKeyItems: "キーアイテム", catalogChaliceItems: "聖杯アイテム", matchingItems: "一致するアイテム", noMatchingItem: "一致するアイテムが見つかりません。" },
  ko: { item: "아이템", type: { item: "아이템", key: "아이템", chalice: "아이템", weapon: "무기", armor: "방어구" }, replacing: "교체 중", replaceDialogLabel: "선택한 아이템 교체", closeReplaceLabel: "아이템 교체 닫기", replaceDescription: "목록에서 호환되는 {{type}}을 선택하세요. 슬롯 위치는 유지됩니다.", selectNew: "새 {{type}} 선택", addDialogLabel: "목록 아이템 추가", closeAddLabel: "아이템 추가 닫기", addDescription: "안전한 목록에서 아이템을 선택하고 수량을 지정하세요.", addNotice: "무기와 방어구는 추가 슬롯 데이터를 유지합니다. 이 데이터를 유효하게 유지하려면 추가 대신 기존 무기나 방어구에 교체를 사용하세요.", catalogItems: "아이템 및 소모품", catalogKeyItems: "핵심 아이템", catalogChaliceItems: "성배 아이템", matchingItems: "일치하는 아이템", noMatchingItem: "일치하는 아이템을 찾을 수 없습니다." },
  "zh-CN": { item: "物品", type: { item: "物品", key: "物品", chalice: "物品", weapon: "武器", armor: "护甲" }, replacing: "正在替换", replaceDialogLabel: "替换所选物品", closeReplaceLabel: "关闭物品替换", replaceDescription: "从目录中选择兼容的{{type}}。槽位位置将保留。", selectNew: "选择新的{{type}}", addDialogLabel: "添加目录物品", closeAddLabel: "关闭添加物品", addDescription: "从安全目录中选择物品并设置数量。", addNotice: "武器和护甲会保留额外槽位数据。请对现有武器或护甲使用替换而非添加，以保持这些数据有效。", catalogItems: "物品和消耗品", catalogKeyItems: "关键物品", catalogChaliceItems: "圣杯物品", matchingItems: "匹配的物品", noMatchingItem: "未找到匹配的物品。" },
  sv: { item: "föremål", type: { item: "föremål", key: "föremål", chalice: "föremål", weapon: "vapen", armor: "rustning" }, replacing: "ERSÄTTER", replaceDialogLabel: "Ersätt valt föremål", closeReplaceLabel: "Stäng ersättning av föremål", replaceDescription: "Välj en kompatibel {{type}} från katalogen. Platsens position bevaras.", selectNew: "Välj en ny {{type}}", addDialogLabel: "Lägg till katalogföremål", closeAddLabel: "Stäng lägg till föremål", addDescription: "Välj ett föremål från en säker katalog och dess mängd.", addNotice: "Vapen och rustningar behåller extra platsdata. Använd Ersätt på ett befintligt vapen eller rustning i stället för Lägg till för att behålla dessa data giltiga.", catalogItems: "Föremål och förbrukningsvaror", catalogKeyItems: "Nyckelföremål", catalogChaliceItems: "Bägareföremål", matchingItems: "Matchande föremål", noMatchingItem: "Inget matchande föremål hittades." },
  cs: { item: "předmět", type: { item: "předmět", key: "předmět", chalice: "předmět", weapon: "zbraň", armor: "brnění" }, replacing: "NAHRAZOVÁNÍ", replaceDialogLabel: "Nahradit vybraný předmět", closeReplaceLabel: "Zavřít nahrazení předmětu", replaceDescription: "Vyberte kompatibilní {{type}} z katalogu. Pozice slotu zůstane zachována.", selectNew: "Vybrat nový {{type}}", addDialogLabel: "Přidat katalogový předmět", closeAddLabel: "Zavřít přidání předmětu", addDescription: "Vyberte předmět z bezpečného katalogu a jeho množství.", addNotice: "Zbraně a brnění zachovávají další data slotu. Použijte Nahradit u existující zbraně nebo brnění namísto Přidat, aby data zůstala platná.", catalogItems: "Předměty a spotřební věci", catalogKeyItems: "Klíčové předměty", catalogChaliceItems: "Předměty kalicha", matchingItems: "Odpovídající předměty", noMatchingItem: "Nebyl nalezen žádný odpovídající předmět." },
  ro: { item: "obiect", type: { item: "obiect", key: "obiect", chalice: "obiect", weapon: "armă", armor: "armură" }, replacing: "ÎNLOCUIRE", replaceDialogLabel: "Înlocuiește obiectul selectat", closeReplaceLabel: "Închide înlocuirea obiectului", replaceDescription: "Alege o {{type}} compatibilă din catalog. Poziția slotului este păstrată.", selectNew: "Selectează o nouă {{type}}", addDialogLabel: "Adaugă obiect din catalog", closeAddLabel: "Închide adăugarea obiectului", addDescription: "Selectează un obiect dintr-un catalog sigur și cantitatea sa.", addNotice: "Armele și armurile păstrează date suplimentare ale slotului. Folosește Înlocuiește pentru o armă sau armură existentă în loc de Adaugă pentru ca aceste date să rămână valide.", catalogItems: "Obiecte și consumabile", catalogKeyItems: "Obiecte-cheie", catalogChaliceItems: "Obiecte de potir", matchingItems: "Obiecte potrivite", noMatchingItem: "Nu a fost găsit niciun obiect potrivit." },
  el: { item: "αντικείμενο", type: { item: "αντικείμενο", key: "αντικείμενο", chalice: "αντικείμενο", weapon: "όπλο", armor: "πανοπλία" }, replacing: "ΑΝΤΙΚΑΤΑΣΤΑΣΗ", replaceDialogLabel: "Αντικατάσταση επιλεγμένου αντικειμένου", closeReplaceLabel: "Κλείσιμο αντικατάστασης αντικειμένου", replaceDescription: "Επιλέξτε συμβατό {{type}} από τον κατάλογο. Η θέση υποδοχής διατηρείται.", selectNew: "Επιλογή νέου {{type}}", addDialogLabel: "Προσθήκη αντικειμένου καταλόγου", closeAddLabel: "Κλείσιμο προσθήκης αντικειμένου", addDescription: "Επιλέξτε αντικείμενο από ασφαλή κατάλογο και ποσότητα.", addNotice: "Τα όπλα και οι πανοπλίες διατηρούν πρόσθετα δεδομένα υποδοχής. Χρησιμοποιήστε Αντικατάσταση σε υπάρχον όπλο ή πανοπλία αντί για Προσθήκη ώστε τα δεδομένα να παραμείνουν έγκυρα.", catalogItems: "Αντικείμενα και αναλώσιμα", catalogKeyItems: "Βασικά αντικείμενα", catalogChaliceItems: "Αντικείμενα δισκοπότηρου", matchingItems: "Αντιστοιχισμένα αντικείμενα", noMatchingItem: "Δεν βρέθηκε αντίστοιχο αντικείμενο." },
  id: { item: "item", type: { item: "item", key: "item", chalice: "item", weapon: "senjata", armor: "zirah" }, replacing: "MENGGANTI", replaceDialogLabel: "Ganti item terpilih", closeReplaceLabel: "Tutup penggantian item", replaceDescription: "Pilih {{type}} yang kompatibel dari katalog. Posisi slot dipertahankan.", selectNew: "Pilih {{type}} baru", addDialogLabel: "Tambahkan item katalog", closeAddLabel: "Tutup tambah item", addDescription: "Pilih item dari katalog aman dan jumlahnya.", addNotice: "Senjata dan zirah menyimpan data slot tambahan. Gunakan Ganti pada senjata atau zirah yang ada, bukan Tambah, agar data ini tetap valid.", catalogItems: "Item dan barang habis pakai", catalogKeyItems: "Item kunci", catalogChaliceItems: "Item chalice", matchingItems: "Item yang cocok", noMatchingItem: "Tidak ada item yang cocok." },
};

Object.entries(inventoryOverrides).forEach(([language, inventory]) => {
  resources[language] = {
    ...(resources[language] ?? {}),
    inventory: {
      ...en.inventory,
      ...(resources[language]?.inventory ?? {}),
      ...inventory,
    },
  };
});

const commonUiOverrides = {
  "es": {
    "home": {
      "eyebrow": "Gestión de personajes sin conexión",
      "title": "Edita deliberadamente. Preserva tu cacería.",
      "lead": "Abre un archivo de personaje de Bloodborne descifrado para inspeccionar inventario, atributos, ajustes de personaje, jefes y banderas. El editor crea una copia de seguridad cuando se abre un archivo; consérvala siempre hasta haber comprobado el resultado en el juego.",
      "stepOneTitle": "Usa una partida descifrada",
      "stepOneDescription": "Las exportaciones de PlayStation deben descifrarse antes de que el editor pueda leerlas.",
      "stepTwoTitle": "Haz ediciones concretas",
      "stepTwoDescription": "Revisa cada cambio y evita usar partidas modificadas en el juego en línea.",
      "stepThreeTitle": "Verifica antes de reemplazar",
      "stepThreeDescription": "Prueba el archivo exportado antes de eliminar la copia automática .bak.",
      "guide": "Lee la guía de descifrado"
    },
    "operation": {
      "preparing": "Preparando el editor",
      "eyebrow": "Trabajando con datos guardados",
      "title": "Por favor, mantén esta ventana abierta."
    },
    "saveFlow": {
      "unsavedStatus": "Cambios no guardados",
      "loadedStatus": "Partida cargada. Se creó una copia de seguridad antes de editar.",
      "savedStatus": "Cambios guardados.",
      "discardOpenTitle": "¿Descartar cambios no guardados?",
      "discardOpenDescription": "Tienes cambios no guardados. Abrir otra partida descartará las ediciones actuales.",
      "discardAndOpen": "Descartar y abrir",
      "keepEditing": "Seguir editando",
      "openTitle": "Abrir partida de Bloodborne descifrada",
      "openFailedTitle": "No se pudo abrir la partida",
      "openFailedDescription": "No se pudo analizar el archivo seleccionado. Elige una partida de personaje de Bloodborne descifrada y vuelve a intentarlo.",
      "close": "Cerrar",
      "saveTitle": "Guardar personaje editado",
      "confirmSaveTitle": "Confirmar guardado",
      "confirmSaveDescription": "Esto escribe las ediciones actuales en el archivo seleccionado. Conserva la copia automática .bak hasta que hayas verificado la partida en el juego.",
      "saveCompletedTitle": "Guardado completado",
      "saveCompletedDescription": "Conserva tu copia .bak hasta que la partida editada haya sido verificada.",
      "saveFailedTitle": "No se pudo guardar",
      "saveFailedDescription": "No se pudo escribir la partida editada. Comprueba el destino y los permisos disponibles, luego inténtalo de nuevo."
    },
    "inventory": {
      "directUpgradeUnavailable": "Esta partida no tiene un registro seguro reutilizable de Gem/Rune. No se realizó ningún cambio. Crea una ranura compatible en el juego y vuelve a intentarlo.",
      "itemQuantity": "Cantidad de objeto:",
      "weaponLevel": "Nivel del arma:",
      "setValue": "Establecer",
      "edit": "Editar",
      "gems": "Gemas"
    }
  },
  "pt-PT": {
    "home": {
      "eyebrow": "Gestão de personagem offline",
      "title": "Edite deliberadamente. Preserve a sua caçada.",
      "lead": "Abra um ficheiro de personagem de Bloodborne descodificado para inspecionar o inventário, atributos, definições de personagem, chefes e flags. O editor cria um backup quando um ficheiro é aberto; mantenha-o sempre até verificar o resultado no jogo.",
      "stepOneTitle": "Use um save descodificado",
      "stepOneDescription": "Exportações da PlayStation têm de ser descodificadas antes de poderem ser lidas pelo editor.",
      "stepTwoTitle": "Faça edições focadas",
      "stepTwoDescription": "Revise cada alteração e evite usar saves modificados no jogo online.",
      "stepThreeTitle": "Verifique antes de substituir",
      "stepThreeDescription": "Teste o ficheiro exportado antes de remover a cópia automática .bak.",
      "guide": "Leia o guia de descodificação"
    },
    "operation": {
      "preparing": "A preparar o editor",
      "eyebrow": "A trabalhar com dados de save",
      "title": "Mantenha esta janela aberta, por favor."
    },
    "saveFlow": {
      "unsavedStatus": "Alterações não guardadas",
      "loadedStatus": "Save carregado. Foi criada uma cópia de segurança antes da edição.",
      "savedStatus": "Alterações guardadas.",
      "discardOpenTitle": "Descartar alterações não guardadas?",
      "discardOpenDescription": "Tem alterações não guardadas. Abrir outro save descartará as edições atuais.",
      "discardAndOpen": "Descartar e abrir",
      "keepEditing": "Continuar a editar",
      "openTitle": "Abrir save de Bloodborne descodificado",
      "openFailedTitle": "Incapaz de abrir o save",
      "openFailedDescription": "O ficheiro selecionado não pôde ser analisado. Escolha um save de personagem de Bloodborne descodificado e tente novamente.",
      "close": "Fechar",
      "saveTitle": "Guardar personagem editado",
      "confirmSaveTitle": "Confirmar gravação",
      "confirmSaveDescription": "Isto escreve as edições atuais no ficheiro selecionado. Mantenha o backup automático .bak até verificar o save no jogo.",
      "saveCompletedTitle": "Gravação concluída",
      "saveCompletedDescription": "Mantenha a sua cópia .bak até que o save editado tenha sido verificado.",
      "saveFailedTitle": "Não foi possível guardar",
      "saveFailedDescription": "O save editado não pôde ser escrito. Verifique o destino e as permissões disponíveis e tente novamente."
    },
    "inventory": {
      "directUpgradeUnavailable": "Este save não tem um registo seguro reutilizável de Gem/Rune. Nenhuma alteração foi feita. Crie um slot compatível no jogo e tente novamente.",
      "itemQuantity": "Quantidade do item:",
      "weaponLevel": "Nível da arma:",
      "setValue": "Definir",
      "edit": "Editar",
      "gems": "Gems"
    }
  },
  "pt-BR": {
    "home": {
      "eyebrow": "Gerenciamento de personagem offline",
      "title": "Edite deliberadamente. Preserve sua caçada.",
      "lead": "Abra um save de personagem do Bloodborne decifrado para inspecionar inventário, atributos, configurações do personagem, chefes e flags. O editor cria um backup quando um arquivo é aberto; mantenha-o sempre até verificar o resultado no jogo.",
      "stepOneTitle": "Use um save decifrado",
      "stepOneDescription": "Exportações do PlayStation devem ser decifradas antes que o editor possa lê-las.",
      "stepTwoTitle": "Faça edições focadas",
      "stepTwoDescription": "Revise cada alteração e evite usar saves modificados no jogo online.",
      "stepThreeTitle": "Verifique antes de substituir",
      "stepThreeDescription": "Teste o arquivo exportado antes de remover a cópia automática .bak.",
      "guide": "Leia o guia de decifração"
    },
    "operation": {
      "preparing": "Preparando o editor",
      "eyebrow": "Trabalhando com dados de save",
      "title": "Mantenha esta janela aberta, por favor."
    },
    "saveFlow": {
      "unsavedStatus": "Alterações não salvas",
      "loadedStatus": "Save carregado. Um backup foi criado antes da edição.",
      "savedStatus": "Alterações salvas.",
      "discardOpenTitle": "Descartar alterações não salvas?",
      "discardOpenDescription": "Você tem alterações não salvas. Abrir outro save descartará as edições atuais.",
      "discardAndOpen": "Descartar e abrir",
      "keepEditing": "Continuar editando",
      "openTitle": "Abrir save de Bloodborne decifrado",
      "openFailedTitle": "Não foi possível abrir o save",
      "openFailedDescription": "O arquivo selecionado não pôde ser analisado. Escolha um save de personagem de Bloodborne decifrado e tente novamente.",
      "close": "Fechar",
      "saveTitle": "Salvar personagem editado",
      "confirmSaveTitle": "Confirmar salvamento",
      "confirmSaveDescription": "Isto grava as edições atuais no arquivo selecionado. Mantenha o backup automático .bak até você verificar o save no jogo.",
      "saveCompletedTitle": "Salvamento concluído",
      "saveCompletedDescription": "Mantenha sua cópia .bak até que o save editado tenha sido verificado.",
      "saveFailedTitle": "Não foi possível salvar",
      "saveFailedDescription": "O save editado não pôde ser gravado. Verifique o destino e as permissões disponíveis e tente novamente."
    },
    "inventory": {
      "directUpgradeUnavailable": "Este save não possui um registro seguro reutilizável de Gem/Rune. Nenhuma alteração foi feita. Crie um slot compatível no jogo e tente novamente.",
      "itemQuantity": "Quantidade do item:",
      "weaponLevel": "Nível da arma:",
      "setValue": "Definir",
      "edit": "Editar",
      "gems": "Gemas"
    }
  },
  "ru": {
    "home": {
      "eyebrow": "Офлайн-управление персонажем",
      "title": "Редактируйте обдуманно. Сохраните свою охоту.",
      "lead": "Откройте расшифрованный файл сохранения персонажа Bloodborne, чтобы просмотреть инвентарь, характеристики, настройки персонажа, боссов и флаги. Редактор создаёт резервную копию при открытии файла; сохраните её до тех пор, пока не проверите результат в игре.",
      "stepOneTitle": "Используйте расшифрованное сохранение",
      "stepOneDescription": "Экспорт из PlayStation необходимо расшифровать, прежде чем редактор сможет его прочитать.",
      "stepTwoTitle": "Вносите целенаправленные изменения",
      "stepTwoDescription": "Проверяйте каждое изменение и избегайте использования изменённых сохранений в онлайн-игре.",
      "stepThreeTitle": "Проверьте перед заменой",
      "stepThreeDescription": "Протестируйте экспортированный файл перед удалением автоматической копии .bak.",
      "guide": "Прочитайте руководство по расшифровке"
    },
    "operation": {
      "preparing": "Подготовка редактора",
      "eyebrow": "Работа с данными сохранения",
      "title": "Пожалуйста, не закрывайте это окно."
    },
    "saveFlow": {
      "unsavedStatus": "Есть несохранённые изменения",
      "loadedStatus": "Сохранение загружено. Перед редактированием была создана резервная копия.",
      "savedStatus": "Изменения сохранены.",
      "discardOpenTitle": "Отменить несохранённые изменения?",
      "discardOpenDescription": "У вас есть несохранённые изменения. Открытие другого сохранения отменит текущие правки.",
      "discardAndOpen": "Отменить и открыть",
      "keepEditing": "Продолжить правку",
      "openTitle": "Открыть расшифрованное сохранение Bloodborne",
      "openFailedTitle": "Не удалось открыть сохранение",
      "openFailedDescription": "Выбранный файл не удалось распознать. Выберите расшифрованное сохранение персонажа Bloodborne и попробуйте снова.",
      "close": "Закрыть",
      "saveTitle": "Сохранить отредактированного персонажа",
      "confirmSaveTitle": "Подтвердите сохранение",
      "confirmSaveDescription": "Это запишет текущие правки в выбранный файл. Сохраните автоматическую копию .bak до тех пор, пока не проверите сохранение в игре.",
      "saveCompletedTitle": "Сохранение завершено",
      "saveCompletedDescription": "Сохраните вашу копию .bak до тех пор, пока отредактированное сохранение не будет проверено.",
      "saveFailedTitle": "Не удалось сохранить",
      "saveFailedDescription": "Отредактированное сохранение не удалось записать. Проверьте расположение и права доступа, затем попробуйте снова."
    },
    "inventory": {
      "directUpgradeUnavailable": "В этом сохранении нет безопасно повторно используемой записи Gem/Rune. Изменений не внесено. Создайте совместимый слот в игре и попробуйте снова.",
      "itemQuantity": "Количество предмета:",
      "weaponLevel": "Уровень оружия:",
      "setValue": "Установить",
      "edit": "Редактировать",
      "gems": "Гемы"
    }
  },
  "de": {
    "home": {
      "eyebrow": "Offline-Charakterverwaltung",
      "title": "Bearbeite bedacht. Bewahre deine Jagd.",
      "lead": "Öffne ein entschlüsseltes Bloodborne-Charakter‑Save, um Inventar, Attribute, Charaktereinstellungen, Bosse und Flags zu prüfen. Der Editor erstellt beim Öffnen einer Datei eine Sicherung; bewahre diese immer auf, bis du das Ergebnis im Spiel überprüft hast.",
      "stepOneTitle": "Verwende ein entschlüsseltes Save",
      "stepOneDescription": "PlayStation‑Exporte müssen entschlüsselt werden, bevor der Editor sie lesen kann.",
      "stepTwoTitle": "Nimm gezielte Änderungen vor",
      "stepTwoDescription": "Überprüfe jede Änderung und vermeide die Verwendung modifizierter Saves im Online‑Spiel.",
      "stepThreeTitle": "Überprüfe vor dem Ersetzen",
      "stepThreeDescription": "Teste die exportierte Datei, bevor du die automatische .bak‑Kopie entfernst.",
      "guide": "Lies die Entschlüsselungsanleitung"
    },
    "operation": {
      "preparing": "Editor wird vorbereitet",
      "eyebrow": "Arbeiten mit Save‑Daten",
      "title": "Bitte dieses Fenster geöffnet halten."
    },
    "saveFlow": {
      "unsavedStatus": "Ungespeicherte Änderungen",
      "loadedStatus": "Save geladen. Vor der Bearbeitung wurde eine Sicherung erstellt.",
      "savedStatus": "Änderungen gespeichert.",
      "discardOpenTitle": "Ungespeicherte Änderungen verwerfen?",
      "discardOpenDescription": "Du hast ungespeicherte Änderungen. Das Öffnen eines anderen Saves verwirft die aktuellen Änderungen.",
      "discardAndOpen": "Verwerfen und öffnen",
      "keepEditing": "Weiter bearbeiten",
      "openTitle": "Entschlüsseltes Bloodborne‑Save öffnen",
      "openFailedTitle": "Save konnte nicht geöffnet werden",
      "openFailedDescription": "Die ausgewählte Datei konnte nicht geparst werden. Wähle ein entschlüsseltes Bloodborne‑Charaktersave und versuche es erneut.",
      "close": "Schließen",
      "saveTitle": "Bearbeiteten Charakter speichern",
      "confirmSaveTitle": "Speichern bestätigen",
      "confirmSaveDescription": "Dies schreibt die aktuellen Änderungen in die gewählte Datei. Bewahre die automatische .bak‑Sicherung auf, bis du das Save im Spiel geprüft hast.",
      "saveCompletedTitle": "Speichern abgeschlossen",
      "saveCompletedDescription": "Bewahre deine .bak‑Kopie, bis das bearbeitete Save verifiziert wurde.",
      "saveFailedTitle": "Speichern fehlgeschlagen",
      "saveFailedDescription": "Das bearbeitete Save konnte nicht geschrieben werden. Überprüfe Zielort und Berechtigungen und versuche es erneut."
    },
    "inventory": {
      "directUpgradeUnavailable": "Dieses Save enthält keinen sicher wiederverwendbaren Gem/Rune‑Eintrag. Es wurde keine Änderung vorgenommen. Erstelle einen kompatiblen Slot im Spiel und versuche es erneut.",
      "itemQuantity": "Anzahl des Gegenstands:",
      "weaponLevel": "Waffenstufe:",
      "setValue": "Festlegen",
      "edit": "Bearbeiten",
      "gems": "Gems"
    }
  },
  "it": {
    "home": {
      "eyebrow": "Gestione personaggi offline",
      "title": "Modifica deliberatamente. Conserva la tua caccia.",
      "lead": "Apri un salvataggio personaggio di Bloodborne decriptato per ispezionare inventario, attributi, impostazioni del personaggio, boss e flag. L'editor crea un backup quando viene aperto un file; conservalo sempre finché non hai verificato il risultato in gioco.",
      "stepOneTitle": "Usa un salvataggio decriptato",
      "stepOneDescription": "Le esportazioni da PlayStation devono essere decriptate prima che l'editor possa leggerle.",
      "stepTwoTitle": "Effettua modifiche mirate",
      "stepTwoDescription": "Controlla ogni modifica ed evita di usare salvataggi modificati nelle partite online.",
      "stepThreeTitle": "Verifica prima di sostituire",
      "stepThreeDescription": "Testa il file esportato prima di rimuovere la copia automatica .bak.",
      "guide": "Leggi la guida alla decriptazione"
    },
    "operation": {
      "preparing": "Preparazione dell'editor",
      "eyebrow": "Lavorare con i dati di salvataggio",
      "title": "Tieni questa finestra aperta, per favore."
    },
    "saveFlow": {
      "unsavedStatus": "Modifiche non salvate",
      "loadedStatus": "Salvataggio caricato. È stato creato un backup prima della modifica.",
      "savedStatus": "Modifiche salvate.",
      "discardOpenTitle": "Annullare le modifiche non salvate?",
      "discardOpenDescription": "Hai modifiche non salvate. Aprire un altro salvataggio annullerà le modifiche correnti.",
      "discardAndOpen": "Annulla e apri",
      "keepEditing": "Continua a modificare",
      "openTitle": "Apri salvataggio di Bloodborne decriptato",
      "openFailedTitle": "Impossibile aprire il salvataggio",
      "openFailedDescription": "Il file selezionato non può essere analizzato. Scegli un salvataggio personaggio di Bloodborne decriptato e riprova.",
      "close": "Chiudi",
      "saveTitle": "Salva personaggio modificato",
      "confirmSaveTitle": "Conferma salvataggio",
      "confirmSaveDescription": "Questo scrive le modifiche correnti nel file selezionato. Conserva il backup automatico .bak finché non hai verificato il salvataggio in gioco.",
      "saveCompletedTitle": "Salvataggio completato",
      "saveCompletedDescription": "Conserva la tua copia .bak finché il salvataggio modificato non è stato verificato.",
      "saveFailedTitle": "Impossibile salvare",
      "saveFailedDescription": "Il salvataggio modificato non può essere scritto. Controlla destinazione e permessi disponibili, poi riprova."
    },
    "inventory": {
      "directUpgradeUnavailable": "Questo salvataggio non contiene un record sicuro riutilizzabile Gem/Rune. Nessuna modifica è stata apportata. Crea uno slot compatibile nel gioco e riprova.",
      "itemQuantity": "Quantità oggetto:",
      "weaponLevel": "Livello dell'arma:",
      "setValue": "Imposta",
      "edit": "Modifica",
      "gems": "Gemme"
    }
  },
  "nl": {
    "home": {
      "eyebrow": "Offline personagebeheer",
      "title": "Bewerk met beleid. Behoud je jacht.",
      "lead": "Open een ontsleuteld Bloodborne-personagebestand om inventaris, attributen, karakterinstellingen, bazen en flags te bekijken. De editor maakt een back-up wanneer een bestand wordt geopend; bewaar deze altijd totdat je het resultaat in het spel hebt gecontroleerd.",
      "stepOneTitle": "Gebruik een ontsleuteld savebestand",
      "stepOneDescription": "PlayStation‑export moet worden ontsleuteld voordat de editor het kan lezen.",
      "stepTwoTitle": "Voer gerichte bewerkingen uit",
      "stepTwoDescription": "Controleer elke wijziging en vermijd het gebruik van aangepaste saves in online spel.",
      "stepThreeTitle": "Verifieer voordat je vervangt",
      "stepThreeDescription": "Test het geëxporteerde bestand voordat je de automatische .bak‑kopie verwijdert.",
      "guide": "Lees de ontsleutelingsgids"
    },
    "operation": {
      "preparing": "Editor voorbereiden",
      "eyebrow": "Werken met save‑data",
      "title": "Houd dit venster open, alstublieft."
    },
    "saveFlow": {
      "unsavedStatus": "Niet‑opgeslagen wijzigingen",
      "loadedStatus": "Save geladen. Er is een back‑up gemaakt vóór het bewerken.",
      "savedStatus": "Wijzigingen opgeslagen.",
      "discardOpenTitle": "Niet‑opgeslagen wijzigingen negeren?",
      "discardOpenDescription": "Je hebt niet‑opgeslagen wijzigingen. Het openen van een ander savebestand maakt de huidige bewerkingen ongedaan.",
      "discardAndOpen": "Ongedaan maken en openen",
      "keepEditing": "Verder bewerken",
      "openTitle": "Ontsleuteld Bloodborne‑save openen",
      "openFailedTitle": "Kan save niet openen",
      "openFailedDescription": "Het geselecteerde bestand kon niet worden geparseerd. Kies een ontsleuteld Bloodborne‑personagebestand en probeer het opnieuw.",
      "close": "Sluiten",
      "saveTitle": "Bewerk personage opslaan",
      "confirmSaveTitle": "Opslaan bevestigen",
      "confirmSaveDescription": "Dit schrijft de huidige bewerkingen naar het geselecteerde bestand. Bewaar de automatische .bak‑back‑up totdat je het save in het spel hebt gecontroleerd.",
      "saveCompletedTitle": "Opslaan voltooid",
      "saveCompletedDescription": "Bewaar je .bak‑kopie totdat het bewerkte save is geverifieerd.",
      "saveFailedTitle": "Opslaan niet mogelijk",
      "saveFailedDescription": "Het bewerkte save kon niet worden weggeschreven. Controleer de bestemming en beschikbare machtigingen en probeer het opnieuw."
    },
    "inventory": {
      "directUpgradeUnavailable": "Dit savebestand heeft geen veilige herbruikbare Gem/Rune‑record. Er is geen wijziging aangebracht. Maak een compatibele plek in het spel en probeer het opnieuw.",
      "itemQuantity": "Aantal item:",
      "weaponLevel": "Wapenlevel:",
      "setValue": "Instellen",
      "edit": "Bewerken",
      "gems": "Gems"
    }
  },
  "pl": {
    "home": {
      "eyebrow": "Zarządzanie postacią w trybie offline",
      "title": "Edytuj rozważnie. Zachowaj swoje polowanie.",
      "lead": "Otwórz odszyfrowane zapis postaci Bloodborne, aby sprawdzić ekwipunek, atrybuty, ustawienia postaci, bossów i flagi. Edytor tworzy kopię zapasową po otwarciu pliku; zachowaj ją, dopóki nie sprawdzisz wyniku w grze.",
      "stepOneTitle": "Użyj odszyfrowanego zapisu",
      "stepOneDescription": "Eksporty z PlayStation muszą zostać odszyfrowane, zanim edytor będzie mógł je odczytać.",
      "stepTwoTitle": "Wprowadzaj ukierunkowane zmiany",
      "stepTwoDescription": "Sprawdź każdą zmianę i unikaj używania zmodyfikowanych zapisów w trybie online.",
      "stepThreeTitle": "Zweryfikuj przed zastąpieniem",
      "stepThreeDescription": "Przetestuj wyeksportowany plik przed usunięciem automatycznej kopii .bak.",
      "guide": "Przeczytaj poradnik odszyfrowywania"
    },
    "operation": {
      "preparing": "Przygotowywanie edytora",
      "eyebrow": "Praca z danymi zapisu",
      "title": "Proszę, nie zamykaj tego okna."
    },
    "saveFlow": {
      "unsavedStatus": "Niezapisane zmiany",
      "loadedStatus": "Zapis załadowany. Przed edycją utworzono kopię zapasową.",
      "savedStatus": "Zmiany zapisane.",
      "discardOpenTitle": "Odrzucić niezapisane zmiany?",
      "discardOpenDescription": "Masz niezapisane zmiany. Otwarcie innego zapisu odrzuci bieżące edycje.",
      "discardAndOpen": "Odrzuć i otwórz",
      "keepEditing": "Kontynuuj edycję",
      "openTitle": "Otwórz odszyfrowane zapisy Bloodborne",
      "openFailedTitle": "Nie można otworzyć zapisu",
      "openFailedDescription": "Wybrany plik nie mógł zostać przetworzony. Wybierz odszyfrowany zapis postaci Bloodborne i spróbuj ponownie.",
      "close": "Zamknij",
      "saveTitle": "Zapisz edytowaną postać",
      "confirmSaveTitle": "Potwierdź zapis",
      "confirmSaveDescription": "To zapisze bieżące zmiany do wybranego pliku. Zachowaj automatyczną kopię .bak, aż zapis zostanie zweryfikowany w grze.",
      "saveCompletedTitle": "Zapis zakończony",
      "saveCompletedDescription": "Zachowaj kopię .bak, dopóki edytowany zapis nie zostanie zweryfikowany.",
      "saveFailedTitle": "Nie można zapisać",
      "saveFailedDescription": "Nie udało się zapisać edytowanego pliku. Sprawdź miejsce docelowe i uprawnienia, a następnie spróbuj ponownie."
    },
    "inventory": {
      "directUpgradeUnavailable": "Ten zapis nie zawiera bezpiecznego, możliwego do ponownego użycia rekordu Gem/Rune. Nie wprowadzono żadnych zmian. Utwórz kompatybilne gniazdo w grze i spróbuj ponownie.",
      "itemQuantity": "Ilość przedmiotu:",
      "weaponLevel": "Poziom broni:",
      "setValue": "Ustaw",
      "edit": "Edytuj",
      "gems": "Gemy"
    }
  },
  "tr": {
    "home": {
      "eyebrow": "Çevrimdışı karakter yönetimi",
      "title": "Kasıtlı düzenle. Avını koru.",
      "lead": "Şifre çözülmüş bir Bloodborne karakter kaydını açarak envanter, özellikler, karakter ayarları, patronlar ve bayrakları inceleyin. Bir dosya açıldığında editör bir yedekleme oluşturur; oyunda sonucu doğrulayana kadar bunu saklayın.",
      "stepOneTitle": "Şifre çözülmüş bir kayıt kullanın",
      "stepOneDescription": "PlayStation dışa aktarımları, editör tarafından okunmadan önce şifre çözülmelidir.",
      "stepTwoTitle": "Odaklanmış düzenlemeler yapın",
      "stepTwoDescription": "Her değişikliği gözden geçirin ve değiştirilmiş kayıtları çevrimiçi oynarda kullanmaktan kaçının.",
      "stepThreeTitle": "Değiştirmeden önce doğrulayın",
      "stepThreeDescription": "Otomatik .bak kopyasını kaldırmadan önce dışa aktarılan dosyayı test edin.",
      "guide": "Şifre çözme kılavuzunu okuyun"
    },
    "operation": {
      "preparing": "Editör hazırlanıyor",
      "eyebrow": "Kayıt verileriyle çalışma",
      "title": "Lütfen bu pencereyi açık tutun."
    },
    "saveFlow": {
      "unsavedStatus": "Kaydedilmemiş değişiklikler",
      "loadedStatus": "Kayıt yüklendi. Düzenlemeden önce bir yedek oluşturuldu.",
      "savedStatus": "Değişiklikler kaydedildi.",
      "discardOpenTitle": "Kaydedilmemiş değişiklikler iptal edilsin mi?",
      "discardOpenDescription": "Kaydedilmemiş değişiklikleriniz var. Başka bir kayıt açmak mevcut düzenlemeleri iptal edecektir.",
      "discardAndOpen": "İptal et ve aç",
      "keepEditing": "Düzenlemeye devam et",
      "openTitle": "Şifre çözülmüş Bloodborne kaydını aç",
      "openFailedTitle": "Kayıt açılamıyor",
      "openFailedDescription": "Seçilen dosya ayrıştırılamadı. Şifre çözülmüş bir Bloodborne karakter kaydı seçin ve tekrar deneyin.",
      "close": "Kapat",
      "saveTitle": "Düzenlenmiş karakteri kaydet",
      "confirmSaveTitle": "Kaydı onayla",
      "confirmSaveDescription": "Bu, mevcut düzenlemeleri seçili dosyaya yazar. Oyunda doğrulayana kadar otomatik .bak yedeğini saklayın.",
      "saveCompletedTitle": "Kayıt tamamlandı",
      "saveCompletedDescription": "Düzenlenen kayıt doğrulanana kadar .bak yedeğinizi saklayın.",
      "saveFailedTitle": "Kaydedilemedi",
      "saveFailedDescription": "Düzenlenmiş kayıt yazılamadı. Hedef konumu ve izinleri kontrol ettikten sonra tekrar deneyin."
    },
    "inventory": {
      "directUpgradeUnavailable": "Bu kayıtta güvenli, yeniden kullanılabilir bir Gem/Rune kaydı yok. Değişiklik yapılmadı. Oyunda uyumlu bir yuva oluşturun ve tekrar deneyin.",
      "itemQuantity": "Öğe miktarı:",
      "weaponLevel": "Silah seviyesi:",
      "setValue": "Ayarla",
      "edit": "Düzenle",
      "gems": "Taşlar"
    }
  },
  "uk": {
    "home": {
      "eyebrow": "Офлайн керування персонажем",
      "title": "Редагуйте обдумано. Збережіть своє полювання.",
      "lead": "Відкрийте дешифрований файл збереження персонажа Bloodborne, щоб переглянути інвентар, характеристики, налаштування персонажа, босів і прапорці. Редактор створює резервну копію при відкритті файлу; збережіть її, поки не перевірите результат у грі.",
      "stepOneTitle": "Використовуйте дешифрований сейв",
      "stepOneDescription": "Експорти з PlayStation потрібно дешифрувати перед тим, як редактор зможе їх прочитати.",
      "stepTwoTitle": "Вносьте цілеспрямовані правки",
      "stepTwoDescription": "Перевіряйте кожну зміну і уникайте використання змінених сейвів в онлайн‑грі.",
      "stepThreeTitle": "Перевірте перед заміною",
      "stepThreeDescription": "Протестуйте експортований файл перед видаленням автоматичної копії .bak.",
      "guide": "Прочитайте посібник із дешифрування"
    },
    "operation": {
      "preparing": "Підготовка редактора",
      "eyebrow": "Робота з даними збережень",
      "title": "Будь ласка, тримайте це вікно відкритим."
    },
    "saveFlow": {
      "unsavedStatus": "Є незбережені зміни",
      "loadedStatus": "Збереження завантажено. Перед редагуванням створено резервну копію.",
      "savedStatus": "Зміни збережено.",
      "discardOpenTitle": "Відхилити незбережені зміни?",
      "discardOpenDescription": "У вас є незбережені зміни. Відкриття іншого збереження відхилить поточні правки.",
      "discardAndOpen": "Відхилити і відкрити",
      "keepEditing": "Продовжити редагування",
      "openTitle": "Відкрити дешифрований сейв Bloodborne",
      "openFailedTitle": "Не вдалося відкрити сейв",
      "openFailedDescription": "Вибраний файл не вдалося розпізнати. Оберіть дешифрований файл збереження персонажа Bloodborne і спробуйте знову.",
      "close": "Закрити",
      "saveTitle": "Зберегти відредагованого персонажа",
      "confirmSaveTitle": "Підтвердіть збереження",
      "confirmSaveDescription": "Це запише поточні правки у вибраний файл. Збережіть автоматичну копію .bak, поки не перевірите сейв у грі.",
      "saveCompletedTitle": "Збереження завершено",
      "saveCompletedDescription": "Збережіть вашу копію .bak, поки відредагований сейв не буде перевірено.",
      "saveFailedTitle": "Не вдалося зберегти",
      "saveFailedDescription": "Не вдалося записати відредагований файл. Перевірте місце призначення та дозволи, потім спробуйте знову."
    },
    "inventory": {
      "directUpgradeUnavailable": "У цьому сейві немає безпечного повторно використовуваного запису Gem/Rune. Змін не внесено. Створіть сумісний слот у грі та спробуйте ще раз.",
      "itemQuantity": "Кількість предмету:",
      "weaponLevel": "Рівень зброї:",
      "setValue": "Встановити",
      "edit": "Редагувати",
      "gems": "Геми"
    }
  },
  "ja": {
    "home": {
      "eyebrow": "オフラインのキャラクター管理",
      "title": "慎重に編集し、狩りを守る。",
      "lead": "復号化済みのBloodborneキャラクターセーブを開いて、所持品、ステータス、キャラクター設定、ボス、フラグを確認します。ファイルを開くとエディターがバックアップを作成します。ゲーム内で結果を確認するまで必ず保持してください。",
      "stepOneTitle": "復号化されたセーブを使用する",
      "stepOneDescription": "PlayStationからのエクスポートは、エディターで読み取る前に復号化する必要があります。",
      "stepTwoTitle": "的を絞った編集を行う",
      "stepTwoDescription": "各変更を確認し、オンラインプレイで改変したセーブを使用しないでください。",
      "stepThreeTitle": "置き換える前に検証する",
      "stepThreeDescription": "自動生成された .bak コピーを削除する前に、エクスポートしたファイルをテストしてください。",
      "guide": "復号化ガイドを読む"
    },
    "operation": {
      "preparing": "エディターを準備しています",
      "eyebrow": "セーブデータの操作",
      "title": "このウィンドウは開いたままにしてください。"
    },
    "saveFlow": {
      "unsavedStatus": "未保存の変更",
      "loadedStatus": "セーブを読み込みました。編集前にバックアップが作成されました。",
      "savedStatus": "変更を保存しました。",
      "discardOpenTitle": "未保存の変更を破棄しますか？",
      "discardOpenDescription": "未保存の変更があります。別のセーブを開くと、現在の編集内容は破棄されます。",
      "discardAndOpen": "破棄して開く",
      "keepEditing": "編集を続ける",
      "openTitle": "復号化されたBloodborneセーブを開く",
      "openFailedTitle": "セーブを開けません",
      "openFailedDescription": "選択したファイルを解析できませんでした。復号化されたBloodborneのキャラクターセーブを選択して再試行してください。",
      "close": "閉じる",
      "saveTitle": "編集したキャラクターを保存",
      "confirmSaveTitle": "保存を確認",
      "confirmSaveDescription": "これにより現在の編集内容が選択したファイルに書き込まれます。ゲーム内でセーブを確認するまで自動生成された .bak バックアップを保管してください。",
      "saveCompletedTitle": "保存が完了しました",
      "saveCompletedDescription": "編集したセーブが検証されるまで .bak バックアップを保持してください。",
      "saveFailedTitle": "保存できません",
      "saveFailedDescription": "編集したセーブを書き込めませんでした。保存先と権限を確認してから、再度お試しください。"
    },
    "inventory": {
      "directUpgradeUnavailable": "このセーブには安全に再利用できる Gem/Rune の記録がありません。変更は行われませんでした。ゲーム内で互換性のあるスロットを作成してから、再度お試しください。",
      "itemQuantity": "アイテム個数：",
      "weaponLevel": "武器レベル：",
      "setValue": "設定",
      "edit": "編集",
      "gems": "宝石"
    }
  },
  "ko": {
    "home": {
      "eyebrow": "오프라인 캐릭터 관리",
      "title": "신중하게 수정하세요. 당신의 사냥을 지키세요.",
      "lead": "복호화된 Bloodborne 캐릭터 저장 파일을 열어 인벤토리, 능력치, 캐릭터 설정, 보스 및 플래그를 검사하세요. 파일을 열면 편집 전에 에디터가 백업을 생성합니다. 게임에서 결과를 확인할 때까지 반드시 보관하세요.",
      "stepOneTitle": "복호화된 세이브 사용",
      "stepOneDescription": "PlayStation에서 내보낸 파일은 에디터가 읽기 전에 복호화되어야 합니다.",
      "stepTwoTitle": "집중 편집하기",
      "stepTwoDescription": "각 변경사항을 검토하고, 수정된 세이브를 온라인 플레이에서 사용하지 마세요.",
      "stepThreeTitle": "교체 전에 검증하기",
      "stepThreeDescription": "자동 생성된 .bak 복사본을 제거하기 전에 내보낸 파일을 테스트하세요.",
      "guide": "복호화 안내서 읽기"
    },
    "operation": {
      "preparing": "에디터 준비 중",
      "eyebrow": "세이브 데이터 작업",
      "title": "이 창을 열어 둔 상태로 유지하세요."
    },
    "saveFlow": {
      "unsavedStatus": "저장되지 않은 변경사항",
      "loadedStatus": "세이브 로드됨. 편집 전에 백업이 생성되었습니다.",
      "savedStatus": "변경사항 저장됨.",
      "discardOpenTitle": "저장되지 않은 변경사항을 버리시겠어요?",
      "discardOpenDescription": "저장되지 않은 변경사항이 있습니다. 다른 세이브를 열면 현재 편집 내용이 버려집니다.",
      "discardAndOpen": "버리고 열기",
      "keepEditing": "편집 계속",
      "openTitle": "복호화된 Bloodborne 세이브 열기",
      "openFailedTitle": "세이브를 열 수 없음",
      "openFailedDescription": "선택한 파일을 분석할 수 없습니다. 복호화된 Bloodborne 캐릭터 세이브를 선택하고 다시 시도하세요.",
      "close": "닫기",
      "saveTitle": "편집한 캐릭터 저장",
      "confirmSaveTitle": "저장 확인",
      "confirmSaveDescription": "이 작업은 현재 편집 내용을 선택한 파일에 기록합니다. 게임 내에서 확인할 때까지 자동 .bak 백업을 보관하세요.",
      "saveCompletedTitle": "저장 완료",
      "saveCompletedDescription": "편집한 세이브가 검증될 때까지 .bak 백업을 보관하세요.",
      "saveFailedTitle": "저장할 수 없음",
      "saveFailedDescription": "편집된 세이브를 쓸 수 없습니다. 대상 위치와 권한을 확인한 후 다시 시도하세요."
    },
    "inventory": {
      "directUpgradeUnavailable": "이 세이브에는 안전하게 재사용할 수 있는 Gem/Rune 기록이 없습니다. 변경 사항이 적용되지 않았습니다. 게임 내에서 호환 가능한 슬롯을 생성한 후 다시 시도하세요.",
      "itemQuantity": "아이템 수량:",
      "weaponLevel": "무기 레벨:",
      "setValue": "설정",
      "edit": "편집",
      "gems": "보석"
    }
  },
  "zh-CN": {
    "home": {
      "eyebrow": "离线角色管理",
      "title": "谨慎编辑。保全你的狩猎。",
      "lead": "打开已解密的 Bloodborne 角色存档以查看物品栏、属性、角色设置、Boss 与标记。编辑器在打开文件时会创建备份；在游戏中确认结果之前，请始终保留该备份。",
      "stepOneTitle": "使用已解密的存档",
      "stepOneDescription": "来自 PlayStation 的导出文件必须先解密，编辑器才能读取。",
      "stepTwoTitle": "进行有针对性的修改",
      "stepTwoDescription": "检查每一项更改，并避免在联机游戏中使用已修改的存档。",
      "stepThreeTitle": "替换前请验证",
      "stepThreeDescription": "在删除自动生成的 .bak 备份前，请先测试导出的文件。",
      "guide": "阅读解密指南"
    },
    "operation": {
      "preparing": "正在准备编辑器",
      "eyebrow": "处理存档数据",
      "title": "请保持此窗口打开。"
    },
    "saveFlow": {
      "unsavedStatus": "有未保存的更改",
      "loadedStatus": "存档已加载。编辑前已创建备份。",
      "savedStatus": "更改已保存。",
      "discardOpenTitle": "要放弃未保存的更改吗？",
      "discardOpenDescription": "你有未保存的更改。打开另一个存档将放弃当前的编辑内容。",
      "discardAndOpen": "放弃并打开",
      "keepEditing": "继续编辑",
      "openTitle": "打开已解密的 Bloodborne 存档",
      "openFailedTitle": "无法打开存档",
      "openFailedDescription": "无法解析所选文件。请选择已解密的 Bloodborne 角色存档并重试。",
      "close": "关闭",
      "saveTitle": "保存已编辑的角色",
      "confirmSaveTitle": "确认保存",
      "confirmSaveDescription": "此操作会将当前编辑写入所选文件。请在游戏中验证存档之前保留自动生成的 .bak 备份。",
      "saveCompletedTitle": "保存完成",
      "saveCompletedDescription": "在已编辑的存档被验证之前，请保留你的 .bak 备份。",
      "saveFailedTitle": "无法保存",
      "saveFailedDescription": "无法写入已编辑的存档。检查目标位置和权限后重试。"
    },
    "inventory": {
      "directUpgradeUnavailable": "该存档没有安全可重用的 Gem/Rune 记录。未做任何更改。请在游戏中创建兼容的槽位后再试。",
      "itemQuantity": "物品数量：",
      "weaponLevel": "武器等级：",
      "setValue": "设置",
      "edit": "编辑",
      "gems": "宝石"
    }
  },
  "sv": {
    "home": {
      "eyebrow": "Offline-teckenhantering",
      "title": "Redigera med eftertanke. Bevara din jakt.",
      "lead": "Öppna ett dekrypterat Bloodborne‑saves för att granska inventarier, attribut, karaktärsinställningar, bossar och flaggor. Editorn skapar en backup när en fil öppnas; behåll den alltid tills du kontrollerat resultatet i spelet.",
      "stepOneTitle": "Använd ett dekrypterat save",
      "stepOneDescription": "PlayStation‑exporter måste dekrypteras innan editorn kan läsa dem.",
      "stepTwoTitle": "Gör fokuserade ändringar",
      "stepTwoDescription": "Granska varje ändring och undvik att använda modifierade saves i onlinespel.",
      "stepThreeTitle": "Verifiera innan du ersätter",
      "stepThreeDescription": "Testa den exporterade filen innan du tar bort den automatiska .bak‑kopian.",
      "guide": "Läs dekrypteringsguiden"
    },
    "operation": {
      "preparing": "Förbereder editorn",
      "eyebrow": "Arbete med savedata",
      "title": "Håll det här fönstret öppet, tack."
    },
    "saveFlow": {
      "unsavedStatus": "Olagrade ändringar",
      "loadedStatus": "Save laddat. En backup skapades innan redigering.",
      "savedStatus": "Ändringar sparade.",
      "discardOpenTitle": "Kasta osparade ändringar?",
      "discardOpenDescription": "Du har osparade ändringar. Att öppna ett annat save kommer att kasta de nuvarande ändringarna.",
      "discardAndOpen": "Kasta och öppna",
      "keepEditing": "Fortsätt redigera",
      "openTitle": "Öppna dekrypterat Bloodborne‑save",
      "openFailedTitle": "Kunde inte öppna save",
      "openFailedDescription": "Den valda filen kunde inte tolkas. Välj ett dekrypterat Bloodborne‑saves och försök igen.",
      "close": "Stäng",
      "saveTitle": "Spara redigerad karaktär",
      "confirmSaveTitle": "Bekräfta sparande",
      "confirmSaveDescription": "Detta skriver de aktuella ändringarna till den valda filen. Behåll den automatiska .bak‑backupen tills du verifierat saven i spelet.",
      "saveCompletedTitle": "Sparat",
      "saveCompletedDescription": "Behåll din .bak‑kopia tills det redigerade savet har verifierats.",
      "saveFailedTitle": "Kunde inte spara",
      "saveFailedDescription": "Det redigerade savet kunde inte skrivas. Kontrollera destination och behörigheter och försök igen."
    },
    "inventory": {
      "directUpgradeUnavailable": "Detta save har ingen säker återanvändbar Gem/Rune‑post. Ingen ändring gjordes. Skapa en kompatibel plats i spelet och försök igen.",
      "itemQuantity": "Antal föremål:",
      "weaponLevel": "Vapennivå:",
      "setValue": "Ange",
      "edit": "Redigera",
      "gems": "Gems"
    }
  },
  "cs": {
    "home": {
      "eyebrow": "Správa postav offline",
      "title": "Upravujte uvážlivě. Zachovejte svůj lov.",
      "lead": "Otevřete dešifrovaný save postavy Bloodborne, abyste zkontrolovali inventář, atributy, nastavení postavy, bossy a příznaky. Editor při otevření souboru vytvoří zálohu; vždy ji ponechte, dokud nezkontrolujete výsledek ve hře.",
      "stepOneTitle": "Použijte dešifrované uložení",
      "stepOneDescription": "Exporty z PlayStation musí být dešifrovány, než je editor dokáže přečíst.",
      "stepTwoTitle": "Provádějte cílené úpravy",
      "stepTwoDescription": "Zkontrolujte každou změnu a vyhněte se používání upravených saveů v online hře.",
      "stepThreeTitle": "Ověřte před nahrazením",
      "stepThreeDescription": "Otestujte exportovaný soubor před odstraněním automatické kopie .bak.",
      "guide": "Přečtěte si průvodce dešifrováním"
    },
    "operation": {
      "preparing": "Příprava editoru",
      "eyebrow": "Práce s daty uložené hry",
      "title": "Toto okno prosím nechte otevřené."
    },
    "saveFlow": {
      "unsavedStatus": "Neuložené změny",
      "loadedStatus": "Save načteno. Před úpravou byla vytvořena záloha.",
      "savedStatus": "Změny uloženy.",
      "discardOpenTitle": "Zrušit neuložené změny?",
      "discardOpenDescription": "Máte neuložené změny. Otevření jiného save zruší aktuální úpravy.",
      "discardAndOpen": "Zrušit a otevřít",
      "keepEditing": "Pokračovat v úpravách",
      "openTitle": "Otevřít dešifrované save Bloodborne",
      "openFailedTitle": "Nelze otevřít save",
      "openFailedDescription": "Vybraný soubor nelze zpracovat. Vyberte dešifrované uložené postavy Bloodborne a zkuste to znovu.",
      "close": "Zavřít",
      "saveTitle": "Uložit upravenou postavu",
      "confirmSaveTitle": "Potvrdit uložení",
      "confirmSaveDescription": "Toto zapíše aktuální úpravy do vybraného souboru. Uchovejte automatickou zálohu .bak, dokud neověříte save ve hře.",
      "saveCompletedTitle": "Uloženo",
      "saveCompletedDescription": "Uchovejte kopii .bak, dokud upravené uložení nebude ověřeno.",
      "saveFailedTitle": "Uložení se nezdařilo",
      "saveFailedDescription": "Upravený soubor nelze zapsat. Zkontrolujte cílové umístění a oprávnění, poté to zkuste znovu."
    },
    "inventory": {
      "directUpgradeUnavailable": "Toto uložené hře postavy nemá bezpečný znovupoužitelný záznam Gem/Rune. Nebyla provedena žádná změna. Vytvořte kompatibilní slot ve hře a zkuste to znovu.",
      "itemQuantity": "Počet položek:",
      "weaponLevel": "Úroveň zbraně:",
      "setValue": "Nastavit",
      "edit": "Upravit",
      "gems": "Klenoty"
    }
  },
  "ro": {
    "home": {
      "eyebrow": "Gestionare personaje offline",
      "title": "Editează în mod deliberat. Păstrează-ți vânătoarea.",
      "lead": "Deschide un fișier de salvare al unui personaj Bloodborne decriptat pentru a inspecta inventarul, atributele, setările personajului, boss‑ii și flag‑urile. Editorul creează un backup când se deschide un fișier; păstrează‑l întotdeauna până când ai verificat rezultatul în joc.",
      "stepOneTitle": "Folosește un save decriptat",
      "stepOneDescription": "Exporturile de pe PlayStation trebuie decriptate înainte ca editorul să le poată citi.",
      "stepTwoTitle": "Fă modificări concentrate",
      "stepTwoDescription": "Revizuiește fiecare schimbare și evită folosirea fișierelor modificate în jocurile online.",
      "stepThreeTitle": "Verifică înainte de a înlocui",
      "stepThreeDescription": "Testează fișierul exportat înainte de a elimina copia automată .bak.",
      "guide": "Citește ghidul de decriptare"
    },
    "operation": {
      "preparing": "Se pregătește editorul",
      "eyebrow": "Lucru cu datele de salvare",
      "title": "Vă rugăm să păstrați această fereastră deschisă."
    },
    "saveFlow": {
      "unsavedStatus": "Modificări nesalvate",
      "loadedStatus": "Salvarea încărcată. A fost creat un backup înainte de editare.",
      "savedStatus": "Modificări salvate.",
      "discardOpenTitle": "Renunți la modificările nesalvate?",
      "discardOpenDescription": "Ai modificări nesalvate. Deschiderea altei salvări va renunța la editările curente.",
      "discardAndOpen": "Renunță și deschide",
      "keepEditing": "Continuă editarea",
      "openTitle": "Deschide save-ul Bloodborne decriptat",
      "openFailedTitle": "Nu s-a putut deschide save-ul",
      "openFailedDescription": "Fișierul selectat nu a putut fi analizat. Alege un save de personaj Bloodborne decriptat și încearcă din nou.",
      "close": "Închide",
      "saveTitle": "Salvează personajul editat",
      "confirmSaveTitle": "Confirmă salvarea",
      "confirmSaveDescription": "Aceasta scrie editările curente în fișierul selectat. Păstrează backup‑ul automat .bak până când verifici salvarea în joc.",
      "saveCompletedTitle": "Salvare finalizată",
      "saveCompletedDescription": "Păstrează copia .bak până când salvarea editată a fost verificată.",
      "saveFailedTitle": "Nu se poate salva",
      "saveFailedDescription": "Salvarea editată nu a putut fi scrisă. Verifică destinația și permisiunile disponibile, apoi încearcă din nou."
    },
    "inventory": {
      "directUpgradeUnavailable": "Acest save nu are un record sigur reutilizabil Gem/Rune. Nu s‑a efectuat nicio modificare. Creează un slot compatibil în joc și încearcă din nou.",
      "itemQuantity": "Cantitate obiect:",
      "weaponLevel": "Nivel armă:",
      "setValue": "Setează",
      "edit": "Editează",
      "gems": "Gems"
    }
  },
  "el": {
    "home": {
      "eyebrow": "Διαχείριση χαρακτήρων εκτός σύνδεσης",
      "title": "Επεξεργαστείτε σκόπιμα. Διατηρήστε το κυνήγι σας.",
      "lead": "Ανοίξτε ένα αποκρυπτογραφημένο αρχείο αποθήκευσης χαρακτήρα Bloodborne για να ελέγξετε το απόθεμα, τις ιδιότητες, τις ρυθμίσεις χαρακτήρα, τους αφεντικά και τις σημαίες. Ο επεξεργαστής δημιουργεί αντίγραφο ασφαλείας όταν ανοίγει ένα αρχείο· διατηρήστε το έως ότου ελέγξετε το αποτέλεσμα στο παιχνίδι.",
      "stepOneTitle": "Χρησιμοποιήστε ένα αποκρυπτογραφημένο αρχείο αποθήκευσης",
      "stepOneDescription": "Οι εξαγωγές από PlayStation πρέπει να αποκρυπτογραφηθούν πριν ο επεξεργαστής μπορέσει να τις διαβάσει.",
      "stepTwoTitle": "Κάντε στοχευμένες επεξεργασίες",
      "stepTwoDescription": "Ελέγξτε κάθε αλλαγή και αποφύγετε τη χρήση τροποποιημένων αρχείων αποθήκευσης στο online παιχνίδι.",
      "stepThreeTitle": "Επαληθεύστε πριν αντικαταστήσετε",
      "stepThreeDescription": "Δοκιμάστε το εξαγόμενο αρχείο πριν αφαιρέσετε το αυτόματο αντίγραφο .bak.",
      "guide": "Διαβάστε τον οδηγό αποκρυπτογράφησης"
    },
    "operation": {
      "preparing": "Ετοιμασία του επεξεργαστή",
      "eyebrow": "Εργασία με δεδομένα αποθήκευσης",
      "title": "Παρακαλώ κρατήστε αυτό το παράθυρο ανοιχτό."
    },
    "saveFlow": {
      "unsavedStatus": "Μη αποθηκευμένες αλλαγές",
      "loadedStatus": "Το αρχείο φορτώθηκε. Δημιουργήθηκε αντίγραφο ασφαλείας πριν την επεξεργασία.",
      "savedStatus": "Οι αλλαγές αποθηκεύτηκαν.",
      "discardOpenTitle": "Απόρριψη μη αποθηκευμένων αλλαγών;",
      "discardOpenDescription": "Έχετε μη αποθηκευμένες αλλαγές. Το άνοιγμα άλλου αρχείου θα απορρίψει τις τρέχουσες επεξεργασίες.",
      "discardAndOpen": "Απόρριψη και άνοιγμα",
      "keepEditing": "Συνέχισε την επεξεργασία",
      "openTitle": "Άνοιγμα αποκρυπτογραφημένου αρχείου Bloodborne",
      "openFailedTitle": "Αδυναμία ανοίγματος αρχείου",
      "openFailedDescription": "Το επιλεγμένο αρχείο δεν μπόρεσε να αναλυθεί. Επιλέξτε ένα αποκρυπτογραφημένο αρχείο χαρακτήρα Bloodborne και δοκιμάστε ξανά.",
      "close": "Κλείσιμο",
      "saveTitle": "Αποθήκευση επεξεργασμένου χαρακτήρα",
      "confirmSaveTitle": "Επιβεβαίωση αποθήκευσης",
      "confirmSaveDescription": "Αυτό θα γράψει τις τρέχουσες επεξεργασίες στο επιλεγμένο αρχείο. Κρατήστε το αυτόματο αντίγραφο .bak μέχρι να επαληθεύσετε το αρχείο στο παιχνίδι.",
      "saveCompletedTitle": "Η αποθήκευση ολοκληρώθηκε",
      "saveCompletedDescription": "Κρατήστε το αντίγραφό .bak σας μέχρι το επεξεργασμένο αρχείο να επαληθευτεί.",
      "saveFailedTitle": "Αδύνατη η αποθήκευση",
      "saveFailedDescription": "Το επεξεργασμένο αρχείο δεν μπόρεσε να γραφτεί. Ελέγξτε τον προορισμό και τα διαθέσιμα δικαιώματα και δοκιμάστε ξανά."
    },
    "inventory": {
      "directUpgradeUnavailable": "Αυτό το αρχείο αποθήκευσης δεν περιέχει ασφαλές επαναχρησιμοποιήσιμο αρχείο Gem/Rune. Δεν έγινε καμία αλλαγή. Δημιουργήστε μια συμβατή θέση (slot) στο παιχνίδι και δοκιμάστε ξανά.",
      "itemQuantity": "Ποσότητα αντικειμένου:",
      "weaponLevel": "Επίπεδο όπλου:",
      "setValue": "Ορισμός",
      "edit": "Επεξεργασία",
      "gems": "Gems"
    }
  },
  "id": {
    "home": {
      "eyebrow": "Manajemen karakter offline",
      "title": "Sunting dengan sengaja. Pertahankan perburuanmu.",
      "lead": "Buka save karakter Bloodborne yang sudah didekripsi untuk memeriksa inventaris, atribut, pengaturan karakter, bos, dan flag. Editor membuat cadangan saat file dibuka; selalu simpan hingga kamu memeriksa hasilnya di dalam game.",
      "stepOneTitle": "Gunakan save yang sudah didekripsi",
      "stepOneDescription": "Ekspor dari PlayStation harus didekripsi sebelum editor dapat membacanya.",
      "stepTwoTitle": "Lakukan suntingan terfokus",
      "stepTwoDescription": "Tinjau setiap perubahan dan hindari menggunakan save yang dimodifikasi dalam permainan online.",
      "stepThreeTitle": "Verifikasi sebelum mengganti",
      "stepThreeDescription": "Uji file yang diekspor sebelum menghapus salinan otomatis .bak.",
      "guide": "Baca panduan dekripsi"
    },
    "operation": {
      "preparing": "Mempersiapkan editor",
      "eyebrow": "Bekerja dengan data save",
      "title": "Harap biarkan jendela ini terbuka."
    },
    "saveFlow": {
      "unsavedStatus": "Perubahan belum disimpan",
      "loadedStatus": "Save dimuat. Cadangan dibuat sebelum pengeditan.",
      "savedStatus": "Perubahan tersimpan.",
      "discardOpenTitle": "Buang perubahan yang belum disimpan?",
      "discardOpenDescription": "Kamu memiliki perubahan yang belum disimpan. Membuka save lain akan membuang pengeditan saat ini.",
      "discardAndOpen": "Buang dan buka",
      "keepEditing": "Lanjutkan menyunting",
      "openTitle": "Buka save Bloodborne yang telah didekripsi",
      "openFailedTitle": "Tidak dapat membuka save",
      "openFailedDescription": "File yang dipilih tidak dapat diparsing. Pilih save karakter Bloodborne yang telah didekripsi dan coba lagi.",
      "close": "Tutup",
      "saveTitle": "Simpan karakter yang diedit",
      "confirmSaveTitle": "Konfirmasi simpan",
      "confirmSaveDescription": "Ini akan menulis pengeditan saat ini ke file yang dipilih. Simpan cadangan otomatis .bak sampai kamu memverifikasi save di dalam game.",
      "saveCompletedTitle": "Simpan selesai",
      "saveCompletedDescription": "Simpan salinan .bak sampai save yang diedit telah diverifikasi.",
      "saveFailedTitle": "Tidak dapat menyimpan",
      "saveFailedDescription": "Save yang diedit tidak dapat ditulis. Periksa lokasi tujuan dan izin yang tersedia, lalu coba lagi."
    },
    "inventory": {
      "directUpgradeUnavailable": "Save ini tidak memiliki catatan Gem/Rune yang aman dan dapat digunakan kembali. Tidak ada perubahan dibuat. Buat slot yang kompatibel di dalam game, lalu coba lagi.",
      "itemQuantity": "Jumlah item:",
      "weaponLevel": "Level senjata:",
      "setValue": "Atur",
      "edit": "Sunting",
      "gems": "Permata"
    }
  }
};

Object.entries(commonUiOverrides).forEach(([language, copy]) => {
  resources[language] = {
    ...(resources[language] ?? {}),
    home: copy.home,
    operation: copy.operation,
    saveFlow: copy.saveFlow,
    inventory: { ...en.inventory, ...(resources[language]?.inventory ?? {}), ...copy.inventory },
    update: { ...en.update, ...(resources[language]?.update ?? {}) },
    characterForm: { ...en.characterForm, ...(resources[language]?.characterForm ?? {}) },
    bosses: { ...en.bosses, ...(resources[language]?.bosses ?? {}) },
  };
});

const flagOverrides = {
  en: {
    card: {
      confirm: "Apply this known save flag? A backup is kept before saving.",
      applied: "Flag applied to the in-memory save. Select Save changes to write the file.",
      applyFailed: "Unable to apply this flag: {{error}}",
      whatChanges: "What changes:",
      careful: "Careful:",
      bytePattern: "Validated byte pattern:",
      hideDetails: "Hide details",
      showDetails: "What does this do?",
      applying: "Applying…",
      apply: "Apply",
    },
    entries: {
      restoreMaria: { label: "Restore Lady Maria dialogue", category: "Narrative restoration", info: "Restores a small set of dialogue lines before the Lady Maria encounter.", impact: "This changes the dialogue state only; it does not grant an item, level or boss reward.", warning: "Use on a copied save first if you are currently in the Astral Clocktower area." },
      dollLullaby: { label: "Enable the Doll’s legacy lullaby", category: "Legacy presentation", info: "Re-enables the Doll’s lullaby behaviour associated with the original 1.0 release.", impact: "This restores a legacy presentation state. It does not alter attributes, inventory or quest rewards.", warning: "The behaviour is version-sensitive; keep the backup until you have loaded the character successfully." },
      bloodAddled: { label: "Enable Blood-addled co-op behaviour", category: "Multiplayer behaviour", info: "Enables the Blood-addled interaction associated with co-op players using the Hunter rune.", impact: "This changes multiplayer hostility behaviour while the relevant rune conditions are met.", warning: "Use this only offline or with consenting players. It can create confusing hostile co-op behaviour." },
    },
  },
  fr: {
    card: {
      confirm: "Appliquer ce flag de sauvegarde connu ? Une copie de sauvegarde est conservée avant l’enregistrement.",
      applied: "Le flag a été appliqué à la sauvegarde en mémoire. Sélectionnez Enregistrer les modifications pour écrire le fichier.",
      applyFailed: "Impossible d’appliquer ce flag : {{error}}",
      whatChanges: "Modifications :",
      careful: "Attention :",
      bytePattern: "Modèle d’octets validé :",
      hideDetails: "Masquer les détails",
      showDetails: "À quoi cela sert ?",
      applying: "Application…",
      apply: "Appliquer",
    },
    entries: {
      restoreMaria: { label: "Restaurer les dialogues de Lady Maria", category: "Restauration narrative", info: "Restaure un petit ensemble de lignes de dialogue avant la rencontre avec Lady Maria.", impact: "Modifie uniquement l’état des dialogues ; aucun objet, niveau ou gain de boss n’est accordé.", warning: "Utilisez d’abord une copie de sauvegarde si vous êtes actuellement dans la zone de la Tour de l’Horloge Astrale." },
      dollLullaby: { label: "Activer la berceuse historique de la Poupée", category: "Présentation historique", info: "Réactive le comportement de berceuse de la Poupée associé à la version originale 1.0.", impact: "Restaure un état de présentation historique. Les attributs, l’inventaire et les récompenses de quête ne sont pas modifiés.", warning: "Le comportement dépend de la version ; conservez la copie de sauvegarde jusqu’au chargement réussi du personnage." },
      bloodAddled: { label: "Activer le comportement coopératif de sang vicié", category: "Comportement multijoueur", info: "Active l’interaction de sang vicié associée aux joueurs coopératifs utilisant la rune Chasseur.", impact: "Modifie le comportement d’hostilité en multijoueur tant que les conditions de rune concernées sont remplies.", warning: "Utilisez-le uniquement hors ligne ou avec des joueurs consentants. Ce flag peut créer un comportement coopératif hostile déroutant." },
    },
  },
};

const v021FlagCardOverrides = {
  "da": {
    "confirm": "Anvend dette kendte gemme-flag? Der oprettes en sikkerhedskopi før gemning.",
    "applied": "Flag anvendt på den midlertidige gemning. Vælg Gem ændringer for at skrive filen.",
    "applyFailed": "Kunne ikke anvende dette flag: {{error}}",
    "whatChanges": "Hvad ændres:",
    "careful": "Vær forsigtig:",
    "bytePattern": "Valideret byte-mønster:",
    "hideDetails": "Skjul detaljer",
    "showDetails": "Hvad gør dette?",
    "applying": "Anvender…",
    "apply": "Anvend"
  },
  "fi": {
    "confirm": "Käytetäänkö tätä tunnettua tallennuslipuketta? Varmuuskopio tehdään ennen tallennusta.",
    "applied": "Lipuke on otettu käyttöön muistissa olevassa tallennuksessa. Valitse Tallenna muutokset kirjoittaaksesi tiedoston.",
    "applyFailed": "Lippua ei voitu käyttää: {{error}}",
    "whatChanges": "Mitä muuttuu:",
    "careful": "Varoitus:",
    "bytePattern": "Vahvistettu tavumalli:",
    "hideDetails": "Piilota tiedot",
    "showDetails": "Mitä tämä tekee?",
    "applying": "Käytetään…",
    "apply": "Käytä"
  },
  "hu": {
    "confirm": "Alkalmazza ezt az ismert mentési jelzőt? Mentés előtt biztonsági másolat készül.",
    "applied": "A jelző alkalmazva a memóriabeli mentésre. A fájl írásához válassza a Változtatások mentése lehetőséget.",
    "applyFailed": "Nem sikerült alkalmazni a jelzőt: {{error}}",
    "whatChanges": "Mi változik:",
    "careful": "Figyelem:",
    "bytePattern": "Ellenőrzött bájtminta:",
    "hideDetails": "Részletek elrejtése",
    "showDetails": "Mit csinál ez?",
    "applying": "Alkalmazás…",
    "apply": "Alkalmaz"
  },
  "nb": {
    "confirm": "Bruk dette kjente lagringsflagget? En sikkerhetskopi tas før lagring.",
    "applied": "Flagget er brukt på den midlertidige lagringen. Velg Lagre endringer for å skrive filen.",
    "applyFailed": "Kunne ikke bruke dette flagget: {{error}}",
    "whatChanges": "Hva endres:",
    "careful": "Forsiktig:",
    "bytePattern": "Validert byte-mønster:",
    "hideDetails": "Skjul detaljer",
    "showDetails": "Hva gjør dette?",
    "applying": "Påfører…",
    "apply": "Bruk"
  }
};

Object.entries(v021FlagCardOverrides).forEach(([language, card]) => {
  const current = flagOverrides[language] ?? {};
  flagOverrides[language] = {
    ...current,
    card: { ...(current.card ?? {}), ...card },
  };
});

const v021FlagEntryOverrides = {
  "es": {
    "restoreMaria": {
      "label": "Restaurar diálogo de Lady Maria",
      "category": "Restauración narrativa",
      "info": "Restaura un pequeño conjunto de líneas de diálogo antes del encuentro con Lady Maria.",
      "impact": "Esto solo cambia el estado del diálogo; no otorga objetos, niveles ni recompensas de jefe.",
      "warning": "Úsalo primero en una copia de la partida si actualmente estás en el área Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Habilitar la nana heredada de la Doll",
      "category": "Presentación heredada",
      "info": "Rehabilita el comportamiento de la nana de la Doll asociado con la versión original 1.0.",
      "impact": "Esto restaura un estado de presentación heredado. No altera atributos, inventario ni recompensas de misiones.",
      "warning": "El comportamiento es sensible a la versión; conserva la copia de seguridad hasta que hayas cargado el personaje con éxito."
    },
    "bloodAddled": {
      "label": "Habilitar comportamiento cooperativo Blood-addled",
      "category": "Comportamiento multijugador",
      "info": "Habilita la interacción Blood-addled asociada con jugadores cooperativos que usan la Hunter rune.",
      "impact": "Esto cambia el comportamiento hostil multijugador mientras se cumplan las condiciones de la runa correspondiente.",
      "warning": "Usa esto solo sin conexión o con jugadores que consientan. Puede crear comportamiento cooperativo hostil y confuso."
    }
  },
  "pt-PT": {
    "restoreMaria": {
      "label": "Restaurar diálogo de Lady Maria",
      "category": "Restauração narrativa",
      "info": "Restaura um conjunto pequeno de linhas de diálogo antes do encontro com Lady Maria.",
      "impact": "Isto altera apenas o estado do diálogo; não concede item, nível ou recompensa de chefe.",
      "warning": "Use primeiro numa cópia do ficheiro de gravação se estiver atualmente na área Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Ativar a canção de embalar herdada da Doll",
      "category": "Apresentação herdada",
      "info": "Reativa o comportamento da canção de embalar da Doll associado ao lançamento original 1.0.",
      "impact": "Isto restaura um estado de apresentação legado. Não altera atributos, inventário ou recompensas de missão.",
      "warning": "O comportamento é sensível à versão; mantenha o backup até ter carregado a personagem com sucesso."
    },
    "bloodAddled": {
      "label": "Ativar comportamento cooperativo Blood-addled",
      "category": "Comportamento multijogador",
      "info": "Ativa a interação Blood-addled associada a jogadores cooperativos que usam a Hunter rune.",
      "impact": "Isto altera o comportamento hostil multijogador enquanto as condições da runa relevante forem satisfeitas.",
      "warning": "Use apenas offline ou com jogadores que consintam. Pode criar comportamentos cooperativos hostis e confusos."
    }
  },
  "pt-BR": {
    "restoreMaria": {
      "label": "Restaurar diálogo de Lady Maria",
      "category": "Restauração narrativa",
      "info": "Restaura um pequeno conjunto de falas antes do encontro com Lady Maria.",
      "impact": "Isso altera apenas o estado do diálogo; não concede item, nível ou recompensa de chefe.",
      "warning": "Use primeiro em uma cópia do arquivo de salvamento se você estiver atualmente na área Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Ativar a canção de ninar legada da Doll",
      "category": "Apresentação legada",
      "info": "Reativa o comportamento da canção de ninar da Doll associado ao lançamento original 1.0.",
      "impact": "Isso restaura um estado de apresentação legada. Não altera atributos, inventário ou recompensas de missão.",
      "warning": "O comportamento é sensível à versão; mantenha o backup até carregar o personagem com sucesso."
    },
    "bloodAddled": {
      "label": "Ativar comportamento cooperativo Blood-addled",
      "category": "Comportamento multijogador",
      "info": "Ativa a interação Blood-addled associada a jogadores cooperativos que usam a Hunter rune.",
      "impact": "Isso altera o comportamento hostil no multijogador enquanto as condições da runa relevante forem atendidas.",
      "warning": "Use isto apenas offline ou com jogadores que consintam. Pode gerar comportamento cooperativo hostil e confuso."
    }
  },
  "ru": {
    "restoreMaria": {
      "label": "Восстановить диалоги Lady Maria",
      "category": "Восстановление повествования",
      "info": "Восстанавливает небольшой набор строк диалога перед встречей с Lady Maria.",
      "impact": "Это изменяет только состояние диалога; не выдаёт предмет, уровень или награду за босса.",
      "warning": "Сначала применяйте к копии сохранения, если вы сейчас находитесь в районе Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Включить наследственную колыбельную Doll",
      "category": "Наследственная презентация",
      "info": "Повторно включает поведение колыбельной Doll, связанное с оригинальным релизом 1.0.",
      "impact": "Это восстанавливает наследственное состояние презентации. Не изменяет характеристики, инвентарь или награды за квесты.",
      "warning": "Поведение зависит от версии; сохраните резервную копию, пока не загрузите персонажа успешно."
    },
    "bloodAddled": {
      "label": "Включить кооперативное поведение Blood-addled",
      "category": "Поведение мультиплеера",
      "info": "Включает взаимодействие Blood-addled, связанное с кооперативными игроками, использующими Hunter rune.",
      "impact": "Это изменяет поведение враждебности в мультиплеере, пока выполняются условия соответствующей руны.",
      "warning": "Используйте только офлайн или с согласными игроками. Это может создать запутанное враждебное кооперативное поведение."
    }
  },
  "de": {
    "restoreMaria": {
      "label": "Lady Maria-Dialog wiederherstellen",
      "category": "Narrative Wiederherstellung",
      "info": "Stellt eine kleine Auswahl von Dialogzeilen vor der Begegnung mit Lady Maria wieder her.",
      "impact": "Dies ändert nur den Dialogzustand; es gewährt keinen Gegenstand, kein Level oder eine Bossbelohnung.",
      "warning": "Zuerst auf einer Kopie des Saves verwenden, wenn Sie sich aktuell im Astral Clocktower befinden."
    },
    "dollLullaby": {
      "label": "Das Wiegenlied der Doll (Legacy) aktivieren",
      "category": "Legacy-Präsentation",
      "info": "Reaktiviert das Wiegenlied-Verhalten der Doll, wie es in der ursprünglichen Version 1.0 vorhanden war.",
      "impact": "Stellt einen Legacy-Präsentationszustand wieder her. Es werden weder Attribute, Inventar noch Questbelohnungen verändert.",
      "warning": "Das Verhalten ist versionsabhängig; behalten Sie das Backup, bis Sie den Charakter erfolgreich geladen haben."
    },
    "bloodAddled": {
      "label": "Blood-addled Koop-Verhalten aktivieren",
      "category": "Multiplayer-Verhalten",
      "info": "Aktiviert die Blood-addled-Interaktion für Koop-Spieler, die die Hunter rune verwenden.",
      "impact": "Ändert die Multiplayer-Feindseligkeitslogik, solange die relevanten Runenbedingungen erfüllt sind.",
      "warning": "Nur offline oder mit zustimmenden Spielern verwenden. Kann verwirrendes, feindliches Koop-Verhalten erzeugen."
    }
  },
  "it": {
    "restoreMaria": {
      "label": "Ripristina i dialoghi di Lady Maria",
      "category": "Ripristino narrativo",
      "info": "Ripristina un piccolo insieme di battute prima dell'incontro con Lady Maria.",
      "impact": "Modifica solo lo stato dei dialoghi; non assegna oggetti, livelli o ricompense del boss.",
      "warning": "Usare prima su una copia del salvataggio se ti trovi nell'Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Abilita la ninna nanna legacy della Doll",
      "category": "Presentazione legacy",
      "info": "Riattiva il comportamento della ninna nanna della Doll associato alla release originale 1.0.",
      "impact": "Ripristina uno stato di presentazione legacy. Non modifica attributi, inventario o ricompense delle missioni.",
      "warning": "Il comportamento è sensibile alla versione; conserva il backup finché non hai caricato il personaggio con successo."
    },
    "bloodAddled": {
      "label": "Abilita il comportamento co-op Blood-addled",
      "category": "Comportamento multigiocatore",
      "info": "Abilita l'interazione Blood-addled associata ai giocatori cooperativi che usano la Hunter rune.",
      "impact": "Modifica il comportamento di ostilità in multiplayer finché sono soddisfatte le condizioni rilevanti della runa.",
      "warning": "Usare solo offline o con giocatori consenzienti. Può generare comportamenti cooperativi ostili e confusi."
    }
  },
  "nl": {
    "restoreMaria": {
      "label": "Lady Maria-gesprek herstellen",
      "category": "Narratieve restauratie",
      "info": "Herstelt een kleine set dialoogregels vóór de ontmoeting met Lady Maria.",
      "impact": "Dit verandert alleen de dialoogstatus; het geeft geen item, level of baasbeloning.",
      "warning": "Gebruik eerst op een kopie van de save als je je momenteel in de Astral Clocktower bevindt."
    },
    "dollLullaby": {
      "label": "Het legacy-wiegelied van de Doll inschakelen",
      "category": "Legacy-presentatie",
      "info": "Herstelt het wiegeliedgedrag van de Doll dat bij de originele 1.0-release hoorde.",
      "impact": "Herstelt een legacy-presentatiestatus. Wijzigt geen attributen, inventaris of questbeloningen.",
      "warning": "Het gedrag is versiegevoelig; bewaar de backup totdat je het personage succesvol hebt geladen."
    },
    "bloodAddled": {
      "label": "Blood-addled coöpgedrag inschakelen",
      "category": "Multiplayer-gedrag",
      "info": "Schakelt de Blood-addled-interactie in die hoort bij coöpspelers die de Hunter rune gebruiken.",
      "impact": "Wijzigt de vijandigheidslogica in multiplayer zolang de relevante Hunter rune-voorwaarden gelden.",
      "warning": "Gebruik dit alleen offline of met instemmende spelers. Kan verwarrend vijandig coöpgedrag veroorzaken."
    }
  },
  "pl": {
    "restoreMaria": {
      "label": "Przywróć dialog Lady Maria",
      "category": "Przywracanie narracji",
      "info": "Przywraca niewielki zestaw linii dialogowych przed spotkaniem z Lady Maria.",
      "impact": "Zmienia jedynie stan dialogu; nie przyznaje przedmiotów, poziomów ani nagród za bossa.",
      "warning": "Użyj najpierw na kopii zapisu, jeśli aktualnie znajdujesz się w Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Włącz legacyową kołysankę Doll",
      "category": "Prezentacja (legacy)",
      "info": "Ponownie włącza zachowanie kołysanki Doll związane z oryginalnym wydaniem 1.0.",
      "impact": "Przywraca stan prezentacji z wcześniejszej wersji. Nie zmienia atrybutów, ekwipunku ani nagród z zadań.",
      "warning": "Zachowanie zależy od wersji; zachowaj kopię zapasową aż do pomyślnego załadowania postaci."
    },
    "bloodAddled": {
      "label": "Włącz Blood-addled zachowanie kooperacji",
      "category": "Zachowanie wieloosobowe",
      "info": "Włącza interakcję Blood-addled związaną z graczami kooperacyjnymi używającymi Hunter rune.",
      "impact": "Zmienia zachowanie wrogości w trybie wieloosobowym, dopóki spełnione są odpowiednie warunki Hunter rune.",
      "warning": "Używaj tylko offline lub z graczami wyrażającymi zgodę. Może powodować mylące, wrogie zachowania w kooperacji."
    }
  },
  "tr": {
    "restoreMaria": {
      "label": "Lady Maria diyaloglarını geri yükle",
      "category": "Anlatı onarımı",
      "info": "Lady Maria karşılaşması öncesindeki birkaç diyalog satırını geri yükler.",
      "impact": "Sadece diyalog durumunu değiştirir; herhangi bir eşya, seviye veya boss ödülü vermez.",
      "warning": "Şu anda Astral Clocktower bölgesindeyseniz önce kaydın kopyasında kullanın."
    },
    "dollLullaby": {
      "label": "Doll’un miras ninnisini etkinleştir",
      "category": "Miras sunumu",
      "info": "Orijinal 1.0 sürümüyle ilişkili Doll’ın ninni davranışını yeniden etkinleştirir.",
      "impact": "Bu, miras sunum durumunu geri yükler. Nitelikleri, envanteri veya görev ödüllerini değiştirmez.",
      "warning": "Davranış sürüme duyarlıdır; karakteri başarıyla yükleyene kadar yedeği saklayın."
    },
    "bloodAddled": {
      "label": "Blood-addled eşli oynama davranışını etkinleştir",
      "category": "Çok oyunculu davranış",
      "info": "Hunter rune kullanan işbirlikçi oyuncularla ilişkili Blood-addled etkileşimini etkinleştirir.",
      "impact": "İlgili rune koşulları sağlandığı sürece çok oyunculu düşmanlık davranışını değiştirir.",
      "warning": "Bunu yalnızca çevrimdışı veya rızalı oyuncularla kullanın. Kafa karıştıran düşmanca eşli oynama davranışına yol açabilir."
    }
  },
  "uk": {
    "restoreMaria": {
      "label": "Відновити діалоги Lady Maria",
      "category": "Відновлення оповіді",
      "info": "Відновлює невелику кількість рядків діалогу перед зустріччю з Lady Maria.",
      "impact": "Змінює лише стан діалогів; не дає предмета, рівня або нагороди за боса.",
      "warning": "Якщо ви зараз у районі Astral Clocktower, спочатку використовуйте на копії сейву."
    },
    "dollLullaby": {
      "label": "Увімкнути спадкову колискову Doll",
      "category": "Спадкова презентація",
      "info": "Повторно вмикає поведінку колискової Doll, пов’язану з оригінальним релізом 1.0.",
      "impact": "Відновлює спадковий стан презентації. Не змінює характеристики, інвентар або нагороди за квести.",
      "warning": "Поведінка чутлива до версії; зберігайте резервну копію, доки не завантажите персонажа успішно."
    },
    "bloodAddled": {
      "label": "Увімкнути поведінку кооперації Blood-addled",
      "category": "Поведінка мультиплеєра",
      "info": "Увімкнює взаємодію Blood-addled, пов'язану з кооперативними гравцями, які використовують Hunter rune.",
      "impact": "Змінює поведінку ворожості в мультиплеєрі, поки виконуються відповідні умови руни.",
      "warning": "Використовуйте лише офлайн або з гравцями за згодою. Може спричинити плутану ворожу кооперацію."
    }
  },
  "ja": {
    "restoreMaria": {
      "label": "Lady Mariaのダイアログを復元する",
      "category": "物語の復元",
      "info": "Lady Mariaとの遭遇前の少数の台詞を復元します。",
      "impact": "これはダイアログ状態のみを変更します。アイテム、レベル、ボス報酬は付与されません。",
      "warning": "現在Astral Clocktowerエリアにいる場合は、まずコピーしたセーブで使用してください。"
    },
    "dollLullaby": {
      "label": "Dollのレガシーな子守歌を有効にする",
      "category": "レガシー表示",
      "info": "オリジナル1.0リリースに関連するDollの子守歌動作を再有効化します。",
      "impact": "これはレガシーの表示状態を復元します。能力値、所持品、クエスト報酬は変更されません。",
      "warning": "動作はバージョンに依存します。キャラクターを正常にロードするまでバックアップを保持してください。"
    },
    "bloodAddled": {
      "label": "Blood-addledの協力プレイ挙動を有効化",
      "category": "マルチプレイヤー挙動",
      "info": "Hunter runeを使用する協力プレイヤーに関連するBlood-addledの相互作用を有効にします。",
      "impact": "該当するルーン条件が満たされている間、マルチプレイヤーの敵対行動を変更します。",
      "warning": "オフラインまたは同意したプレイヤーのみで使用してください。混乱する敵対的な協力挙動を引き起こす可能性があります。"
    }
  },
  "ko": {
    "restoreMaria": {
      "label": "Lady Maria 대사 복원",
      "category": "내러티브 복원",
      "info": "Lady Maria와의 조우 이전의 소수 대사 행을 복원합니다.",
      "impact": "대사 상태만 변경합니다; 아이템, 레벨 또는 보스 보상을 부여하지 않습니다.",
      "warning": "현재 Astral Clocktower 구역에 있다면 먼저 복사한 저장 파일에서 사용하세요."
    },
    "dollLullaby": {
      "label": "Doll의 레거시 자장가 활성화",
      "category": "레거시 표현",
      "info": "원래 1.0 릴리스와 관련된 Doll의 자장가 동작을 다시 활성화합니다.",
      "impact": "이는 레거시 표현 상태를 복원합니다. 능력치, 인벤토리 또는 퀘스트 보상을 변경하지 않습니다.",
      "warning": "동작은 버전에 민감합니다; 캐릭터를 성공적으로 불러올 때까지 백업을 보관하세요."
    },
    "bloodAddled": {
      "label": "Blood-addled 협동 동작 활성화",
      "category": "멀티플레이 동작",
      "info": "Hunter rune을 사용하는 협력 플레이어와 관련된 Blood-addled 상호작용을 활성화합니다.",
      "impact": "관련 룬 조건이 충족되는 동안 멀티플레이 적대 행동을 변경합니다.",
      "warning": "오프라인이거나 동의한 플레이어와만 사용하세요. 혼란스러운 적대적 협동 행동을 초래할 수 있습니다."
    }
  },
  "zh-CN": {
    "restoreMaria": {
      "label": "恢复 Lady Maria 对话",
      "category": "叙事还原",
      "info": "恢复 Lady Maria 遭遇前的一小段对话行。",
      "impact": "仅更改对话状态；不会给予物品、等级或首领奖励。",
      "warning": "如果你当前在 Astral Clocktower 区域，请先在复制的存档上使用。"
    },
    "dollLullaby": {
      "label": "启用 Doll 的遗留摇篮曲",
      "category": "遗留呈现",
      "info": "重新启用与原始 1.0 版本相关的 Doll 摇篮曲行为。",
      "impact": "恢复旧版呈现状态。不会更改属性、物品或任务奖励。",
      "warning": "该行为对版本敏感；在成功加载角色前请保留备份。"
    },
    "bloodAddled": {
      "label": "启用 Blood-addled 联机行为",
      "category": "多人行为",
      "info": "启用与使用 Hunter rune 的合作玩家相关的 Blood-addled 互动。",
      "impact": "在满足相关符文条件期间更改多人敌对行为。",
      "warning": "仅在离线或与同意的玩家一同使用。可能导致令人困惑的敌对合作行为。"
    }
  },
  "sv": {
    "restoreMaria": {
      "label": "Återställ Lady Marias dialog",
      "category": "Narrativ återställning",
      "info": "Återställer ett litet antal dialograder före mötet med Lady Maria.",
      "impact": "Endast dialogstatus ändras; ger inte föremål, nivå eller bossbelöning.",
      "warning": "Använd först på en kopierad sparfil om du befinner dig i Astral Clocktower-området."
    },
    "dollLullaby": {
      "label": "Aktivera Dolls ursprungliga vaggvisa",
      "category": "Äldre presentation",
      "info": "Återaktiverar Dolls vaggvisebeteende kopplat till ursprungliga 1.0-utgåvan.",
      "impact": "Återställer ett äldre presentationsläge. Ändrar inte attribut, inventarium eller uppdragsbelöningar.",
      "warning": "Beteendet är versionskänsligt; behåll backupen tills du lyckats ladda karaktären."
    },
    "bloodAddled": {
      "label": "Aktivera Blood-addled co-op-beteende",
      "category": "Flerspelarbeteende",
      "info": "Aktiverar Blood-addled-interaktionen kopplad till co-op-spelare som använder Hunter rune.",
      "impact": "Ändrar flerspelarens fientlighetsbeteende medan relevanta rune-villkor är uppfyllda.",
      "warning": "Använd endast offline eller med medgivande spelare. Kan skapa förvirrande fientligt co-op-beteende."
    }
  },
  "cs": {
    "restoreMaria": {
      "label": "Obnovit dialog Lady Maria",
      "category": "Obnovení vyprávění",
      "info": "Obnoví malou sadu dialogových řádků před setkáním s Lady Maria.",
      "impact": "Tím se změní pouze stav dialogu; nezískáte předmět, úroveň ani odměnu za bosse.",
      "warning": "Použijte nejprve na kopii uložené pozice, pokud se nacházíte v oblasti Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Povolit Dollinu dědičnou ukolébavku",
      "category": "Dědičná prezentace",
      "info": "Znovu aktivuje chování ukolébavky Doll spojené s původním vydáním 1.0.",
      "impact": "Obnoví starší prezentační stav. Nemění atributy, inventář ani odměny za úkoly.",
      "warning": "Chování je citlivé na verzi; ponechte zálohu, dokud postavu úspěšně nenačtete."
    },
    "bloodAddled": {
      "label": "Povolit Blood-addled co-op chování",
      "category": "Chování pro více hráčů",
      "info": "Povolí Blood-addled interakci spojenou s hráči v co-opu používajícími Hunter rune.",
      "impact": "Změní chování nepřátelství v multiplayeru, dokud budou splněny příslušné podmínky runy.",
      "warning": "Používejte pouze offline nebo s hráči, kteří s tím souhlasí. Může to vytvořit matoucí nepřátelské co-op chování."
    }
  },
  "ro": {
    "restoreMaria": {
      "label": "Restabilește dialogul Lady Maria",
      "category": "Restaurare narativă",
      "info": "Restabilește un set mic de replici înainte de întâlnirea cu Lady Maria.",
      "impact": "Aceasta schimbă doar starea dialogului; nu acordă obiecte, nivel sau recompensă de boss.",
      "warning": "Folosește mai întâi pe un save copiat dacă ești în zona Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Activează cântecul de leagăn moștenit al Doll",
      "category": "Prezentare moștenită",
      "info": "Reactivează comportamentul cântecului de leagăn al Doll asociat versiunii originale 1.0.",
      "impact": "Restabilește un stadiu de prezentare vechi. Nu modifică atribute, inventar sau recompense de misiune.",
      "warning": "Comportamentul depinde de versiune; păstrează copia de rezervă până când ai încărcat cu succes personajul."
    },
    "bloodAddled": {
      "label": "Activează comportamentul co-op Blood-addled",
      "category": "Comportament multiplayer",
      "info": "Activează interacțiunea Blood-addled asociată jucătorilor co-op care folosesc Hunter rune.",
      "impact": "Modifică comportamentul de ostilitate în multiplayer în timpul în care condițiile rune relevante sunt îndeplinite.",
      "warning": "Folosește doar offline sau cu jucători care sunt de acord. Poate crea comportamente co-op ostile și confuze."
    }
  },
  "el": {
    "restoreMaria": {
      "label": "Επαναφορά διαλόγου Lady Maria",
      "category": "Αποκατάσταση αφήγησης",
      "info": "Αποκαθιστά ένα μικρό σύνολο γραμμών διαλόγου πριν τη συνάντηση με τη Lady Maria.",
      "impact": "Αυτό αλλάζει μόνο την κατάσταση διαλόγου· δεν χορηγεί αντικείμενο, επίπεδο ή ανταμοιβή αφεντικού.",
      "warning": "Χρησιμοποιήστε πρώτα σε αντίγραφο αποθήκευσης εάν βρίσκεστε στην περιοχή Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Ενεργοποίηση του νανουρίσματος κληρονομιάς της Doll",
      "category": "Παρουσίαση κληρονομιάς",
      "info": "Ενεργοποιεί ξανά τη συμπεριφορά του νανουρίσματος της Doll που σχετιζόταν με την αρχική έκδοση 1.0.",
      "impact": "Αυτό επαναφέρει κατάσταση παλαιάς παρουσίασης. Δεν αλλάζει χαρακτηριστικά, αποθέματα ή ανταμοιβές αποστολών.",
      "warning": "Η συμπεριφορά εξαρτάται από την έκδοση· διατηρήστε το αντίγραφο ασφαλείας μέχρι να φορτωθεί επιτυχώς ο χαρακτήρας."
    },
    "bloodAddled": {
      "label": "Ενεργοποίηση Blood-addled συνεργατικής συμπεριφοράς",
      "category": "Συμπεριφορά πολλών παικτών",
      "info": "Ενεργοποιεί την Blood-addled αλληλεπίδραση που σχετίζεται με συνεργάτες που χρησιμοποιούν το Hunter rune.",
      "impact": "Αυτό αλλάζει τη συμπεριφορά εχθρότητας στο multiplayer όσο πληρούνται οι σχετικές συνθήκες rune.",
      "warning": "Χρησιμοποιήστε αυτό μόνο εκτός σύνδεσης ή με παίκτες που συναινούν. Μπορεί να δημιουργήσει συγκεχυμένη εχθρική συμπεριφορά σε co-op."
    }
  },
  "id": {
    "restoreMaria": {
      "label": "Pulihkan dialog Lady Maria",
      "category": "Pemulihan narasi",
      "info": "Mengembalikan sejumlah kecil baris dialog sebelum pertemuan dengan Lady Maria.",
      "impact": "Ini hanya mengubah status dialog; tidak memberikan item, level, atau hadiah bos.",
      "warning": "Gunakan pada salinan save terlebih dahulu jika Anda saat ini berada di area Astral Clocktower."
    },
    "dollLullaby": {
      "label": "Aktifkan lullaby warisan Doll",
      "category": "Presentasi warisan",
      "info": "Mengaktifkan kembali perilaku lullaby Doll yang terkait dengan rilis awal 1.0.",
      "impact": "Ini mengembalikan status presentasi warisan. Tidak mengubah atribut, inventaris, atau hadiah quest.",
      "warning": "Perilaku sensitif terhadap versi; simpan cadangan sampai karakter berhasil dimuat."
    },
    "bloodAddled": {
      "label": "Aktifkan perilaku co-op Blood-addled",
      "category": "Perilaku multipemain",
      "info": "Mengaktifkan interaksi Blood-addled yang terkait dengan pemain co-op yang menggunakan Hunter rune.",
      "impact": "Ini mengubah perilaku permusuhan multipemain selama kondisi rune yang relevan terpenuhi.",
      "warning": "Gunakan ini hanya offline atau dengan pemain yang menyetujui. Dapat menyebabkan perilaku co-op yang bermusuhan dan membingungkan."
    }
  },
  "da": {
    "restoreMaria": {
      "label": "Gendan Lady Maria-dialog",
      "category": "Gendannelse af fortælling",
      "info": "Gendanner et lille sæt dialoglinjer før mødet med Lady Maria.",
      "impact": "Dette ændrer kun dialogtilstanden; det giver ikke et objekt, niveau eller boss-belønning.",
      "warning": "Brug først på en kopieret save, hvis du befinder dig i Astral Clocktower-området."
    },
    "dollLullaby": {
      "label": "Aktivér Doll’s arvede vuggevise",
      "category": "Arvet præsentation",
      "info": "Genaktiverer Doll’s vuggeviseopførsel forbundet med den oprindelige 1.0-udgivelse.",
      "impact": "Dette gendanner en ældre præsentationstilstand. Det ændrer ikke attributter, inventar eller quest-belønninger.",
      "warning": "Adfærden er versionsfølsom; behold backup, indtil karakteren er indlæst med succes."
    },
    "bloodAddled": {
      "label": "Aktivér Blood-addled co-op-adfærd",
      "category": "Multiplayer-adfærd",
      "info": "Aktiverer Blood-addled-interaktionen for co-op-spillere, der bruger Hunter rune.",
      "impact": "Dette ændrer multiplayerens fjendtlighedsadfærd, mens de relevante rune-betingelser er opfyldt.",
      "warning": "Brug kun offline eller med spillere, der giver samtykke. Det kan skabe forvirrende fjendtlig co-op-adfærd."
    }
  },
  "fi": {
    "restoreMaria": {
      "label": "Palauta Lady Marian dialogi",
      "category": "Tarinan palautus",
      "info": "Palauttaa pienen joukon vuorosanoja ennen kohtaamista Lady Marian kanssa.",
      "impact": "Tämä muuttaa vain dialogitilaa; se ei myönnä esinettä, tasoa tai pomopalkkiota.",
      "warning": "Käytä ensin kopioidulla tallenteella, jos olet Astral Clocktower-alueella."
    },
    "dollLullaby": {
      "label": "Ota käyttöön Dollin perintökehtolaulu",
      "category": "Perintöesitys",
      "info": "Ota uudelleen käyttöön Dollin kehtolaulun käyttäytyminen, joka liittyi alkuperäiseen versioon 1.0.",
      "impact": "Tämä palauttaa perintöesityksen tilan. Se ei muuta attribuutteja, inventaariota tai tehtäväpalkintoja.",
      "warning": "Käyttäytyminen on versiotuntuva; pidä varmuuskopio, kunnes hahmo on latautunut onnistuneesti."
    },
    "bloodAddled": {
      "label": "Ota käyttöön Blood-addled co-op -käyttäytyminen",
      "category": "Moninpelikäyttäytyminen",
      "info": "Ota käyttöön Blood-addled-vuorovaikutus, joka liittyy yhteistyöpelaajiin, jotka käyttävät Hunter rune.",
      "impact": "Tämä muuttaa moninpelin vihamielisyyskäyttäytymistä niin kauan kuin asiaankuuluvat rune-ehdot täyttyvät.",
      "warning": "Käytä tätä vain offline-tilassa tai suostuvien pelaajien kanssa. Se voi aiheuttaa sekavaa vihamielistä yhteistyökäyttäytymistä."
    }
  },
  "hu": {
    "restoreMaria": {
      "label": "Lady Maria párbeszédének visszaállítása",
      "category": "Narratív helyreállítás",
      "info": "Visszaállít néhány párbeszédsort a Lady Maria találkozó előttről.",
      "impact": "Csak a párbeszédállapotot módosítja; nem ad tárgyat, szintet vagy főellenfél-jutalmat.",
      "warning": "Először egy másolt mentésen használd, ha jelenleg az Astral Clocktower területén vagy."
    },
    "dollLullaby": {
      "label": "A Doll régi altatódalának engedélyezése",
      "category": "Régi megjelenés",
      "info": "Újra engedélyezi a Doll altatódal viselkedését, amely az eredeti 1.0 kiadáshoz tartozott.",
      "impact": "Ez egy régi megjelenési állapotot állít helyre. Nem módosítja az attribútumokat, a készletet vagy a küldetésjutalmakat.",
      "warning": "A viselkedés verziófüggő; tartsd meg a biztonsági másolatot, amíg sikeresen be nem töltötted a karaktert."
    },
    "bloodAddled": {
      "label": "A Blood-addled kooperatív viselkedés engedélyezése",
      "category": "Többjátékos viselkedés",
      "info": "Engedélyezi a Blood-addled interakciót, amely kooperáló játékosoknál lép fel a Hunter rune használatakor.",
      "impact": "Megváltoztatja a többjátékos ellenségességi viselkedést, amíg a vonatkozó rune feltételek teljesülnek.",
      "warning": "Ezt csak offline használd, vagy beleegyező játékosokkal. Zavaróan ellenséges kooperatív viselkedést okozhat."
    }
  },
  "nb": {
    "restoreMaria": {
      "label": "Gjenopprett Lady Marias dialog",
      "category": "Narrativ gjenoppretting",
      "info": "Gjenoppretter et lite sett med dialoglinjer før møtet med Lady Maria.",
      "impact": "Endrer bare dialogtilstanden; gir ikke gjenstand, nivå eller boss-belønning.",
      "warning": "Bruk først på en kopiert lagring hvis du befinner deg i Astral Clocktower-området."
    },
    "dollLullaby": {
      "label": "Aktiver Dolls arvede vuggesang",
      "category": "Arvet presentasjon",
      "info": "Gjenskaper Dolls vuggesangsoppførsel knyttet til den opprinnelige 1.0-utgivelsen.",
      "impact": "Dette gjenoppretter en arvet presentasjonsstatus. Den endrer ikke attributter, inventar eller oppdragsbelønninger.",
      "warning": "Atferden er versjonsavhengig; behold sikkerhetskopien til du har lastet inn karakteren med hell."
    },
    "bloodAddled": {
      "label": "Aktiver Blood-addled samspillsoppførsel",
      "category": "Flerspillersoppførsel",
      "info": "Aktiverer Blood-addled-interaksjonen knyttet til samspillere som bruker Hunter rune.",
      "impact": "Endrer flerspiller fiendtlighetsatferd mens de relevante rune-betingelsene er oppfylt.",
      "warning": "Bruk dette kun offline eller med spillere som samtykker. Det kan skape forvirrende fiendtlig samspillsoppførsel."
    }
  }
};

Object.entries(v021FlagEntryOverrides).forEach(([language, entries]) => {
  const current = flagOverrides[language] ?? {};
  flagOverrides[language] = {
    ...current,
    entries: { ...(current.entries ?? {}), ...entries },
  };
});

const beta5TranslatedOverrides = {
  "fr": [
    {
      "key": "forge.presets",
      "value": "Préréglages"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "sidebar.flags",
      "value": "Drapeaux"
    },
    {
      "key": "update.version",
      "value": "Version {{version}}"
    }
  ],
  "es": [
    {
      "key": "flags.card.confirm",
      "value": "¿Aplicar esta marca de guardado conocida? Se realizará una copia de seguridad antes de guardar."
    },
    {
      "key": "flags.card.applied",
      "value": "Marca aplicada al guardado en memoria. Selecciona Guardar cambios para escribir el archivo."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "No se pudo aplicar esta marca: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Cambios:"
    },
    {
      "key": "flags.card.careful",
      "value": "Precaución:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Patrón de bytes validado:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Ocultar detalles"
    },
    {
      "key": "flags.card.showDetails",
      "value": "¿Qué hace esto?"
    },
    {
      "key": "flags.card.applying",
      "value": "Aplicando…"
    },
    {
      "key": "flags.card.apply",
      "value": "Aplicar"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Restaurar el diálogo de Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Restauración narrativa"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Restaura un pequeño conjunto de líneas de diálogo anteriores al encuentro con Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Esto solo cambia el estado del diálogo; no otorga objetos, niveles ni recompensas de jefe."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Úsalo primero en una copia de la partida si te encuentras actualmente en el Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Habilitar la nana heredada de la Muñeca"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Presentación heredada"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Vuelve a habilitar el comportamiento de la nana de la Muñeca asociado con la versión original 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Esto restaura un estado de presentación heredado. No altera atributos, inventario ni recompensas de misiones."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "El comportamiento depende de la versión; conserva la copia de seguridad hasta cargar el personaje correctamente."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Habilitar el comportamiento cooperativo Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Comportamiento multijugador"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Habilita la interacción Blood-addled asociada a jugadores cooperativos que usan la runa Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Esto cambia el comportamiento de hostilidad multijugador mientras se cumplan las condiciones de la runa relevante."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Úsalo solo sin conexión o con jugadores que consientan. Puede provocar comportamientos cooperativos hostiles y confusos."
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Armas"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armaduras"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Gemas de sangre (adición directa experimental)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Runas Caryll (adición directa experimental)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Agregar una gema o runa terminada"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Agregar un arma o una armadura"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Crear directamente una gema de sangre o una Runa Caryll terminada a partir de efectos validados cuando exista un registro reutilizable seguro en la partida."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Crear directamente un arma o armadura catalogada cuando la partida contenga un bloque seguro y reutilizable de ranura de equipo."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Constructor directo de gemas y runas"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimental: esta operación reutiliza solo un registro huérfano de mejora seguro. Nunca reestructura el formato de la partida. Mantén la copia de seguridad automática hasta que el personaje se cargue normalmente."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimental: esta operación reutiliza solo un bloque huérfano y seguro de ranura de equipo y crea cinco ranuras de gemas cerradas. Abre las ranuras más tarde con Gemas si es necesario."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Elige un primer efecto validado antes de añadir una gema o runa."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "No se pudo completar la adición directa de forma segura."
    },
    {
      "key": "inventory.addDirect",
      "value": "Añadir directamente"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Agregar equipo"
    },
    {
      "key": "inventory.gemShape",
      "value": "Forma de gema"
    },
    {
      "key": "inventory.runeType",
      "value": "Tipo de runa"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Editar {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nombre del preset personal de {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Guardado “{{name}}” en Mis presets para Gem Forge y Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Convertir a {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "¿Convertir este {{source}} en un {{destination}}? Mantén la copia de seguridad automática hasta que hayas probado la partida."
    },
    {
      "key": "forge.unableToApply",
      "value": "No se pudo aplicar este cambio."
    },
    {
      "key": "forge.closeLabel",
      "value": "Cerrar la Forja de {{subject}}"
    },
    {
      "key": "forge.notice",
      "value": "Cargar un preset solo actualiza el borrador visible. Selecciona Confirmar en el editor para escribirlo en la partida. Cada efecto de abajo proviene del catálogo validado integrado del editor. Los presets personales se comparten entre Gem Forge y Rune Forge; el editor de destino mantiene su propia Forma o Tipo válidos."
    },
    {
      "key": "forge.modeLabel",
      "value": "Modo Forja de {{subject}}"
    },
    {
      "key": "forge.presets",
      "value": "Presets"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorías de presets"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Conjunto personalizado de efectos de {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Crear un {{subject}} de seis efectos"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Elige hasta seis efectos validados. Las ranuras vacías permanecen como Sin efecto. El editor valida cada ID seleccionado de nuevo cuando confirmes."
    },
    {
      "key": "forge.effect",
      "value": "Efecto {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Vista previa del borrador"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Elige al menos un efecto para cargar un borrador personalizado."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Presets personales de {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Presets personales compartidos por ambas forjas"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Guarda una gema o runa editada una vez, luego carga el mismo preset desde Gem Forge o Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Personal"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Preset personal de Forja compartido por Gem Forge y Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "¿Eliminar el preset personal “{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Aún no se ha guardado ningún preset personal."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Edita una gema o runa, luego usa Guardar como preset para hacerlo disponible en ambas forjas."
    },
    {
      "key": "forge.customName",
      "value": "Forja personalizada de {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Conjunto personalizado — {{count}} efecto(s) seleccionado(s)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Preset de Runa Caryll validado."
    },
    {
      "key": "forge.categories.All",
      "value": "Todos"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Ataque"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Recuperación"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimental"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personal"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Personalizado"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runa"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex físico"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Daño físico, presión a plena salud y soporte de durabilidad."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex nutritivo"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Amplificación de todo daño con presión a plena salud y recuperación."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Cazador Bloodtinge"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Alto daño de Bloodtinge con soporte de todo daño y recuperación."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Ruptor contundente"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Alto daño contundente con soporte para todo daño y durabilidad."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Especialista en estocada"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Alto daño de estocada con soporte de todo daño y durabilidad."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vanguardia"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Amplificación de todo daño con presión física y alta bonificación de recuperación."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Oleada Arcana"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Daño arcano con soporte de recuperación y durabilidad."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Oleada Ígnea"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Daño de fuego con soporte de todo daño y recuperación."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Oleada eléctrica"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Daño de rayo con soporte de todo daño y durabilidad."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ascendente elemental"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efectos arcano, fuego y rayo en una configuración deliberadamente experimental."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Caza sostenida"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Recuperación, durabilidad y soporte de todo daño para sesiones largas de exploración."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalidad abisal +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Usa el efecto integrado de recuperación continua de HP +75 con soporte de durabilidad y daño."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Resistencia forjada"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "La bonificación agrupada de durabilidad más fuerte conocida, acompañada de alta recuperación y daño físico."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Último aliento"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Altos multiplicadores cerca de la muerte y a plena salud. Mantén esta configuración sin conexión."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Cañón de cristal"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Acumula multiplicadores físicos, de todo daño y cerca de la muerte solo para pruebas."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Caza infinita"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Efectos máximos conocidos de recuperación y durabilidad con una bonificación de daño a plena salud."
    },
    {
      "key": "sidebar.flags",
      "value": "Marcas"
    },
    {
      "key": "update.available",
      "value": "Actualización disponible"
    },
    {
      "key": "update.version",
      "value": "Versión {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Ahora no"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Actualizar y reiniciar"
    },
    {
      "key": "update.startingDownload",
      "value": "Iniciando descarga segura…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Descargando actualización firmada…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Descargando: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB descargados"
    },
    {
      "key": "update.installing",
      "value": "Instalando actualización…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Actualización instalada. Reiniciando el editor…"
    },
    {
      "key": "update.installFailed",
      "value": "No se pudo instalar la actualización. Tu versión actual no ha cambiado."
    },
    {
      "key": "actions.reset",
      "value": "Restablecer"
    },
    {
      "key": "actions.confirm",
      "value": "Confirmar"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Cambios confirmados"
    },
    {
      "key": "actions.back",
      "value": "Atrás"
    },
    {
      "key": "actions.change",
      "value": "Cambiar"
    },
    {
      "key": "actions.edit",
      "value": "Editar"
    },
    {
      "key": "characterForm.name",
      "value": "Nombre:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coordenadas:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Tiempo de juego:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teletransporte:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Selecciona una ubicación"
    },
    {
      "key": "bosses.alive",
      "value": "Vivo"
    },
    {
      "key": "bosses.dead",
      "value": "Muerto"
    }
  ],
  "pt-PT": [
    {
      "key": "flags.card.confirm",
      "value": "Aplicar esta flag conhecida ao save? Será mantido um backup antes de gravar."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag aplicada ao save em memória. Selecione Guardar alterações para gravar o ficheiro."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Não foi possível aplicar esta flag: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "O que muda:"
    },
    {
      "key": "flags.card.careful",
      "value": "Cuidado:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Padrão de bytes validado:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Ocultar detalhes"
    },
    {
      "key": "flags.card.showDetails",
      "value": "O que isto faz?"
    },
    {
      "key": "flags.card.applying",
      "value": "A aplicar…"
    },
    {
      "key": "flags.card.apply",
      "value": "Aplicar"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Restaurar diálogo da Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Restauração narrativa"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Restaura um pequeno conjunto de linhas de diálogo anteriores ao encontro com Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Isto altera apenas o estado do diálogo; não concede um item, um nível nem recompensa de chefe."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Use primeiro num save copiado se estiver atualmente na área Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Ativar canção de embalar legada da Boneca"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Apresentação legada"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Reativa o comportamento de canção de embalar da Boneca associado à versão original 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Isto restaura um estado de apresentação legado. Não altera atributos, inventário ou recompensas de missão."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "O comportamento é sensível à versão; mantenha o backup até carregar a personagem com sucesso."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Ativar comportamento cooperativo Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Comportamento multijogador"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Ativa a interação Blood-addled associada a jogadores cooperativos que usam a runa Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Isto altera o comportamento de hostilidade multijogador enquanto as condições da runa relevante forem satisfeitas."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Use apenas offline ou com jogadores que concordem. Pode causar comportamentos cooperativos hostis e confusos."
    },
    {
      "key": "inventory.item",
      "value": "item"
    },
    {
      "key": "inventory.type.item",
      "value": "item"
    },
    {
      "key": "inventory.type.key",
      "value": "item"
    },
    {
      "key": "inventory.type.chalice",
      "value": "item"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Armas"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armaduras"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Gemas de Sangue (adição direta experimental)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Runas Caryll (adição direta experimental)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Adicionar uma gema ou runa concluída"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Adicionar uma arma ou armadura"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Criar directamente uma Gema de Sangue ou Runa Caryll completa a partir de efeitos validados quando houver um registo reutilizável seguro disponível no save."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Criar directamente uma arma ou armadura catalogada quando o save contiver um bloco de slot de equipamento reutilizável e seguro."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Construtor directo de gemas e runas"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimental: esta operação reutiliza apenas um registo de upgrade órfão seguro. Nunca altera a estrutura do save. Mantenha o backup automático até a personagem carregar normalmente."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimental: esta operação reutiliza apenas um bloco de slot de equipamento órfão e seguro e cria cinco espaços de gema fechados. Abra os espaços mais tarde com Gemas se necessário."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Escolha um primeiro efeito validado antes de adicionar uma gema ou runa."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "A adição directa não pôde ser concluída com segurança."
    },
    {
      "key": "inventory.addDirect",
      "value": "Adicionar directamente"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Adicionar equipamento"
    },
    {
      "key": "inventory.gemShape",
      "value": "Formato da gema"
    },
    {
      "key": "inventory.runeType",
      "value": "Tipo de runa"
    },
    {
      "key": "inventory.gems",
      "value": "Gemas"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Editar {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nome da predefinição pessoal de {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "“{{name}}” guardado em Minhas predefinições para Forja de Gemas e Forja de Runas."
    },
    {
      "key": "forge.convertTo",
      "value": "Converter para {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Converter este {{source}} num {{destination}}? Mantenha o backup automático até testar o save."
    },
    {
      "key": "forge.unableToApply",
      "value": "Não foi possível aplicar esta alteração."
    },
    {
      "key": "forge.closeLabel",
      "value": "Fechar Forja de {{subject}}"
    },
    {
      "key": "forge.notice",
      "value": "Carregar uma predefinição apenas actualiza o rascunho visível. Seleccione Confirmar no editor para gravá-lo no save. Cada efeito abaixo provém do catálogo validado embutido do editor. As predefinições pessoais são partilhadas pela Forja de Gemas e Forja de Runas; o editor de destino mantém a sua própria Forma ou Tipo válida."
    },
    {
      "key": "forge.modeLabel",
      "value": "Modo Forja de {{subject}}"
    },
    {
      "key": "forge.presets",
      "value": "Predefinições"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorias de predefinições"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Conjunto personalizado de efeitos de {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Criar um {{subject}} de seis efeitos"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Escolha até seis efeitos validados. Os espaços vazios ficam como Sem Efeito. O editor valida novamente cada ID seleccionado quando confirmar."
    },
    {
      "key": "forge.effect",
      "value": "Efeito {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Pré-visualização do rascunho"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Escolha pelo menos um efeito para carregar um rascunho personalizado."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Predefinições pessoais de {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Predefinições pessoais partilhadas por ambas as forjas"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Guarde uma gema ou runa editada uma vez e depois carregue a mesma predefinição na Forja de Gemas ou na Forja de Runas."
    },
    {
      "key": "forge.personal",
      "value": "Pessoal"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Predefinição pessoal de Forja partilhada entre Forja de Gemas e Forja de Runas."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Eliminar a predefinição pessoal “{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Ainda não foi guardada nenhuma predefinição pessoal."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Edite uma gema ou runa e depois use Guardar como predefinição para a tornar disponível em ambas as forjas."
    },
    {
      "key": "forge.customName",
      "value": "Forja personalizada de {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Conjunto personalizado — {{count}} efeito(s) selecionado(s)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Predefinição de Runa Caryll validada."
    },
    {
      "key": "forge.categories.All",
      "value": "Todas"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Ataque"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Recuperação"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimental"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Pessoal"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Personalizado"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runa"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Ápice Físico"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Dano físico, pressão em vida máxima e suporte de durabilidade."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Ápice Nutritivo"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Amplificação de todo o dano com pressão em vida máxima e recuperação."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Elevado dano de Bloodtinge com suporte de todo o dano e recuperação."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Quebrador Contundente"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Alto dano contundente com suporte de todo o dano e durabilidade."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Especialista em Estocada"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Alto dano de estocada com suporte de todo o dano e durabilidade."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vanguarda"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Amplificação de todo o dano com pressão física e um elevado bónus de recuperação."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Surto Arcano"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Dano arcano com suporte de recuperação e durabilidade."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Surto de Chama"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Dano de fogo com suporte de todo o dano e recuperação."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Surto de Raio"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Dano de raio com suporte de todo o dano e durabilidade."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ascendente Elemental"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efeitos arcano, fogo e raio numa configuração deliberadamente experimental."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Caça Sustentada"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Suporte de recuperação, durabilidade e todo o dano para sessões longas de exploração."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalidade Abissal +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Utiliza o efeito embutido de recuperação contínua de HP +75 com suporte de durabilidade e dano."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Resistência Forjada"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "O mais forte bónus de durabilidade conhecido emparelhado com alta recuperação e dano físico."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Última Resistência"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Elevados multiplicadores para quase-morte e vida cheia. Mantenha esta configuração offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Canhão de Vidro"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Acumula multiplicadores de físico, todo o dano e quase-morte apenas para testes."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Caça Sem Fim"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Efeitos máximos conhecidos de recuperação e durabilidade com um bónus de dano em vida cheia."
    },
    {
      "key": "sidebar.flags",
      "value": "Flags"
    },
    {
      "key": "update.available",
      "value": "Atualização disponível"
    },
    {
      "key": "update.version",
      "value": "Versão {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Agora não"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Atualizar e reiniciar"
    },
    {
      "key": "update.startingDownload",
      "value": "A iniciar transferência segura…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "A transferir atualização assinada…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "A transferir: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB transferidos"
    },
    {
      "key": "update.installing",
      "value": "A instalar atualização…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Atualização instalada. A reiniciar o editor…"
    },
    {
      "key": "update.installFailed",
      "value": "A atualização não pôde ser instalada. A sua versão atual permanece inalterada."
    },
    {
      "key": "actions.reset",
      "value": "Repor"
    },
    {
      "key": "actions.confirm",
      "value": "Confirmar"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Alterações confirmadas"
    },
    {
      "key": "actions.back",
      "value": "Voltar"
    },
    {
      "key": "actions.change",
      "value": "Alterar"
    },
    {
      "key": "actions.edit",
      "value": "Editar"
    },
    {
      "key": "characterForm.name",
      "value": "Nome:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coordenadas:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Tempo de jogo:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teletransportar:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Selecionar uma localização"
    },
    {
      "key": "bosses.alive",
      "value": "Vivo"
    },
    {
      "key": "bosses.dead",
      "value": "Morto"
    }
  ],
  "pt-BR": [
    {
      "key": "flags.card.confirm",
      "value": "Aplicar esta flag conhecida ao salvamento? Um backup será mantido antes de salvar."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag aplicada no salvamento em memória. Selecione Salvar alterações para gravar o arquivo."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Não foi possível aplicar esta flag: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "O que muda:"
    },
    {
      "key": "flags.card.careful",
      "value": "Cuidado:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Padrão de bytes validado:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Ocultar detalhes"
    },
    {
      "key": "flags.card.showDetails",
      "value": "O que isso faz?"
    },
    {
      "key": "flags.card.applying",
      "value": "Aplicando…"
    },
    {
      "key": "flags.card.apply",
      "value": "Aplicar"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Restaurar diálogo da Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Restauração narrativa"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Restaura um pequeno conjunto de falas anteriores ao encontro com Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Isso altera apenas o estado do diálogo; não concede item, nível ou recompensa de chefe."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Use primeiro em um salvamento copiado se você estiver atualmente na área Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Ativar canção de ninar legada da Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Apresentação legada"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Reativa o comportamento de canção de ninar da Doll associado ao lançamento original 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Isso restaura um estado de apresentação legada. Não altera atributos, inventário ou recompensas de missão."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "O comportamento é sensível à versão; mantenha o backup até carregar o personagem com sucesso."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Ativar comportamento cooperativo Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Comportamento multijogador"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Ativa a interação Blood-addled associada a jogadores cooperativos usando a runa Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Isso altera o comportamento de hostilidade no multijogador enquanto as condições da runa relevantes estiverem atendidas."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Use apenas offline ou com jogadores que concordarem. Pode causar comportamento cooperativo hostil e confuso."
    },
    {
      "key": "inventory.item",
      "value": "item"
    },
    {
      "key": "inventory.type.item",
      "value": "item"
    },
    {
      "key": "inventory.type.key",
      "value": "item"
    },
    {
      "key": "inventory.type.chalice",
      "value": "item"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Armas"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armadura"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Gemas de Sangue (adição direta experimental)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Runas Caryll (adição direta experimental)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Adicionar uma gema ou runa pronta"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Adicionar arma ou armadura"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Cria diretamente uma Gema de Sangue finalizada ou uma Runa Caryll a partir de efeitos validados quando houver um registro reutilizável seguro disponível no salvamento."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Cria diretamente uma arma ou armadura catalogada quando o salvamento contém um bloco de slot de equipamento reutilizável seguro."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Construtor direto de gemas e runas"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimental: esta operação reutiliza apenas um registro de upgrade órfão seguro. Ela nunca altera a estrutura do salvamento. Mantenha o backup automático até que o personagem seja carregado normalmente."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimental: esta operação reutiliza apenas um bloco de slot de equipamento órfão seguro e cria cinco slots de gema fechados. Abra os slots depois com Gemas se necessário."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Escolha um efeito primário validado antes de adicionar uma gema ou runa."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "A adição direta não pôde ser concluída com segurança."
    },
    {
      "key": "inventory.addDirect",
      "value": "Adicionar diretamente"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Adicionar equipamento"
    },
    {
      "key": "inventory.gemShape",
      "value": "Formato da gema"
    },
    {
      "key": "inventory.runeType",
      "value": "Tipo de runa"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Editar {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nome do preset pessoal de {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Salvo “{{name}}” em Meus presets para Gem Forge e Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Converter para {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Converter este {{source}} em um {{destination}}? Mantenha o backup automático até testar o salvamento."
    },
    {
      "key": "forge.unableToApply",
      "value": "Não foi possível aplicar esta alteração."
    },
    {
      "key": "forge.closeLabel",
      "value": "Fechar {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Carregar um preset apenas atualiza o rascunho visível. Selecione Confirmar no editor para gravá-lo no salvamento. Cada efeito abaixo vem do catálogo validado embutido do editor. Presets pessoais são compartilhados pela Gem Forge e Rune Forge; o editor de destino mantém sua própria Forma ou Tipo válidos."
    },
    {
      "key": "forge.modeLabel",
      "value": "Modo {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Predefinições"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorias de predefinições"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Conjunto personalizado de efeitos de {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Criar um {{subject}} de seis efeitos"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Escolha até seis efeitos validados. Slots vazios permanecem como Sem Efeito. O editor valida cada ID selecionado novamente quando você confirmar."
    },
    {
      "key": "forge.effect",
      "value": "Efeito {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Pré-visualização do rascunho"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Escolha pelo menos um efeito para carregar um rascunho personalizado."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Predefinições pessoais de {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Predefinições pessoais compartilhadas por ambas as forjas"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Salve uma gema ou runa editada uma vez, então carregue o mesmo preset na Gem Forge ou na Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Pessoal"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Preset pessoal de Forja compartilhado pela Gem Forge e Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Excluir o preset pessoal “{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Nenhum preset pessoal foi salvo ainda."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Edite uma gema ou runa e use Salvar como preset para torná-lo disponível em ambas as forjas."
    },
    {
      "key": "forge.customName",
      "value": "Forja personalizada de {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Conjunto personalizado — {{count}} efeito(s) selecionado(s)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Preset de Runa Caryll validado."
    },
    {
      "key": "forge.categories.All",
      "value": "Todas"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Ataque"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Recuperação"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimental"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Pessoal"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Personalizado"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runa"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Ápice Físico"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Dano físico, pressão em vida cheia e suporte à durabilidade."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Ápice Nutritivo"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Amplificação de todo dano, com pressão em vida cheia e recuperação."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Alto dano de Bloodtinge com suporte a todo dano e recuperação."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Quebra-Contundente"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Alto dano contundente com suporte a todo dano e durabilidade."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Especialista em Estocada"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Alto dano de perfuração com suporte a todo dano e durabilidade."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vanguarda"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Amplificação de todo dano com pressão física e alto bônus de recuperação."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Surto Arcano"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Dano arcano com suporte a recuperação e durabilidade."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Surto de Fogo"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Dano de fogo com suporte a todo dano e recuperação."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Surto Elétrico"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Dano elétrico com suporte a todo dano e durabilidade."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ascendente Elemental"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efeitos arcano, fogo e elétrico em uma configuração deliberadamente experimental."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Caçada Sustentada"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Recuperação, durabilidade e suporte a todo dano para longas sessões de exploração."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalidade Abissal +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Usa o efeito embutido de recuperação contínua de HP +75 com suporte a durabilidade e dano."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Resistência Forjada"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "O mais forte bônus agrupado de durabilidade conhecido, combinado com alta recuperação e dano físico."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Última Resistência"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Altos multiplicadores de quase-morte e de vida cheia. Mantenha essa configuração offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Canhão de Vidro"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Empilha multiplicadores de físico, todo dano e quase-morte apenas para testes."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Caçada Sem Fim"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Efeitos de recuperação e durabilidade conhecidos máximos com bônus de dano em vida cheia."
    },
    {
      "key": "sidebar.flags",
      "value": "Flags"
    },
    {
      "key": "update.available",
      "value": "Atualização disponível"
    },
    {
      "key": "update.version",
      "value": "Versão {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Agora não"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Atualizar e reiniciar"
    },
    {
      "key": "update.startingDownload",
      "value": "Iniciando download seguro…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Baixando atualização assinada…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Baixando: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB baixados"
    },
    {
      "key": "update.installing",
      "value": "Instalando atualização…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Atualização instalada. Reiniciando o editor…"
    },
    {
      "key": "update.installFailed",
      "value": "A atualização não pôde ser instalada. Sua versão atual permanece inalterada."
    },
    {
      "key": "actions.reset",
      "value": "Redefinir"
    },
    {
      "key": "actions.confirm",
      "value": "Confirmar"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Alterações confirmadas"
    },
    {
      "key": "actions.back",
      "value": "Voltar"
    },
    {
      "key": "actions.change",
      "value": "Alterar"
    },
    {
      "key": "actions.edit",
      "value": "Editar"
    },
    {
      "key": "characterForm.name",
      "value": "Nome:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coordenadas:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Tempo de jogo:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleporte:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Selecione uma localização"
    },
    {
      "key": "bosses.alive",
      "value": "Vivo"
    },
    {
      "key": "bosses.dead",
      "value": "Morto"
    }
  ],
  "ru": [
    {
      "key": "flags.card.confirm",
      "value": "Применить этот известный флаг сохранения? Перед сохранением создаётся резервная копия."
    },
    {
      "key": "flags.card.applied",
      "value": "Флаг применён к сохранению в памяти. Выберите «Сохранить изменения», чтобы записать файл."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Не удалось применить этот флаг: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Что изменится:"
    },
    {
      "key": "flags.card.careful",
      "value": "Внимание:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Проверенный байтовый шаблон:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Скрыть подробности"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Что это делает?"
    },
    {
      "key": "flags.card.applying",
      "value": "Применяется…"
    },
    {
      "key": "flags.card.apply",
      "value": "Применить"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Восстановить реплики Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Восстановление сюжета"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Восстанавливает небольшой набор реплик до встречи с Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Изменяет только состояние диалогов; не даёт предмета, уровня или награды за босса."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Применяйте сначала к копии сохранения, если вы находитесь в районе Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Включить наследственную колыбельную Куклы"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Наследственное поведение"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Повторно включает поведение колыбельной Куклы, связанное с оригинальным выпуском 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Восстанавливает наследственное состояние отображения. Не изменяет характеристики, инвентарь или награды за задания."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Поведение зависит от версии; сохраняйте резервную копию, пока персонаж не загрузится успешно."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Включить кооперативное поведение Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Поведение в мультиплеере"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Включает взаимодействие Blood-addled, связанное с кооперативными игроками, использующими руну Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Это изменяет поведение враждебности в мультиплеере, пока соблюдены соответствующие условия руны."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Используйте только оффлайн или с согласными игроками. Это может вызвать запутанное враждебное поведение в кооперативе."
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Оружие"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Броня"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Кровавые самоцветы (экспериментальное прямое добавление)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Руны Caryll (экспериментальное прямое добавление)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Добавить готовый самоцвет или руну"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Добавить оружие или броню"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Создаёт готовый кровавый самоцвет или руну Caryll напрямую из проверенных эффектов, когда в сохранении доступна безопасная повторно используемая запись."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Создаёт каталогизированное оружие или броню напрямую, когда в сохранении есть безопасный повторно используемый блок слота экипировки."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Прямой конструктор самоцветов и рун"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Экспериментально: операция использует только безопасную «осиротевшую» запись улучшения. Она никогда не меняет структуру сохранения. Сохраните автоматическую резервную копию, пока персонаж не загрузится нормально."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Экспериментально: операция использует только безопасный осиротевший блок слота экипировки и создаёт пять закрытых слотов для самоцветов. Откройте слоты позже через Самоцветы при необходимости."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Выберите проверенный первичный эффект перед добавлением самоцвета или руны."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Не удалось безопасно выполнить прямое добавление."
    },
    {
      "key": "inventory.addDirect",
      "value": "Добавить напрямую"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Добавить экипировку"
    },
    {
      "key": "inventory.gemShape",
      "value": "Форма самоцвета"
    },
    {
      "key": "inventory.runeType",
      "value": "Тип руны"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Редактировать {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Имя личного пресета {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Сохранён пресет «{{name}}» в «Моих пресетах» для Gem Forge и Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Преобразовать в {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Преобразовать этот {{source}} в {{destination}}? Сохраните автоматическую резервную копию, пока не протестируете сохранение."
    },
    {
      "key": "forge.unableToApply",
      "value": "Не удалось применить это изменение."
    },
    {
      "key": "forge.closeLabel",
      "value": "Закрыть {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Загрузка пресета обновляет только видимый черновик. Нажмите «Подтвердить» в редакторе, чтобы записать его в сохранение. Каждый эффект ниже берётся из встроенного проверенного каталога редактора. Личные пресеты используются и Gem Forge, и Rune Forge; редактор-приёмник сохраняет собственную допустимую форму или тип."
    },
    {
      "key": "forge.modeLabel",
      "value": "Режим {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Пресеты"
    },
    {
      "key": "forge.presetCategories",
      "value": "Категории пресетов"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Пользовательский набор эффектов {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Создать {{subject}} из шести эффектов"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Выберите до шести проверенных эффектов. Пустые слоты остаются без эффекта. Редактор снова проверит каждый выбранный идентификатор при подтверждении."
    },
    {
      "key": "forge.effect",
      "value": "Эффект {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Предпросмотр черновика"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Выберите хотя бы один эффект, чтобы загрузить пользовательский черновик."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Личные пресеты {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Личные пресеты, общие для Gem Forge и Rune Forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Сохраните отредактированный самоцвет или руну один раз, затем загрузите тот же пресет из Gem Forge или Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Личный"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Личный пресет Forge, общий для Gem Forge и Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Удалить личный пресет «{{name}}»?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Пока не сохранено ни одного личного пресета."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Отредактируйте самоцвет или руну, затем используйте «Сохранить как пресет», чтобы сделать его доступным в обоих Forge."
    },
    {
      "key": "forge.customName",
      "value": "Пользовательский {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Пользовательский набор — {{count}} выбранных эффектов."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Проверенный пресет руны Caryll."
    },
    {
      "key": "forge.categories.All",
      "value": "Все"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Атака"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Элементальное"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Восстановление"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Экспериментальные"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Личные"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Пользовательские"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Руны"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Физический апекс"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Физический урон, бонус при полном здоровье и поддержка прочности."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Питающий апекс"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Усиление всех видов урона, бонус при полном здоровье и восстановление."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Высокий урон Bloodtinge с поддержкой всех видов урона и восстановления."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Дробящий прорыв"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Высокий дробящий урон с поддержкой всех видов урона и прочности."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Специалист по колющему урону"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Высокий колющий урон с поддержкой всех видов урона и прочности."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Авангард"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Увеличение всех видов урона с физическим давлением и высоким бонусом к восстановлению."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Арканный всплеск"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Арканный урон с поддержкой восстановления и прочности."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Огненный всплеск"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Огненный урон с поддержкой всех видов урона и восстановления."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Всплеск молний"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Молниевый урон с поддержкой всех видов урона и прочности."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Элементальное вознесение"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Арканные, огненные и молниевые эффекты в одном преднамеренно экспериментальном наборе."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Длительная охота"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Поддержка восстановления, прочности и всех видов урона для долгих сессий исследования."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Абиcсальная жизнеспособность +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Использует встроенный эффект постоянного восстановления HP +75 с поддержкой прочности и урона."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Кованая выносливость"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Наиболее сильный известный бонус к прочности в комплекте, в сочетании с высоким восстановлением и физическим уроном."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Последний рубеж"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Высокие множители при критическом и полном здоровье. Используйте этот набор только оффлайн."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Хрупкая пушка"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Сочетает множители физического урона, всех видов урона и при критическом здоровье — только для тестирования."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Бесконечная охота"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Максимальные известные эффекты восстановления и прочности с бонусом урона при полном здоровье."
    },
    {
      "key": "update.available",
      "value": "Доступно обновление"
    },
    {
      "key": "update.version",
      "value": "Версия {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Не сейчас"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Обновить и перезапустить"
    },
    {
      "key": "update.startingDownload",
      "value": "Запуск защищённой загрузки…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Загрузка подписанного обновления…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Загрузка: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} МБ загружено"
    },
    {
      "key": "update.installing",
      "value": "Установка обновления…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Обновление установлено. Перезапуск редактора…"
    },
    {
      "key": "update.installFailed",
      "value": "Не удалось установить обновление. Ваша текущая версия не изменена."
    },
    {
      "key": "actions.reset",
      "value": "Сброс"
    },
    {
      "key": "actions.confirm",
      "value": "Подтвердить"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Изменения подтверждены"
    },
    {
      "key": "actions.back",
      "value": "Назад"
    },
    {
      "key": "actions.change",
      "value": "Изменить"
    },
    {
      "key": "actions.edit",
      "value": "Редактировать"
    },
    {
      "key": "characterForm.name",
      "value": "Имя:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Координаты:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Время игры:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Телепорт:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Выберите местоположение"
    },
    {
      "key": "bosses.alive",
      "value": "Жив"
    },
    {
      "key": "bosses.dead",
      "value": "Мёртв"
    }
  ],
  "de": [
    {
      "key": "flags.card.confirm",
      "value": "Diesen bekannten Save-Flag anwenden? Vor dem Speichern wird eine Sicherungskopie erstellt."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag auf den im Speicher geladenen Spielstand angewendet. Wähle 'Änderungen speichern', um die Datei zu schreiben."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Dieses Flag konnte nicht angewendet werden: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Änderungen:"
    },
    {
      "key": "flags.card.careful",
      "value": "Vorsicht:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Validiertes Byte-Muster:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Details verbergen"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Was bewirkt das?"
    },
    {
      "key": "flags.card.applying",
      "value": "Wende an…"
    },
    {
      "key": "flags.card.apply",
      "value": "Anwenden"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Lady Maria-Dialog wiederherstellen"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Narrative Wiederherstellung"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Stellt einige Dialogzeilen vor der Begegnung mit Lady Maria wieder her."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Ändert nur den Dialogzustand; gewährt kein Item, kein Level und keine Boss-Belohnung."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Auf einer Kopie des Saves ausführen, falls du dich derzeit im Astral Clocktower befindest."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Das alte Wiegenlied der Doll aktivieren"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Alte Darstellung"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Aktiviert das Wiegenlied-Verhalten der Doll, wie es in der ursprünglichen Version 1.0 vorhanden war."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Stellt einen alten Darstellungszustand wieder her. Es werden keine Attribute, kein Inventar und keine Quest-Belohnungen verändert."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Das Verhalten ist versionsabhängig; behalte die Sicherung, bis du den Charakter erfolgreich geladen hast."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Blood-addled-Koop-Verhalten aktivieren"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Multiplayer-Verhalten"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Aktiviert die Blood-addled-Interaktion, die mit Koop-Spielern verbunden ist, die die Hunter-Rune verwenden."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Ändert das feindselige Multiplayer-Verhalten, solange die relevanten Runenbedingungen erfüllt sind."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Nur offline oder mit einvernehmlichen Spielern verwenden. Es kann verwirrendes feindliches Koop-Verhalten erzeugen."
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Waffen"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Rüstung"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (experimentelles direktes Hinzufügen)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll-Runen (experimentelles direktes Hinzufügen)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Fertiges Gem oder Rune hinzufügen"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Waffe oder Rüstung hinzufügen"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Erstelle direkt ein fertiges Blood Gem oder eine Caryll-Rune aus validierten Effekten, wenn ein sicherer wiederverwendbarer Datensatz im Save verfügbar ist."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Erstelle direkt eine katalogisierte Waffe oder Rüstung, wenn der Save einen sicheren wiederverwendbaren Ausrüstungs-Slot-Block enthält."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Direkter Gem- und Runen-Editor"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimentell: Diese Operation verwendet nur einen sicheren verwaisten Aufwertungs-Datensatz. Sie verändert niemals das Save-Layout. Behalte die automatische Sicherung, bis der Charakter normal geladen wurde."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimentell: Diese Operation verwendet nur einen sicheren verwaisten Ausrüstungs-Slot-Block und erstellt fünf geschlossene Gem-Slots. Öffne die Slots später bei Bedarf mit Gems."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Wähle einen validierten ersten Effekt, bevor du ein Gem oder eine Rune hinzufügst."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Das direkte Hinzufügen konnte nicht sicher abgeschlossen werden."
    },
    {
      "key": "inventory.addDirect",
      "value": "Direkt hinzufügen"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Ausrüstung hinzufügen"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem-Form"
    },
    {
      "key": "inventory.runeType",
      "value": "Runen-Typ"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Bearbeite {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Name des persönlichen {{subject}}-Presets"
    },
    {
      "key": "forge.savedStatus",
      "value": "„{{name}}“ in Meine Voreinstellungen für Gem Forge und Rune Forge gespeichert."
    },
    {
      "key": "forge.convertTo",
      "value": "In {{subject}} konvertieren"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Dieses {{source}} in ein {{destination}} konvertieren? Behalte die automatische Sicherung, bis du den Save getestet hast."
    },
    {
      "key": "forge.unableToApply",
      "value": "Diese Änderung konnte nicht angewendet werden."
    },
    {
      "key": "forge.closeLabel",
      "value": "Schließe die {{subject}}-Schmiede"
    },
    {
      "key": "forge.notice",
      "value": "Das Laden eines Presets aktualisiert nur den sichtbaren Entwurf. Wähle im Editor 'Bestätigen', um ihn in den Save zu schreiben. Jeder Effekt unten stammt aus dem eingebetteten validierten Katalog des Editors. Persönliche Voreinstellungen werden von Gem-Schmiede und Runen-Schmiede geteilt; der Ziel-Editor behält seine eigene gültige Form bzw. seinen eigenen Typ."
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}}-Schmiede-Modus"
    },
    {
      "key": "forge.presets",
      "value": "Voreinstellungen"
    },
    {
      "key": "forge.presetCategories",
      "value": "Kategorien"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Benutzerdefinierter {{subject}}-Effekt-Satz"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Erstelle ein {{subject}} mit sechs Effekten"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Wähle bis zu sechs validierte Effekte. Leere Slots bleiben als 'Kein Effekt'. Der Editor validiert jede ausgewählte ID erneut, wenn du bestätigst."
    },
    {
      "key": "forge.effect",
      "value": "Effekt {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Entwurfs-Vorschau"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Wähle mindestens einen Effekt, um einen benutzerdefinierten Entwurf zu laden."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Persönliche {{subject}}-Voreinstellungen"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Persönliche Voreinstellungen, die von beiden Schmieden geteilt werden"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Speichere ein bearbeitetes Gem oder eine Rune einmal, und lade dann dieselbe Voreinstellung in der Gem-Schmiede oder Runen-Schmiede."
    },
    {
      "key": "forge.personal",
      "value": "Persönlich"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Persönliche Voreinstellung der Schmiede, geteilt von Gem-Schmiede und Runen-Schmiede."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Die persönliche Voreinstellung „{{name}}“ löschen?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Es wurde noch keine persönliche Voreinstellung gespeichert."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Bearbeite ein Gem oder eine Rune und verwende dann 'Als Voreinstellung speichern', um sie in beiden Schmieden verfügbar zu machen."
    },
    {
      "key": "forge.customName",
      "value": "Benutzerdefinierte {{subject}}-Schmiede"
    },
    {
      "key": "forge.customDescription",
      "value": "Benutzerdefiniertes Set — {{count}} gewählte Effekte."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Validierte Caryll-Runen-Voreinstellung."
    },
    {
      "key": "forge.categories.All",
      "value": "Alle"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Angriff"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementar"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Erholung"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimentell"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Persönlich"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Benutzerdefiniert"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runen"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Physisch"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Physischer Schaden, Bonus bei voller Gesundheit und Haltbarkeitsunterstützung."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Ernährend"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Verstärkung aller Schadensarten, Bonus bei voller Gesundheit und Erholung."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Hoher Bloodtinge-Schaden mit Unterstützung für alle Schadensarten und Erholung."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Stumpfbrecher"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Hoher stumpfer Schaden mit Unterstützung für alle Schadensarten und Haltbarkeit."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Stich-Spezialist"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Hoher Stich-Schaden mit Unterstützung für alle Schadensarten und Haltbarkeit."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vorhut"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Verstärkung aller Schadensarten mit physischem Druck und hohem Erholungsbonus."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arkaner Stoß"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arkaner Schaden mit Erholungs- und Haltbarkeitsunterstützung."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Flammenstoß"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Feuerschaden mit Unterstützung für alle Schadensarten und Erholung."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Blitzstoß"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Blitzschaden mit Unterstützung für alle Schadensarten und Haltbarkeit."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementarer Aufstieg"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arkan-, Feuer- und Blitz-Effekte in einem bewusst experimentellen Setup."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Ausdauernde Jagd"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Erholung, Haltbarkeit und Unterstützung für alle Schadensarten bei langen Erkundungssessions."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssale Vitalität +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Verwendet den eingebetteten kontinuierlichen HP-Erholungs-Effekt +75 mit Haltbarkeits- und Schadensunterstützung."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Geschmiedete Ausdauer"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Der stärkste bekannte gebündelte Haltbarkeitsbonus, kombiniert mit hoher Erholung und physischem Schaden."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Last Stand"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Hohe Multiplikatoren bei Nahtod- und Voll-Leben-Zuständen. Dieses Loadout offline verwenden."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glaskanone"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Kombiniert physische, alle-Schaden- und Nahtod-Multiplikatoren nur zum Testen."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Endlose Jagd"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maximale bekannte Erholungs- und Haltbarkeitseffekte mit einem Schadensbonus bei voller Gesundheit."
    },
    {
      "key": "sidebar.flags",
      "value": "Flags"
    },
    {
      "key": "update.available",
      "value": "Update verfügbar"
    },
    {
      "key": "update.version",
      "value": "Version {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Nicht jetzt"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Aktualisieren und neu starten"
    },
    {
      "key": "update.startingDownload",
      "value": "Sicherer Download wird gestartet…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Signiertes Update wird heruntergeladen…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Herunterladen: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB heruntergeladen"
    },
    {
      "key": "update.installing",
      "value": "Update wird installiert…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Update installiert. Editor wird neu gestartet…"
    },
    {
      "key": "update.installFailed",
      "value": "Das Update konnte nicht installiert werden. Deine aktuelle Version bleibt unverändert."
    },
    {
      "key": "actions.reset",
      "value": "Zurücksetzen"
    },
    {
      "key": "actions.confirm",
      "value": "Bestätigen"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Änderungen bestätigt"
    },
    {
      "key": "actions.back",
      "value": "Zurück"
    },
    {
      "key": "actions.change",
      "value": "Ändern"
    },
    {
      "key": "actions.edit",
      "value": "Bearbeiten"
    },
    {
      "key": "characterForm.name",
      "value": "Name:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinaten:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Spielzeit:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleport:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Ort auswählen"
    },
    {
      "key": "bosses.alive",
      "value": "Lebendig"
    },
    {
      "key": "bosses.dead",
      "value": "Tot"
    }
  ],
  "it": [
    {
      "key": "flags.card.confirm",
      "value": "Applicare questa flag di salvataggio? Verrà creato un backup prima del salvataggio."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag applicata al salvataggio in memoria. Seleziona Salva modifiche per scrivere il file."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Impossibile applicare questa flag: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Cosa cambia:"
    },
    {
      "key": "flags.card.careful",
      "value": "Attenzione:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Sequenza di byte validata:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Nascondi dettagli"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Cosa fa?"
    },
    {
      "key": "flags.card.applying",
      "value": "Applicazione…"
    },
    {
      "key": "flags.card.apply",
      "value": "Applica"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Ripristina i dialoghi di Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Ripristino narrativo"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Ripristina un piccolo insieme di battute antecedenti all'incontro con Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Modifica solo lo stato dei dialoghi; non concede oggetti, livelli o ricompense del boss."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Usalo prima su una copia del salvataggio se ti trovi attualmente nell'area Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Abilita la ninnananna originale della Bambola"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Presentazione originale"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Riattiva il comportamento della ninnananna della Bambola associato alla release originale 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Ripristina uno stato di presentazione originale. Non altera attributi, inventario o ricompense di missione."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Il comportamento è sensibile alla versione; conserva il backup finché il personaggio non viene caricato correttamente."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Abilita il comportamento cooperativo Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Comportamento multiplayer"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Abilita l'interazione Blood-addled associata ai giocatori cooperativi che usano la runa Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Modifica il comportamento di ostilità multiplayer mentre sono soddisfatte le condizioni della runa pertinente."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Usalo solo offline o con giocatori consenzienti. Può creare comportamenti cooperativi ostili e confusi."
    },
    {
      "key": "inventory.title",
      "value": "Inventario"
    },
    {
      "key": "inventory.addItem",
      "value": "Aggiungi oggetto"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Sostituisci oggetto"
    },
    {
      "key": "inventory.catalog",
      "value": "Catalogo"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Cerca nel catalogo"
    },
    {
      "key": "inventory.searchItems",
      "value": "Cerca elementi {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Quantità"
    },
    {
      "key": "inventory.addSelected",
      "value": "Aggiungi elemento selezionato"
    },
    {
      "key": "inventory.cancel",
      "value": "Annulla"
    },
    {
      "key": "inventory.close",
      "value": "Chiudi"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Armi"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armature"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Gemme del Sangue (aggiunta diretta sperimentale)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Rune di Caryll (aggiunta diretta sperimentale)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Aggiungi una gemma o runa finita"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Aggiungi un'arma o un'armatura"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Crea direttamente una Gemma del Sangue o una Runa di Caryll finita da effetti convalidati quando è disponibile un record riutilizzabile sicuro nel salvataggio."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Crea direttamente un'arma o un'armatura catalogata quando il salvataggio contiene un blocco di slot equipaggiamento riutilizzabile sicuro."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Generatore diretto di gemme e rune"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Sperimentale: questa operazione riutilizza solo un record di potenziamento orfano sicuro. Non modifica la struttura del salvataggio. Conserva il backup automatico finché il personaggio non viene caricato normalmente."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Sperimentale: questa operazione riutilizza solo un blocco di slot equipaggiamento orfano sicuro e crea cinque slot gemma chiusi. Apri gli slot in seguito con Gemme se necessario."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Scegli un primo effetto convalidato prima di aggiungere una gemma o runa."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "L'aggiunta diretta non è stata completata in sicurezza."
    },
    {
      "key": "inventory.addDirect",
      "value": "Aggiungi direttamente"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Aggiungi equipaggiamento"
    },
    {
      "key": "inventory.gemShape",
      "value": "Forma della gemma"
    },
    {
      "key": "inventory.runeType",
      "value": "Tipo di runa"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Seleziona un preset di runa"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Modifica {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nome del preset personale di {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Salvato \"{{name}}\" nei miei preset per Gem Forge e Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Converti in {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Convertire questo {{source}} in un {{destination}}? Conserva il backup automatico finché non hai testato il salvataggio."
    },
    {
      "key": "forge.unableToApply",
      "value": "Impossibile applicare questa modifica."
    },
    {
      "key": "forge.closeLabel",
      "value": "Chiudi {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Caricare un preset aggiorna solo la bozza visibile. Seleziona Conferma nell'editor per scriverlo nel salvataggio. Ogni effetto sotto proviene dal catalogo convalidato integrato dell'editor. I preset personali sono condivisi tra Gem Forge e Rune Forge; l'editor di destinazione mantiene la propria Forma o Tipo valido."
    },
    {
      "key": "forge.modeLabel",
      "value": "Modalità {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Preset"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorie preset"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Set di effetti {{subject}} personalizzato"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Costruisci un {{subject}} a sei effetti"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Scegli fino a sei effetti convalidati. Gli slot vuoti rimangono come Nessun effetto. L'editor convalida ogni ID selezionato nuovamente alla conferma."
    },
    {
      "key": "forge.effect",
      "value": "Effetto {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Anteprima bozza"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Scegli almeno un effetto per caricare una bozza personalizzata."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Preset personali di {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Preset personali condivisi da entrambe le forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Salva una gemma o runa modificata una volta, poi carica lo stesso preset da Gem Forge o Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Personale"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Preset personale di Forge condiviso da Gem Forge e Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Eliminare il preset personale \"{{name}}\"?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Nessun preset personale è stato ancora salvato."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Modifica una gemma o runa, poi usa Salva come preset per renderlo disponibile in entrambe le forge."
    },
    {
      "key": "forge.customName",
      "value": "Forge {{subject}} personalizzata"
    },
    {
      "key": "forge.customDescription",
      "value": "Set personalizzato — {{count}} effetto(i) selezionato(i)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Preset di Runa di Caryll convalidato."
    },
    {
      "key": "forge.categories.All",
      "value": "Tutti"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Attacco"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementale"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Recupero"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Sperimentale"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personale"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Personalizzato"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runa"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apice Fisico"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Danno fisico, pressione a piena salute e supporto alla durabilità."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apice Nutriente"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Amplificazione di tutti i danni con pressione a piena salute e recupero."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Cacciatore Bloodtinge"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Alto danno Bloodtinge con supporto a tutti i danni e recupero."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Spezzatore Contundente"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Alto danno contundente con supporto a tutti i danni e durabilità."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Specialista di Impatto"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Alto danno da punta con supporto a tutti i danni e durabilità."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Avanguardia"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Amplificazione di tutti i danni con pressione fisica e un alto bonus al recupero."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Impeto Arcano"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Danno arcano con supporto a recupero e durabilità."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Impeto di Fuoco"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Danno da fuoco con supporto a tutti i danni e recupero."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Impeto Fulmineo"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Danno da fulmine con supporto a tutti i danni e durabilità."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ascesa Elementale"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Effetti arcani, fuoco e fulmine in un loadout deliberatamente sperimentale."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Caccia Sostenuta"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Recupero, durabilità e supporto a tutti i danni per sessioni di esplorazione prolungate."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalità Abissale +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Utilizza l'effetto integrato di recupero HP continuo +75 con supporto a durabilità e danno."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Resistenza Forgiata"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Il più forte bonus combinato alla durabilità noto, abbinato a alto recupero e danno fisico."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Ultima Difesa"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Alti moltiplicatori in quasi-morte e a piena salute. Usa questo loadout offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Cannone di Vetro"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Accumula moltiplicatori fisici, a tutti i danni e in quasi-morte solo per test."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Caccia Infinita"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Massimi effetti noti di recupero e durabilità con un bonus al danno a piena salute."
    },
    {
      "key": "update.available",
      "value": "Aggiornamento disponibile"
    },
    {
      "key": "update.version",
      "value": "Versione {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Non ora"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Aggiorna e riavvia"
    },
    {
      "key": "update.startingDownload",
      "value": "Avvio download sicuro…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Download aggiornamento firmato…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Download: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB scaricati"
    },
    {
      "key": "update.installing",
      "value": "Installazione aggiornamento…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Aggiornamento installato. Riavvio dell'editor…"
    },
    {
      "key": "update.installFailed",
      "value": "L'aggiornamento non è riuscito. La versione attuale rimane invariata."
    },
    {
      "key": "actions.reset",
      "value": "Reimposta"
    },
    {
      "key": "actions.confirm",
      "value": "Conferma"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Modifiche confermate"
    },
    {
      "key": "actions.back",
      "value": "Indietro"
    },
    {
      "key": "actions.change",
      "value": "Cambia"
    },
    {
      "key": "actions.edit",
      "value": "Modifica"
    },
    {
      "key": "characterForm.name",
      "value": "Nome:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coordinate:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Tempo di gioco:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teletrasporta:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Seleziona una posizione"
    },
    {
      "key": "bosses.alive",
      "value": "Vivo"
    },
    {
      "key": "bosses.dead",
      "value": "Morto"
    }
  ],
  "nl": [
    {
      "key": "flags.card.confirm",
      "value": "Deze bekende save-flag toepassen? Er wordt een back-up gemaakt voordat er wordt opgeslagen."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag toegepast in het geheugen van de save. Kies 'Wijzigingen opslaan' om naar het bestand te schrijven."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Kan deze flag niet toepassen: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Wat verandert er:"
    },
    {
      "key": "flags.card.careful",
      "value": "Let op:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Gevalideerd bytepatroon:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Details verbergen"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Wat doet dit?"
    },
    {
      "key": "flags.card.applying",
      "value": "Bezig met toepassen…"
    },
    {
      "key": "flags.card.apply",
      "value": "Toepassen"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Herstel Lady Maria-dialogen"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Verhalend herstel"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Herstelt een kleine set dialoogregels van vóór de confrontatie met Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Wijzigt alleen de dialoogstatus; geeft geen item, level of beloning van een baas."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Gebruik eerst op een gekopieerde save als je je momenteel in de Astral Clocktower bevindt."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Activeer het originele slaapliedje van de Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Oorspronkelijke presentatie"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Herstelt het slaapliedgedrag van de Doll dat hoort bij de oorspronkelijke 1.0-release."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Herstelt alleen een oude presentatie‑status. Wijzigt geen attributen, inventaris of quest-beloningen."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Het gedrag is versiegevoelig; houd de back-up totdat je het personage succesvol hebt geladen."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Activeer Blood-addled coöp-gedrag"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Multiplayergedrag"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Activeert de Blood-addled-interactie die optreedt wanneer coöperatieve spelers de Hunter-rune gebruiken."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Wijzigt de vijandigheid in multiplayer zolang de relevante runevoorwaarden gelden."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Gebruik dit alleen offline of met instemmende spelers. Het kan verwarrend vijandig coöpgedrag veroorzaken."
    },
    {
      "key": "inventory.title",
      "value": "Inventaris"
    },
    {
      "key": "inventory.addItem",
      "value": "Voorwerp toevoegen"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Voorwerp vervangen"
    },
    {
      "key": "inventory.catalog",
      "value": "Catalogus"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Catalogus doorzoeken"
    },
    {
      "key": "inventory.searchItems",
      "value": "Zoek {{type}}-items"
    },
    {
      "key": "inventory.quantity",
      "value": "Aantal"
    },
    {
      "key": "inventory.addSelected",
      "value": "Geselecteerd item toevoegen"
    },
    {
      "key": "inventory.cancel",
      "value": "Annuleren"
    },
    {
      "key": "inventory.close",
      "value": "Sluiten"
    },
    {
      "key": "inventory.item",
      "value": "voorwerp"
    },
    {
      "key": "inventory.type.item",
      "value": "voorwerp"
    },
    {
      "key": "inventory.type.key",
      "value": "sleutelvoorwerp"
    },
    {
      "key": "inventory.type.chalice",
      "value": "kelk"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Wapens"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Harnassen"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Bloedparels (experimenteel - directe toevoeging)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll-runes (experimenteel - directe toevoeging)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Voeg een afgewerkte bloedparel of rune toe"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Voeg een wapen of harnas toe"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Maak direct een afgewerkte bloedparel of Caryll-rune aan op basis van gevalideerde effecten wanneer er een veilig herbruikbaar record in de save beschikbaar is."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Maak direct een gecatalogiseerd wapen of harnas aan wanneer de save een veilig herbruikbaar uitrustingsslotblok bevat."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Directe parel- en rune-bouwer"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimenteel: deze bewerking hergebruikt alleen een veilig verweesd upgrade-record. Het verschuift nooit de save‑indeling. Houd de automatische back-up totdat het personage normaal is geladen."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimenteel: deze bewerking hergebruikt alleen een veilig verweesd uitrustingsslotblok en maakt vijf gesloten parelsloten aan. Open de slots later met parels indien nodig."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Kies eerst een gevalideerd primair effect voordat je een parel of rune toevoegt."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "De directe toevoeging kon niet veilig worden voltooid."
    },
    {
      "key": "inventory.addDirect",
      "value": "Direct toevoegen"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Uitrusting toevoegen"
    },
    {
      "key": "inventory.gemShape",
      "value": "Parelvorm"
    },
    {
      "key": "inventory.runeType",
      "value": "Runetype"
    },
    {
      "key": "inventory.gems",
      "value": "Parels"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Selecteer een rune-preset"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Bewerk {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Persoonlijke {{subject}} presetnaam"
    },
    {
      "key": "forge.savedStatus",
      "value": "“{{name}}” opgeslagen in Mijn presets voor Gem Forge en Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Converteren naar {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Dit {{source}} omzetten naar een {{destination}}? Houd de automatische back-up totdat je de save getest hebt."
    },
    {
      "key": "forge.unableToApply",
      "value": "Kan deze wijziging niet toepassen."
    },
    {
      "key": "forge.closeLabel",
      "value": "Sluit {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Het laden van een preset werkt alleen de zichtbare conceptversie bij. Kies Bevestigen in de editor om het naar de save te schrijven. Elk effect hieronder komt uit de ingebedde gevalideerde catalogus van de editor. Persoonlijke presets worden gedeeld door Gem Forge en Rune Forge; de doelditor behoudt zijn eigen geldige Vorm of Type."
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge-modus"
    },
    {
      "key": "forge.presets",
      "value": "Voorinstellingen"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorieën voorinstellingen"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Aangepaste {{subject}} effectset"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Maak een {{subject}} met zes effecten"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Kies tot zes gevalideerde effecten. Lege slots blijven 'Geen effect'. De editor valideert elk geselecteerd ID opnieuw wanneer je bevestigt."
    },
    {
      "key": "forge.effect",
      "value": "Effect {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Conceptvoorbeeld"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Kies minstens één effect om een aangepast concept te laden."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Persoonlijke {{subject}}-presets"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Persoonlijke presets gedeeld door beide forges"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Sla eenmaal een bewerkte parel of rune op en laad daarna dezelfde preset vanuit Gem Forge of Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Persoonlijk"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Persoonlijke Forge-preset gedeeld door Gem Forge en Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Persoonlijke preset “{{name}}” verwijderen?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Er is nog geen persoonlijke preset opgeslagen."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Bewerk een parel of rune en gebruik daarna Opslaan als preset om het beschikbaar te maken in beide forges."
    },
    {
      "key": "forge.customName",
      "value": "Aangepaste {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Aangepaste set — {{count}} geselecteerde effect(en)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Gevalideerde Caryll-rune-preset."
    },
    {
      "key": "forge.categories.All",
      "value": "Alle"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Aanval"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementair"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Herstel"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimenteel"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Persoonlijk"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Aangepast"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Fysiek"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fysieke schade, druk bij volle gezondheid en duurzaamheidsondersteuning."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Voedend"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Versterking van alle schade met druk bij volle gezondheid en herstel."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge-jager"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Hoge Bloodtinge-schade met ondersteuning voor alle schade en herstel."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Stompbreker"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Hoge stomp-schade met ondersteuning voor alle schade en duurzaamheid."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Steekspecialist"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Hoge steek-schade met ondersteuning voor alle schade en duurzaamheid."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Voorhoede"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Versterking van alle schade met fysieke druk en een hoge herstelbonus."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arcane Opwelling"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arcane-schade met herstel- en duurzaamheidssteun."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Vlamgolf"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Vuurschade met ondersteuning voor alle schade en herstel."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Bliksemgolf"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Bliksemschade met ondersteuning voor alle schade en duurzaamheid."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementair Verheven"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arcane-, vuur- en bliksemeffecten gecombineerd in één opzettelijk experimentele uitrusting."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Duurzame Jacht"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Herstel-, duurzaamheid- en alle-schade-ondersteuning voor lange verkenningssessies."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssale Vitaliteit +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Maakt gebruik van het ingebedde +75 continue HP-herstel-effect, met ondersteuning voor duurzaamheid en schade."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Gesmede Uithouding"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "De sterkste bekende gebundelde duurzaamheidsbonus, gecombineerd met hoog herstel en fysieke schade."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Laatste Verdediging"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Hoge multipliers bij bijna dood en volle gezondheid. Houd deze uitrusting offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glazen Kanon"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Combineert fysieke, alle-schade en bijna-dood multipliers, uitsluitend voor testen."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Eindeloze Jacht"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maximale bekende herstel- en duurzaamheids-effecten met een schadebonus bij volle gezondheid."
    },
    {
      "key": "sidebar.flags",
      "value": "Flags"
    },
    {
      "key": "update.available",
      "value": "Update beschikbaar"
    },
    {
      "key": "update.version",
      "value": "Versie {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Later"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Updaten en herstarten"
    },
    {
      "key": "update.startingDownload",
      "value": "Beveiligde download starten…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Ondertekende update downloaden…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Downloaden: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB gedownload"
    },
    {
      "key": "update.installing",
      "value": "Update installeren…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Update geïnstalleerd. Editor wordt herstart…"
    },
    {
      "key": "update.installFailed",
      "value": "De update kon niet worden geïnstalleerd. Je huidige versie blijft ongewijzigd."
    },
    {
      "key": "actions.reset",
      "value": "Resetten"
    },
    {
      "key": "actions.confirm",
      "value": "Bevestigen"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Wijzigingen bevestigd"
    },
    {
      "key": "actions.back",
      "value": "Terug"
    },
    {
      "key": "actions.change",
      "value": "Wijzigen"
    },
    {
      "key": "actions.edit",
      "value": "Bewerken"
    },
    {
      "key": "characterForm.name",
      "value": "Naam:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coördinaten:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Speeltijd:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleporteren:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Selecteer een locatie"
    },
    {
      "key": "bosses.alive",
      "value": "Levend"
    },
    {
      "key": "bosses.dead",
      "value": "Dood"
    }
  ],
  "pl": [
    {
      "key": "flags.card.confirm",
      "value": "Zastosować ten znany znacznik zapisu? Przed zapisaniem zostanie utworzona kopia zapasowa."
    },
    {
      "key": "flags.card.applied",
      "value": "Znacznik zastosowany w zapisie w pamięci. Wybierz Zapisz zmiany, aby nadpisać plik."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Nie można zastosować tego znacznika: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Co się zmieni:"
    },
    {
      "key": "flags.card.careful",
      "value": "Uwaga:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Zwalidowany wzorzec bajtów:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Ukryj szczegóły"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Co to robi?"
    },
    {
      "key": "flags.card.applying",
      "value": "Zastosowywanie…"
    },
    {
      "key": "flags.card.apply",
      "value": "Zastosuj"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Przywróć dialog Lady Marii"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Przywrócenie narracji"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Przywraca niewielki zestaw linii dialogowych sprzed starcia z Lady Marią."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Zmienia tylko stan dialogu; nie przyznaje przedmiotu, poziomu ani nagrody za pokonanie bossa."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Najpierw użyj na skopiowanym zapisie, jeśli aktualnie znajdujesz się w obszarze Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Włącz dawną kołysankę Lalki"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Dziedzictwo prezentacji"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Ponownie włącza zachowanie kołysanki Lalki związane z oryginalnym wydaniem 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Przywraca jedynie starszy stan prezentacji. Nie zmienia atrybutów, ekwipunku ani nagród z zadań."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Zachowanie zależne od wersji; zachowaj kopię zapasową, dopóki postać nie zostanie poprawnie załadowana."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Włącz kooperacyjne zachowanie Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Zachowanie w trybie wieloosobowym"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Włącza interakcję Blood-addled związaną z graczami kooperującymi używającymi runy Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Zmienia zachowanie wrogości w trybie wieloosobowym, gdy spełnione są odpowiednie warunki runy."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Używać tylko offline lub z graczami wyrażającymi zgodę. Może powodować mylące, wrogie zachowanie w kooperacji."
    },
    {
      "key": "inventory.title",
      "value": "Ekwipunek"
    },
    {
      "key": "inventory.addItem",
      "value": "Dodaj przedmiot"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Zamień przedmiot"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Szukaj w katalogu"
    },
    {
      "key": "inventory.searchItems",
      "value": "Szukaj przedmiotów typu {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Ilość"
    },
    {
      "key": "inventory.addSelected",
      "value": "Dodaj wybrany przedmiot"
    },
    {
      "key": "inventory.cancel",
      "value": "Anuluj"
    },
    {
      "key": "inventory.close",
      "value": "Zamknij"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Broń"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Zbroje"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Klejnoty Krwi (eksperymentalne dodawanie bezpośrednie)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Runy Caryll (eksperymentalne dodawanie bezpośrednie)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Dodaj ukończony klejnot lub runę"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Dodaj broń lub zbroję"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Utwórz ukończony Klejnot Krwi lub Runę Caryll bezpośrednio z zatwierdzonych efektów, jeśli w zapisie znajduje się bezpieczny, możliwy do ponownego użycia rekord."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Utwórz bezpośrednio skatalogowaną broń lub zbroję, gdy zapis zawiera bezpieczny, wielokrotnego użytku blok slotu wyposażenia."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Bezpośredni kreator klejnotów i run"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Eksperymentalne: operacja ponownie wykorzystuje tylko bezpieczny, osierocony rekord ulepszenia. Nigdy nie zmienia układu zapisu. Zachowaj automatyczną kopię zapasową, dopóki postać nie załaduje się poprawnie."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Eksperymentalne: operacja ponownie wykorzystuje tylko bezpieczny, osierocony blok slotu wyposażenia i tworzy pięć zamkniętych miejsc na klejnoty. Otwórz je później w sekcji Klejnoty, jeśli będzie to potrzebne."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Wybierz zatwierdzony pierwszy efekt przed dodaniem klejnotu lub runy."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Nie udało się bezpiecznie dodać elementu bezpośrednio."
    },
    {
      "key": "inventory.addDirect",
      "value": "Dodaj bezpośrednio"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Dodaj wyposażenie"
    },
    {
      "key": "inventory.gemShape",
      "value": "Kształt klejnotu"
    },
    {
      "key": "inventory.runeType",
      "value": "Typ runy"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Wybierz preset runy"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Edytuj {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nazwa osobistego presetu {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Zapisano „{{name}}” w Moje presety dla Gem Forge i Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Konwertuj na {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Konwertować ten {{source}} na {{destination}}? Zachowaj automatyczną kopię zapasową, dopóki nie przetestujesz zapisu."
    },
    {
      "key": "forge.unableToApply",
      "value": "Nie można zastosować tej zmiany."
    },
    {
      "key": "forge.closeLabel",
      "value": "Zamknij {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Wczytanie presetu aktualizuje jedynie widoczny szkic. Wybierz Potwierdź w edytorze, aby zapisać go do zapisu. Każdy efekt poniżej pochodzi z wbudowanego, zweryfikowanego katalogu edytora. Presety osobiste są współdzielone między Gem Forge i Rune Forge; edytor docelowy zachowuje własny prawidłowy kształt lub typ."
    },
    {
      "key": "forge.modeLabel",
      "value": "Tryb {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Presety"
    },
    {
      "key": "forge.presetCategories",
      "value": "Kategorie presetów"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Niestandardowy zestaw efektów {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Stwórz {{subject}} z sześcioma efektami"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Wybierz do sześciu zatwierdzonych efektów. Puste sloty pozostaną jako Brak efektu. Edytor ponownie waliduje każdy wybrany identyfikator po potwierdzeniu."
    },
    {
      "key": "forge.effect",
      "value": "Efekt {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Podgląd szkicu"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Wybierz przynajmniej jeden efekt, aby załadować niestandardowy szkic."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Osobiste presety {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Osobiste presety współdzielone przez Gem Forge i Rune Forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Zapisz edytowany klejnot lub runę raz, a następnie załaduj ten sam preset z Gem Forge lub Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Osobiste"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Osobisty preset Forge współdzielony przez Gem Forge i Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Usunąć osobisty preset „{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Nie zapisano jeszcze żadnego osobistego presetu."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Edytuj klejnot lub runę, a następnie użyj Zapisz jako preset, aby udostępnić go w obu Forge'ach."
    },
    {
      "key": "forge.customName",
      "value": "Niestandardowy {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Niestandardowy zestaw — wybrano {{count}} efektów."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Zatwierdzony preset Runy Caryll."
    },
    {
      "key": "forge.categories.All",
      "value": "Wszystkie"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Atak"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Żywiołowy"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Odzyskiwanie"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Eksperymentalne"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Osobiste"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Niestandardowe"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runy"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex (fizyczny)"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Obrażenia fizyczne, presja przy pełnym zdrowiu i wsparcie wytrzymałości."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex (odżywczy)"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Zwiększenie wszystkich obrażeń z presją przy pełnym zdrowiu i regeneracją."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Wysokie obrażenia Bloodtinge z wsparciem dla wszystkich obrażeń i regeneracji."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Specjalista obuchowy"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Wysokie obrażenia obuchowe z wsparciem dla wszystkich obrażeń i wytrzymałości."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Specjalista pchnięć"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Wysokie obrażenia kłute z wsparciem dla wszystkich obrażeń i wytrzymałości."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Awangarda"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Wzmocnienie wszystkich obrażeń z presją fizyczną i dużym bonusem do regeneracji."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Nawał Arkan"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Obrażenia arkaniczne z wsparciem regeneracji i wytrzymałości."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Fala Płomieni"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Obrażenia ogniem z wsparciem wszystkich obrażeń i regeneracji."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Fala Błyskawic"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Obrażenia błyskawicą z wsparciem wszystkich obrażeń i wytrzymałości."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Wzlot Żywiołów"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efekty arkaniczne, ogniem i błyskawicą w jednym celowo eksperymentalnym zestawie."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Długotrwałe polowanie"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Wsparcie regeneracji, wytrzymałości i wszystkich obrażeń dla długich sesji eksploracji."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Używa wbudowanego efektu ciągłej regeneracji HP +75 wraz z wsparciem wytrzymałości i obrażeń."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Wykuwana Wytrzymałość"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Najsilniejszy znany pakiet bonusu do wytrzymałości w parze z wysoką regeneracją i obrażeniami fizycznymi."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Ostatni Opór"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Wysokie mnożniki przy niemal śmierci i przy pełnym zdrowiu. Zachowaj ten zestaw offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Szklana Armata"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Nakłada się mnożnikami obrażeń fizycznych, wszystkich obrażeń i przy niemal śmierci — tylko do testów."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Niekończące się polowanie"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maksymalne znane efekty regeneracji i wytrzymałości z bonusem do obrażeń przy pełnym zdrowiu."
    },
    {
      "key": "update.available",
      "value": "Dostępna aktualizacja"
    },
    {
      "key": "update.version",
      "value": "Wersja {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Nie teraz"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Aktualizuj i uruchom ponownie"
    },
    {
      "key": "update.startingDownload",
      "value": "Rozpoczynanie bezpiecznego pobierania…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Pobieranie podpisanej aktualizacji…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Pobieranie: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB pobrane"
    },
    {
      "key": "update.installing",
      "value": "Instalowanie aktualizacji…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Aktualizacja zainstalowana. Ponowne uruchamianie edytora…"
    },
    {
      "key": "update.installFailed",
      "value": "Nie udało się zainstalować aktualizacji. Twoja obecna wersja pozostaje bez zmian."
    },
    {
      "key": "actions.reset",
      "value": "Resetuj"
    },
    {
      "key": "actions.confirm",
      "value": "Potwierdź"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Zmiany potwierdzone"
    },
    {
      "key": "actions.back",
      "value": "Wstecz"
    },
    {
      "key": "actions.change",
      "value": "Zmień"
    },
    {
      "key": "actions.edit",
      "value": "Edytuj"
    },
    {
      "key": "characterForm.name",
      "value": "Nazwa:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Współrzędne:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Czas gry:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleport:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Wybierz lokalizację"
    },
    {
      "key": "bosses.alive",
      "value": "Żywy"
    },
    {
      "key": "bosses.dead",
      "value": "Pokonany"
    }
  ],
  "tr": [
    {
      "key": "flags.card.confirm",
      "value": "Bu bilinen kayıt bayrağı uygulanacak mı? Kaydetmeden önce bir yedek oluşturulur."
    },
    {
      "key": "flags.card.applied",
      "value": "Bayrak bellek içi kayda uygulandı. Dosyayı yazmak için Değişiklikleri kaydet'i seçin."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Bu bayrak uygulanamadı: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Ne değişecek:"
    },
    {
      "key": "flags.card.careful",
      "value": "Dikkat:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Doğrulanmış bayt deseni:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Detayları gizle"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Bu ne yapar?"
    },
    {
      "key": "flags.card.applying",
      "value": "Uygulanıyor…"
    },
    {
      "key": "flags.card.apply",
      "value": "Uygula"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Lady Maria diyalogunu geri yükle"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Anlatı geri yüklemesi"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Lady Maria karşılaşmasından önceki küçük bir diyalog setini geri yükler."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Bu yalnızca diyalog durumunu değiştirir; herhangi bir eşya, seviye veya boss ödülü vermez."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Şu anda Astral Clocktower bölgesindeyseniz önce kopyalanmış bir kayıtta kullanın."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Doll'un eski ninnisini etkinleştir"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Eski sunum"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Doll'un 1.0 sürümündeki ninni davranışını tekrar etkinleştirir."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Bu bir eski sunum durumunu geri yükler. Nitelikleri, envanteri veya görev ödüllerini değiştirmez."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Davranış sürüme duyarlıdır; karakteri başarıyla yükleyene kadar yedeği saklayın."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Blood-addled kooperatif davranışını etkinleştir"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Çok oyunculu davranış"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Hunter rune kullanan kooperatif oyuncularla ilişkili Blood-addled etkileşimini etkinleştirir."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "İlgili rune koşulları sağlandığında çok oyunculu düşmanlık davranışını değiştirir."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Bunu yalnızca çevrimdışıyken veya rızalı oyuncularla kullanın. Kafa karıştırıcı düşmanca kooperatif davranışlar yaratabilir."
    },
    {
      "key": "inventory.title",
      "value": "Envanter"
    },
    {
      "key": "inventory.addItem",
      "value": "Öğe ekle"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Öğeyi değiştir"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Kataloğu ara"
    },
    {
      "key": "inventory.searchItems",
      "value": "{{type}} öğelerini ara"
    },
    {
      "key": "inventory.quantity",
      "value": "Miktar"
    },
    {
      "key": "inventory.addSelected",
      "value": "Seçilen öğeyi ekle"
    },
    {
      "key": "inventory.cancel",
      "value": "İptal"
    },
    {
      "key": "inventory.close",
      "value": "Kapat"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Silahlar"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Zırhlar"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (deneysel doğrudan ekleme)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (deneysel doğrudan ekleme)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Tamamlanmış bir gem veya rune ekle"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Silah veya zırh ekle"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Kayında güvenli, yeniden kullanılabilir bir kayıt varsa, doğrulanmış etkilerden doğrudan tamamlanmış bir Blood Gem veya Caryll Rune oluşturur."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Kaydın güvenli yeniden kullanılabilir bir ekipman yuvası bloğu içerdiği durumlarda kataloglanmış bir silah veya zırhı doğrudan oluşturur."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Doğrudan gem ve rune oluşturucu"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Deneysel: bu işlem yalnızca güvenli, sahipsiz bir yükseltme kaydını yeniden kullanır. Kayıt düzenini asla değiştirmez. Karakter normal şekilde yüklenene kadar otomatik yedeği saklayın."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Deneysel: bu işlem yalnızca güvenli, sahipsiz bir ekipman yuvası bloğunu yeniden kullanır ve beş kapalı gem yuvası oluşturur. Gerekirse yuvaları daha sonra Gems ile açın."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Bir gem veya rune eklemeden önce doğrulanmış bir ilk etki seçin."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Doğrudan ekleme güvenli şekilde tamamlanamadı."
    },
    {
      "key": "inventory.addDirect",
      "value": "Doğrudan ekle"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Ekipman ekle"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem şekli"
    },
    {
      "key": "inventory.runeType",
      "value": "Rune türü"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Bir rune ön ayarı seçin"
    },
    {
      "key": "forge.dialogLabel",
      "value": "{{subject}} öğesini düzenle"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Kişisel {{subject}} ön ayarı adı"
    },
    {
      "key": "forge.savedStatus",
      "value": "Gem Forge ve Rune Forge için Kişisel önayarlarımda “{{name}}” kaydedildi."
    },
    {
      "key": "forge.convertTo",
      "value": "{{subject}}'e dönüştür"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Bu {{source}} öğesini bir {{destination}}'e dönüştürmek istiyor musunuz? Kayıdı test edene kadar otomatik yedeği saklayın."
    },
    {
      "key": "forge.unableToApply",
      "value": "Bu değişiklik uygulanamadı."
    },
    {
      "key": "forge.closeLabel",
      "value": "{{subject}} Forge'u kapat"
    },
    {
      "key": "forge.notice",
      "value": "Bir önayarı yüklemek yalnızca görünür taslağı günceller. Kayda yazmak için editörde Onayla'yı seçin. Aşağıdaki her etki editörün gömülü doğrulanmış kataloğundan gelir. Kişisel önayarlar Gem Forge ve Rune Forge tarafından paylaşılır; hedef editör kendi geçerli Şekil veya Türünü korur."
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge modu"
    },
    {
      "key": "forge.presets",
      "value": "Önayarlar"
    },
    {
      "key": "forge.presetCategories",
      "value": "Önayar kategorileri"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Özel {{subject}} etki seti"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Altı etkili bir {{subject}} oluştur"
    },
    {
      "key": "forge.customSetDescription",
      "value": "En fazla altı doğrulanmış etki seçin. Boş yuvalar 'No Effect' olarak kalır. Onayladığınızda editör seçilen her ID'yi yeniden doğrular."
    },
    {
      "key": "forge.effect",
      "value": "Etki {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Taslak önizleme"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Özel bir taslak yüklemek için en az bir etki seçin."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Kişisel {{subject}} önayarları"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Her iki forge tarafından paylaşılan kişisel önayarlar"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Düzenlenmiş bir gem veya rune'u bir kez kaydedin, sonra aynı önayarı Gem Forge veya Rune Forge'dan yükleyin."
    },
    {
      "key": "forge.personal",
      "value": "Kişisel"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Gem Forge ve Rune Forge tarafından paylaşılan kişisel Forge önayarı."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Kişisel önayar “{{name}}” silinsin mi?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Henüz kişisel bir önayar kaydedilmedi."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Bir gem veya rune'u düzenleyin, ardından Her iki forge'da kullanılabilir hale getirmek için 'Önayar olarak kaydet'i kullanın."
    },
    {
      "key": "forge.customName",
      "value": "Özel {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Özel set — {{count}} seçilmiş etki."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Doğrulanmış Caryll Rune önayarı."
    },
    {
      "key": "forge.categories.All",
      "value": "Tümü"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Saldırı"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "İyileşme"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Deneysel"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Kişisel"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Özel"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Fiziksel"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fiziksel hasar, tam sağlık baskısı ve dayanıklılık desteği."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Besleyici"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Tüm hasar artırımı, tam sağlık baskısı ve iyileşme."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Yüksek Bloodtinge hasarı ile tüm hasar ve iyileşme desteği."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Küt Kırıcı"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Yüksek küt hasar, tüm hasar ve dayanıklılık desteği."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Saplama Uzmanı"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Yüksek saplama hasarı, tüm hasar ve dayanıklılık desteği."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Öncü"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Fiziksel baskı ve yüksek iyileşme bonusu ile tüm hasar artırımı."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Esrarengiz Atılım"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Esrarengiz hasar ile iyileşme ve dayanıklılık desteği."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Alev Atılımı"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Ateş hasarı, tüm hasar ve iyileşme desteği."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Yıldırım Atılımı"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Yıldırım hasarı, tüm hasar ve dayanıklılık desteği."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementsel Yükseliş"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Esrarengiz, ateş ve yıldırım etkilerini içeren kasıtlı olarak deneysel bir düzen."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Sürekli Av"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Uzun keşif oturumları için iyileşme, dayanıklılık ve tüm hasar desteği."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Gömülü +75 sürekli HP iyileşme etkisini dayanıklılık ve hasar desteği ile kullanır."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Kovulmuş Dayanıklılık"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Bilinen en güçlü paketlenmiş dayanıklılık bonusu, yüksek iyileşme ve fiziksel hasarla eşleştirilmiştir."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Son Direniş"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Yüksek ölüm eşiği ve tam sağlık çarpanları. Bu düzenlemeyi çevrimdışında kullanın."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glass Cannon"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Sadece test için fiziksel, tüm hasar ve ölüm eşiği çarpanlarını yığar."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Sonsuz Av"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Tam sağlık hasar bonusu ile bilinen maksimum iyileşme ve dayanıklılık etkileri."
    },
    {
      "key": "update.available",
      "value": "Güncelleme var"
    },
    {
      "key": "update.version",
      "value": "Sürüm {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Şimdi değil"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Güncelle ve yeniden başlat"
    },
    {
      "key": "update.startingDownload",
      "value": "Güvenli indirme başlatılıyor…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "İmzalı güncelleme indiriliyor…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "İndiriliyor: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB indirildi"
    },
    {
      "key": "update.installing",
      "value": "Güncelleme kuruluyor…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Güncelleme yüklendi. Editör yeniden başlatılıyor…"
    },
    {
      "key": "update.installFailed",
      "value": "Güncelleme kurulamadı. Mevcut sürümünüz değişmedi."
    },
    {
      "key": "actions.reset",
      "value": "Sıfırla"
    },
    {
      "key": "actions.confirm",
      "value": "Onayla"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Değişiklikler onaylandı"
    },
    {
      "key": "actions.back",
      "value": "Geri"
    },
    {
      "key": "actions.change",
      "value": "Değiştir"
    },
    {
      "key": "actions.edit",
      "value": "Düzenle"
    },
    {
      "key": "characterForm.name",
      "value": "İsim:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinatlar:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Oynama süresi:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Işınlan:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Bir konum seçin"
    },
    {
      "key": "bosses.alive",
      "value": "Hayatta"
    },
    {
      "key": "bosses.dead",
      "value": "Ölü"
    }
  ],
  "uk": [
    {
      "key": "flags.card.confirm",
      "value": "Застосувати цей відомий прапорець збереження? Перед записом робиться резервна копія."
    },
    {
      "key": "flags.card.applied",
      "value": "Прапорець застосовано до збереження в пам'яті. Виберіть «Зберегти зміни», щоб записати файл."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Не вдалося застосувати цей прапорець: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Що зміниться:"
    },
    {
      "key": "flags.card.careful",
      "value": "Увага:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Перевірений байтовий шаблон:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Приховати деталі"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Що це робить?"
    },
    {
      "key": "flags.card.applying",
      "value": "Застосування…"
    },
    {
      "key": "flags.card.apply",
      "value": "Застосувати"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Відновити діалоги Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Відновлення сюжету"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Відновлює кілька рядків діалогу, що передували зустрічі з Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Це змінює лише стан діалогів; не дає предметів, рівнів або нагороди за боса."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Спочатку використайте на копії збереження, якщо ви зараз у зоні Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Увімкнути спадкову колискову Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Спадкова подача"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Повторно вмикає поведінку колискової Doll, пов’язану з оригінальним релізом 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Відновлює лише спадковий стан презентації. Не змінює атрибути, інвентар або нагороди за квести."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Поведінка залежить від версії; зберігайте резервну копію, поки персонаж не завантажиться успішно."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Увімкнути Blood-addled кооперативну поведінку"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Мультиплеєрна поведінка"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Увімкнути взаємодію Blood-addled, пов’язану з кооперативними гравцями, що використовують руну Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Це змінює поведінку ворожості в мультиплеєрі, поки виконуються відповідні умови руни."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Використовуйте лише офлайн або з погодженими гравцями. Це може спричинити заплутану ворожу поведінку в кооперативі."
    },
    {
      "key": "inventory.title",
      "value": "Інвентар"
    },
    {
      "key": "inventory.addItem",
      "value": "Додати предмет"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Замінити предмет"
    },
    {
      "key": "inventory.catalog",
      "value": "Каталог"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Пошук у каталозі"
    },
    {
      "key": "inventory.searchItems",
      "value": "Шукати предмети {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Кількість"
    },
    {
      "key": "inventory.addSelected",
      "value": "Додати вибраний предмет"
    },
    {
      "key": "inventory.cancel",
      "value": "Скасувати"
    },
    {
      "key": "inventory.close",
      "value": "Закрити"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Зброя"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Броня"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (експериментальне пряме додавання)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (експериментальне пряме додавання)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Додати готовий самоцвіт або руну"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Додати зброю або броню"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Створити готовий Blood Gem або Caryll Rune безпосередньо з перевірених ефектів, коли у збереженні є безпечний повторно використовуваний запис."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Створити каталожну зброю або броню безпосередньо, якщо в збереженні є безпечний повторно використовуваний блок слота екіпіровки."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Прямий конструктор самоцвітів і рун"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Експериментально: ця операція повторно використовує лише безпечний покинутий запис покращення. Вона ніколи не змінює структуру збереження. Зберігайте автоматичну резервну копію, поки персонаж не завантажиться нормально."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Експериментально: ця операція повторно використовує лише безпечний покинутий блок слота екіпіровки і створює п'ять закритих слотів для самоцвітів. За потреби відкрийте слоти пізніше через розділ Gems."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Виберіть перевірений первинний ефект перед додаванням самоцвіту або руни."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Пряме додавання не вдалося виконати безпечно."
    },
    {
      "key": "inventory.addDirect",
      "value": "Додати напряму"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Додати екіпіровку"
    },
    {
      "key": "inventory.gemShape",
      "value": "Форма самоцвіту"
    },
    {
      "key": "inventory.runeType",
      "value": "Тип руни"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Виберіть пресет руни"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Редагувати {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Назва персонального пресету {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Збережено «{{name}}» у Моїх пресетах для Gem Forge і Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Конвертувати в {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Конвертувати цей {{source}} у {{destination}}? Зберігайте автоматичну резервну копію, поки не перевірите збереження."
    },
    {
      "key": "forge.unableToApply",
      "value": "Не вдалося застосувати цю зміну."
    },
    {
      "key": "forge.closeLabel",
      "value": "Закрити {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Завантаження пресету оновлює лише видимий чернетку. Виберіть Підтвердити в редакторі, щоб записати його в збереження. Кожен ефект нижче походить з вбудованого перевіреного каталогу редактора. Персональні пресети спільні для Gem Forge та Rune Forge; цільовий редактор використовує власну допустиму Shape або Type."
    },
    {
      "key": "forge.modeLabel",
      "value": "Режим {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Пресети"
    },
    {
      "key": "forge.presetCategories",
      "value": "Категорії пресетів"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Користувацький набір ефектів {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Створити {{subject}} з шістьма ефектами"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Виберіть до шести перевірених ефектів. Порожні слоти залишаться як No Effect. Редактор перевіряє кожен вибраний ID знову при підтвердженні."
    },
    {
      "key": "forge.effect",
      "value": "Ефект {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Попередній перегляд чернетки"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Виберіть щонайменше один ефект, щоб завантажити користувацьку чернетку."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Персональні пресети {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Персональні пресети, спільні для обох кузнь"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Збережіть відредагований самоцвіт або руну один раз, після чого можна буде завантажити той самий пресет у Gem Forge або Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Персональні"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Персональний пресет Forge, спільний для Gem Forge і Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Видалити персональний пресет «{{name}}»?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Ще не збережено жодного персонального пресету."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Відредагуйте самоцвіт або руну, а потім використайте «Зберегти як пресет», щоб зробити його доступним в обох кузнях."
    },
    {
      "key": "forge.customName",
      "value": "Користувацький {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Користувацький набір — обрано {{count}} ефект(ів)."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Перевірений пресет Caryll Rune."
    },
    {
      "key": "forge.categories.All",
      "value": "Усі"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Атака"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Елементальний"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Відновлення"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Експериментальний"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Персональні"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Користувацькі"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Руна"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Physical"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Фізичний урон, бонус при повному здоров'ї та підтримка міцності."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Nourishing"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Посилення всіх видів шкоди з бонусом при повному здоров'ї і відновленням."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Високий урон від Bloodtinge з підтримкою всього шкоди та відновленням."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Blunt Breaker"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Високий дроблячий урон із підтримкою всього шкоди та міцності."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Thrust Specialist"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Високий колючий урон із підтримкою всього шкоди та міцності."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vanguard"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Посилення всіх видів шкоди з фізичним тиском і великим бонусом відновлення."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arcane Surge"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Арканний урон із підтримкою відновлення та міцності."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Flame Surge"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Вогняний урон із підтримкою всього шкоди та відновлення."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Bolt Surge"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Блискавичний урон із підтримкою всього шкоди та міцності."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elemental Ascendant"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Арканні, вогняні та блискавичні ефекти в одному навмисно експериментальному наборі."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Sustained Hunt"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Відновлення, міцність і підтримка всього шкоди для тривалих походів."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Використовує вбудований ефект безперервного відновлення HP +75 з підтримкою міцності та шкоди."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Forged Endurance"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Найсильніший відомий пакет бонусу міцності поєднаний з високим відновленням та фізичним уроном."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Last Stand"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Високі множники при майже смерті і повному здоров'ї. Використовуйте цей набір поза мережею."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glass Cannon"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Накопичує фізичні, загальні і множники при майже смерті — лише для тестування."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Endless Hunt"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Максимальні відомі ефекти відновлення і міцності з бонусом до шкоди при повному здоров'ї."
    },
    {
      "key": "update.available",
      "value": "Доступне оновлення"
    },
    {
      "key": "update.version",
      "value": "Версія {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Не зараз"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Оновити та перезапустити"
    },
    {
      "key": "update.startingDownload",
      "value": "Починаю безпечне завантаження…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Завантаження підписаного оновлення…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Завантаження: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "Завантажено {{megabytes}} МБ"
    },
    {
      "key": "update.installing",
      "value": "Встановлення оновлення…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Оновлення встановлено. Перезапуск редактора…"
    },
    {
      "key": "update.installFailed",
      "value": "Оновлення не вдалося встановити. Поточна версія залишилася без змін."
    },
    {
      "key": "actions.reset",
      "value": "Скинути"
    },
    {
      "key": "actions.confirm",
      "value": "Підтвердити"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Зміни підтверджено"
    },
    {
      "key": "actions.back",
      "value": "Назад"
    },
    {
      "key": "actions.change",
      "value": "Змінити"
    },
    {
      "key": "actions.edit",
      "value": "Редагувати"
    },
    {
      "key": "characterForm.name",
      "value": "Ім'я:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Координати:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Час гри:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Телепорт:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Вибрати локацію"
    },
    {
      "key": "bosses.alive",
      "value": "Живий"
    },
    {
      "key": "bosses.dead",
      "value": "Мертвий"
    }
  ],
  "ja": [
    {
      "key": "flags.card.confirm",
      "value": "この既知のセーブフラグを適用しますか？ 保存前にバックアップを作成します。"
    },
    {
      "key": "flags.card.applied",
      "value": "フラグはメモリ上のセーブに適用されました。ファイルに書き込むには「変更を保存」を選択してください。"
    },
    {
      "key": "flags.card.applyFailed",
      "value": "このフラグを適用できませんでした: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "変更点："
    },
    {
      "key": "flags.card.careful",
      "value": "注意："
    },
    {
      "key": "flags.card.bytePattern",
      "value": "検証済みバイトパターン："
    },
    {
      "key": "flags.card.hideDetails",
      "value": "詳細を非表示"
    },
    {
      "key": "flags.card.showDetails",
      "value": "これは何をしますか？"
    },
    {
      "key": "flags.card.applying",
      "value": "適用中…"
    },
    {
      "key": "flags.card.apply",
      "value": "適用"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Lady Mariaの会話を復元"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "ストーリー復元"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Lady Mariaとの遭遇前の一部の会話行を復元します。"
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "これは会話状態のみを変更します。アイテムやレベル、ボス報酬は付与されません。"
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "現在 Astral Clocktower エリアにいる場合は、まずセーブのコピーで実行してください。"
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Dollの旧仕様の子守唄を有効にする"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "旧表示"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "1.0初期版にあったDollの子守唄の挙動を再有効化します。"
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "見た目に関する旧仕様の状態を復元します。能力値、所持品、クエスト報酬は変更されません。"
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "この挙動はバージョンに依存します。キャラクターが正常に読み込まれるまでバックアップを保持してください。"
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Blood-addled の協力プレイ挙動を有効にする"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "マルチプレイヤー挙動"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Hunter ルーンを装備した協力プレイヤーに関連する Blood-addled の挙動を有効にします。"
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "該当ルーンの条件が満たされている間、マルチプレイヤーの敵対挙動が変更されます。"
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "オフラインで、または同意のあるプレイヤーとのみ使用してください。敵対的な協力プレイで混乱を招く可能性があります。"
    },
    {
      "key": "inventory.title",
      "value": "所持品"
    },
    {
      "key": "inventory.addItem",
      "value": "アイテムを追加"
    },
    {
      "key": "inventory.replaceItem",
      "value": "アイテムを置換"
    },
    {
      "key": "inventory.catalog",
      "value": "カタログ"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "カタログを検索"
    },
    {
      "key": "inventory.searchItems",
      "value": "{{type}}のアイテムを検索"
    },
    {
      "key": "inventory.quantity",
      "value": "数量"
    },
    {
      "key": "inventory.addSelected",
      "value": "選択したアイテムを追加"
    },
    {
      "key": "inventory.cancel",
      "value": "キャンセル"
    },
    {
      "key": "inventory.close",
      "value": "閉じる"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "武器"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "防具"
    },
    {
      "key": "inventory.catalogGems",
      "value": "血の宝石（実験的・直接追加）"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll ルーン（実験的な直接追加）"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "完成した宝石またはルーンを追加"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "武器または防具を追加"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "セーブ内に安全に再利用できるレコードがある場合、検証済み効果から完成済みの血の宝石またはCaryllルーンを直接作成します。"
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "セーブに安全に再利用できる装備スロットブロックが含まれている場合、カタログ化された武器または防具を直接作成します。"
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "宝石・ルーン直接作成"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "実験的機能：この操作は安全な孤立した強化レコードのみを再利用します。セーブのレイアウトを変更することはありません。キャラクターが正常に読み込まれるまで自動バックアップを保持してください。"
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "実験的機能：この操作は安全な孤立装備スロットブロックのみを再利用し、閉じた宝石スロットを5つ作成します。必要なら後でGemsでスロットを開いてください。"
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "宝石またはルーンを追加する前に、検証済みの第一効果を選択してください。"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "直接追加は安全に完了できませんでした。"
    },
    {
      "key": "inventory.addDirect",
      "value": "直接追加"
    },
    {
      "key": "inventory.addEquipment",
      "value": "装備を追加"
    },
    {
      "key": "inventory.gemShape",
      "value": "宝石形状"
    },
    {
      "key": "inventory.runeType",
      "value": "ルーン種別"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "ルーンプリセットを選択"
    },
    {
      "key": "forge.dialogLabel",
      "value": "{{subject}}を編集"
    },
    {
      "key": "forge.personalPresetName",
      "value": "個人用{{subject}}プリセット名"
    },
    {
      "key": "forge.savedStatus",
      "value": "Gem Forge と Rune Forge のマイプリセットに「{{name}}」を保存しました。"
    },
    {
      "key": "forge.convertTo",
      "value": "{{subject}}に変換"
    },
    {
      "key": "forge.convertConfirm",
      "value": "この{{source}}を{{destination}}に変換しますか？セーブをテストするまで自動バックアップは保持してください。"
    },
    {
      "key": "forge.unableToApply",
      "value": "この変更を適用できませんでした。"
    },
    {
      "key": "forge.closeLabel",
      "value": "{{subject}} Forge を閉じる"
    },
    {
      "key": "forge.notice",
      "value": "プリセットを読み込んでも表示中のドラフトのみが更新されます。セーブに書き込むにはエディタで「確定」を選択してください。以下の各効果はエディタに組み込まれた検証済みカタログから来ています。個人用プリセットはGem ForgeとRune Forgeで共有されますが、変換先のエディタは独自の有効な Shape または Type を保持します。"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge モード"
    },
    {
      "key": "forge.presets",
      "value": "プリセット"
    },
    {
      "key": "forge.presetCategories",
      "value": "プリセットカテゴリ"
    },
    {
      "key": "forge.customSetLabel",
      "value": "カスタム{{subject}}効果セット"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "6効果の{{subject}}を作成"
    },
    {
      "key": "forge.customSetDescription",
      "value": "最大6つの検証済み効果を選択します。空スロットは「効果なし」のままです。確定時にエディタが選択したIDを再度検証します。"
    },
    {
      "key": "forge.effect",
      "value": "効果 {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "ドラフトプレビュー"
    },
    {
      "key": "forge.draftEmpty",
      "value": "カスタムドラフトを読み込むには少なくとも1つ効果を選んでください。"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "個人用{{subject}}プリセット"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "両フォージで共有される個人用プリセット"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "編集した宝石またはルーンを一度保存すれば、Gem ForgeやRune Forgeから同じプリセットを読み込めます。"
    },
    {
      "key": "forge.personal",
      "value": "個人用"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Gem ForgeとRune Forgeで共有される個人用フォージプリセット。"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "個人用プリセット「{{name}}」を削除しますか？"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "まだ個人用プリセットは保存されていません。"
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "宝石またはルーンを編集し、「プリセットとして保存」を使うと両フォージで利用可能になります。"
    },
    {
      "key": "forge.customName",
      "value": "カスタム{{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "カスタムセット — {{count}} 件の効果を選択済み。"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "検証済みCaryllルーンのプリセット。"
    },
    {
      "key": "forge.categories.All",
      "value": "すべて"
    },
    {
      "key": "forge.categories.Attack",
      "value": "攻撃"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "属性"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "回復"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "実験的"
    },
    {
      "key": "forge.categories.Personal",
      "value": "個人用"
    },
    {
      "key": "forge.categories.Custom",
      "value": "カスタム"
    },
    {
      "key": "forge.categories.Rune",
      "value": "ルーン"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "アペックス（物理）"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "物理ダメージ、満タン時のプレッシャーと耐久サポート。"
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "アペックス（滋養）"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "全ダメージ増幅、満タン時のプレッシャーと回復支援。"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtingeハンター"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "高いBloodtingeダメージと、全ダメージおよび回復支援。"
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "打撃特化"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "高い打撃ダメージ、全ダメージと耐久サポート。"
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "刺突特化"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "高い刺突ダメージ、全ダメージと耐久サポート。"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "ヴァンガード"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "全ダメージ増幅、物理プレッシャーと高い回復ボーナス。"
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "アーケインサージ"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "秘術ダメージ、回復と耐久サポート。"
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "フレイムサージ"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "炎ダメージ、全ダメージと回復サポート。"
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "ボルトサージ"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "雷ダメージ、全ダメージと耐久サポート。"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "エレメンタルアセンダント"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "秘術、炎、雷の効果を一つにした意図的に実験的な装備構成。"
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "持続ハント"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "長時間の探索向けに回復、耐久、全ダメージをサポート。"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "深淵の活力 +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "+75の継続HP回復効果を内蔵し、耐久とダメージをサポート。"
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "鍛造耐久"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "既知の中で最も強力な耐久ボーナスと高い回復、物理ダメージを組み合わせます。"
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "ラストスタンド"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "瀕死時と満タン時の高倍率。オフラインで使用してください。"
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "ガラスキャノン"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "テスト用：物理、全ダメージ、瀕死倍率を重ねます。"
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "エンドレスハント"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "既知で最大の回復と耐久効果に、満タン時ダメージボーナスを付与します。"
    },
    {
      "key": "update.available",
      "value": "アップデートがあります"
    },
    {
      "key": "update.version",
      "value": "バージョン {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "後で"
    },
    {
      "key": "update.updateAndRestart",
      "value": "アップデートして再起動"
    },
    {
      "key": "update.startingDownload",
      "value": "安全なダウンロードを開始しています…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "署名済みアップデートをダウンロード中…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "ダウンロード中: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB ダウンロード済み"
    },
    {
      "key": "update.installing",
      "value": "アップデートをインストール中…"
    },
    {
      "key": "update.installedRestarting",
      "value": "アップデートをインストールしました。エディタを再起動しています…"
    },
    {
      "key": "update.installFailed",
      "value": "アップデートをインストールできませんでした。現行のバージョンは変更されていません。"
    },
    {
      "key": "actions.reset",
      "value": "リセット"
    },
    {
      "key": "actions.confirm",
      "value": "確認"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "変更を確認しました"
    },
    {
      "key": "actions.back",
      "value": "戻る"
    },
    {
      "key": "actions.change",
      "value": "変更"
    },
    {
      "key": "actions.edit",
      "value": "編集"
    },
    {
      "key": "characterForm.name",
      "value": "名前："
    },
    {
      "key": "characterForm.coordinates",
      "value": "座標："
    },
    {
      "key": "characterForm.playtime",
      "value": "プレイ時間："
    },
    {
      "key": "characterForm.teleport",
      "value": "テレポート："
    },
    {
      "key": "characterForm.selectLocation",
      "value": "場所を選択"
    },
    {
      "key": "bosses.alive",
      "value": "生存"
    },
    {
      "key": "bosses.dead",
      "value": "討伐済み"
    }
  ],
  "ko": [
    {
      "key": "flags.card.confirm",
      "value": "이 알려진 세이브 플래그를 적용하시겠습니까? 저장 전에 백업이 만들어집니다."
    },
    {
      "key": "flags.card.applied",
      "value": "플래그가 메모리 상의 세이브에 적용되었습니다. 파일에 쓰려면 '변경사항 저장'을 선택하세요."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "이 플래그를 적용할 수 없습니다: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "변경 내용:"
    },
    {
      "key": "flags.card.careful",
      "value": "주의:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "검증된 바이트 패턴:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "상세 숨기기"
    },
    {
      "key": "flags.card.showDetails",
      "value": "이 작업은 무엇을 하나요?"
    },
    {
      "key": "flags.card.applying",
      "value": "적용 중…"
    },
    {
      "key": "flags.card.apply",
      "value": "적용"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Lady Maria 대사 복원"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "스토리 복원"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Lady Maria와의 조우 이전의 대사 일부를 복원합니다."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "대사 상태만 변경합니다; 아이템, 레벨 또는 보스 보상은 부여하지 않습니다."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "현재 Astral Clocktower 지역에 있다면 먼저 세이브 복사본에서 사용하세요."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "인형의 레거시 자장가 활성화"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "구버전 연출"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "원래 1.0 버전에 있던 인형의 자장가 동작을 재활성화합니다."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "구버전 연출 상태를 복원합니다. 능력치, 인벤토리, 퀘스트 보상은 변경하지 않습니다."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "동작은 버전 민감적입니다; 캐릭터가 정상적으로 로드될 때까지 백업을 보관하세요."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Blood-addled 협동 동작 활성화"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "멀티플레이 동작"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Hunter 룬을 사용하는 협동 플레이어와 관련된 Blood-addled 상호작용을 활성화합니다."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "관련 룬 조건이 충족되는 동안 멀티플레이어의 적대 행동을 변경합니다."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "오프라인이거나 동의한 플레이어와 함께 사용할 때만 적용하세요. 혼란스러운 적대적 협동 상황을 유발할 수 있습니다."
    },
    {
      "key": "inventory.title",
      "value": "인벤토리"
    },
    {
      "key": "inventory.addItem",
      "value": "아이템 추가"
    },
    {
      "key": "inventory.replaceItem",
      "value": "아이템 교체"
    },
    {
      "key": "inventory.catalog",
      "value": "카탈로그"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "카탈로그 검색"
    },
    {
      "key": "inventory.searchItems",
      "value": "{{type}} 아이템 검색"
    },
    {
      "key": "inventory.quantity",
      "value": "수량"
    },
    {
      "key": "inventory.addSelected",
      "value": "선택 항목 추가"
    },
    {
      "key": "inventory.cancel",
      "value": "취소"
    },
    {
      "key": "inventory.close",
      "value": "닫기"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "무기"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "방어구"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (실험적 직접 추가)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll 룬 (실험적 직접 추가)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "완성된 보석 또는 룬 추가"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "무기 또는 방어구 추가"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "세이브에 안전하게 재사용 가능한 레코드가 있을 때, 검증된 효과로부터 완성된 Blood Gem 또는 Caryll 룬을 직접 생성합니다."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "세이브에 안전하게 재사용 가능한 장비 슬롯 블록이 있을 때 카탈로그에 등록된 무기 또는 방어구를 직접 생성합니다."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "직접 보석·룬 생성기"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "실험적 기능: 이 작업은 안전한 고아 업그레이드 레코드만 재사용합니다. 세이브 레이아웃을 변경하지 않습니다. 캐릭터가 정상적으로 로드될 때까지 자동 백업을 보관하세요."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "실험적 기능: 이 작업은 안전한 고아 장비 슬롯 블록만 재사용하며 닫힌 보석 슬롯 5개를 생성합니다. 필요하면 이후 Gems로 슬롯을 열어주세요."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "보석 또는 룬을 추가하기 전에 검증된 첫 번째 효과를 선택하세요."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "직접 추가를 안전하게 완료할 수 없습니다."
    },
    {
      "key": "inventory.addDirect",
      "value": "직접 추가"
    },
    {
      "key": "inventory.addEquipment",
      "value": "장비 추가"
    },
    {
      "key": "inventory.gemShape",
      "value": "보석 형태"
    },
    {
      "key": "inventory.runeType",
      "value": "룬 유형"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "룬 프리셋 선택"
    },
    {
      "key": "forge.dialogLabel",
      "value": "{{subject}} 편집"
    },
    {
      "key": "forge.personalPresetName",
      "value": "개인 {{subject}} 프리셋 이름"
    },
    {
      "key": "forge.savedStatus",
      "value": "Gem Forge와 Rune Forge의 내 프리셋에 \"{{name}}\"을(를) 저장했습니다."
    },
    {
      "key": "forge.convertTo",
      "value": "{{subject}}로 변환"
    },
    {
      "key": "forge.convertConfirm",
      "value": "이 {{source}}를 {{destination}}로 변환하시겠습니까? 저장을 테스트할 때까지 자동 백업을 보관하세요."
    },
    {
      "key": "forge.unableToApply",
      "value": "이 변경을 적용할 수 없습니다."
    },
    {
      "key": "forge.closeLabel",
      "value": "{{subject}} Forge 닫기"
    },
    {
      "key": "forge.notice",
      "value": "프리셋을 불러와도 보이는 초안만 업데이트됩니다. 세이브에 쓰려면 에디터에서 확인을 선택하세요. 아래의 모든 효과는 에디터에 내장된 검증된 카탈로그에서 제공합니다. 개인 프리셋은 Gem Forge와 Rune Forge에서 공유되며, 대상 에디터는 자체적으로 유효한 Shape 또는 Type을 사용합니다."
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge 모드"
    },
    {
      "key": "forge.presets",
      "value": "프리셋"
    },
    {
      "key": "forge.presetCategories",
      "value": "프리셋 분류"
    },
    {
      "key": "forge.customSetLabel",
      "value": "사용자 지정 {{subject}} 효과 세트"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "효과 6개짜리 {{subject}} 생성"
    },
    {
      "key": "forge.customSetDescription",
      "value": "최대 6개의 검증된 효과를 선택하세요. 빈 슬롯은 No Effect로 유지됩니다. 확인 시 에디터가 선택한 모든 ID를 다시 검증합니다."
    },
    {
      "key": "forge.effect",
      "value": "효과 {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "초안 미리보기"
    },
    {
      "key": "forge.draftEmpty",
      "value": "사용자 초안을 불러오려면 최소 한 개의 효과를 선택하세요."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "개인 {{subject}} 프리셋"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "양쪽 Forge에서 공유되는 개인 프리셋"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "편집한 보석 또는 룬을 한 번 저장하면 Gem Forge나 Rune Forge에서 동일한 프리셋을 불러올 수 있습니다."
    },
    {
      "key": "forge.personal",
      "value": "개인"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Gem Forge와 Rune Forge에서 공유되는 개인 Forge 프리셋."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "개인 프리셋 \"{{name}}\"을(를) 삭제하시겠습니까?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "저장된 개인 프리셋이 없습니다."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "보석 또는 룬을 편집한 뒤 '프리셋으로 저장'을 사용하면 Gem Forge와 Rune Forge 모두에서 사용할 수 있습니다."
    },
    {
      "key": "forge.customName",
      "value": "맞춤형 {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "사용자 설정 — {{count}}개 선택됨."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "검증된 Caryll 룬 프리셋."
    },
    {
      "key": "forge.categories.All",
      "value": "전체"
    },
    {
      "key": "forge.categories.Attack",
      "value": "공격"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "속성"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "회복"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "실험적"
    },
    {
      "key": "forge.categories.Personal",
      "value": "개인"
    },
    {
      "key": "forge.categories.Custom",
      "value": "사용자 설정"
    },
    {
      "key": "forge.categories.Rune",
      "value": "룬"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "최상급 물리"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "물리 피해, 최대 체력 기반 압박 및 내구도 지원."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "최상급 회복"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "모든 피해 증폭, 최대 체력 기반 압박 및 회복."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "높은 Bloodtinge 피해와 모든 피해 및 회복 지원."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "둔기 특화"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "높은 둔기 피해와 모든 피해 및 내구도 지원."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "찌르기 특화"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "높은 찌르기 피해와 모든 피해 및 내구도 지원."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "선봉"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "모든 피해 증폭, 물리 압박 및 높은 회복 보너스."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "아케인 서지"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "아케인 피해와 회복·내구도 지원."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "화염 서지"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "화염 피해와 모든 피해 및 회복 지원."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "번개 서지"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "번개 피해와 모든 피해 및 내구도 지원."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "속성 정점"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "아케인, 화염, 번개 효과를 하나로 합친 의도적으로 실험적인 세팅."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "지속적인 사냥"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "장시간 탐험을 위한 회복, 내구도 및 모든 피해 지원."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "심연의 활력 +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "내장된 +75 지속 HP 회복 효과를 사용하며 내구도와 피해 지원을 제공합니다."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "단련된 인내"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "가장 강력한 번들 내구 보너스로, 높은 회복 및 물리 피해를 동반합니다."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "최후의 저항"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "위기(저HP) 및 풀체력에서의 높은 배수 효과. 이 세팅은 오프라인에서 사용하세요."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "유리 대포"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "테스트 전용으로 물리, 모든 피해, 위기(저HP) 배수를 중첩합니다."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "끝없는 사냥"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "최대 수준의 회복 및 내구 효과와 풀체력 공격 보너스를 제공합니다."
    },
    {
      "key": "update.available",
      "value": "업데이트 가능"
    },
    {
      "key": "update.version",
      "value": "버전 {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "나중에"
    },
    {
      "key": "update.updateAndRestart",
      "value": "업데이트 후 재시작"
    },
    {
      "key": "update.startingDownload",
      "value": "보안 다운로드 시작…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "서명된 업데이트 다운로드 중…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "다운로드 중: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB 다운로드됨"
    },
    {
      "key": "update.installing",
      "value": "업데이트 설치 중…"
    },
    {
      "key": "update.installedRestarting",
      "value": "업데이트가 설치되었습니다. 에디터를 재시작합니다…"
    },
    {
      "key": "update.installFailed",
      "value": "업데이트를 설치할 수 없습니다. 현재 버전은 변경되지 않았습니다."
    },
    {
      "key": "actions.reset",
      "value": "초기화"
    },
    {
      "key": "actions.confirm",
      "value": "확인"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "변경사항 확인됨"
    },
    {
      "key": "actions.back",
      "value": "뒤로"
    },
    {
      "key": "actions.change",
      "value": "변경"
    },
    {
      "key": "actions.edit",
      "value": "편집"
    },
    {
      "key": "characterForm.name",
      "value": "이름:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "좌표:"
    },
    {
      "key": "characterForm.playtime",
      "value": "플레이 시간:"
    },
    {
      "key": "characterForm.teleport",
      "value": "텔레포트:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "위치 선택"
    },
    {
      "key": "bosses.alive",
      "value": "살아있음"
    },
    {
      "key": "bosses.dead",
      "value": "처치됨"
    }
  ],
  "zh-CN": [
    {
      "key": "flags.card.confirm",
      "value": "应用此已知存档标记？保存前会自动保留备份。"
    },
    {
      "key": "flags.card.applied",
      "value": "标记已应用到内存存档。选择“保存更改”以写入文件。"
    },
    {
      "key": "flags.card.applyFailed",
      "value": "无法应用此标记： {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "更改内容："
    },
    {
      "key": "flags.card.careful",
      "value": "注意："
    },
    {
      "key": "flags.card.bytePattern",
      "value": "已验证的字节模式："
    },
    {
      "key": "flags.card.hideDetails",
      "value": "隐藏详情"
    },
    {
      "key": "flags.card.showDetails",
      "value": "这会做什么？"
    },
    {
      "key": "flags.card.applying",
      "value": "应用中…"
    },
    {
      "key": "flags.card.apply",
      "value": "应用"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "恢复 Lady Maria 对话"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "叙事恢复"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "恢复 Lady Maria 遭遇前的一小部分对话台词。"
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "仅更改对话状态；不会授予物品、等级或首领奖励。"
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "如果你当前在 Astral Clocktower 区域，请先在存档副本上使用。"
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "启用傀儡的遗留摇篮曲"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "遗留表现"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "重新启用与原始 1.0 版本相关的傀儡摇篮曲行为。"
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "恢复旧版表现状态。不会更改属性、物品或任务奖励。"
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "该行为依赖版本；在成功载入角色前请保留备份。"
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "启用 Blood-addled 联机协作行为"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "多人游戏行为"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "启用与协作玩家使用 Hunter 符文相关的 Blood-addled 交互。"
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "在满足相关符文条件时，这会改变联机敌对行为。"
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "仅在离线或获得同意的玩家间使用。可能造成混乱的敌对协作行为。"
    },
    {
      "key": "inventory.title",
      "value": "物品栏"
    },
    {
      "key": "inventory.addItem",
      "value": "添加物品"
    },
    {
      "key": "inventory.replaceItem",
      "value": "替换物品"
    },
    {
      "key": "inventory.catalog",
      "value": "目录"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "搜索目录"
    },
    {
      "key": "inventory.searchItems",
      "value": "搜索 {{type}} 物品"
    },
    {
      "key": "inventory.quantity",
      "value": "数量"
    },
    {
      "key": "inventory.addSelected",
      "value": "添加所选物品"
    },
    {
      "key": "inventory.cancel",
      "value": "取消"
    },
    {
      "key": "inventory.close",
      "value": "关闭"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "武器"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "护甲"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (实验性直接添加)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (实验性直接添加)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "添加已完成的宝石或符文"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "添加武器或护甲"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "当存档中存在可安全复用的记录时，直接根据已验证效果创建已完成的 Blood Gem 或 Caryll Rune。"
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "当存档包含可安全复用的装备栏块时，直接创建目录中的武器或护甲。"
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "直接宝石和符文构建器"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "实验性：此操作仅复用可安全的孤立升级记录。不会改变存档布局。请在角色正常载入前保留自动备份。"
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "实验性：此操作仅复用可安全的孤立装备栏块，并创建五个封闭宝石槽。如需打开，请稍后使用 Gems。"
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "在添加宝石或符文前，请先选择一个已验证的首要效果。"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "无法安全完成直接添加。"
    },
    {
      "key": "inventory.addDirect",
      "value": "直接添加"
    },
    {
      "key": "inventory.addEquipment",
      "value": "添加装备"
    },
    {
      "key": "inventory.gemShape",
      "value": "宝石形状"
    },
    {
      "key": "inventory.runeType",
      "value": "符文类型"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "选择符文预设"
    },
    {
      "key": "forge.dialogLabel",
      "value": "编辑 {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "个人 {{subject}} 预设名称"
    },
    {
      "key": "forge.savedStatus",
      "value": "已将“{{name}}”保存到“我的预设”，可在 Gem Forge 和 Rune Forge 使用。"
    },
    {
      "key": "forge.convertTo",
      "value": "转换为 {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "将此 {{source}} 转换为 {{destination}}？在测试存档前请保留自动备份。"
    },
    {
      "key": "forge.unableToApply",
      "value": "无法应用此更改。"
    },
    {
      "key": "forge.closeLabel",
      "value": "关闭 {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "加载预设只会更新可见草稿。要将其写入存档，请在编辑器中选择“确认”。下方的每个效果均来自编辑器内嵌的已验证目录。个人预设在 Gem Forge 与 Rune Forge 之间共享；目标编辑器会保留其各自有效的形状或类型。"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge 模式"
    },
    {
      "key": "forge.presets",
      "value": "预设"
    },
    {
      "key": "forge.presetCategories",
      "value": "预设分类"
    },
    {
      "key": "forge.customSetLabel",
      "value": "自定义 {{subject}} 效果组"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "构建一个六效果的 {{subject}}"
    },
    {
      "key": "forge.customSetDescription",
      "value": "最多选择六个已验证的效果。空槽保持为“无效果”。确认时编辑器会再次验证每个选定的ID。"
    },
    {
      "key": "forge.effect",
      "value": "效果 {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "草稿预览"
    },
    {
      "key": "forge.draftEmpty",
      "value": "至少选择一个效果以加载自定义草稿。"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "个人 {{subject}} 预设"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "两个锻造器共享的个人预设"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "编辑并保存一次宝石或符文后，即可在 Gem Forge 或 Rune Forge 中加载相同预设。"
    },
    {
      "key": "forge.personal",
      "value": "个人"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "个人锻造预设，Gem Forge 与 Rune Forge 共享。"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "删除个人预设“{{name}}”？"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "尚未保存任何个人预设。"
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "编辑宝石或符文，然后使用“另存为预设”使其在两个锻造器中可用。"
    },
    {
      "key": "forge.customName",
      "value": "自定义 {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "自定义集 — 已选择 {{count}} 个效果。"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "已验证的 Caryll Rune 预设。"
    },
    {
      "key": "forge.categories.All",
      "value": "全部"
    },
    {
      "key": "forge.categories.Attack",
      "value": "攻击"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "元素"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "恢复"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "实验性"
    },
    {
      "key": "forge.categories.Personal",
      "value": "个人"
    },
    {
      "key": "forge.categories.Custom",
      "value": "自定义"
    },
    {
      "key": "forge.categories.Rune",
      "value": "符文"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "物理巅峰"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "物理伤害，满血压制与耐久支持。"
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "滋养巅峰"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "全伤害增幅，伴随满血压制与恢复。"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "高 Bloodtinge 伤害，兼有全伤害与恢复支持。"
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "钝击破坏者"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "高钝击伤害，兼有全伤害与耐久支持。"
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "刺击专家"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "高刺击伤害，兼有全伤害与耐久支持。"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "先锋"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "全伤害增幅，物理压制与高恢复加成。"
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "秘术爆发"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "秘术伤害，兼有恢复与耐久支持。"
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "火焰爆发"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "火焰伤害，兼有全伤害与恢复支持。"
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "闪电爆发"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "雷电伤害，兼有全伤害与耐久支持。"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "元素上升"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "将秘术、火焰与雷电效果合并的刻意实验性装备搭配。"
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "持久狩猎"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "为长时间探索提供恢复、耐久与全伤害支持。"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "使用内置的+75 持续HP恢复效果，兼有耐久与伤害支持。"
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "锻造耐力"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "已知最强的耐久加成组合，配合高恢复与物理伤害。"
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "最后一搏"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "高临死与满血乘算加成。请离线使用此配置。"
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "玻璃炮"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "叠加物理、全伤害与临死乘算，仅用于测试。"
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "无尽狩猎"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "已知最大恢复与耐久效果，附带满血伤害加成。"
    },
    {
      "key": "update.available",
      "value": "有可用更新"
    },
    {
      "key": "update.version",
      "value": "版本 {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "稍后"
    },
    {
      "key": "update.updateAndRestart",
      "value": "更新并重启"
    },
    {
      "key": "update.startingDownload",
      "value": "开始安全下载…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "正在下载已签名更新…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "下载中：{{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "已下载 {{megabytes}} MB"
    },
    {
      "key": "update.installing",
      "value": "正在安装更新…"
    },
    {
      "key": "update.installedRestarting",
      "value": "更新已安装。正在重启编辑器…"
    },
    {
      "key": "update.installFailed",
      "value": "更新无法安装。当前版本未更改。"
    },
    {
      "key": "actions.reset",
      "value": "重置"
    },
    {
      "key": "actions.confirm",
      "value": "确认"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "更改已确认"
    },
    {
      "key": "actions.back",
      "value": "返回"
    },
    {
      "key": "actions.change",
      "value": "更改"
    },
    {
      "key": "actions.edit",
      "value": "编辑"
    },
    {
      "key": "characterForm.name",
      "value": "名称："
    },
    {
      "key": "characterForm.coordinates",
      "value": "坐标："
    },
    {
      "key": "characterForm.playtime",
      "value": "游戏时间："
    },
    {
      "key": "characterForm.teleport",
      "value": "传送："
    },
    {
      "key": "characterForm.selectLocation",
      "value": "选择地点"
    },
    {
      "key": "bosses.alive",
      "value": "存活"
    },
    {
      "key": "bosses.dead",
      "value": "已击败"
    }
  ],
  "sv": [
    {
      "key": "flags.card.confirm",
      "value": "Tillämpa denna kända spara-flagga? En säkerhetskopia skapas innan sparandet."
    },
    {
      "key": "flags.card.applied",
      "value": "Flagga tillämpad i minnet. Välj Spara ändringar för att skriva filen."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Kunde inte tillämpa denna flagga: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Vad ändras:"
    },
    {
      "key": "flags.card.careful",
      "value": "Var försiktig:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Validerat byte-mönster:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Dölj detaljer"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Vad gör detta?"
    },
    {
      "key": "flags.card.applying",
      "value": "Tillämpas…"
    },
    {
      "key": "flags.card.apply",
      "value": "Tillämpa"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Återställ Lady Marias dialog"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Återställning av berättelsen"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Återställer några dialograder före mötet med Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Ändrar endast dialogtillståndet; ger inte föremål, nivå eller boss-belöning."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Använd först på en kopierad sparfil om du befinner dig i Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Aktivera Dockans ursprungliga vaggvisa"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Äldre presentation"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Återaktiverar Dockans vaggvisebeteende kopplat till ursprungsversionen 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Återställer ett äldre presentationsläge. Påverkar inte attribut, inventarium eller uppdragsbelöningar."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Beteendet är versionskänsligt; behåll säkerhetskopian tills karaktären laddats normalt."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Aktivera Blood-addled co-op-beteende"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Flerspelarbeteende"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Aktiverar Blood-addled-interaktionen som uppstår när co-op-spelare använder Hunter-runan."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Ändrar fientligt beteende i flerspelarläge medan runvillkoren är uppfyllda."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Använd endast offline eller med medgivande spelare. Kan orsaka förvirrande fientligt co-op-beteende."
    },
    {
      "key": "inventory.title",
      "value": "Inventarie"
    },
    {
      "key": "inventory.addItem",
      "value": "Lägg till föremål"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Byt ut föremål"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Sök i katalogen"
    },
    {
      "key": "inventory.searchItems",
      "value": "Sök {{type}}-föremål"
    },
    {
      "key": "inventory.quantity",
      "value": "Antal"
    },
    {
      "key": "inventory.addSelected",
      "value": "Lägg till markerat föremål"
    },
    {
      "key": "inventory.cancel",
      "value": "Avbryt"
    },
    {
      "key": "inventory.close",
      "value": "Stäng"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Vapen"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Rustning"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (experimentellt direkttillägg)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (experimentellt direkttillägg)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Lägg till en färdig Blood Gem eller Caryll Rune"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Lägg till ett vapen eller en rustning"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Skapa en färdig Blood Gem eller Caryll Rune direkt från validerade effekter när en säker återanvändbar post finns i sparfilen."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Skapa ett katalogfört vapen eller rustning direkt när sparfilen innehåller ett säkert återanvändbart utrustningsfältsblock."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Direktbyggare för gem och runor"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimentellt: denna operation återanvänder endast en säker föräldralös uppgraderingspost. Den ändrar aldrig sparfilens layout. Behåll den automatiska säkerhetskopian tills karaktären har laddats normalt."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimentellt: denna operation återanvänder endast ett säkert föräldralöst utrustningsfältsblock och skapar fem stängda gem-platser. Öppna platserna senare med Gems vid behov."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Välj en validerad primäreffekt innan du lägger till en gem eller rune."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Direktinsättningen kunde inte genomföras säkert."
    },
    {
      "key": "inventory.addDirect",
      "value": "Lägg till direkt"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Lägg till utrustning"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem-form"
    },
    {
      "key": "inventory.runeType",
      "value": "Run-typ"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Välj en runförinställning"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Redigera {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Personligt {{subject}}-presetsnamn"
    },
    {
      "key": "forge.savedStatus",
      "value": "Sparat “{{name}}” i Mina förinställningar för Gem Forge och Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Konvertera till {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Konvertera denna {{source}} till en {{destination}}? Behåll den automatiska säkerhetskopian tills du testat sparfilen."
    },
    {
      "key": "forge.unableToApply",
      "value": "Kunde inte tillämpa denna ändring."
    },
    {
      "key": "forge.closeLabel",
      "value": "Stäng {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Att ladda en förinställning uppdaterar bara det synliga utkastet. Välj Bekräfta i editorn för att skriva det till sparfilen. Varje effekt nedan kommer från editorens inbäddade validerade katalog. Personliga förinställningar delas mellan Gem Forge och Rune Forge; målreditorn behåller sin egen giltiga Shape eller Type."
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge-läge"
    },
    {
      "key": "forge.presets",
      "value": "Förinställningar"
    },
    {
      "key": "forge.presetCategories",
      "value": "Förinställningskategorier"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Anpassad {{subject}}-effektuppsättning"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Skapa en {{subject}} med sex effekter"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Välj upp till sex validerade effekter. Tomma platser förblir som No Effect. Editorn validerar varje valt ID igen när du bekräftar."
    },
    {
      "key": "forge.effect",
      "value": "Effekt {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Utkastförhandsvisning"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Välj åtminstone en effekt för att ladda ett anpassat utkast."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Personliga {{subject}}-förinställningar"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Personliga förinställningar som delas av Gem Forge och Rune Forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Spara en redigerad gem eller rune en gång, och ladda sedan samma förinställning från Gem Forge eller Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Personlig"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Personlig Forge-förinställning som delas av Gem Forge och Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Ta bort den personliga förinställningen “{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Ingen personlig förinställning har sparats än."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Redigera en gem eller rune, använd sedan Spara som förinställning för att göra den tillgänglig i både Gem Forge och Rune Forge."
    },
    {
      "key": "forge.customName",
      "value": "Anpassad {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Anpassad uppsättning — {{count}} valda effekter."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Validerad Caryll Rune-förinställning."
    },
    {
      "key": "forge.categories.All",
      "value": "Alla"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Angrepp"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Element"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Återhämtning"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimentell"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personlig"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Anpassad"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex (Fysisk)"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fysisk skada, bonus vid full hälsa och hållbarhetsstöd."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex (Närande)"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Ökning av all skada med bonus vid full hälsa och återhämtning."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Hög Bloodtinge-skada med stöd för all skada och återhämtning."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Trubbkrossare"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Hög trubbskada med stöd för all skada och hållbarhet."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Stöt-specialist"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Hög stötskada med stöd för all skada och hållbarhet."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Frontlinje"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Ökning av all skada med fysisk tryckpåverkan och hög återhämtningsbonus."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arkanvåg"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arkan skada med återhämtning och hållbarhetsstöd."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Eldvåg"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Eldskada med stöd för all skada och återhämtning."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Blixtvåg"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Blixtskada med stöd för all skada och hållbarhet."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementupphöjd"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arkan-, eld- och blixt-effekter i en medvetet experimentell uppsättning."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Uthållig jakt"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Stöd för återhämtning, hållbarhet och all skada för långa utforskningar."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Avgrundens vitalitet +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Använder inbäddad +75 kontinuerlig HP-återhämtning med hållbarhets- och skadestöd."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Smidd uthållighet"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Den starkaste kända paketbonusen för hållbarhet, tillsammans med hög återhämtning och fysisk skada."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Sista ställningen"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Höga multiplikatorer vid nära-död och full hälsa. Använd denna uppsättning offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glascanon"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Staplar fysiska, allskade- och nära-död-multiplikatorer endast för testning."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Oändlig jakt"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maximala kända effekter för återhämtning och hållbarhet med en skadebonus vid full hälsa."
    },
    {
      "key": "update.available",
      "value": "Uppdatering tillgänglig"
    },
    {
      "key": "update.version",
      "value": "Version {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Inte nu"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Uppdatera och starta om"
    },
    {
      "key": "update.startingDownload",
      "value": "Startar säker nedladdning…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Laddar ner signerad uppdatering…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Laddar ner: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB nedladdat"
    },
    {
      "key": "update.installing",
      "value": "Installerar uppdatering…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Uppdatering installerad. Startar om editorn…"
    },
    {
      "key": "update.installFailed",
      "value": "Uppdateringen kunde inte installeras. Din nuvarande version förblir oförändrad."
    },
    {
      "key": "actions.reset",
      "value": "Återställ"
    },
    {
      "key": "actions.confirm",
      "value": "Bekräfta"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Ändringar bekräftade"
    },
    {
      "key": "actions.back",
      "value": "Tillbaka"
    },
    {
      "key": "actions.change",
      "value": "Ändra"
    },
    {
      "key": "actions.edit",
      "value": "Redigera"
    },
    {
      "key": "characterForm.name",
      "value": "Namn:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinater:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Speltid:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleportera:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Välj en plats"
    },
    {
      "key": "bosses.alive",
      "value": "Vid liv"
    },
    {
      "key": "bosses.dead",
      "value": "Död"
    }
  ],
  "cs": [
    {
      "key": "flags.card.confirm",
      "value": "Uplatnit tento známý příznak uložené hry? Před uložením se vytvoří záloha."
    },
    {
      "key": "flags.card.applied",
      "value": "Příznak byl aplikován do uložené hry v paměti. Vyberte Uložit změny pro zápis do souboru."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Nelze aplikovat tento příznak: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Co se změní:"
    },
    {
      "key": "flags.card.careful",
      "value": "Pozor:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Ověřený vzor bytů:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Skrýt podrobnosti"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Co to dělá?"
    },
    {
      "key": "flags.card.applying",
      "value": "Aplikuje se…"
    },
    {
      "key": "flags.card.apply",
      "value": "Použít"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Obnovit dialogy Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Obnovení příběhu"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Obnoví několik řádků dialogu před střetem s Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Mění pouze stav dialogu; nedává žádnou položku, úroveň ani odměnu za bosse."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Použijte nejdříve na kopii uložené hry, pokud se právě nacházíte v oblasti Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Povolit původní kolébavku Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Původní prezentace"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Znovu povolí chování kolébavky Doll spojené s původním vydáním 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Obnoví pouze původní prezentační stav. Nemění atributy, inventář ani odměny za úkoly."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Chování závisí na verzi; ponechte zálohu, dokud se postava úspěšně nenačte."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Povolit kooperativní chování Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Chování pro více hráčů"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Povolí Blood-addled interakci spojenou s kooperativními hráči používajícími Hunter rune."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Změní nepřátelské chování v multiplayeru, pokud jsou splněny příslušné podmínky runy."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Používejte pouze offline nebo s hráči, kteří s tím souhlasí. Může způsobit matoucí nepřátelské kooperativní chování."
    },
    {
      "key": "inventory.title",
      "value": "Inventář"
    },
    {
      "key": "inventory.addItem",
      "value": "Přidat položku"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Nahradit položku"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Hledat v katalogu"
    },
    {
      "key": "inventory.searchItems",
      "value": "Hledat položky {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Počet"
    },
    {
      "key": "inventory.addSelected",
      "value": "Přidat vybranou položku"
    },
    {
      "key": "inventory.cancel",
      "value": "Zrušit"
    },
    {
      "key": "inventory.close",
      "value": "Zavřít"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Zbraně"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Brnění"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (experimentální přímé přidání)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll runy (experimentální přímé přidání)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Přidat hotový gem nebo runu"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Přidat zbraň nebo brnění"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Vytvoří hotový Blood Gem nebo Caryll runu přímo z ověřených efektů, pokud je v úložném souboru k dispozici bezpečný znovupoužitelný záznam."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Vytvoří katalogizovanou zbraň nebo brnění přímo, pokud uložená hra obsahuje bezpečný znovupoužitelný blok vybavení."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Tvůrce gemů a run přímo"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimentální: tato operace znovupoužívá pouze bezpečný opuštěný záznam vylepšení. Nikdy nemění rozložení uložené hry. Ponechte automatickou zálohu, dokud se postava normálně nenačte."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimentální: tato operace znovupoužívá pouze bezpečný opuštěný blok vybavení a vytvoří pět uzavřených slotů na gemy. Otevřete sloty později pomocí Gems, pokud je to potřeba."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Vyberte ověřený první efekt před přidáním gemu nebo runy."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Přímé přidání nelze bezpečně dokončit."
    },
    {
      "key": "inventory.addDirect",
      "value": "Přidat přímo"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Přidat vybavení"
    },
    {
      "key": "inventory.gemShape",
      "value": "Tvar gemu"
    },
    {
      "key": "inventory.runeType",
      "value": "Typ runy"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Vyberte přednastavení runy"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Upravit {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Název osobního přednastavení {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Uloženo „{{name}}“ do Moje přednastavení pro Kovárnu gemů a Kovárnu run."
    },
    {
      "key": "forge.convertTo",
      "value": "Převést na {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Převést tento {{source}} na {{destination}}? Ponechte automatickou zálohu, dokud uloženou hru neotestujete."
    },
    {
      "key": "forge.unableToApply",
      "value": "Nelze aplikovat tuto změnu."
    },
    {
      "key": "forge.closeLabel",
      "value": "Zavřít {{subject}} kovárnu"
    },
    {
      "key": "forge.notice",
      "value": "Načtení přednastavení aktualizuje pouze viditelný návrh. Vyberte Potvrdit v editoru, chcete‑li jej zapsat do uložené hry. Každý níže uvedený efekt pochází z vestavěného ověřeného katalogu v editoru. Osobní přednastavení jsou sdílena Kovárnou gemů i Kovárnou run; cílový editor si udržuje vlastní platný tvar nebo typ."
    },
    {
      "key": "forge.modeLabel",
      "value": "Režim {{subject}} kovárny"
    },
    {
      "key": "forge.presets",
      "value": "Přednastavení"
    },
    {
      "key": "forge.presetCategories",
      "value": "Kategorie přednastavení"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Vlastní sada efektů {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Sestavit {{subject}} se šesti efekty"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Vyberte až šest ověřených efektů. Prázdné sloty zůstanou jako Žádný efekt. Editor při potvrzení znovu ověří každé vybrané ID."
    },
    {
      "key": "forge.effect",
      "value": "Efekt {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Náhled návrhu"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Vyberte alespoň jeden efekt pro načtení vlastního návrhu."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Osobní přednastavení {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Osobní přednastavení sdílená oběma kovárnám"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Uložte upravený gem nebo runu jednou a poté stejné přednastavení načtěte z Kovárny gemů nebo Kovárny run."
    },
    {
      "key": "forge.personal",
      "value": "Osobní"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Osobní přednastavení kovárny sdílené Kovárnou gemů a Kovárnou run."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Smazat osobní přednastavení „{{name}}“?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Dosud nebylo uloženo žádné osobní přednastavení."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Upravte gem nebo runu a poté použijte Uložit jako přednastavení, aby bylo dostupné v obou kovárnách."
    },
    {
      "key": "forge.customName",
      "value": "Vlastní {{subject}} kovárna"
    },
    {
      "key": "forge.customDescription",
      "value": "Vlastní sada — vybráno {{count}} efektů."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Ověřené přednastavení Caryll runy."
    },
    {
      "key": "forge.categories.All",
      "value": "Vše"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Útok"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementální"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Obnova"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimentální"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Osobní"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Vlastní"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runa"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex – fyzické"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fyzické poškození, tlak při plném zdraví a podpora odolnosti."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex – vyživující"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Zesílení veškerého poškození s tlakem při plném zdraví a obnovou."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Vysoké poškození Bloodtinge s podporou obecného poškození a obnovy."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Blunt Breaker"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Vysoké tupé poškození s podporou obecného poškození a odolnosti."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Thrust Specialist"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Vysoké bodné poškození s podporou obecného poškození a odolnosti."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Průkopník"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Zesílení veškerého poškození s fyzickým tlakem a vysokým bonusem k obnově."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arcane Surge"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arcane poškození s podporou obnovy a odolnosti."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Flame Surge"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Ohňové poškození s podporou obecného poškození a obnovy."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Bolt Surge"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Bleskové poškození s podporou obecného poškození a odolnosti."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elemental Ascendant"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arcane, oheň a blesk v jedné záměrně experimentální sestavě."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Sustained Hunt"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Podpora obnovy, odolnosti a obecného poškození pro dlouhé průzkumy."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssální vitalita +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Využívá zabudovaný efekt kontinuálního obnovování HP +75 s podporou odolnosti a poškození."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Forged Endurance"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Nejsilnější známý bonus k odolnosti v balíčku spárovaný s vysokou obnovou a fyzickým poškozením."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Last Stand"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Vysoké násobitele při téměř smrti i při plném zdraví. Používejte tuto sestavu offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glass Cannon"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Kumulace fyzického, všeobecného a téměř-smrtí násobitelů pouze pro testování."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Endless Hunt"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maximální známé efekty obnovy a odolnosti s bonusem k poškození při plném zdraví."
    },
    {
      "key": "update.available",
      "value": "Aktualizace k dispozici"
    },
    {
      "key": "update.version",
      "value": "Verze {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Ne nyní"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Aktualizovat a restartovat"
    },
    {
      "key": "update.startingDownload",
      "value": "Spouští se zabezpečené stahování…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Stahuje se podepsaná aktualizace…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Stahování: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB staženo"
    },
    {
      "key": "update.installing",
      "value": "Instaluje se aktualizace…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Aktualizace nainstalována. Restartuji editor…"
    },
    {
      "key": "update.installFailed",
      "value": "Aktualizaci se nepodařilo nainstalovat. Vaše současná verze zůstává beze změny."
    },
    {
      "key": "actions.reset",
      "value": "Resetovat"
    },
    {
      "key": "actions.confirm",
      "value": "Potvrdit"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Změny potvrzeny"
    },
    {
      "key": "actions.back",
      "value": "Zpět"
    },
    {
      "key": "actions.change",
      "value": "Změnit"
    },
    {
      "key": "actions.edit",
      "value": "Upravit"
    },
    {
      "key": "characterForm.name",
      "value": "Jméno:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Souřadnice:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Doba hraní:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleport:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Vyberte lokaci"
    },
    {
      "key": "bosses.alive",
      "value": "Naživu"
    },
    {
      "key": "bosses.dead",
      "value": "Poražený"
    }
  ],
  "ro": [
    {
      "key": "flags.card.confirm",
      "value": "Aplici acest flag cunoscut al save-ului? Se păstrează un backup înainte de salvare."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag aplicat în save-ul din memorie. Selectează Salvează modificările pentru a scrie fișierul."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Nu s-a putut aplica acest flag: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Ce se schimbă:"
    },
    {
      "key": "flags.card.careful",
      "value": "Atenție:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Model de octeți validat:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Ascunde detaliile"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Ce face asta?"
    },
    {
      "key": "flags.card.applying",
      "value": "Se aplică…"
    },
    {
      "key": "flags.card.apply",
      "value": "Aplică"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Restabilește dialogul lui Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Restaurare narativă"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Restabilește un set mic de replici de dinaintea întâlnirii cu Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Schimbă doar starea dialogului; nu acordă obiecte, nivel sau recompensă de boss."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Folosește mai întâi pe un save copiat dacă te afli în prezent în zona Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Activează cântecul de leagăn clasic al Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Prezentare clasică"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Reactivează comportamentul cântecului de leagăn al Doll asociat cu lansarea inițială 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Restabilește o stare de prezentare clasică. Nu modifică atribute, inventar sau recompense de misiune."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Comportamentul depinde de versiune; păstrează backup-ul până când personajul s-a încărcat cu succes."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Activează comportamentul Blood-addled în cooperare"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Comportament multiplayer"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Activează interacțiunea Blood-addled asociată jucătorilor cooperativi care folosesc runa Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Schimbă comportamentul ostil în multiplayer atâta timp cât condițiile runei relevante sunt îndeplinite."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Folosește doar offline sau cu jucători care sunt de acord. Poate crea comportament ostil confuz în co-op."
    },
    {
      "key": "inventory.title",
      "value": "Inventar"
    },
    {
      "key": "inventory.addItem",
      "value": "Adaugă un obiect"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Înlocuiește obiect"
    },
    {
      "key": "inventory.catalog",
      "value": "Catalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Caută în catalog"
    },
    {
      "key": "inventory.searchItems",
      "value": "Caută obiecte {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Cantitate"
    },
    {
      "key": "inventory.addSelected",
      "value": "Adaugă obiectul selectat"
    },
    {
      "key": "inventory.cancel",
      "value": "Anulează"
    },
    {
      "key": "inventory.close",
      "value": "Închide"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Arme"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armuri"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (adăugare directă experimentală)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (adăugare directă experimentală)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Adaugă o gemă sau rună finalizată"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Adaugă o armă sau armură"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Creează direct o Blood Gem sau o Caryll Rune finalizată din efecte validate când există o înregistrare reutilizabilă sigură în save."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Creează direct o armă sau armură catalogată când save-ul conține un bloc sigur reutilizabil pentru slotul de echipament."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Constructor direct de gemă și rună"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Experimental: această operațiune reutilizează doar o înregistrare de upgrade orfană și sigură. Nu modifică niciodată structura save-ului. Păstrează backup-ul automat până când personajul s-a încărcat normal."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Experimental: această operațiune reutilizează doar un bloc de slot de echipament orfan și sigur și creează cinci sloturi închise pentru gemă. Deschide sloturile mai târziu cu Gems dacă este nevoie."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Alege un prim efect validat înainte de a adăuga o gemă sau rună."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Adăugarea directă nu a putut fi finalizată în siguranță."
    },
    {
      "key": "inventory.addDirect",
      "value": "Adaugă direct"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Adaugă echipament"
    },
    {
      "key": "inventory.gemShape",
      "value": "Formă gemă"
    },
    {
      "key": "inventory.runeType",
      "value": "Tip rună"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Selectează un preset de rună"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Editează {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nume preset personal pentru {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Am salvat „{{name}}” în Preseturile mele pentru Gem Forge și Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Convertește în {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Convertești acest {{source}} într-un {{destination}}? Păstrează backup-ul automat până când ai testat save-ul."
    },
    {
      "key": "forge.unableToApply",
      "value": "Nu s-a putut aplica această modificare."
    },
    {
      "key": "forge.closeLabel",
      "value": "Închide {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Încărcarea unui preset actualizează doar schița vizibilă. Selectează Confirm în editor pentru a o scrie în save. Fiecare efect de mai jos provine din catalogul validat încorporat al editorului. Preseturile personale sunt partajate între Gem Forge și Rune Forge; editorul de destinație păstrează propriul său Shape sau Type valid."
    },
    {
      "key": "forge.modeLabel",
      "value": "Mod {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Preseturi"
    },
    {
      "key": "forge.presetCategories",
      "value": "Categorii preseturi"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Set personalizat de efecte pentru {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Construiește un {{subject}} cu șase efecte"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Alege până la șase efecte validate. Sloturile goale rămân ca No Effect. Editorul validează din nou fiecare ID selectat când confirmi."
    },
    {
      "key": "forge.effect",
      "value": "Efect {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Previzualizare draft"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Alege cel puțin un efect pentru a încărca o ciornă personalizată."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Preseturi personale pentru {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Preseturi personale partajate de Gem Forge și Rune Forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Salvează o gemă sau rună editată o dată, apoi încarcă același preset din Gem Forge sau Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Personal"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Preset personal de Forge partajat de Gem Forge și Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Ștergi presetul personal „{{name}}”?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Nu a fost salvat niciun preset personal încă."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Editează o gemă sau rună, apoi folosește Salvează ca preset pentru a-l face disponibil în ambele Forge."
    },
    {
      "key": "forge.customName",
      "value": "Forja personalizată {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Set personalizat — {{count}} efecte selectate."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Preset de Caryll Rune validat."
    },
    {
      "key": "forge.categories.All",
      "value": "Toate"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Atac"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Recuperare"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Experimental"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personal"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Personalizat"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rună"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Fizic"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Daune fizice, presiune la viață maximă și suport pentru durabilitate."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Nutritiv"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Amplificare a tuturor daunelor, presiune la viață maximă și recuperare."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Daune mari de Bloodtinge cu suport pentru toate daunele și recuperare."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Spargător Neascuțit"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Daune mari de tip blunt, cu suport pentru toate daunele și durabilitate."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Specialist în Thrust"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Daune mari de tip thrust, cu suport pentru toate daunele și durabilitate."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Avangardă"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Amplificare pentru toate daunele, presiune fizică și bonus mare la recuperare."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Val Arcana"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Daune arcane cu suport pentru recuperare și durabilitate."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Val de Flacără"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Daune de foc cu suport pentru toate daunele și recuperare."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Val Fulger"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Daune de fulger cu suport pentru toate daunele și durabilitate."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ascendent Elemental"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efecte arcane, de foc și fulger într-un set intenționat experimental."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Vânătoare Susținută"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Recuperare, durabilitate și suport pentru toate daunele în sesiuni lungi de explorare."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalitate Abisală +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Folosește efectul încorporat de recuperare continuă a HP +75, cu suport pentru durabilitate și daune."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Enduranță Forjată"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Cel mai puternic bonus de durabilitate cunoscut, asociat cu recuperare mare și daune fizice."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Ultima Rezistență"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Multiplicatori mari la aproape-moarte și la viață completă. Păstrează acest set offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Tun de Sticlă"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Stivuiește multiplicatori pentru daune fizice, toate daunele și aproape-moarte doar pentru testare."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Vânătoare Fără Sfârșit"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Efecte maxime cunoscute de recuperare și durabilitate, cu un bonus de daune la viață completă."
    },
    {
      "key": "update.available",
      "value": "Actualizare disponibilă"
    },
    {
      "key": "update.version",
      "value": "Versiunea {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Mai târziu"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Actualizează și repornește"
    },
    {
      "key": "update.startingDownload",
      "value": "Încep descărcarea securizată…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Se descarcă actualizarea semnată…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Se descarcă: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB descărcați"
    },
    {
      "key": "update.installing",
      "value": "Se instalează actualizarea…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Actualizare instalată. Se repornește editorul…"
    },
    {
      "key": "update.installFailed",
      "value": "Actualizarea nu a putut fi instalată. Versiunea curentă rămâne neschimbată."
    },
    {
      "key": "actions.reset",
      "value": "Resetează"
    },
    {
      "key": "actions.confirm",
      "value": "Confirmă"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Modificări confirmate"
    },
    {
      "key": "actions.back",
      "value": "Înapoi"
    },
    {
      "key": "actions.change",
      "value": "Schimbă"
    },
    {
      "key": "actions.edit",
      "value": "Editează"
    },
    {
      "key": "characterForm.name",
      "value": "Nume:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Coordonate:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Timp de joc:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleportare:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Selectează o locație"
    },
    {
      "key": "bosses.alive",
      "value": "În viață"
    },
    {
      "key": "bosses.dead",
      "value": "Mort"
    }
  ],
  "el": [
    {
      "key": "flags.card.confirm",
      "value": "Εφαρμόζετε αυτή τη γνωστή σημαία αποθήκευσης; Δημιουργείται αντίγραφο ασφαλείας πριν την αποθήκευση."
    },
    {
      "key": "flags.card.applied",
      "value": "Η σημαία εφαρμόστηκε στην αποθηκευμένη μνήμη. Επιλέξτε «Αποθήκευση αλλαγών» για να γράψετε το αρχείο."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Αδύνατη η εφαρμογή αυτής της σημαίας: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Αλλαγές:"
    },
    {
      "key": "flags.card.careful",
      "value": "Προσοχή:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Επικυρωμένο πρότυπο byte:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Απόκρυψη λεπτομερειών"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Τι κάνει αυτό;"
    },
    {
      "key": "flags.card.applying",
      "value": "Εφαρμόζεται…"
    },
    {
      "key": "flags.card.apply",
      "value": "Εφαρμογή"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Επαναφορά διαλόγου της Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Αποκατάσταση αφήγησης"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Επαναφέρει ένα μικρό σύνολο γραμμών διαλόγου πριν την αναμέτρηση με τη Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Αυτό αλλάζει μόνο την κατάσταση των διαλόγων· δεν χορηγεί αντικείμενο, επίπεδο ή ανταμοιβή αφεντικού."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Χρησιμοποιήστε πρώτα σε αντίγραφο αποθήκευσης εάν βρίσκεστε αυτήν τη στιγμή στην περιοχή Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Ενεργοποίηση παλαιού νανουρίσματος της Doll"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Κλασική παρουσίαση"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Επαναενεργοποιεί τη συμπεριφορά του νανουρίσματος της Doll που σχετίζεται με την αρχική έκδοση 1.0."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Αυτό επαναφέρει μια κατάσταση κλασικής παρουσίασης. Δεν αλλάζει χαρακτηριστικά, αποθέματα ή ανταμοιβές αποστολών."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Η συμπεριφορά εξαρτάται από την έκδοση· κρατήστε το αντίγραφο ασφαλείας μέχρι να φορτωθεί επιτυχώς ο χαρακτήρας."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Ενεργοποίηση συμπεριφοράς συνεργασίας Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Συμπεριφορά πολλών παικτών"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Ενεργοποιεί την αλληλεπίδραση Blood-addled που συνδέεται με συνεργαζόμενους παίκτες που χρησιμοποιούν τη Rune Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Αυτό αλλάζει τη συμπεριφορά εχθρότητας στο multiplayer όσο πληρούνται οι σχετικές συνθήκες rune."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Χρησιμοποιήστε αυτό μόνο εκτός σύνδεσης ή με συναίνεση των παικτών. Μπορεί να δημιουργήσει συγκεχυμένη εχθρική συμπεριφορά σε συνεργατικό παιχνίδι."
    },
    {
      "key": "inventory.title",
      "value": "Αντικείμενα"
    },
    {
      "key": "inventory.addItem",
      "value": "Προσθήκη αντικειμένου"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Αντικατάσταση αντικειμένου"
    },
    {
      "key": "inventory.catalog",
      "value": "Κατάλογος"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Αναζήτηση καταλόγου"
    },
    {
      "key": "inventory.searchItems",
      "value": "Αναζήτηση αντικειμένων {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Ποσότητα"
    },
    {
      "key": "inventory.addSelected",
      "value": "Προσθήκη επιλεγμένου αντικειμένου"
    },
    {
      "key": "inventory.cancel",
      "value": "Ακύρωση"
    },
    {
      "key": "inventory.close",
      "value": "Κλείσιμο"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Όπλα"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Πανοπλίες"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (πειραματική άμεση προσθήκη)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (πειραματική άμεση προσθήκη)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Προσθήκη έτοιμου gem ή rune"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Προσθήκη όπλου ή πανοπλίας"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Δημιουργία έτοιμου Blood Gem ή Caryll Rune απευθείας από επικυρωμένα εφέ όταν υπάρχει ασφαλές επαναχρησιμοποιήσιμο αρχείο στην αποθήκευση."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Δημιουργία καταχωρημένου όπλου ή πανοπλίας απευθείας όταν η αποθήκευση περιέχει ασφαλές επαναχρησιμοποιήσιμο μπλοκ θέσης εξοπλισμού."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Άμεσος δημιουργός gem και rune"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Πειραματικό: αυτή η λειτουργία επαναχρησιμοποιεί μόνο ένα ασφαλές ορφανό αρχείο αναβάθμισης. Δεν μεταβάλλει ποτέ τη διάταξη της αποθήκευσης. Κρατήστε το αυτόματο αντίγραφο ασφαλείας μέχρι να φορτωθεί κανονικά ο χαρακτήρας."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Πειραματικό: αυτή η λειτουργία επαναχρησιμοποιεί μόνο ένα ασφαλές ορφανό μπλοκ θέσης εξοπλισμού και δημιουργεί πέντε κλειστές θέσεις gem. Ανοίξτε τις θέσεις αργότερα με Gems αν χρειάζεται."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Επιλέξτε ένα επικυρωμένο πρώτο εφέ πριν προσθέσετε gem ή rune."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Η άμεση προσθήκη δεν μπορούσε να ολοκληρωθεί με ασφάλεια."
    },
    {
      "key": "inventory.addDirect",
      "value": "Προσθήκη απευθείας"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Προσθήκη εξοπλισμού"
    },
    {
      "key": "inventory.gemShape",
      "value": "Σχήμα gem"
    },
    {
      "key": "inventory.runeType",
      "value": "Τύπος rune"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Επιλέξτε ένα preset rune"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Επεξεργασία {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Όνομα προσωπικού preset για {{subject}}"
    },
    {
      "key": "forge.savedStatus",
      "value": "Αποθηκεύτηκε «{{name}}» στα Προσωπικά presets για Gem Forge και Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Μετατροπή σε {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Να μετατραπεί αυτό το {{source}} σε {{destination}}; Κρατήστε το αυτόματο αντίγραφο ασφαλείας μέχρι να δοκιμάσετε την αποθήκευση."
    },
    {
      "key": "forge.unableToApply",
      "value": "Αδύνατη η εφαρμογή αυτής της αλλαγής."
    },
    {
      "key": "forge.closeLabel",
      "value": "Κλείσιμο του {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Η φόρτωση ενός preset ενημερώνει μόνο το ορατό προσχέδιο. Επιλέξτε Επιβεβαίωση στον επεξεργαστή για να το γράψετε στην αποθήκευση. Κάθε εφέ παρακάτω προέρχεται από το ενσωματωμένο επικυρωμένο κατάλογο του επεξεργαστή. Τα προσωπικά presets μοιράζονται μεταξύ Gem Forge και Rune Forge· ο προορισμός επεξεργασίας διατηρεί το δικό του έγκυρο Σχήμα ή Τύπο."
    },
    {
      "key": "forge.modeLabel",
      "value": "Λειτουργία {{subject}} Forge"
    },
    {
      "key": "forge.presets",
      "value": "Προεπιλογές"
    },
    {
      "key": "forge.presetCategories",
      "value": "Κατηγορίες προεπιλογών"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Προσαρμοσμένο σύνολο εφέ {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Δημιουργία {{subject}} με έξι εφέ"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Επιλέξτε έως έξι επικυρωμένα εφέ. Τα κενά slots παραμένουν ως Χωρίς εφέ. Ο επεξεργαστής επικυρώνει ξανά κάθε επιλεγμένο ID όταν επιβεβαιώσετε."
    },
    {
      "key": "forge.effect",
      "value": "Εφέ {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Προεπισκόπηση προσχεδίου"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Επιλέξτε τουλάχιστον ένα εφέ για να φορτώσετε ένα προσαρμοσμένο προσχέδιο."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Προσωπικά presets για {{subject}}"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Προσωπικά presets κοινά και για τα δύο forges"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Αποθηκεύστε μια επεξεργασμένη gem ή rune μία φορά, και μετά φορτώστε το ίδιο preset από το Gem Forge ή το Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Προσωπικά"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Προσωπικό preset Forge που μοιράζεται από Gem Forge και Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Διαγραφή του προσωπικού preset «{{name}}»;"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Δεν έχει αποθηκευτεί ακόμη προσωπικό preset."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Επεξεργαστείτε ένα gem ή rune και μετά χρησιμοποιήστε «Αποθήκευση ως preset» για να το κάνετε διαθέσιμο και στους δύο forges."
    },
    {
      "key": "forge.customName",
      "value": "Προσαρμοσμένος {{subject}} Forge"
    },
    {
      "key": "forge.customDescription",
      "value": "Προσαρμοσμένο σύνολο — {{count}} επιλεγμένα εφέ."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Επικυρωμένο preset Caryll Rune."
    },
    {
      "key": "forge.categories.All",
      "value": "Όλα"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Επίθεση"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Στοιχειακά"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Ανάκτηση"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Πειραματικό"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Προσωπικά"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Προσαρμοσμένο"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Ανώτατη Φυσική"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Φυσική ζημιά, πίεση στην πλήρη υγεία και υποστήριξη ανθεκτικότητας."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Ανώτατη Θρέψη"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Ενίσχυση όλων των ζημιών με πίεση πλήρους υγείας και ανάκτηση."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Υψηλή ζημιά Bloodtinge με υποστήριξη όλων των ζημιών και ανάκτησης."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Καταστροφέας Κρούσης"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Υψηλή ζημιά κρούσης με υποστήριξη για όλες τις ζημιές και ανθεκτικότητα."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Ειδικός Τρυπήματος"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Υψηλή ζημιά τρυπήματος με υποστήριξη για όλες τις ζημιές και ανθεκτικότητα."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Προπομπός"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Ενίσχυση όλων των ζημιών με φυσική πίεση και μεγάλο μπόνους ανάκτησης."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Άνοδος Αρκάνου"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Ζημιά Arcane με υποστήριξη ανάκτησης και ανθεκτικότητας."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Έκρηξη Φλόγας"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Ζημιά από φωτιά με ενίσχυση όλων των ζημιών και υποστήριξη ανάκτησης."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Έκρηξη Κεραυνού"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Ζημιά από κεραυνό με ενίσχυση όλων των ζημιών και υποστήριξη ανθεκτικότητας."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Ανυψωτής Στοιχείων"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Εφέ Arcane, φωτιάς και κεραυνού σε ένα σκόπιμα πειραματικό σετ."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Επίμονο Κυνήγι"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Υποστήριξη ανάκτησης, ανθεκτικότητας και όλων των ζημιών για μακρές συνεδρίες εξερεύνησης."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Αβυσσαία Ζωτικότητα +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Χρησιμοποιεί το ενσωματωμένο συνεχές εφέ +75 ανάκτησης HP με υποστήριξη ανθεκτικότητας και ζημιάς."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Σφυρηλατημένη Αντοχή"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Το ισχυρότερο γνωστό πακέτο μπόνους ανθεκτικότητας σε συνδυασμό με υψηλή ανάκτηση και φυσική ζημιά."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Τελευταία Στάση"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Υψηλοί πολλαπλασιαστές σε κατάσταση κοντά στο θάνατο και σε πλήρη υγεία. Κρατήστε αυτό το σετ εκτός σύνδεσης."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Γυάλινο Κανόνι"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Συσσωρεύει πολλαπλασιαστές φυσικών, όλων των ζημιών και κοντά στο θάνατο για δοκιμές μόνο."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Ατελείωτο Κυνήγι"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Μέγιστα γνωστά εφέ ανάκτησης και ανθεκτικότητας με μπόνους ζημιάς στην πλήρη υγεία."
    },
    {
      "key": "update.available",
      "value": "Διαθέσιμη ενημέρωση"
    },
    {
      "key": "update.version",
      "value": "Έκδοση {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Όχι τώρα"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Ενημέρωση και επανεκκίνηση"
    },
    {
      "key": "update.startingDownload",
      "value": "Έναρξη ασφαλούς λήψης…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Λήψη υπογεγραμμένης ενημέρωσης…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Λήψη: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB λήφθηκαν"
    },
    {
      "key": "update.installing",
      "value": "Εγκατάσταση ενημέρωσης…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Ενημέρωση εγκαταστάθηκε. Επανεκκίνηση του editor…"
    },
    {
      "key": "update.installFailed",
      "value": "Η ενημέρωση δεν μπόρεσε να εγκατασταθεί. Η τρέχουσα έκδοσή σας παραμένει ίδια."
    },
    {
      "key": "actions.reset",
      "value": "Επαναφορά"
    },
    {
      "key": "actions.confirm",
      "value": "Επιβεβαίωση"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Οι αλλαγές επιβεβαιώθηκαν"
    },
    {
      "key": "actions.back",
      "value": "Πίσω"
    },
    {
      "key": "actions.change",
      "value": "Αλλαγή"
    },
    {
      "key": "actions.edit",
      "value": "Επεξεργασία"
    },
    {
      "key": "characterForm.name",
      "value": "Όνομα:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Συντεταγμένες:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Χρόνος παιχνιδιού:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Τηλεμεταφορά:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Επιλέξτε τοποθεσία"
    },
    {
      "key": "bosses.alive",
      "value": "Ζωντανός"
    },
    {
      "key": "bosses.dead",
      "value": "Νεκρός"
    }
  ],
  "id": [
    {
      "key": "flags.card.confirm",
      "value": "Terapkan flag simpan ini? Cadangan otomatis dibuat sebelum menyimpan."
    },
    {
      "key": "flags.card.applied",
      "value": "Flag diterapkan ke save di memori. Pilih Simpan perubahan untuk menulis file."
    },
    {
      "key": "flags.card.applyFailed",
      "value": "Tidak dapat menerapkan flag ini: {{error}}"
    },
    {
      "key": "flags.card.whatChanges",
      "value": "Perubahan:"
    },
    {
      "key": "flags.card.careful",
      "value": "Hati-hati:"
    },
    {
      "key": "flags.card.bytePattern",
      "value": "Pola byte tervalidasi:"
    },
    {
      "key": "flags.card.hideDetails",
      "value": "Sembunyikan detail"
    },
    {
      "key": "flags.card.showDetails",
      "value": "Apa fungsi ini?"
    },
    {
      "key": "flags.card.applying",
      "value": "Menerapkan…"
    },
    {
      "key": "flags.card.apply",
      "value": "Terapkan"
    },
    {
      "key": "flags.entries.restoreMaria.label",
      "value": "Pulihkan dialog Lady Maria"
    },
    {
      "key": "flags.entries.restoreMaria.category",
      "value": "Pemulihan naratif"
    },
    {
      "key": "flags.entries.restoreMaria.info",
      "value": "Mengembalikan beberapa baris dialog sebelum pertemuan dengan Lady Maria."
    },
    {
      "key": "flags.entries.restoreMaria.impact",
      "value": "Ini hanya mengubah status dialog; tidak memberikan item, level, atau hadiah bos."
    },
    {
      "key": "flags.entries.restoreMaria.warning",
      "value": "Gunakan pada salinan save terlebih dahulu jika Anda sedang berada di area Astral Clocktower."
    },
    {
      "key": "flags.entries.dollLullaby.label",
      "value": "Aktifkan lagu nina bobo warisan Boneka"
    },
    {
      "key": "flags.entries.dollLullaby.category",
      "value": "Presentasi warisan"
    },
    {
      "key": "flags.entries.dollLullaby.info",
      "value": "Mengembalikan perilaku lagu nina bobo Boneka yang terkait dengan rilis 1.0 asli."
    },
    {
      "key": "flags.entries.dollLullaby.impact",
      "value": "Ini mengembalikan status presentasi warisan. Tidak mengubah atribut, inventaris, atau hadiah misi."
    },
    {
      "key": "flags.entries.dollLullaby.warning",
      "value": "Perilaku ini sensitif terhadap versi; simpan cadangan sampai karakter berhasil dimuat."
    },
    {
      "key": "flags.entries.bloodAddled.label",
      "value": "Aktifkan perilaku co-op Blood-addled"
    },
    {
      "key": "flags.entries.bloodAddled.category",
      "value": "Perilaku multipemain"
    },
    {
      "key": "flags.entries.bloodAddled.info",
      "value": "Mengaktifkan interaksi Blood-addled yang terkait dengan pemain co-op yang menggunakan rune Hunter."
    },
    {
      "key": "flags.entries.bloodAddled.impact",
      "value": "Ini mengubah perilaku permusuhan multipemain selama kondisi rune terkait terpenuhi."
    },
    {
      "key": "flags.entries.bloodAddled.warning",
      "value": "Gunakan hanya saat offline atau dengan pemain yang setuju. Ini dapat menciptakan perilaku co-op bermusuhan yang membingungkan."
    },
    {
      "key": "inventory.title",
      "value": "Inventaris"
    },
    {
      "key": "inventory.addItem",
      "value": "Tambahkan item"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Ganti item"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Cari katalog"
    },
    {
      "key": "inventory.searchItems",
      "value": "Cari item {{type}}"
    },
    {
      "key": "inventory.quantity",
      "value": "Jumlah"
    },
    {
      "key": "inventory.addSelected",
      "value": "Tambahkan item terpilih"
    },
    {
      "key": "inventory.cancel",
      "value": "Batal"
    },
    {
      "key": "inventory.close",
      "value": "Tutup"
    },
    {
      "key": "inventory.item",
      "value": "item"
    },
    {
      "key": "inventory.type.item",
      "value": "item"
    },
    {
      "key": "inventory.type.key",
      "value": "item"
    },
    {
      "key": "inventory.type.chalice",
      "value": "item"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Senjata"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Armor"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (penambahan langsung eksperimental)"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (penambahan langsung eksperimental)"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Tambahkan gem atau rune jadi"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Tambahkan senjata atau armor"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Buat Blood Gem atau Caryll Rune jadi langsung dari efek tervalidasi ketika terdapat rekaman aman yang dapat digunakan ulang dalam save."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Buat senjata atau armor yang tercatat langsung ketika save berisi blok slot perlengkapan yang aman dan dapat digunakan ulang."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Pembuat gem dan rune langsung"
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Eksperimental: operasi ini hanya menggunakan kembali catatan upgrade yatim yang aman. Ini tidak pernah mengubah tata letak save. Simpan cadangan otomatis sampai karakter berhasil dimuat secara normal."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Eksperimental: operasi ini hanya menggunakan kembali blok slot-perlengkapan yatim yang aman dan membuat lima slot gem tertutup. Buka slot tersebut nanti dengan Gems jika diperlukan."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Pilih efek pertama yang tervalidasi sebelum menambahkan gem atau rune."
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Penambahan langsung tidak dapat diselesaikan dengan aman."
    },
    {
      "key": "inventory.addDirect",
      "value": "Tambahkan langsung"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Tambahkan perlengkapan"
    },
    {
      "key": "inventory.gemShape",
      "value": "Bentuk gem"
    },
    {
      "key": "inventory.runeType",
      "value": "Tipe rune"
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Pilih preset rune"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Sunting {{subject}}"
    },
    {
      "key": "forge.personalPresetName",
      "value": "Nama preset {{subject}} pribadi"
    },
    {
      "key": "forge.savedStatus",
      "value": "Tersimpan \"{{name}}\" di Preset Saya untuk Gem Forge dan Rune Forge."
    },
    {
      "key": "forge.convertTo",
      "value": "Ubah menjadi {{subject}}"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Ubah {{source}} ini menjadi {{destination}}? Simpan cadangan otomatis sampai Anda menguji save."
    },
    {
      "key": "forge.unableToApply",
      "value": "Tidak dapat menerapkan perubahan ini."
    },
    {
      "key": "forge.closeLabel",
      "value": "Tutup {{subject}} Forge"
    },
    {
      "key": "forge.notice",
      "value": "Memuat preset hanya memperbarui draft yang terlihat. Pilih Konfirmasi di editor untuk menulisnya ke save. Setiap efek di bawah berasal dari katalog tervalidasi yang tertanam di editor. Preset pribadi dibagikan oleh Gem Forge dan Rune Forge; editor tujuan mempertahankan Shape atau Type yang valid sendiri."
    },
    {
      "key": "forge.modeLabel",
      "value": "Mode Forge {{subject}}"
    },
    {
      "key": "forge.presets",
      "value": "Preset"
    },
    {
      "key": "forge.presetCategories",
      "value": "Kategori preset"
    },
    {
      "key": "forge.customSetLabel",
      "value": "Set efek kustom {{subject}}"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Buat {{subject}} dengan enam efek"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Pilih hingga enam efek tervalidasi. Slot kosong tetap menjadi Tanpa Efek. Editor memvalidasi setiap ID yang dipilih lagi saat Anda mengonfirmasi."
    },
    {
      "key": "forge.effect",
      "value": "Efek {{index}}"
    },
    {
      "key": "forge.draftPreview",
      "value": "Pratinjau draft"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Pilih setidaknya satu efek untuk memuat draft kustom."
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Preset {{subject}} pribadi"
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Preset pribadi yang dibagi oleh kedua forge"
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Simpan gem atau rune yang diedit sekali, lalu muat preset yang sama dari Gem Forge atau Rune Forge."
    },
    {
      "key": "forge.personal",
      "value": "Pribadi"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Preset Forge pribadi yang dibagikan oleh Gem Forge dan Rune Forge."
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Hapus preset pribadi \"{{name}}\"?"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Belum ada preset pribadi yang disimpan."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Sunting gem atau rune, lalu gunakan Simpan sebagai preset untuk membuatnya tersedia di kedua forge."
    },
    {
      "key": "forge.customName",
      "value": "Forge {{subject}} Kustom"
    },
    {
      "key": "forge.customDescription",
      "value": "Set kustom — {{count}} efek terpilih."
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Preset Caryll Rune tervalidasi."
    },
    {
      "key": "forge.categories.All",
      "value": "Semua"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Serangan"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Pemulihan"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Eksperimental"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Pribadi"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Kustom"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Puncak Fisik"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Kerusakan fisik, tekanan pada kesehatan penuh, dan dukungan daya tahan."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Puncak Pemulih"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Penguatan semua jenis kerusakan dengan tekanan saat kesehatan penuh dan pemulihan."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Daya serang Bloodtinge tinggi dengan dukungan semua-kerusakan dan pemulihan."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Pemecah Tumpul"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Daya serang tipe tumpul tinggi dengan dukungan semua-kerusakan dan daya tahan."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Spesialis Tusukan"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Daya serang tusukan tinggi dengan dukungan semua-kerusakan dan daya tahan."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Garda Depan"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Penguatan semua-kerusakan dengan tekanan fisik dan bonus pemulihan tinggi."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Lonjakan Arcane"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Kerusakan Arcane dengan dukungan pemulihan dan daya tahan."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Lonjakan Api"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Kerusakan api dengan dukungan semua-kerusakan dan pemulihan."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Lonjakan Petir"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Kerusakan petir dengan dukungan semua-kerusakan dan daya tahan."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Unggul Elemental"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Efek Arcane, api, dan petir dalam satu susunan yang sengaja eksperimental."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Perburuan Berkelanjutan"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Dukungan pemulihan, daya tahan, dan semua-kerusakan untuk sesi eksplorasi panjang."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Vitalitas Abyssal +75"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Menggunakan efek pemulihan HP kontinu +75 yang tertanam dengan dukungan daya tahan dan kerusakan."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Ketahanan Ditempa"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Bonus daya tahan terkuat yang diketahui, dipasangkan dengan pemulihan tinggi dan kerusakan fisik."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Pertahanan Terakhir"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Pengali tinggi saat nyaris mati dan saat kesehatan penuh. Simpan loadout ini offline."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Meriam Kaca"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Menumpuk pengali fisik, semua-kerusakan, dan nyaris-mati hanya untuk pengujian."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Perburuan Tanpa Akhir"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Efek pemulihan dan daya tahan maksimum yang diketahui dengan bonus kerusakan saat kesehatan penuh."
    },
    {
      "key": "update.available",
      "value": "Pembaruan tersedia"
    },
    {
      "key": "update.version",
      "value": "Versi {{version}}"
    },
    {
      "key": "update.notNow",
      "value": "Nanti"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Perbarui dan mulai ulang"
    },
    {
      "key": "update.startingDownload",
      "value": "Memulai unduhan aman…"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Mengunduh pembaruan bertanda tangan…"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Mengunduh: {{percentage}}%"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB terunduh"
    },
    {
      "key": "update.installing",
      "value": "Menginstal pembaruan…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Pembaruan terpasang. Memulai ulang editor…"
    },
    {
      "key": "update.installFailed",
      "value": "Pembaruan gagal diinstal. Versi Anda tetap tidak berubah."
    },
    {
      "key": "actions.reset",
      "value": "Atur Ulang"
    },
    {
      "key": "actions.confirm",
      "value": "Konfirmasi"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Perubahan dikonfirmasi"
    },
    {
      "key": "actions.back",
      "value": "Kembali"
    },
    {
      "key": "actions.change",
      "value": "Ubah"
    },
    {
      "key": "actions.edit",
      "value": "Sunting"
    },
    {
      "key": "characterForm.name",
      "value": "Nama:"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinat:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Waktu bermain:"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleport:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Pilih lokasi"
    },
    {
      "key": "bosses.alive",
      "value": "Hidup"
    },
    {
      "key": "bosses.dead",
      "value": "Mati"
    }
  ]
};

function applyTranslationPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    cursor[part] = { ...(cursor[part] ?? {}) };
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

Object.entries(beta5TranslatedOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  translations.forEach(({ key, value }) => applyTranslationPath(translatedResource, key, value));
  resources[language] = translatedResource;
});

const beta5TerminologyOverrides = {
  de: { "inventory.gems": "Edelsteine" },
  sv: { "inventory.gems": "Ädelstenar" },
  ro: { "inventory.gems": "Pietre prețioase" },
  el: { "inventory.gems": "Πολύτιμοι λίθοι" },
};

Object.entries(beta5TerminologyOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  Object.entries(translations).forEach(([key, value]) => applyTranslationPath(translatedResource, key, value));
  resources[language] = translatedResource;
});

const finalV020TranslatedOverrides = {
  "da": [
    {
      "key": "actions.back",
      "value": "Tilbage"
    },
    {
      "key": "actions.change",
      "value": "Skift"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Ændringer bekræftet"
    },
    {
      "key": "actions.confirm",
      "value": "Bekræft"
    },
    {
      "key": "actions.edit",
      "value": "Rediger"
    },
    {
      "key": "actions.reset",
      "value": "Nulstil"
    },
    {
      "key": "bosses.alive",
      "value": "Levende"
    },
    {
      "key": "bosses.dead",
      "value": "Død"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinater:"
    },
    {
      "key": "characterForm.name",
      "value": "Navn:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Spilletid:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Vælg et sted"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleport:"
    },
    {
      "key": "flags.eyebrow",
      "value": "Avancerede gemningsindstillinger"
    },
    {
      "key": "flags.introduction",
      "value": "Kun uafhængigt dokumenterede byte-mønstre vises her. Ukendte offsets er bevidst udeladt for at beskytte gemningen mod utilsigtet korruption."
    },
    {
      "key": "flags.listLabel",
      "value": "Kendte gemningsflag"
    },
    {
      "key": "flags.safetyDescription",
      "value": "Anvend én ændring ad gangen, og brug derefter Gem ændringer. Behold den automatiske backup, indtil karakteren indlæses normalt."
    },
    {
      "key": "flags.safetyTitle",
      "value": "Før du anvender et flag"
    },
    {
      "key": "flags.title",
      "value": "Kendte flag"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Byg et seks-effekters {{subject}}"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Bruger den indbyggede +75 kontinuerlige HP-genopretnings-effekt med holdbarheds- og skadestøtte."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Forøgelse af al skade med fysisk pres og stor helingsbonus."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Forpost"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Skadeforøgelse for alle typer med pres ved fuld sundhed og heling."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Nærende"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fysisk skade, pres ved fuld sundhed og holdbarhedsstøtte."
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Fysisk"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arkane skader med støtte til heling og holdbarhed."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arkane Stigning"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Høj Bloodtinge-skade med støtte til al skade og heling."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge-jæger"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Høj stump skade med støtte til al skade og holdbarhed."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Slagknuser"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Lynskade med støtte til al skade og holdbarhed."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Lynbølge"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arkane-, ild- og lyn-effekter i én bevidst eksperimentel opstilling."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementær Ascendant"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maksimale kendte helings- og holdbarhedseffekter med fuld-sundheds skadebonus."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Endeløs Jagt"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Ildskade med støtte til al skade og heling."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Flammebølge"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Det stærkeste kendte bundtede holdbarhedsbonus parret med høj heling og fysisk skade."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Smedet Udholdenhed"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Stakker fysisk, al-skade og nær-død-multiplikatorer kun til test."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glaskanon"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Høje nær-død- og fuld-sundheds-multiplikatorer. Hold denne opstilling offline."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Sidste Stand"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Heling, holdbarhed og støtte til al skade for lange udforskningssessioner."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Varig Jagt"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Høj stikkende skade med støtte til al skade og holdbarhed."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Stikspecialist"
    },
    {
      "key": "forge.cancel",
      "value": "Annuller"
    },
    {
      "key": "forge.categories.All",
      "value": "Alle"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Angreb"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Brugerdefineret"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementær"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Eksperimentel"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personlig"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Genopretning"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.close",
      "value": "Luk"
    },
    {
      "key": "forge.closeLabel",
      "value": "Luk {{subject}} Forge"
    },
    {
      "key": "forge.confirm",
      "value": "Bekræft"
    },
    {
      "key": "forge.confirming",
      "value": "Bekræfter…"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Konverter denne {{source}} til en {{destination}}? Behold den automatiske backup, indtil du har testet gemningen."
    },
    {
      "key": "forge.convertTo",
      "value": "Konverter til {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Brugerdefineret sæt — {{count}} valgte effekter."
    },
    {
      "key": "forge.customName",
      "value": "Brugerdefineret {{subject}} Forge"
    },
    {
      "key": "forge.customSet",
      "value": "Brugerdefineret sæt"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Vælg op til seks validerede effekter. Tomme felter forbliver som Ingen effekt. Editoren validerer hvert valgt ID igen, når du bekræfter."
    },
    {
      "key": "forge.customSetLabel",
      "value": "Brugerdefineret {{subject}} effektsæt"
    },
    {
      "key": "forge.delete",
      "value": "Slet"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Slet den personlige forudindstilling “{{name}}”?"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Rediger {{subject}}"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Vælg mindst én effekt for at indlæse et brugerdefineret udkast."
    },
    {
      "key": "forge.draftPreview",
      "value": "Udkastvisning"
    },
    {
      "key": "forge.editing",
      "value": "Redigerer:"
    },
    {
      "key": "forge.effect",
      "value": "Effekt {{index}}"
    },
    {
      "key": "forge.gemForge",
      "value": "Gem Forge"
    },
    {
      "key": "forge.loadCustomDraft",
      "value": "Indlæs brugerdefineret sæt i udkast"
    },
    {
      "key": "forge.loadIntoDraft",
      "value": "Indlæs i udkast"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge-tilstand"
    },
    {
      "key": "forge.myPresets",
      "value": "Mine forudindstillinger"
    },
    {
      "key": "forge.noEffect",
      "value": "Ingen effekt"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Ingen personlig forudindstilling er gemt endnu."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Rediger en gem eller rune, og brug derefter Gem som forudindstilling for at gøre den tilgængelig i begge forger."
    },
    {
      "key": "forge.notice",
      "value": "Indlæsning af en forudindstilling opdaterer kun det synlige udkast. Vælg Bekræft i editoren for at skrive det til gemningen. Hver effekt nedenfor kommer fra editorens indbyggede validerede katalog. Personlige forudindstillinger deles af Gem Forge og Rune Forge; destinationseditoren bevarer sin egen gyldige form eller type."
    },
    {
      "key": "forge.personal",
      "value": "Personlig"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Personlig Forge-forudindstilling delt af Gem Forge og Rune Forge."
    },
    {
      "key": "forge.personalPresetName",
      "value": "Personligt {{subject}}-forudindstillingsnavn"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Personlige {{subject}}-forudindstillinger"
    },
    {
      "key": "forge.presetCategories",
      "value": "Forudindstillingskategorier"
    },
    {
      "key": "forge.presetName",
      "value": "Forudindstillingsnavn"
    },
    {
      "key": "forge.presets",
      "value": "Forudindstillinger"
    },
    {
      "key": "forge.runeForge",
      "value": "Rune Forge"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Valideret Caryll-rune-forudindstilling."
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Vælg en rune-forudindstilling"
    },
    {
      "key": "forge.saveAsPreset",
      "value": "Gem som forudindstilling"
    },
    {
      "key": "forge.savedStatus",
      "value": "Gemt “{{name}}” i Mine forudindstillinger for Gem Forge og Rune Forge."
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Gem et redigeret gem eller rune én gang, og indlæs derefter den samme forudindstilling fra Gem Forge eller Rune Forge."
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Personlige forudindstillinger delt af både Gem Forge og Rune Forge"
    },
    {
      "key": "forge.title",
      "value": "Validerede effekter og brugerdefinerede sæt"
    },
    {
      "key": "forge.unableToApply",
      "value": "Kan ikke anvende denne ændring."
    },
    {
      "key": "home.eyebrow",
      "value": "Offline karakteradministration"
    },
    {
      "key": "home.guide",
      "value": "Læs dekrypteringsvejledningen"
    },
    {
      "key": "home.lead",
      "value": "Åbn en dekrypteret Bloodborne-karaktergemning for at inspicere inventar, attributter, karakterindstillinger, bosser og flag. Editoren opretter en backup, når en fil åbnes; behold altid den, indtil du har tjekket resultatet i spillet."
    },
    {
      "key": "home.stepOneDescription",
      "value": "PlayStation-eksporter skal dekrypteres, før editoren kan læse dem."
    },
    {
      "key": "home.stepOneTitle",
      "value": "Brug en dekrypteret gemning"
    },
    {
      "key": "home.stepThreeDescription",
      "value": "Test den eksporterede fil, før du fjerner den automatiske .bak-kopi."
    },
    {
      "key": "home.stepThreeTitle",
      "value": "Bekræft før udskiftning"
    },
    {
      "key": "home.stepTwoDescription",
      "value": "Gennemgå hver ændring og undgå at bruge modificerede gemninger online."
    },
    {
      "key": "home.stepTwoTitle",
      "value": "Foretag målrettede ændringer"
    },
    {
      "key": "home.title",
      "value": "Rediger med omtanke. Bevar din jagt."
    },
    {
      "key": "inventory.addDescription",
      "value": "Vælg en genstand fra et sikkert katalog og vælg dens antal."
    },
    {
      "key": "inventory.addDialogLabel",
      "value": "Tilføj katalogiseret genstand"
    },
    {
      "key": "inventory.addDirect",
      "value": "Tilføj direkte"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Tilføj udstyr"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Tilføj en færdig gem eller rune"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Tilføj udstyr"
    },
    {
      "key": "inventory.addItem",
      "value": "Tilføj en genstand"
    },
    {
      "key": "inventory.addNotice",
      "value": "Våben og rustning bevarer ekstra slot-data. Brug Erstat på et eksisterende våben eller rustning i stedet for Tilføj, så disse data forbliver gyldige."
    },
    {
      "key": "inventory.addSelected",
      "value": "Tilføj valgte genstand"
    },
    {
      "key": "inventory.cancel",
      "value": "Annuller"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Rustning"
    },
    {
      "key": "inventory.catalogChaliceItems",
      "value": "Bægergenstande"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (eksperimentel direkte tilføjelse)"
    },
    {
      "key": "inventory.catalogItems",
      "value": "Genstande og forbrugsvarer"
    },
    {
      "key": "inventory.catalogKeyItems",
      "value": "Nøglegenstande"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll-runer (eksperimentel direkte tilføjelse)"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Våben"
    },
    {
      "key": "inventory.close",
      "value": "Luk"
    },
    {
      "key": "inventory.closeAddLabel",
      "value": "Luk Tilføj genstand"
    },
    {
      "key": "inventory.closeReplaceLabel",
      "value": "Luk Erstat genstand"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Den direkte tilføjelse kunne ikke gennemføres sikkert."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Opret et katalogført våben eller rustning direkte, når gemningen indeholder en sikker genbrugelig udstyrs-slot-blok."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Eksperimentel: denne operation genbruger kun en sikker forældreløs udstyrs-slot-blok og opretter fem lukkede gem-slots. Åbn slottene senere med Gems, hvis nødvendigt."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Direkte gem- og runebygger"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Opret en færdig Blood Gem eller Caryll Rune direkte fra validerede effekter, når en sikker genbrugelig post er tilgængelig i gemningen."
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Eksperimentel: denne operation genbruger kun en sikker forældreløs opgraderingspost. Den ændrer aldrig gemningslayoutet. Behold den automatiske backup, indtil karakteren har indlæst normalt."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Vælg en valideret første effekt før du tilføjer en gem eller rune."
    },
    {
      "key": "inventory.directUpgradeUnavailable",
      "value": "Denne gemning har ingen sikker genbrugelig Gem/Rune-post. Ingen ændring blev foretaget. Opret en kompatibel slot i spillet, og prøv igen."
    },
    {
      "key": "inventory.edit",
      "value": "Rediger"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem-form"
    },
    {
      "key": "inventory.item",
      "value": "genstand"
    },
    {
      "key": "inventory.itemQuantity",
      "value": "Genstandsantal:"
    },
    {
      "key": "inventory.matchingItems",
      "value": "Matchende genstande"
    },
    {
      "key": "inventory.noMatchingItem",
      "value": "Ingen matchende genstand fundet."
    },
    {
      "key": "inventory.quantity",
      "value": "Antal"
    },
    {
      "key": "inventory.replaceDescription",
      "value": "Vælg en kompatibel {{type}} fra kataloget. Pladsens position bevares."
    },
    {
      "key": "inventory.replaceDialogLabel",
      "value": "Erstat valgte genstand"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Erstat genstand"
    },
    {
      "key": "inventory.replacing",
      "value": "Erstatter"
    },
    {
      "key": "inventory.runeType",
      "value": "Rune-type"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Søg i katalog"
    },
    {
      "key": "inventory.searchItems",
      "value": "Søg efter {{type}}-genstande"
    },
    {
      "key": "inventory.selectNew",
      "value": "Vælg en ny {{type}}"
    },
    {
      "key": "inventory.setValue",
      "value": "Indstil"
    },
    {
      "key": "inventory.title",
      "value": "Inventar"
    },
    {
      "key": "inventory.type.armor",
      "value": "rustning"
    },
    {
      "key": "inventory.type.chalice",
      "value": "bægergenstand"
    },
    {
      "key": "inventory.type.item",
      "value": "genstand"
    },
    {
      "key": "inventory.type.key",
      "value": "nøglegenstand"
    },
    {
      "key": "inventory.type.weapon",
      "value": "våben"
    },
    {
      "key": "inventory.weaponLevel",
      "value": "Våbenniveau:"
    },
    {
      "key": "language.label",
      "value": "Sprog"
    },
    {
      "key": "nav.activeSave",
      "value": "Aktivt gem"
    },
    {
      "key": "nav.controls",
      "value": "Gemfilkontroller"
    },
    {
      "key": "nav.noSaveLoaded",
      "value": "Ingen gemning indlæst"
    },
    {
      "key": "nav.openFileToBegin",
      "value": "Åbn en dekrypteret karakterfil for at begynde"
    },
    {
      "key": "nav.openSave",
      "value": "Åbn gemning"
    },
    {
      "key": "nav.saveChanges",
      "value": "Gem ændringer"
    },
    {
      "key": "operation.eyebrow",
      "value": "Arbejder med gemdata"
    },
    {
      "key": "operation.preparing",
      "value": "Forbereder editoren"
    },
    {
      "key": "operation.title",
      "value": "Hold dette vindue åbent."
    },
    {
      "key": "saveFlow.close",
      "value": "Luk"
    },
    {
      "key": "saveFlow.confirmSaveDescription",
      "value": "Dette skriver de aktuelle ændringer til den valgte fil. Behold den automatiske .bak-kopi, indtil du har verificeret gemningen i spillet."
    },
    {
      "key": "saveFlow.confirmSaveTitle",
      "value": "Bekræft gemning"
    },
    {
      "key": "saveFlow.discardAndOpen",
      "value": "Forkast og åbn"
    },
    {
      "key": "saveFlow.discardOpenDescription",
      "value": "Du har ugemte ændringer. Hvis du åbner en anden gemning, vil de nuværende ændringer blive forkastet."
    },
    {
      "key": "saveFlow.discardOpenTitle",
      "value": "Forkast ugemte ændringer?"
    },
    {
      "key": "saveFlow.keepEditing",
      "value": "Fortsæt redigering"
    },
    {
      "key": "saveFlow.loadedStatus",
      "value": "Gemning indlæst. En backup blev oprettet før redigering."
    },
    {
      "key": "saveFlow.openFailedDescription",
      "value": "Den valgte fil kunne ikke læses. Vælg en dekrypteret Bloodborne-karaktergemning og prøv igen."
    },
    {
      "key": "saveFlow.openFailedTitle",
      "value": "Kan ikke åbne gemning"
    },
    {
      "key": "saveFlow.openTitle",
      "value": "Åbn dekrypteret Bloodborne-gemning"
    },
    {
      "key": "saveFlow.saveCompletedDescription",
      "value": "Behold din .bak-kopi indtil den redigerede gemning er verificeret."
    },
    {
      "key": "saveFlow.saveCompletedTitle",
      "value": "Gemning fuldført"
    },
    {
      "key": "saveFlow.savedStatus",
      "value": "Ændringer gemt."
    },
    {
      "key": "saveFlow.saveFailedDescription",
      "value": "Den redigerede gemning kunne ikke skrives. Kontroller destinationen og rettigheder, og prøv igen."
    },
    {
      "key": "saveFlow.saveFailedTitle",
      "value": "Kan ikke gemme"
    },
    {
      "key": "saveFlow.saveTitle",
      "value": "Gem redigeret karakter"
    },
    {
      "key": "saveFlow.unsavedStatus",
      "value": "Ugemte ændringer"
    },
    {
      "key": "sidebar.backupDescription",
      "value": "Når du åbner en gemning, oprettes en .bak-kopi, før ændringer foretages."
    },
    {
      "key": "sidebar.backupTitle",
      "value": "Backup-først arbejdsgang"
    },
    {
      "key": "sidebar.bosses",
      "value": "Bosser"
    },
    {
      "key": "sidebar.bossesDescription",
      "value": "Fremdriftsstatus"
    },
    {
      "key": "sidebar.character",
      "value": "Karakter"
    },
    {
      "key": "sidebar.characterData",
      "value": "Karakterdata"
    },
    {
      "key": "sidebar.characterDescription",
      "value": "Identitet og placering"
    },
    {
      "key": "sidebar.flags",
      "value": "Flag"
    },
    {
      "key": "sidebar.flagsDescription",
      "value": "Avancerede indstillinger"
    },
    {
      "key": "sidebar.inventory",
      "value": "Inventar"
    },
    {
      "key": "sidebar.inventoryDescription",
      "value": "Genstande og udstyr"
    },
    {
      "key": "sidebar.stats",
      "value": "Statistik"
    },
    {
      "key": "sidebar.statsDescription",
      "value": "Attributter og ekkoer"
    },
    {
      "key": "sidebar.storage",
      "value": "Opbevaring"
    },
    {
      "key": "sidebar.storageDescription",
      "value": "Opbevarede genstande"
    },
    {
      "key": "sidebar.workspace",
      "value": "Redigeringsområde"
    },
    {
      "key": "unsaved.cancel",
      "value": "Annuller"
    },
    {
      "key": "unsaved.description",
      "value": "Dine aktuelle ændringer er ikke skrevet til en gemfil. Vælg Gem ændringer for at beholde dem, eller luk uden at gemme for at forkaste dem."
    },
    {
      "key": "unsaved.discard",
      "value": "Luk uden at gemme"
    },
    {
      "key": "unsaved.eyebrow",
      "value": "Ugemte ændringer"
    },
    {
      "key": "unsaved.save",
      "value": "Gem ændringer"
    },
    {
      "key": "unsaved.saving",
      "value": "Gemmer…"
    },
    {
      "key": "unsaved.title",
      "value": "Gem før lukning?"
    },
    {
      "key": "update.available",
      "value": "Opdatering tilgængelig"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB downloadet"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Downloader: {{percentage}}%"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Downloader underskrevet opdatering…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Opdatering installeret. Genstarter editor…"
    },
    {
      "key": "update.installFailed",
      "value": "Opdateringen kunne ikke installeres. Din nuværende version forbliver uændret."
    },
    {
      "key": "update.installing",
      "value": "Installerer opdatering…"
    },
    {
      "key": "update.notNow",
      "value": "Ikke nu"
    },
    {
      "key": "update.startingDownload",
      "value": "Starter sikker download…"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Opdater og genstart"
    },
    {
      "key": "update.version",
      "value": "Version {{version}}"
    }
  ],
  "fi": [
    {
      "key": "actions.back",
      "value": "Takaisin"
    },
    {
      "key": "actions.change",
      "value": "Vaihda"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Muutokset vahvistettu"
    },
    {
      "key": "actions.confirm",
      "value": "Vahvista"
    },
    {
      "key": "actions.edit",
      "value": "Muokkaa"
    },
    {
      "key": "actions.reset",
      "value": "Nollaa"
    },
    {
      "key": "bosses.alive",
      "value": "Elossa"
    },
    {
      "key": "bosses.dead",
      "value": "Kuollut"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinaatit:"
    },
    {
      "key": "characterForm.name",
      "value": "Nimi:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Peliaika:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Valitse sijainti"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleportointi:"
    },
    {
      "key": "flags.eyebrow",
      "value": "Edistyneet tallennusasetukset"
    },
    {
      "key": "flags.introduction",
      "value": "Tässä näkyvät vain itsenäisesti dokumentoidut tavumallit. Tuntemattomat offsetit on jätetty tahallisesti pois tallennetta vahingoittumasta."
    },
    {
      "key": "flags.listLabel",
      "value": "Tunnetut tallennusliput"
    },
    {
      "key": "flags.safetyDescription",
      "value": "Tee yksi muutos kerrallaan ja käytä sitten 'Tallenna muutokset'. Säilytä automaattisesti luotu varmuuskopio, kunnes hahmo latautuu normaalisti."
    },
    {
      "key": "flags.safetyTitle",
      "value": "Ennen lipun soveltamista"
    },
    {
      "key": "flags.title",
      "value": "Tunnetut liput"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Rakenna kuusi-efektinen {{subject}}"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Käyttää sisäänrakennettua +75 jatkuvaa HP‑palautusefektiä sekä kestävyyden ja vahingon tukea."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Kaikkien vahinkojen vahvistus fyysisellä paineella ja korkealla palautusbonuksella."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Etujoukko"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Kaikkien vahinkojen vahvistus, täyden terveyden bonus ja palautus."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Ravitseva"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fyysinen vahinko, täyden terveyden bonus ja kestävyyden tuki."
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex (fyysinen)"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arkaani‑vahinko, palautus ja kestävyyden tuki."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arkaani‑purkaus"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Korkea Bloodtinge‑vahinko sekä kaikkien vahinkojen ja palautuksen tuki."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge-metsästäjä"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Korkea tylppä vahinko, kaikkien vahinkojen ja kestävyyden tuki."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Tylppä murskaaja"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Salamavahinko, kaikkien vahinkojen ja kestävyyden tuki."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Salamapurkaus"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arkaani-, tuli- ja salamaefektit yhdessä, tarkoituksellisesti kokeellinen kokoonpano."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementaalinen nousija"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Tunnetuista suurimmat palautus- ja kestävyysefektit täyden terveyden vahinkobonuksella."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Loputon metsästys"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Tulivahinko, kaikkien vahinkojen ja palautuksen tuki."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Tulipurkaus"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Tunnetuin paketoitu kestävyysetu, yhdistettynä korkeaan palautukseen ja fyysiseen vahinkoon."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Takomakestävyys"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Pinottaa fyysisiä, kaikkien vahinkojen ja lähellä‑kuolemaa kertoimia vain testaukseen."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Lasikanuuna"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Korkeat lähellä-kuolemaa ja täyden terveyden kertoimet. Käytä tätä kokoonpanoa vain offline‑tilassa."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Viimeinen taistelu"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Palautus, kestävyys ja kaikkien vahinkojen tuki pitkille tutkimusretkille."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Pitkäkestoinen metsästys"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Korkea pistosvahinko, kaikkien vahinkojen ja kestävyyden tuki."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Pistosasiantuntija"
    },
    {
      "key": "forge.cancel",
      "value": "Peruuta"
    },
    {
      "key": "forge.categories.All",
      "value": "Kaikki"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Hyökkäys"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Mukautettu"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementaalinen"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Kokeellinen"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Henkilökohtainen"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Palautus"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Runi"
    },
    {
      "key": "forge.close",
      "value": "Sulje"
    },
    {
      "key": "forge.closeLabel",
      "value": "Sulje {{subject}} Forge"
    },
    {
      "key": "forge.confirm",
      "value": "Vahvista"
    },
    {
      "key": "forge.confirming",
      "value": "Vahvistetaan…"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Muunna tämä {{source}} {{destination}}ksi? Säilytä automaattinen varmuuskopio, kunnes olet testannut tallennetta."
    },
    {
      "key": "forge.convertTo",
      "value": "Muunna {{subject}}ksi"
    },
    {
      "key": "forge.customDescription",
      "value": "Mukautettu sarja — {{count}} valittua efektiä."
    },
    {
      "key": "forge.customName",
      "value": "Mukautettu {{subject}} Forge"
    },
    {
      "key": "forge.customSet",
      "value": "Mukautettu sarja"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Valitse enintään kuusi vahvistettua efektiä. Tyhjät paikat pysyvät Ei vaikutusta -tilassa. Editori tarkistaa jokaisen valitun ID:n uudelleen vahvistettaessa."
    },
    {
      "key": "forge.customSetLabel",
      "value": "Mukautettu {{subject}}-efektisarja"
    },
    {
      "key": "forge.delete",
      "value": "Poista"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Poistetaanko henkilökohtainen esiasetus “{{name}}”?"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Muokkaa {{subject}}"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Valitse vähintään yksi efekti ladataksesi mukautetun luonnoksen."
    },
    {
      "key": "forge.draftPreview",
      "value": "Luonnoksen esikatselu"
    },
    {
      "key": "forge.editing",
      "value": "Muokataan:"
    },
    {
      "key": "forge.effect",
      "value": "Efekti {{index}}"
    },
    {
      "key": "forge.gemForge",
      "value": "Gem Forge"
    },
    {
      "key": "forge.loadCustomDraft",
      "value": "Lataa mukautettu sarja luonnokseen"
    },
    {
      "key": "forge.loadIntoDraft",
      "value": "Lataa luonnokseen"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge -tila"
    },
    {
      "key": "forge.myPresets",
      "value": "Omat esiasetukset"
    },
    {
      "key": "forge.noEffect",
      "value": "Ei vaikutusta"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Henkilökohtaista esiasetusta ei ole vielä tallennettu."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Muokkaa gemiä tai runia, käytä sitten 'Tallenna esiasetuksena' tehdäksesi sen saataville molemmissa forgeissa."
    },
    {
      "key": "forge.notice",
      "value": "Esiasetuksen lataus päivittää vain näkyvän luonnoksen. Valitse editorissa Vahvista kirjoittaaksesi sen tallenteeseen. Alla olevat efektit tulevat editorin sisäänrakennetusta vahvistetusta luettelosta. Henkilökohtaiset esiasetukset ovat yhteisiä Gem Forgelle ja Rune Forgelle; kohteen editori säilyttää oman kelvollisen muodon tai tyypin."
    },
    {
      "key": "forge.personal",
      "value": "Henkilökohtainen"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Henkilökohtainen Forge-esiasetus, jota Gem Forge ja Rune Forge jakavat."
    },
    {
      "key": "forge.personalPresetName",
      "value": "Oma {{subject}}-esiasetuksen nimi"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Henkilökohtaiset {{subject}}-esiasetukset"
    },
    {
      "key": "forge.presetCategories",
      "value": "Esiasetusten kategoriat"
    },
    {
      "key": "forge.presetName",
      "value": "Esiasetuksen nimi"
    },
    {
      "key": "forge.presets",
      "value": "Esiasetukset"
    },
    {
      "key": "forge.runeForge",
      "value": "Rune Forge"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Vahvistettu Caryll Rune -esiasetus."
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Valitse rune-esiasetus"
    },
    {
      "key": "forge.saveAsPreset",
      "value": "Tallenna esiasetuksena"
    },
    {
      "key": "forge.savedStatus",
      "value": "Tallennettu “{{name}}” omiin esiasetuksiin Gem Forgea ja Rune Forgea varten."
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Tallenna kerran muokattu gem tai rune, sitten lataa sama esiasetus Gem Forgesta tai Rune Forgesta."
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Henkilökohtaiset esiasetukset, joita Gem Forge ja Rune Forge jakavat"
    },
    {
      "key": "forge.title",
      "value": "Vahvistetut efektit ja mukautetut sarjat"
    },
    {
      "key": "forge.unableToApply",
      "value": "Muutosta ei voitu soveltaa."
    },
    {
      "key": "home.eyebrow",
      "value": "Offline-hahmon hallinta"
    },
    {
      "key": "home.guide",
      "value": "Lue purkuohjeet"
    },
    {
      "key": "home.lead",
      "value": "Avaa purettu Bloodborne-hahmon tallenne tarkastellaksesi varastoa, ominaisuuksia, hahmoasetuksia, pomoja ja lippuja. Editori luo varmuuskopion avatessa tiedoston; säilytä se aina, kunnes olet tarkistanut tuloksen pelissä."
    },
    {
      "key": "home.stepOneDescription",
      "value": "PlayStationin vientitiedostot on purettava ennen kuin editori voi lukea niitä."
    },
    {
      "key": "home.stepOneTitle",
      "value": "Käytä purettua tallennetta"
    },
    {
      "key": "home.stepThreeDescription",
      "value": "Testaa viedyt tiedosto ennen automaattisen .bak‑kopion poistamista."
    },
    {
      "key": "home.stepThreeTitle",
      "value": "Varmista ennen korvaamista"
    },
    {
      "key": "home.stepTwoDescription",
      "value": "Tarkista jokainen muutos ja vältä muokattujen tallenteiden käyttöä verkkopeleissä."
    },
    {
      "key": "home.stepTwoTitle",
      "value": "Tee kohdennettuja muokkauksia"
    },
    {
      "key": "home.title",
      "value": "Muokkaa harkiten. Säilytä metsästyksesi."
    },
    {
      "key": "inventory.addDescription",
      "value": "Valitse esine turvallisesta luettelosta ja määritä määrä."
    },
    {
      "key": "inventory.addDialogLabel",
      "value": "Lisää luettelosta löytyvä esine"
    },
    {
      "key": "inventory.addDirect",
      "value": "Lisää suoraan"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Lisää ase tai haarniska"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Lisää valmis gem tai rune"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Lisää varuste"
    },
    {
      "key": "inventory.addItem",
      "value": "Lisää esine"
    },
    {
      "key": "inventory.addNotice",
      "value": "Aseet ja haarniskat säilyttävät lisätiedot paikassa. Käytä 'Korvaa' olemassa olevalle aseelle tai haarniskalle 'Lisää'-toiminnon sijaan, jotta tiedot pysyvät kelvollisina."
    },
    {
      "key": "inventory.addSelected",
      "value": "Lisää valittu esine"
    },
    {
      "key": "inventory.cancel",
      "value": "Peruuta"
    },
    {
      "key": "inventory.catalog",
      "value": "Luettelo"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Haarniskat"
    },
    {
      "key": "inventory.catalogChaliceItems",
      "value": "Chalice-esineet"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (kokeellinen suora lisäys)"
    },
    {
      "key": "inventory.catalogItems",
      "value": "Esineet ja kulutettavat"
    },
    {
      "key": "inventory.catalogKeyItems",
      "value": "Tärkeät esineet"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (kokeellinen suora lisäys)"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Aseet"
    },
    {
      "key": "inventory.close",
      "value": "Sulje"
    },
    {
      "key": "inventory.closeAddLabel",
      "value": "Sulje 'Lisää esine'"
    },
    {
      "key": "inventory.closeReplaceLabel",
      "value": "Sulje 'Korvaa esine'"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Suoraa lisäystä ei voitu suorittaa turvallisesti."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Luo luettelossa oleva ase tai haarniska suoraan, kun tallenteessa on turvallinen uudelleenkäytettävä varustepaikkalohko."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Kokeellinen: tämä toiminto käyttää uudelleen vain turvallista hylättyä varustepaikkalohkoa ja luo viisi suljettua gem-paikkaa. Avaa paikat myöhemmin Gems‑toiminnolla tarvittaessa."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Suora gemien ja runien rakentaja"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Luo valmis Blood Gem tai Caryll Rune suoraan vahvistetuista efekteistä, kun tallenteessa on turvallinen uudelleenkäytettävä tietue."
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Kokeellinen: tämä toiminto käyttää uudelleen vain turvallista hylättyä päivitystietuetta. Se ei koskaan siirrä tallenteen rakennetta. Säilytä automaattinen varmuuskopio, kunnes hahmo latautuu normaalisti."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Valitse vahvistettu ensiefekti ennen gemin tai runin lisäämistä."
    },
    {
      "key": "inventory.directUpgradeUnavailable",
      "value": "Tässä tallenteessa ei ole turvallista uudelleenkäytettävää Gem/Rune‑tietuetta. Muutosta ei tehty. Luo yhteensopiva paikka pelissä ja yritä uudelleen."
    },
    {
      "key": "inventory.edit",
      "value": "Muokkaa"
    },
    {
      "key": "inventory.gems",
      "value": "Gemit"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gemin muoto"
    },
    {
      "key": "inventory.item",
      "value": "esine"
    },
    {
      "key": "inventory.itemQuantity",
      "value": "Esineiden määrä:"
    },
    {
      "key": "inventory.matchingItems",
      "value": "Vastaavat esineet"
    },
    {
      "key": "inventory.noMatchingItem",
      "value": "Yhtään vastaavaa esinettä ei löytynyt."
    },
    {
      "key": "inventory.quantity",
      "value": "Määrä"
    },
    {
      "key": "inventory.replaceDescription",
      "value": "Valitse yhteensopiva {{type}} luettelosta. Paikan sijainti säilyy."
    },
    {
      "key": "inventory.replaceDialogLabel",
      "value": "Korvaa valittu esine"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Korvaa esine"
    },
    {
      "key": "inventory.replacing",
      "value": "Korvataan"
    },
    {
      "key": "inventory.runeType",
      "value": "Runen tyyppi"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Hae luettelosta"
    },
    {
      "key": "inventory.searchItems",
      "value": "Hae {{type}}-esineitä"
    },
    {
      "key": "inventory.selectNew",
      "value": "Valitse uusi {{type}}"
    },
    {
      "key": "inventory.setValue",
      "value": "Aseta"
    },
    {
      "key": "inventory.title",
      "value": "Inventaario"
    },
    {
      "key": "inventory.type.armor",
      "value": "haarniska"
    },
    {
      "key": "inventory.type.chalice",
      "value": "esine"
    },
    {
      "key": "inventory.type.item",
      "value": "esine"
    },
    {
      "key": "inventory.type.key",
      "value": "esine"
    },
    {
      "key": "inventory.type.weapon",
      "value": "ase"
    },
    {
      "key": "inventory.weaponLevel",
      "value": "Aseen taso:"
    },
    {
      "key": "language.label",
      "value": "Kieli"
    },
    {
      "key": "nav.activeSave",
      "value": "Aktiivinen tallenne"
    },
    {
      "key": "nav.controls",
      "value": "Tallennustiedoston toiminnot"
    },
    {
      "key": "nav.noSaveLoaded",
      "value": "Ei tallennetta avattu"
    },
    {
      "key": "nav.openFileToBegin",
      "value": "Aloita avaamalla purettu hahmotiedosto"
    },
    {
      "key": "nav.openSave",
      "value": "Avaa tallenne"
    },
    {
      "key": "nav.saveChanges",
      "value": "Tallenna muutokset"
    },
    {
      "key": "operation.eyebrow",
      "value": "Tallennusdatan käsittely"
    },
    {
      "key": "operation.preparing",
      "value": "Valmistellaan editoria"
    },
    {
      "key": "operation.title",
      "value": "Pidä tämä ikkuna avoinna."
    },
    {
      "key": "saveFlow.close",
      "value": "Sulje"
    },
    {
      "key": "saveFlow.confirmSaveDescription",
      "value": "Tämä kirjoittaa nykyiset muokkaukset valittuun tiedostoon. Säilytä automaattinen .bak-varmuuskopio, kunnes olet varmistanut tallenteen pelissä."
    },
    {
      "key": "saveFlow.confirmSaveTitle",
      "value": "Vahvista tallennus"
    },
    {
      "key": "saveFlow.discardAndOpen",
      "value": "Hylkää ja avaa"
    },
    {
      "key": "saveFlow.discardOpenDescription",
      "value": "Sinulla on tallentamattomia muutoksia. Toisen tallenteen avaaminen hylkää nykyiset muokkaukset."
    },
    {
      "key": "saveFlow.discardOpenTitle",
      "value": "Hylätään tallentamattomat muutokset?"
    },
    {
      "key": "saveFlow.keepEditing",
      "value": "Jatka muokkausta"
    },
    {
      "key": "saveFlow.loadedStatus",
      "value": "Tallenne ladattu. Varmuuskopio luotiin ennen muokkausta."
    },
    {
      "key": "saveFlow.openFailedDescription",
      "value": "Valittua tiedostoa ei voitu jäsentää. Valitse purettu Bloodborne-hahmon tallenne ja yritä uudelleen."
    },
    {
      "key": "saveFlow.openFailedTitle",
      "value": "Tallennetta ei voida avata"
    },
    {
      "key": "saveFlow.openTitle",
      "value": "Avaa purettu Bloodborne-tallenne"
    },
    {
      "key": "saveFlow.saveCompletedDescription",
      "value": "Pidä .bak-varmuuskopio tallessa, kunnes muokattu tallenne on vahvistettu."
    },
    {
      "key": "saveFlow.saveCompletedTitle",
      "value": "Tallennus valmis"
    },
    {
      "key": "saveFlow.savedStatus",
      "value": "Muutokset tallennettu."
    },
    {
      "key": "saveFlow.saveFailedDescription",
      "value": "Muokattua tallennetta ei voitu kirjoittaa. Tarkista kohde ja käyttöoikeudet, yritä sitten uudelleen."
    },
    {
      "key": "saveFlow.saveFailedTitle",
      "value": "Tallentaminen epäonnistui"
    },
    {
      "key": "saveFlow.saveTitle",
      "value": "Tallenna muokattu hahmo"
    },
    {
      "key": "saveFlow.unsavedStatus",
      "value": "Tallentamattomat muutokset"
    },
    {
      "key": "sidebar.backupDescription",
      "value": "Tallennetta avatessa luodaan .bak-kopio ennen muokkauksia."
    },
    {
      "key": "sidebar.backupTitle",
      "value": "Varmuuskopio ensin"
    },
    {
      "key": "sidebar.bosses",
      "value": "Pomot"
    },
    {
      "key": "sidebar.bossesDescription",
      "value": "Edistymistila"
    },
    {
      "key": "sidebar.character",
      "value": "Hahmo"
    },
    {
      "key": "sidebar.characterData",
      "value": "Hahmotiedot"
    },
    {
      "key": "sidebar.characterDescription",
      "value": "Henkilöllisyys ja sijainti"
    },
    {
      "key": "sidebar.flags",
      "value": "Liput"
    },
    {
      "key": "sidebar.flagsDescription",
      "value": "Lisäasetukset"
    },
    {
      "key": "sidebar.inventory",
      "value": "Inventaario"
    },
    {
      "key": "sidebar.inventoryDescription",
      "value": "Esineet ja varusteet"
    },
    {
      "key": "sidebar.stats",
      "value": "Ominaisuudet"
    },
    {
      "key": "sidebar.statsDescription",
      "value": "Ominaisuudet ja kaiut"
    },
    {
      "key": "sidebar.storage",
      "value": "Säilytys"
    },
    {
      "key": "sidebar.storageDescription",
      "value": "Säilytetyt esineet"
    },
    {
      "key": "sidebar.workspace",
      "value": "Editorin työtila"
    },
    {
      "key": "unsaved.cancel",
      "value": "Peruuta"
    },
    {
      "key": "unsaved.description",
      "value": "Nykyisiä muokkauksia ei ole tallennettu tiedostoon. Valitse 'Tallenna muutokset' säilyttääksesi ne, tai sulje ilman tallennusta hylätäksesi ne."
    },
    {
      "key": "unsaved.discard",
      "value": "Sulje tallentamatta"
    },
    {
      "key": "unsaved.eyebrow",
      "value": "Tallentamattomat muutokset"
    },
    {
      "key": "unsaved.save",
      "value": "Tallenna muutokset"
    },
    {
      "key": "unsaved.saving",
      "value": "Tallennetaan…"
    },
    {
      "key": "unsaved.title",
      "value": "Tallennetaanko ennen sulkemista?"
    },
    {
      "key": "update.available",
      "value": "Päivitys saatavilla"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB ladattu"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Ladataan: {{percentage}}%"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Ladataan allekirjoitettua päivitystä…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Päivitys asennettu. Editorin uudelleenkäynnistys…"
    },
    {
      "key": "update.installFailed",
      "value": "Päivityksen asennus epäonnistui. Nykyinen versiosi ei muuttunut."
    },
    {
      "key": "update.installing",
      "value": "Asennetaan päivitystä…"
    },
    {
      "key": "update.notNow",
      "value": "Ei nyt"
    },
    {
      "key": "update.startingDownload",
      "value": "Aloitetaan turvallinen lataus…"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Päivitä ja käynnistä uudelleen"
    },
    {
      "key": "update.version",
      "value": "Versio {{version}}"
    }
  ],
  "hu": [
    {
      "key": "actions.back",
      "value": "Vissza"
    },
    {
      "key": "actions.change",
      "value": "Módosítás"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Változtatások megerősítve"
    },
    {
      "key": "actions.confirm",
      "value": "Megerősít"
    },
    {
      "key": "actions.edit",
      "value": "Szerkesztés"
    },
    {
      "key": "actions.reset",
      "value": "Visszaállítás"
    },
    {
      "key": "bosses.alive",
      "value": "Élő"
    },
    {
      "key": "bosses.dead",
      "value": "Halott"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordináták:"
    },
    {
      "key": "characterForm.name",
      "value": "Név:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Játékidő:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Válasszon helyszínt"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleportálás:"
    },
    {
      "key": "flags.eyebrow",
      "value": "Speciális mentésbeállítások"
    },
    {
      "key": "flags.introduction",
      "value": "Itt csak függetlenül dokumentált bájtminták jelennek meg. Az ismeretlen eltolásokat szándékosan kizártuk, hogy megóvjuk a mentést a véletlen sérüléstől."
    },
    {
      "key": "flags.listLabel",
      "value": "Ismert mentészászlók"
    },
    {
      "key": "flags.safetyDescription",
      "value": "Alkalmazzon egyszerre egy változtatást, majd használja a 'Változtatások mentése'-t. Tartsa meg az automatikusan létrehozott biztonsági másolatot, amíg a karakter normálisan be nem töltődik."
    },
    {
      "key": "flags.safetyTitle",
      "value": "Zászló alkalmazása előtt"
    },
    {
      "key": "flags.title",
      "value": "Ismert zászlók"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Hozzon létre egy hat hatású {{subject}}-et"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "A beágyazott +75 folyamatos HP-visszanyerő hatást használja, tartósság- és sebzéstámogatással."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abisszális vitalitás +75"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Általános sebzésnövelés, fizikai nyomás és magas gyógyulás-bónusz."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Előőrs"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Minden típusú sebzés növelése, teljes-életerőn alapuló nyomás és gyógyulás."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Csúcstápláló"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fizikai sebzés, teljes-életerőn alapuló nyomás és tartóssági támogatás."
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Csúcspont (fizikai)"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arkán sebzés, gyógyulás- és tartósságtámogatással."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arkán hullám"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Magas Bloodtinge sebzés, általános sebzés- és gyógyulástámogatással."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge-vadász"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Magas tompa sebzés, általános sebzés- és tartósságtámogatással."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Tompa törő"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Villámsebzés, általános sebzés- és tartósságtámogatással."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Villámhullám"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arkán, tűz és villám hatások egy szándékosan kísérleti összeállításban."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elementális felemelkedés"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "A legismertebb maximális gyógyulás- és tartóssághatások, teljes-életerő sebzésbónusszal."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Végtelen vadászat"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Tűzsebzés, általános sebzés- és gyógyulástámogatással."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Lánghullám"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "A legerősebb ismert tartósságbónusz, magas gyógyulás- és fizikai sebzés-támogatással."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Kovácsolt állóképesség"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Fizikai, általános sebzés- és közelhalál-szorzókat halmoz, csak teszteléshez."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Üvegágyú"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Magas közelhalál- és teljes-életerő szorzók. Tartsa ezt az összeállítást offline."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Utolsó állás"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Gyógyulás-, tartósság- és általános sebzés-támogatás hosszú felfedező utakhoz."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Tartós vadászat"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Magas szúrósebzés, általános sebzés- és tartósságtámogatással."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Szúró specialist"
    },
    {
      "key": "forge.cancel",
      "value": "Mégse"
    },
    {
      "key": "forge.categories.All",
      "value": "Minden"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Támadás"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Egyéni"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elementális"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Kísérleti"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Személyes"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Visszanyerés"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.close",
      "value": "Bezárás"
    },
    {
      "key": "forge.closeLabel",
      "value": "Bezárás: {{subject}} Forge"
    },
    {
      "key": "forge.confirm",
      "value": "Megerősít"
    },
    {
      "key": "forge.confirming",
      "value": "Megerősítés…"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Átalakítja ezt a {{source}}-t {{destination}}-ra? Tartsa meg az automatikus biztonsági másolatot, amíg ki nem próbálta a mentést."
    },
    {
      "key": "forge.convertTo",
      "value": "Átalakítás {{subject}}-ra"
    },
    {
      "key": "forge.customDescription",
      "value": "Egyéni készlet — {{count}} kiválasztott hatás."
    },
    {
      "key": "forge.customName",
      "value": "Egyéni {{subject}} Forge"
    },
    {
      "key": "forge.customSet",
      "value": "Egyéni készlet"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Válasszon legfeljebb hat ellenőrzött hatást. Az üres helyek Nincs hatás maradnak. A szerkesztő minden kiválasztott azonosítót újból ellenőriz, amikor megerősíti."
    },
    {
      "key": "forge.customSetLabel",
      "value": "Egyéni {{subject}} hatáskészlet"
    },
    {
      "key": "forge.delete",
      "value": "Törlés"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Törli a személyes “{{name}}” előbeállítást?"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Szerkesztés: {{subject}}"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Legalább egy hatást válasszon a személyre szabott vázlat betöltéséhez."
    },
    {
      "key": "forge.draftPreview",
      "value": "Vázlat előnézet"
    },
    {
      "key": "forge.editing",
      "value": "Szerkesztés:"
    },
    {
      "key": "forge.effect",
      "value": "Hatás {{index}}"
    },
    {
      "key": "forge.gemForge",
      "value": "Gem Forge"
    },
    {
      "key": "forge.loadCustomDraft",
      "value": "Egyéni készlet betöltése a vázlatba"
    },
    {
      "key": "forge.loadIntoDraft",
      "value": "Betöltés a vázlatba"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge mód"
    },
    {
      "key": "forge.myPresets",
      "value": "Saját előbeállítások"
    },
    {
      "key": "forge.noEffect",
      "value": "Nincs hatás"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Még nincs elmentett személyes előbeállítás."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Szerkesszen egy gemet vagy runét, majd használja a 'Mentés előbeállításként'-t, hogy elérhető legyen mindkét forge-ban."
    },
    {
      "key": "forge.notice",
      "value": "Egy előbeállítás betöltése csak a látható vázlatot frissíti. A szerkesztőben válassza a Megerősítést, hogy a változtatás a mentésbe kerüljön. Az alábbi hatások mind a szerkesztő beágyazott, ellenőrzött katalógusából származnak. A személyes előbeállítások a Gem Forge és Rune Forge között megosztottak; a cél szerkesztő megtartja saját érvényes Shape vagy Type-ját."
    },
    {
      "key": "forge.personal",
      "value": "Személyes"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Személyes Forge előbeállítás, amelyet a Gem Forge és a Rune Forge megoszt."
    },
    {
      "key": "forge.personalPresetName",
      "value": "Személyes {{subject}} előbeállítás neve"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Személyes {{subject}} előbeállítások"
    },
    {
      "key": "forge.presetCategories",
      "value": "Előbeállítás kategóriák"
    },
    {
      "key": "forge.presetName",
      "value": "Előbeállítás neve"
    },
    {
      "key": "forge.presets",
      "value": "Előbeállítások"
    },
    {
      "key": "forge.runeForge",
      "value": "Rune Forge"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Ellenőrzött Caryll Rune előbeállítás."
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Válasszon rune előbeállítást"
    },
    {
      "key": "forge.saveAsPreset",
      "value": "Mentés előbeállításként"
    },
    {
      "key": "forge.savedStatus",
      "value": "Elmentve “{{name}}” a Saját előbeállításokba a Gem Forge és Rune Forge számára."
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Mentse el egyszer a szerkesztett gemet vagy runét, majd töltse be ugyanazt az előbeállítást a Gem Forge-ból vagy a Rune Forge-ból."
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Mindkét Forge által megosztott személyes előbeállítások"
    },
    {
      "key": "forge.title",
      "value": "Ellenőrzött hatások és egyéni készletek"
    },
    {
      "key": "forge.unableToApply",
      "value": "Nem sikerült alkalmazni ezt a változtatást."
    },
    {
      "key": "home.eyebrow",
      "value": "Offline karakterkezelés"
    },
    {
      "key": "home.guide",
      "value": "Olvassa el a dekódolási útmutatót"
    },
    {
      "key": "home.lead",
      "value": "Nyisson meg egy dekódolt Bloodborne karaktermentést az inventár, tulajdonságok, karakterbeállítások, főnökök és zászlók ellenőrzéséhez. A szerkesztő fájlmegnyitáskor létrehoz egy biztonsági másolatot; mindig tartsa meg, amíg az eredményt a játékban nem ellenőrizte."
    },
    {
      "key": "home.stepOneDescription",
      "value": "A PlayStationről exportált fájlokat dekódolni kell, mielőtt a szerkesztő olvasni tudja."
    },
    {
      "key": "home.stepOneTitle",
      "value": "Használjon dekódolt mentést"
    },
    {
      "key": "home.stepThreeDescription",
      "value": "Tesztelje az exportált fájlt, mielőtt eltávolítja az automatikus .bak másolatot."
    },
    {
      "key": "home.stepThreeTitle",
      "value": "Ellenőrizze, mielőtt felülírja"
    },
    {
      "key": "home.stepTwoDescription",
      "value": "Ellenőrizzen minden változtatást, és ne használjon módosított mentéseket online játékhoz."
    },
    {
      "key": "home.stepTwoTitle",
      "value": "Végezzen célzott szerkesztéseket"
    },
    {
      "key": "home.title",
      "value": "Szerkeszd megfontoltan. Őrizd meg a vadászatod."
    },
    {
      "key": "inventory.addDescription",
      "value": "Válasszon egy tárgyat egy biztonságos katalógusból, majd adja meg a mennyiséget."
    },
    {
      "key": "inventory.addDialogLabel",
      "value": "Katalógusból tárgy hozzáadása"
    },
    {
      "key": "inventory.addDirect",
      "value": "Közvetlen hozzáadás"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Fegyver vagy páncél hozzáadása"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Befejezett gem vagy rune hozzáadása"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Felszerelés hozzáadása"
    },
    {
      "key": "inventory.addItem",
      "value": "Tárgy hozzáadása"
    },
    {
      "key": "inventory.addNotice",
      "value": "A fegyverek és páncélok extra slotadatokat tartanak. Használja a Cserét meglévő fegyvernél/páncélnál a Hozzáadás helyett, hogy ezek az adatok érvényben maradjanak."
    },
    {
      "key": "inventory.addSelected",
      "value": "Kiválasztott tárgy hozzáadása"
    },
    {
      "key": "inventory.cancel",
      "value": "Mégse"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalógus"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Páncél"
    },
    {
      "key": "inventory.catalogChaliceItems",
      "value": "Kelyhes tárgyak"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Vérdrágakövek (kísérleti közvetlen hozzáadás)"
    },
    {
      "key": "inventory.catalogItems",
      "value": "Tárgyak és fogyóeszközök"
    },
    {
      "key": "inventory.catalogKeyItems",
      "value": "Kulcstárgyak"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll-rúnák (kísérleti közvetlen hozzáadás)"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Fegyverek"
    },
    {
      "key": "inventory.close",
      "value": "Bezárás"
    },
    {
      "key": "inventory.closeAddLabel",
      "value": "Hozzáadás bezárása"
    },
    {
      "key": "inventory.closeReplaceLabel",
      "value": "Cserélés bezárása"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "A közvetlen hozzáadás nem volt biztonságosan végrehajtható."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Hozzon létre közvetlenül egy katalógusolt fegyvert vagy páncélt, ha a mentés biztonságos, újrahasználható felszerelés-slot blokkot tartalmaz."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Kísérleti: ez a művelet csak egy biztonságos, árva felszerelés-slot blokkot használ újra, és létrehoz öt zárt gem-slotot. Nyissa meg a slotokat később a Gems-szel, ha szükséges."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Közvetlen gem és rune készítő"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Kész Vérdrágakő vagy Caryll-rúna létrehozása közvetlenül az ellenőrzött hatásokból, ha a mentésben biztonságos, újrahasználható rekord áll rendelkezésre."
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Kísérleti: ez a művelet csak egy biztonságos, árva fejlesztési rekordot használ újra. Soha nem módosítja a mentés elrendezését. Tartsa meg az automatikus biztonsági másolatot, amíg a karakter normálisan nem töltődik be."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Válasszon egy ellenőrzött első hatást, mielőtt gemet vagy runét ad hozzá."
    },
    {
      "key": "inventory.directUpgradeUnavailable",
      "value": "Ennek a mentésnek nincs biztonságos, újrahasználható Gem/Rune rekordja. Nem történt változtatás. Hozzon létre kompatibilis slotot a játékban, majd próbálja újra."
    },
    {
      "key": "inventory.edit",
      "value": "Szerkesztés"
    },
    {
      "key": "inventory.gems",
      "value": "Drágakövek"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem forma"
    },
    {
      "key": "inventory.item",
      "value": "tárgy"
    },
    {
      "key": "inventory.itemQuantity",
      "value": "Tárgy mennyisége:"
    },
    {
      "key": "inventory.matchingItems",
      "value": "Egyező tárgyak"
    },
    {
      "key": "inventory.noMatchingItem",
      "value": "Nincs egyező tárgy."
    },
    {
      "key": "inventory.quantity",
      "value": "Mennyiség"
    },
    {
      "key": "inventory.replaceDescription",
      "value": "Válasszon kompatibilis {{type}}-ot a katalógusból. A hely pozíciója változatlan marad."
    },
    {
      "key": "inventory.replaceDialogLabel",
      "value": "Kiválasztott tárgy cseréje"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Tárgy cseréje"
    },
    {
      "key": "inventory.replacing",
      "value": "Cserélés"
    },
    {
      "key": "inventory.runeType",
      "value": "Rune típus"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Katalógus keresése"
    },
    {
      "key": "inventory.searchItems",
      "value": "Keresés {{type}} tárgyak között"
    },
    {
      "key": "inventory.selectNew",
      "value": "Válasszon új {{type}}-ot"
    },
    {
      "key": "inventory.setValue",
      "value": "Beállít"
    },
    {
      "key": "inventory.title",
      "value": "Inventár"
    },
    {
      "key": "inventory.type.armor",
      "value": "páncél"
    },
    {
      "key": "inventory.type.chalice",
      "value": "tárgy"
    },
    {
      "key": "inventory.type.item",
      "value": "tárgy"
    },
    {
      "key": "inventory.type.key",
      "value": "tárgy"
    },
    {
      "key": "inventory.type.weapon",
      "value": "fegyver"
    },
    {
      "key": "inventory.weaponLevel",
      "value": "Fegyver szintje:"
    },
    {
      "key": "language.label",
      "value": "Nyelv"
    },
    {
      "key": "nav.activeSave",
      "value": "Aktív mentés"
    },
    {
      "key": "nav.controls",
      "value": "Mentésfájl-vezérlők"
    },
    {
      "key": "nav.noSaveLoaded",
      "value": "Nincs betöltött mentés"
    },
    {
      "key": "nav.openFileToBegin",
      "value": "Kezdéshez nyisson meg egy dekódolt karakterfájlt"
    },
    {
      "key": "nav.openSave",
      "value": "Mentés megnyitása"
    },
    {
      "key": "nav.saveChanges",
      "value": "Változtatások mentése"
    },
    {
      "key": "operation.eyebrow",
      "value": "Mentésadatok kezelése"
    },
    {
      "key": "operation.preparing",
      "value": "Szerkesztő előkészítése"
    },
    {
      "key": "operation.title",
      "value": "Kérjük, tartsa nyitva ezt az ablakot."
    },
    {
      "key": "saveFlow.close",
      "value": "Bezárás"
    },
    {
      "key": "saveFlow.confirmSaveDescription",
      "value": "Ez a művelet a jelenlegi szerkesztéseket írja a kiválasztott fájlba. Tartsa meg az automatikus .bak biztonsági másolatot, amíg a mentést a játékban nem ellenőrizte."
    },
    {
      "key": "saveFlow.confirmSaveTitle",
      "value": "Mentés megerősítése"
    },
    {
      "key": "saveFlow.discardAndOpen",
      "value": "Elvetés és megnyitás"
    },
    {
      "key": "saveFlow.discardOpenDescription",
      "value": "Vannak mentetlen változtatások. Egy másik mentés megnyitása elveti a jelenlegi szerkesztéseket."
    },
    {
      "key": "saveFlow.discardOpenTitle",
      "value": "Mentetlen változtatások elvetése?"
    },
    {
      "key": "saveFlow.keepEditing",
      "value": "Szerkesztés folytatása"
    },
    {
      "key": "saveFlow.loadedStatus",
      "value": "Mentés betöltve. Szerkesztés előtt biztonsági másolat készült."
    },
    {
      "key": "saveFlow.openFailedDescription",
      "value": "A kiválasztott fájl nem elemezhető. Válasszon egy dekódolt Bloodborne karaktermentést, majd próbálja újra."
    },
    {
      "key": "saveFlow.openFailedTitle",
      "value": "Nem lehet megnyitni a mentést"
    },
    {
      "key": "saveFlow.openTitle",
      "value": "Dekódolt Bloodborne mentés megnyitása"
    },
    {
      "key": "saveFlow.saveCompletedDescription",
      "value": "Tartsa meg a .bak biztonsági másolatot, amíg a szerkesztett mentést nem ellenőrizte."
    },
    {
      "key": "saveFlow.saveCompletedTitle",
      "value": "Mentés befejezve"
    },
    {
      "key": "saveFlow.savedStatus",
      "value": "Változtatások mentve."
    },
    {
      "key": "saveFlow.saveFailedDescription",
      "value": "A szerkesztett mentést nem sikerült menteni. Ellenőrizze a célhelyet és a jogosultságokat, majd próbálja újra."
    },
    {
      "key": "saveFlow.saveFailedTitle",
      "value": "Nem lehet menteni"
    },
    {
      "key": "saveFlow.saveTitle",
      "value": "Szerkesztett karakter mentése"
    },
    {
      "key": "saveFlow.unsavedStatus",
      "value": "Mentetlen változtatások"
    },
    {
      "key": "sidebar.backupDescription",
      "value": "Mentés megnyitásakor létrejön egy .bak másolat, mielőtt a szerkesztések megtörténnének."
    },
    {
      "key": "sidebar.backupTitle",
      "value": "Biztonsági mentés-első munkafolyamat"
    },
    {
      "key": "sidebar.bosses",
      "value": "Főnökök"
    },
    {
      "key": "sidebar.bossesDescription",
      "value": "Előrehaladási állapot"
    },
    {
      "key": "sidebar.character",
      "value": "Karakter"
    },
    {
      "key": "sidebar.characterData",
      "value": "Karakteradatok"
    },
    {
      "key": "sidebar.characterDescription",
      "value": "Identitás és pozíció"
    },
    {
      "key": "sidebar.flags",
      "value": "Zászlók"
    },
    {
      "key": "sidebar.flagsDescription",
      "value": "Speciális beállítások"
    },
    {
      "key": "sidebar.inventory",
      "value": "Inventár"
    },
    {
      "key": "sidebar.inventoryDescription",
      "value": "Tárgyak és felszerelés"
    },
    {
      "key": "sidebar.stats",
      "value": "Statisztikák"
    },
    {
      "key": "sidebar.statsDescription",
      "value": "Tulajdonságok és echo-k"
    },
    {
      "key": "sidebar.storage",
      "value": "Tároló"
    },
    {
      "key": "sidebar.storageDescription",
      "value": "Tárolt tárgyak"
    },
    {
      "key": "sidebar.workspace",
      "value": "Szerkesztő munkaterület"
    },
    {
      "key": "unsaved.cancel",
      "value": "Mégse"
    },
    {
      "key": "unsaved.description",
      "value": "A jelenlegi szerkesztések nincsenek mentve. Válassza a 'Változtatások mentése' lehetőséget a megtartáshoz, vagy zárjon be mentés nélkül az elvetéshez."
    },
    {
      "key": "unsaved.discard",
      "value": "Bezárás mentés nélkül"
    },
    {
      "key": "unsaved.eyebrow",
      "value": "Mentetlen változtatások"
    },
    {
      "key": "unsaved.save",
      "value": "Változtatások mentése"
    },
    {
      "key": "unsaved.saving",
      "value": "Mentés…"
    },
    {
      "key": "unsaved.title",
      "value": "Mentés bezárás előtt?"
    },
    {
      "key": "update.available",
      "value": "Frissítés elérhető"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB letöltve"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Letöltés: {{percentage}}%"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Aláírt frissítés letöltése…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Frissítés telepítve. A szerkesztő újraindul…"
    },
    {
      "key": "update.installFailed",
      "value": "A frissítést nem sikerült telepíteni. A jelenlegi verzió változatlan maradt."
    },
    {
      "key": "update.installing",
      "value": "Frissítés telepítése…"
    },
    {
      "key": "update.notNow",
      "value": "Most nem"
    },
    {
      "key": "update.startingDownload",
      "value": "Biztonságos letöltés indítása…"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Frissítés és újraindítás"
    },
    {
      "key": "update.version",
      "value": "Verzió {{version}}"
    }
  ],
  "nb": [
    {
      "key": "actions.back",
      "value": "Tilbake"
    },
    {
      "key": "actions.change",
      "value": "Endre"
    },
    {
      "key": "actions.changesConfirmed",
      "value": "Endringer bekreftet"
    },
    {
      "key": "actions.confirm",
      "value": "Bekreft"
    },
    {
      "key": "actions.edit",
      "value": "Rediger"
    },
    {
      "key": "actions.reset",
      "value": "Tilbakestill"
    },
    {
      "key": "bosses.alive",
      "value": "Levende"
    },
    {
      "key": "bosses.dead",
      "value": "Død"
    },
    {
      "key": "characterForm.coordinates",
      "value": "Koordinater:"
    },
    {
      "key": "characterForm.name",
      "value": "Navn:"
    },
    {
      "key": "characterForm.playtime",
      "value": "Spilletid:"
    },
    {
      "key": "characterForm.selectLocation",
      "value": "Velg en lokasjon"
    },
    {
      "key": "characterForm.teleport",
      "value": "Teleportering:"
    },
    {
      "key": "flags.eyebrow",
      "value": "Avanserte lagringsinnstillinger"
    },
    {
      "key": "flags.introduction",
      "value": "Kun byte-mønstre som er dokumentert uavhengig vises her. Ukjente offseter er bevisst utelatt for å beskytte lagringen mot utilsiktet korrupsjon."
    },
    {
      "key": "flags.listLabel",
      "value": "Kjente lagringsflagg"
    },
    {
      "key": "flags.safetyDescription",
      "value": "Utfør én endring om gangen, og bruk deretter Lagre endringer. Behold den automatisk opprettede sikkerhetskopien til karakteren laster normalt."
    },
    {
      "key": "flags.safetyTitle",
      "value": "Før du bruker et flagg"
    },
    {
      "key": "flags.title",
      "value": "Kjente flagg"
    },
    {
      "key": "forge.buildSixEffect",
      "value": "Bygg en seks-effekts {{subject}}"
    },
    {
      "key": "forge.builtIn.abyssal-vitality.description",
      "value": "Bruker den innebygde +75 kontinuerlige HP-gjenopprettingseffekten med holdbarhet og skade-støtte."
    },
    {
      "key": "forge.builtIn.abyssal-vitality.name",
      "value": "Abyssal Vitality +75"
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.description",
      "value": "Forsterkning av all skade med fysisk press og høy gjenopprettingsbonus."
    },
    {
      "key": "forge.builtIn.all-damage-vanguard.name",
      "value": "Vanguard"
    },
    {
      "key": "forge.builtIn.apex-nourishing.description",
      "value": "Forsterkning av all skade med full-helse press og gjenoppretting."
    },
    {
      "key": "forge.builtIn.apex-nourishing.name",
      "value": "Apex Nourishing"
    },
    {
      "key": "forge.builtIn.apex-physical.description",
      "value": "Fysisk skade, press ved full helse og støtte for holdbarhet."
    },
    {
      "key": "forge.builtIn.apex-physical.name",
      "value": "Apex Physical"
    },
    {
      "key": "forge.builtIn.arcane-surge.description",
      "value": "Arcane-skade med støtte for gjenoppretting og holdbarhet."
    },
    {
      "key": "forge.builtIn.arcane-surge.name",
      "value": "Arcane Surge"
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.description",
      "value": "Høy Bloodtinge-skade med støtte for all skade og gjenoppretting."
    },
    {
      "key": "forge.builtIn.bloodtinge-hunter.name",
      "value": "Bloodtinge Hunter"
    },
    {
      "key": "forge.builtIn.blunt-breaker.description",
      "value": "Høy stump skade med støtte for all skade og holdbarhet."
    },
    {
      "key": "forge.builtIn.blunt-breaker.name",
      "value": "Blunt Breaker"
    },
    {
      "key": "forge.builtIn.bolt-surge.description",
      "value": "Lynskade med støtte for all skade og holdbarhet."
    },
    {
      "key": "forge.builtIn.bolt-surge.name",
      "value": "Bolt Surge"
    },
    {
      "key": "forge.builtIn.elemental-ascendant.description",
      "value": "Arcane-, ild- og lyn-effekter i ett bevisst eksperimentelt oppsett."
    },
    {
      "key": "forge.builtIn.elemental-ascendant.name",
      "value": "Elemental Ascendant"
    },
    {
      "key": "forge.builtIn.endless-hunt.description",
      "value": "Maksimale kjente gjenopprettings- og holdbarhetseffekter med bonus for full helse."
    },
    {
      "key": "forge.builtIn.endless-hunt.name",
      "value": "Endless Hunt"
    },
    {
      "key": "forge.builtIn.flame-surge.description",
      "value": "Ildskade med støtte for all skade og gjenoppretting."
    },
    {
      "key": "forge.builtIn.flame-surge.name",
      "value": "Flame Surge"
    },
    {
      "key": "forge.builtIn.forged-endurance.description",
      "value": "Den sterkeste kjente samlede holdbarhetsbonusen kombinert med høy gjenoppretting og fysisk skade."
    },
    {
      "key": "forge.builtIn.forged-endurance.name",
      "value": "Forged Endurance"
    },
    {
      "key": "forge.builtIn.glass-cannon.description",
      "value": "Stabler fysisk, all-skade og nær-død multiplikatorer kun for testing."
    },
    {
      "key": "forge.builtIn.glass-cannon.name",
      "value": "Glass Cannon"
    },
    {
      "key": "forge.builtIn.last-stand.description",
      "value": "Høye nær-død- og full-helse-multiplikatorer. Hold dette oppsettet offline."
    },
    {
      "key": "forge.builtIn.last-stand.name",
      "value": "Last Stand"
    },
    {
      "key": "forge.builtIn.sustained-hunt.description",
      "value": "Gjenoppretting, holdbarhet og støtte for all skade ved lange utforskningsøkter."
    },
    {
      "key": "forge.builtIn.sustained-hunt.name",
      "value": "Sustained Hunt"
    },
    {
      "key": "forge.builtIn.thrust-specialist.description",
      "value": "Høy stikkskade med støtte for all skade og holdbarhet."
    },
    {
      "key": "forge.builtIn.thrust-specialist.name",
      "value": "Thrust Specialist"
    },
    {
      "key": "forge.cancel",
      "value": "Avbryt"
    },
    {
      "key": "forge.categories.All",
      "value": "Alle"
    },
    {
      "key": "forge.categories.Attack",
      "value": "Angrep"
    },
    {
      "key": "forge.categories.Custom",
      "value": "Egendefinert"
    },
    {
      "key": "forge.categories.Elemental",
      "value": "Elemental"
    },
    {
      "key": "forge.categories.Experimental",
      "value": "Eksperimentell"
    },
    {
      "key": "forge.categories.Personal",
      "value": "Personlig"
    },
    {
      "key": "forge.categories.Recovery",
      "value": "Gjenoppretting"
    },
    {
      "key": "forge.categories.Rune",
      "value": "Rune"
    },
    {
      "key": "forge.close",
      "value": "Lukk"
    },
    {
      "key": "forge.closeLabel",
      "value": "Lukk {{subject}} Forge"
    },
    {
      "key": "forge.confirm",
      "value": "Bekreft"
    },
    {
      "key": "forge.confirming",
      "value": "Bekrefter…"
    },
    {
      "key": "forge.convertConfirm",
      "value": "Konverter denne {{source}} til en {{destination}}? Behold den automatiske sikkerhetskopien til du har testet lagringen."
    },
    {
      "key": "forge.convertTo",
      "value": "Konverter til {{subject}}"
    },
    {
      "key": "forge.customDescription",
      "value": "Egendefinert sett — {{count}} valgt(e) effekt(er)."
    },
    {
      "key": "forge.customName",
      "value": "Egendefinert {{subject}} Forge"
    },
    {
      "key": "forge.customSet",
      "value": "Egendefinert sett"
    },
    {
      "key": "forge.customSetDescription",
      "value": "Velg opptil seks validerte effekter. Tomme plasser forblir som Ingen effekt. Redigeringsprogrammet validerer hver valgt ID på nytt når du bekrefter."
    },
    {
      "key": "forge.customSetLabel",
      "value": "Egendefinert {{subject}}-effektsett"
    },
    {
      "key": "forge.delete",
      "value": "Slett"
    },
    {
      "key": "forge.deleteConfirm",
      "value": "Slett den personlige preset “{{name}}”?"
    },
    {
      "key": "forge.dialogLabel",
      "value": "Rediger {{subject}}"
    },
    {
      "key": "forge.draftEmpty",
      "value": "Velg minst én effekt for å laste et egendefinert utkast."
    },
    {
      "key": "forge.draftPreview",
      "value": "Utkastforhåndsvisning"
    },
    {
      "key": "forge.editing",
      "value": "Redigerer:"
    },
    {
      "key": "forge.effect",
      "value": "Effekt {{index}}"
    },
    {
      "key": "forge.gemForge",
      "value": "Gem Forge"
    },
    {
      "key": "forge.loadCustomDraft",
      "value": "Last egendefinert sett inn i utkast"
    },
    {
      "key": "forge.loadIntoDraft",
      "value": "Last inn i utkast"
    },
    {
      "key": "forge.modeLabel",
      "value": "{{subject}} Forge-modus"
    },
    {
      "key": "forge.myPresets",
      "value": "Mine presets"
    },
    {
      "key": "forge.noEffect",
      "value": "Ingen effekt"
    },
    {
      "key": "forge.noPersonalPreset",
      "value": "Ingen personlig preset er lagret ennå."
    },
    {
      "key": "forge.noPersonalPresetDescription",
      "value": "Rediger en gem eller rune, bruk så Lagre som preset for å gjøre den tilgjengelig i begge forges."
    },
    {
      "key": "forge.notice",
      "value": "Laste inn et preset oppdaterer bare det synlige utkastet. Velg Bekreft i redigeringsprogrammet for å skrive det til lagringen. Hver effekt under kommer fra redigeringsprogrammets innebygde validerte katalog. Personlige presets deles av Gem Forge og Rune Forge; målredigereren beholder sin egen gyldige Shape eller Type."
    },
    {
      "key": "forge.personal",
      "value": "Personlig"
    },
    {
      "key": "forge.personalPresetDescription",
      "value": "Personlig Forge-preset delt av Gem Forge og Rune Forge."
    },
    {
      "key": "forge.personalPresetName",
      "value": "Personlig {{subject}}-presetnavn"
    },
    {
      "key": "forge.personalPresetsLabel",
      "value": "Personlige {{subject}}-presets"
    },
    {
      "key": "forge.presetCategories",
      "value": "Preset-kategorier"
    },
    {
      "key": "forge.presetName",
      "value": "Preset-navn"
    },
    {
      "key": "forge.presets",
      "value": "Presets"
    },
    {
      "key": "forge.runeForge",
      "value": "Rune Forge"
    },
    {
      "key": "forge.runePresetDescription",
      "value": "Validert Caryll Rune-preset."
    },
    {
      "key": "forge.runePresetPlaceholder",
      "value": "Velg rune-preset"
    },
    {
      "key": "forge.saveAsPreset",
      "value": "Lagre som preset"
    },
    {
      "key": "forge.savedStatus",
      "value": "Lagret “{{name}}” i Mine presets for Gem Forge og Rune Forge."
    },
    {
      "key": "forge.sharedPresetsDescription",
      "value": "Lagre en redigert gem eller rune én gang, og last deretter samme preset fra Gem Forge eller Rune Forge."
    },
    {
      "key": "forge.sharedPresetsTitle",
      "value": "Personlige presets delt av begge forges"
    },
    {
      "key": "forge.title",
      "value": "Validerte effekter og egendefinerte sett"
    },
    {
      "key": "forge.unableToApply",
      "value": "Kan ikke anvende denne endringen."
    },
    {
      "key": "home.eyebrow",
      "value": "Offline karakterbehandling"
    },
    {
      "key": "home.guide",
      "value": "Les dekrypteringsveiledningen"
    },
    {
      "key": "home.lead",
      "value": "Åpne en dekryptert Bloodborne-karakterlagring for å inspisere inventar, attributter, karakterinnstillinger, sjefer og flagg. Redigeringsprogrammet oppretter en sikkerhetskopi når en fil åpnes; behold alltid denne til du har kontrollert resultatet i spillet."
    },
    {
      "key": "home.stepOneDescription",
      "value": "PlayStation-eksporter må dekrypteres før de kan leses av redigeringsprogrammet."
    },
    {
      "key": "home.stepOneTitle",
      "value": "Bruk en dekryptert lagring"
    },
    {
      "key": "home.stepThreeDescription",
      "value": "Test den eksporterte filen før du fjerner den automatiske .bak-kopien."
    },
    {
      "key": "home.stepThreeTitle",
      "value": "Verifiser før du erstatter"
    },
    {
      "key": "home.stepTwoDescription",
      "value": "Gå gjennom hver endring, og unngå å bruke endrede lagringer i nettspill."
    },
    {
      "key": "home.stepTwoTitle",
      "value": "Gjør målrettede endringer"
    },
    {
      "key": "home.title",
      "value": "Rediger med omhu. Bevar jakten."
    },
    {
      "key": "inventory.addDescription",
      "value": "Velg en gjenstand fra en sikker katalog og velg antallet."
    },
    {
      "key": "inventory.addDialogLabel",
      "value": "Legg til gjenstand fra katalogen"
    },
    {
      "key": "inventory.addDirect",
      "value": "Legg til direkte"
    },
    {
      "key": "inventory.addDirectEquipment",
      "value": "Legg til et våpen eller en rustning"
    },
    {
      "key": "inventory.addDirectUpgrade",
      "value": "Legg til en ferdig gem eller rune"
    },
    {
      "key": "inventory.addEquipment",
      "value": "Legg til utstyr"
    },
    {
      "key": "inventory.addItem",
      "value": "Legg til en gjenstand"
    },
    {
      "key": "inventory.addNotice",
      "value": "Våpen og rustning beholder tilleggsdata for slot. Bruk Erstatt på et eksisterende våpen eller rustning i stedet for Legg til, slik at disse dataene forblir gyldige."
    },
    {
      "key": "inventory.addSelected",
      "value": "Legg til valgt gjenstand"
    },
    {
      "key": "inventory.cancel",
      "value": "Avbryt"
    },
    {
      "key": "inventory.catalog",
      "value": "Katalog"
    },
    {
      "key": "inventory.catalogArmors",
      "value": "Rustning"
    },
    {
      "key": "inventory.catalogChaliceItems",
      "value": "Chalice-gjenstander"
    },
    {
      "key": "inventory.catalogGems",
      "value": "Blood Gems (eksperimentell direkte tillegg)"
    },
    {
      "key": "inventory.catalogItems",
      "value": "Gjenstander og forbruksvarer"
    },
    {
      "key": "inventory.catalogKeyItems",
      "value": "Nøkkelgjenstander"
    },
    {
      "key": "inventory.catalogRunes",
      "value": "Caryll Runes (eksperimentell direkte tillegg)"
    },
    {
      "key": "inventory.catalogWeapons",
      "value": "Våpen"
    },
    {
      "key": "inventory.close",
      "value": "Lukk"
    },
    {
      "key": "inventory.closeAddLabel",
      "value": "Lukk Legg til gjenstand"
    },
    {
      "key": "inventory.closeReplaceLabel",
      "value": "Lukk Erstatt gjenstand"
    },
    {
      "key": "inventory.directAddFailed",
      "value": "Det direkte tillegg kunne ikke fullføres på en sikker måte."
    },
    {
      "key": "inventory.directEquipmentDescription",
      "value": "Opprett et katalogført våpen eller rustning direkte når lagringen inneholder en sikker gjenbrukbar equipment-slot-blokk."
    },
    {
      "key": "inventory.directEquipmentNotice",
      "value": "Eksperimentelt: denne operasjonen gjenbruker kun en sikker foreldreløs equipment-slot-blokk og oppretter fem lukkede gem-slots. Åpne slotene senere med Gems om nødvendig."
    },
    {
      "key": "inventory.directUpgradeBuilder",
      "value": "Direkte gem- og runebygger"
    },
    {
      "key": "inventory.directUpgradeDescription",
      "value": "Opprett en ferdig Blood Gem eller Caryll Rune direkte fra validerte effekter når en sikker gjenbrukbar post er tilgjengelig i lagringen."
    },
    {
      "key": "inventory.directUpgradeNotice",
      "value": "Eksperimentelt: denne operasjonen gjenbruker kun en sikker foreldreløs oppgraderingspost. Den endrer aldri lagringsoppsettet. Behold den automatiske sikkerhetskopien til karakteren har lastet normalt."
    },
    {
      "key": "inventory.directUpgradePrimaryRequired",
      "value": "Velg en validert primæreffekt før du legger til en gem eller rune."
    },
    {
      "key": "inventory.directUpgradeUnavailable",
      "value": "Denne lagringen har ingen sikker gjenbrukbar Gem/Rune-post. Ingen endring ble gjort. Opprett en kompatibel slot i spillet, og prøv igjen."
    },
    {
      "key": "inventory.edit",
      "value": "Rediger"
    },
    {
      "key": "inventory.gems",
      "value": "Gems"
    },
    {
      "key": "inventory.gemShape",
      "value": "Gem-form"
    },
    {
      "key": "inventory.item",
      "value": "gjenstand"
    },
    {
      "key": "inventory.itemQuantity",
      "value": "Antall gjenstander:"
    },
    {
      "key": "inventory.matchingItems",
      "value": "Matchende gjenstander"
    },
    {
      "key": "inventory.noMatchingItem",
      "value": "Ingen matchende gjenstand funnet."
    },
    {
      "key": "inventory.quantity",
      "value": "Antall"
    },
    {
      "key": "inventory.replaceDescription",
      "value": "Velg en kompatibel {{type}} fra katalogen. Slot-posisjonen bevares."
    },
    {
      "key": "inventory.replaceDialogLabel",
      "value": "Erstatt valgt gjenstand"
    },
    {
      "key": "inventory.replaceItem",
      "value": "Erstatt gjenstand"
    },
    {
      "key": "inventory.replacing",
      "value": "Erstatter"
    },
    {
      "key": "inventory.runeType",
      "value": "Rune-type"
    },
    {
      "key": "inventory.searchCatalog",
      "value": "Søk i katalogen"
    },
    {
      "key": "inventory.searchItems",
      "value": "Søk etter {{type}}-gjenstander"
    },
    {
      "key": "inventory.selectNew",
      "value": "Velg en ny {{type}}"
    },
    {
      "key": "inventory.setValue",
      "value": "Angi"
    },
    {
      "key": "inventory.title",
      "value": "Inventar"
    },
    {
      "key": "inventory.type.armor",
      "value": "rustning"
    },
    {
      "key": "inventory.type.chalice",
      "value": "gjenstand"
    },
    {
      "key": "inventory.type.item",
      "value": "gjenstand"
    },
    {
      "key": "inventory.type.key",
      "value": "gjenstand"
    },
    {
      "key": "inventory.type.weapon",
      "value": "våpen"
    },
    {
      "key": "inventory.weaponLevel",
      "value": "Våpennivå:"
    },
    {
      "key": "language.label",
      "value": "Språk"
    },
    {
      "key": "nav.activeSave",
      "value": "Aktiv lagring"
    },
    {
      "key": "nav.controls",
      "value": "Kontroller for lagringsfil"
    },
    {
      "key": "nav.noSaveLoaded",
      "value": "Ingen lagring lastet"
    },
    {
      "key": "nav.openFileToBegin",
      "value": "Åpne en dekryptert karakterfil for å begynne"
    },
    {
      "key": "nav.openSave",
      "value": "Åpne lagring"
    },
    {
      "key": "nav.saveChanges",
      "value": "Lagre endringer"
    },
    {
      "key": "operation.eyebrow",
      "value": "Arbeider med lagringsdata"
    },
    {
      "key": "operation.preparing",
      "value": "Forbereder redigeringsprogrammet"
    },
    {
      "key": "operation.title",
      "value": "Vennligst hold dette vinduet åpent."
    },
    {
      "key": "saveFlow.close",
      "value": "Lukk"
    },
    {
      "key": "saveFlow.confirmSaveDescription",
      "value": "Dette skriver de nåværende endringene til den valgte filen. Behold den automatiske .bak-sikkerhetskopien til du har verifisert lagringen i spillet."
    },
    {
      "key": "saveFlow.confirmSaveTitle",
      "value": "Bekreft lagring"
    },
    {
      "key": "saveFlow.discardAndOpen",
      "value": "Forkast og åpne"
    },
    {
      "key": "saveFlow.discardOpenDescription",
      "value": "Du har ikke-lagrede endringer. Åpning av en annen lagring vil forkaste de nåværende endringene."
    },
    {
      "key": "saveFlow.discardOpenTitle",
      "value": "Forkast ikke-lagrede endringer?"
    },
    {
      "key": "saveFlow.keepEditing",
      "value": "Fortsett å redigere"
    },
    {
      "key": "saveFlow.loadedStatus",
      "value": "Lagring lastet. En sikkerhetskopi ble opprettet før redigering."
    },
    {
      "key": "saveFlow.openFailedDescription",
      "value": "Den valgte filen kunne ikke tolkes. Velg en dekryptert Bloodborne-karakterlagring og prøv igjen."
    },
    {
      "key": "saveFlow.openFailedTitle",
      "value": "Kan ikke åpne lagring"
    },
    {
      "key": "saveFlow.openTitle",
      "value": "Åpne dekryptert Bloodborne-lagring"
    },
    {
      "key": "saveFlow.saveCompletedDescription",
      "value": "Behold .bak-sikkerhetskopien til den redigerte lagringen er verifisert."
    },
    {
      "key": "saveFlow.saveCompletedTitle",
      "value": "Lagring fullført"
    },
    {
      "key": "saveFlow.savedStatus",
      "value": "Endringer lagret."
    },
    {
      "key": "saveFlow.saveFailedDescription",
      "value": "Den redigerte lagringen kunne ikke skrives. Sjekk målplassering og rettigheter, og prøv igjen."
    },
    {
      "key": "saveFlow.saveFailedTitle",
      "value": "Kan ikke lagre"
    },
    {
      "key": "saveFlow.saveTitle",
      "value": "Lagre redigert karakter"
    },
    {
      "key": "saveFlow.unsavedStatus",
      "value": "Ulagrede endringer"
    },
    {
      "key": "sidebar.backupDescription",
      "value": "Åpning av en lagring oppretter en .bak-kopi før endringer gjøres."
    },
    {
      "key": "sidebar.backupTitle",
      "value": "Sikkerhetskopi-først arbeidsflyt"
    },
    {
      "key": "sidebar.bosses",
      "value": "Sjefer"
    },
    {
      "key": "sidebar.bossesDescription",
      "value": "Fremdriftsstatus"
    },
    {
      "key": "sidebar.character",
      "value": "Karakter"
    },
    {
      "key": "sidebar.characterData",
      "value": "Karakterdata"
    },
    {
      "key": "sidebar.characterDescription",
      "value": "Identitet og posisjon"
    },
    {
      "key": "sidebar.flags",
      "value": "Flagg"
    },
    {
      "key": "sidebar.flagsDescription",
      "value": "Avanserte innstillinger"
    },
    {
      "key": "sidebar.inventory",
      "value": "Inventar"
    },
    {
      "key": "sidebar.inventoryDescription",
      "value": "Gjenstander og utstyr"
    },
    {
      "key": "sidebar.stats",
      "value": "Statistikk"
    },
    {
      "key": "sidebar.statsDescription",
      "value": "Attributter og ekkoer"
    },
    {
      "key": "sidebar.storage",
      "value": "Lager"
    },
    {
      "key": "sidebar.storageDescription",
      "value": "Lagrede gjenstander"
    },
    {
      "key": "sidebar.workspace",
      "value": "Redigeringsarbeidsområde"
    },
    {
      "key": "unsaved.cancel",
      "value": "Avbryt"
    },
    {
      "key": "unsaved.description",
      "value": "Dine nåværende endringer er ikke skrevet til en lagringsfil. Velg Lagre endringer for å beholde dem, eller lukk uten å lagre for å forkaste dem."
    },
    {
      "key": "unsaved.discard",
      "value": "Lukk uten å lagre"
    },
    {
      "key": "unsaved.eyebrow",
      "value": "Ulagrede endringer"
    },
    {
      "key": "unsaved.save",
      "value": "Lagre endringer"
    },
    {
      "key": "unsaved.saving",
      "value": "Lagrer…"
    },
    {
      "key": "unsaved.title",
      "value": "Lagre før lukking?"
    },
    {
      "key": "update.available",
      "value": "Oppdatering tilgjengelig"
    },
    {
      "key": "update.downloadedMegabytes",
      "value": "{{megabytes}} MB lastet ned"
    },
    {
      "key": "update.downloadingProgress",
      "value": "Laster ned: {{percentage}}%"
    },
    {
      "key": "update.downloadingSigned",
      "value": "Laster ned signert oppdatering…"
    },
    {
      "key": "update.installedRestarting",
      "value": "Oppdatering installert. Starter redigeringsprogrammet på nytt…"
    },
    {
      "key": "update.installFailed",
      "value": "Oppdateringen kunne ikke installeres. Din nåværende versjon er uendret."
    },
    {
      "key": "update.installing",
      "value": "Installerer oppdatering…"
    },
    {
      "key": "update.notNow",
      "value": "Ikke nå"
    },
    {
      "key": "update.startingDownload",
      "value": "Starter sikker nedlasting…"
    },
    {
      "key": "update.updateAndRestart",
      "value": "Oppdater og start på nytt"
    },
    {
      "key": "update.version",
      "value": "Versjon {{version}}"
    }
  ]
};

Object.entries(finalV020TranslatedOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  translations.forEach(({ key, value }) => applyTranslationPath(translatedResource, key, value));
  resources[language] = translatedResource;
});

const v020FeatureTranslatedOverrides = {
  "fr": [
    {
      "key": "preferences.compact",
      "value": "Vue compacte"
    },
    {
      "key": "preferences.comfortable",
      "value": "Vue confortable"
    },
    {
      "key": "revision.controls",
      "value": "Contrôles de révision"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revue locale"
    },
    {
      "key": "revision.title",
      "value": "Journal des modifications"
    },
    {
      "key": "revision.description",
      "value": "Vérifiez les modifications en mémoire avant d'enregistrer. Annuler et refaire n'écrivent jamais automatiquement dans le fichier."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} modifications"
    },
    {
      "key": "revision.genericChange",
      "value": "Données de sauvegarde modifiées"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Quantité de l'objet mise à jour"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Niveau d'arme mis à jour"
    },
    {
      "key": "revision.itemAdded",
      "value": "Objet ajouté à l'inventaire"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Équipement ajouté directement"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gemme ou rune ajoutée directement"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Objet de l'inventaire remplacé"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gemme ou rune mise à jour"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gemme ou rune convertie"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Forme d'emplacement d'équipement mise à jour"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Contenu de l'emplacement d'équipement mis à jour"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Statistiques du personnage mises à jour"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Données du personnage mises à jour"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progression des boss mise à jour"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Option avancée de sauvegarde appliquée"
    },
    {
      "key": "revision.undo",
      "value": "Annuler"
    },
    {
      "key": "revision.redo",
      "value": "Refaire"
    },
    {
      "key": "revision.close",
      "value": "Fermer le journal des modifications"
    },
    {
      "key": "revision.empty",
      "value": "Aucune modification en mémoire enregistrée pour le moment."
    },
    {
      "key": "revision.notice",
      "value": "L'enregistrement n'écrit que la révision actuelle. Conservez la sauvegarde automatique .bak jusqu'à vérification en jeu."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Modifications depuis le dernier point de contrôle du fichier"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} valeur(s) de statistique modifiée(s)"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nom du personnage modifié"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Temps de jeu modifié"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Position ou destination modifiée"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progression des boss modifiée"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} élément(s) d'inventaire ajouté(s) ou supprimé(s)"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} gemme(s) ou rune(s) ajoutée(s) ou supprimée(s)"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Rechercher dans l'inventaire"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nom, type, effet…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Effacer"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Favoris uniquement"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Ajouter aux favoris"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Retirer des favoris"
    },
    {
      "key": "forge.duplicate",
      "value": "Dupliquer"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Copie créée nommée «{{name}}»."
    },
    {
      "key": "forge.importPresets",
      "value": "Importer JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exporter JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importer les préréglages Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exporter les préréglages Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} nouveau(x) préréglage(s) importé(s)."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Bibliothèque de préréglages exportée avec succès."
    },
    {
      "key": "forge.libraryFailed",
      "value": "L'opération sur la bibliothèque de préréglages n'a pas pu être complétée."
    }
  ],
  "es": [
    {
      "key": "preferences.compact",
      "value": "Vista compacta"
    },
    {
      "key": "preferences.comfortable",
      "value": "Vista cómoda"
    },
    {
      "key": "revision.controls",
      "value": "Controles de revisión"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revisión local"
    },
    {
      "key": "revision.title",
      "value": "Registro de cambios"
    },
    {
      "key": "revision.description",
      "value": "Revisa los cambios en memoria antes de guardar. Deshacer y rehacer no escriben en el archivo automáticamente."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} cambios"
    },
    {
      "key": "revision.genericChange",
      "value": "Datos de guardado editados"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Cantidad de objeto actualizada"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Nivel de arma actualizado"
    },
    {
      "key": "revision.itemAdded",
      "value": "Objeto añadido al inventario"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Equipo añadido directamente"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gema o Runa añadida directamente"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Objeto del inventario reemplazado"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gema o Runa actualizada"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gema o Runa convertida"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Forma de ranura de equipo actualizada"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Contenido de ranura de equipo actualizado"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Estadísticas del personaje actualizadas"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Datos del personaje actualizados"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progreso de jefes actualizado"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Bandera avanzada de guardado aplicada"
    },
    {
      "key": "revision.undo",
      "value": "Deshacer"
    },
    {
      "key": "revision.redo",
      "value": "Rehacer"
    },
    {
      "key": "revision.close",
      "value": "Cerrar registro de cambios"
    },
    {
      "key": "revision.empty",
      "value": "No se han registrado cambios en memoria todavía."
    },
    {
      "key": "revision.notice",
      "value": "Guardar escribe solo la revisión actual. Mantén la copia automática .bak hasta verificar la partida en el juego."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Cambios desde el último punto de control del archivo"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} valor(es) de estadística modificado(s)"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nombre del personaje cambiado"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Tiempo de juego cambiado"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posición o destino cambiado"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progreso de jefes cambiado"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} registro(s) de inventario añadido(s) o eliminado(s)"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} registro(s) de Gema o Runa añadido(s) o eliminado(s)"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Buscar en inventario"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nombre, tipo, efecto…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Borrar"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Solo favoritos"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Añadir a favoritos"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Quitar de favoritos"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplicar"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Se creó una copia llamada “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importar presets de Forge"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportar presets de Forge"
    },
    {
      "key": "forge.importTitle",
      "value": "Importar presets de Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exportar presets de Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Se importaron {{count}} presets nuevos."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Biblioteca de presets exportada correctamente."
    },
    {
      "key": "forge.libraryFailed",
      "value": "No se pudo completar la operación de la biblioteca de presets."
    }
  ],
  "pt-PT": [
    {
      "key": "preferences.compact",
      "value": "Vista compacta"
    },
    {
      "key": "preferences.comfortable",
      "value": "Vista confortável"
    },
    {
      "key": "revision.controls",
      "value": "Controlos de revisão"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revisão local"
    },
    {
      "key": "revision.title",
      "value": "Registo de alterações"
    },
    {
      "key": "revision.description",
      "value": "Reveja as alterações em memória antes de guardar. Desfazer e refazer nunca escrevem automaticamente no ficheiro."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} alterações"
    },
    {
      "key": "revision.genericChange",
      "value": "Dados de gravação editados"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Quantidade do item atualizada"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Nível da arma atualizado"
    },
    {
      "key": "revision.itemAdded",
      "value": "Item de inventário adicionado"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Equipamento adicionado diretamente"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gema ou Runa adicionada diretamente"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Item de inventário substituído"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gema ou Runa atualizada"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gema ou Runa convertida"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Forma do encaixe do equipamento atualizada"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Conteúdo do encaixe do equipamento atualizado"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Estatísticas do personagem atualizadas"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Dados do personagem atualizados"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progresso dos chefes atualizado"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Flag de gravação avançada aplicada"
    },
    {
      "key": "revision.undo",
      "value": "Desfazer"
    },
    {
      "key": "revision.redo",
      "value": "Refazer"
    },
    {
      "key": "revision.close",
      "value": "Fechar registo de alterações"
    },
    {
      "key": "revision.empty",
      "value": "Ainda não foram registadas alterações em memória."
    },
    {
      "key": "revision.notice",
      "value": "Gravar escreve apenas a revisão atual. Mantenha a cópia automática .bak até verificar a gravação no jogo."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Alterações desde o último ponto de verificação do ficheiro"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} valor(es) de estatística alterado(s)"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nome da personagem alterado"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Tempo de jogo alterado"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posição ou destino alterado"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progresso dos chefes alterado"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} registo(s) de item de inventário adicionados ou removidos"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} registo(s) de Gema ou Runa adicionados ou removidos"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Pesquisar no inventário"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nome, tipo, efeito…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Limpar"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Apenas favoritos"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Adicionar aos favoritos"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Remover dos favoritos"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplicar"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Criada uma cópia chamada “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importar JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportar JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importar predefinições do Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exportar predefinições do Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importadas {{count}} predefinição(ões) nova(s)."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Biblioteca de predefinições exportada com sucesso."
    },
    {
      "key": "forge.libraryFailed",
      "value": "A operação da biblioteca de predefinições não pôde ser concluída."
    }
  ],
  "pt-BR": [
    {
      "key": "preferences.compact",
      "value": "Visual compacto"
    },
    {
      "key": "preferences.comfortable",
      "value": "Visual confortável"
    },
    {
      "key": "revision.controls",
      "value": "Controles de revisão"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revisão local"
    },
    {
      "key": "revision.title",
      "value": "Registro de alterações"
    },
    {
      "key": "revision.description",
      "value": "Revise as alterações em memória antes de salvar. Desfazer e refazer nunca gravam automaticamente no arquivo."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} alterações"
    },
    {
      "key": "revision.genericChange",
      "value": "Dados de salvamento editados"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Quantidade do item atualizada"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Nível da arma atualizado"
    },
    {
      "key": "revision.itemAdded",
      "value": "Item do inventário adicionado"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Equipamento adicionado diretamente"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gema ou Runa adicionada diretamente"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Item do inventário substituído"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gema ou Runa atualizada"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gema ou Runa convertida"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Formato do slot de equipamento atualizado"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Conteúdo do slot de equipamento atualizado"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Estatísticas do personagem atualizadas"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Dados do personagem atualizados"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progresso de chefes atualizado"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Flag avançada aplicada"
    },
    {
      "key": "revision.undo",
      "value": "Desfazer"
    },
    {
      "key": "revision.redo",
      "value": "Refazer"
    },
    {
      "key": "revision.close",
      "value": "Fechar registro de alterações"
    },
    {
      "key": "revision.empty",
      "value": "Nenhuma alteração em memória foi registrada ainda."
    },
    {
      "key": "revision.notice",
      "value": "Salvar grava apenas a revisão atual. Mantenha o backup automático .bak até que o salvamento seja verificado no jogo."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Alterações desde o último checkpoint do arquivo"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} valor(es) de estatística alterado(s)"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nome do personagem alterado"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Tempo de jogo alterado"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posição ou destino alterado"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progresso de chefes alterado"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} registro(s) de item do inventário adicionados ou removidos"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} registro(s) de Gema ou Runa adicionados ou removidos"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Buscar no inventário"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nome, tipo, efeito…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Limpar"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Somente favoritos"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Adicionar aos favoritos"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Remover dos favoritos"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplicar"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Criada uma cópia chamada “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importar JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportar JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importar presets do Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exportar presets do Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importados {{count}} preset(s) novos."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Biblioteca de presets exportada com sucesso."
    },
    {
      "key": "forge.libraryFailed",
      "value": "A operação na biblioteca de presets não pôde ser concluída."
    }
  ],
  "ru": [
    {
      "key": "preferences.compact",
      "value": "Компактный вид"
    },
    {
      "key": "preferences.comfortable",
      "value": "Комфортный вид"
    },
    {
      "key": "revision.controls",
      "value": "Управление изменениями"
    },
    {
      "key": "revision.eyebrow",
      "value": "Локальная проверка"
    },
    {
      "key": "revision.title",
      "value": "Журнал изменений"
    },
    {
      "key": "revision.description",
      "value": "Просмотрите изменения в памяти перед сохранением. Отмена и повтор не записывают файл автоматически."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} изменений"
    },
    {
      "key": "revision.genericChange",
      "value": "Изменены данные сохранения"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Обновлено количество предмета"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Обновлён уровень оружия"
    },
    {
      "key": "revision.itemAdded",
      "value": "Добавлен предмет в инвентарь"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Добавлено оборудование напрямую"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Добавлен камень или руна напрямую"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Заменён предмет в инвентаре"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Обновлён камень или руна"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Конвертирован камень или руна"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Изменён тип слота экипировки"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Обновлено содержимое слота экипировки"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Обновлены характеристики персонажа"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Обновлены данные персонажа"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Обновлён прогресс боссов"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Применён расширенный флаг сохранения"
    },
    {
      "key": "revision.undo",
      "value": "Отменить"
    },
    {
      "key": "revision.redo",
      "value": "Повторить"
    },
    {
      "key": "revision.close",
      "value": "Закрыть журнал изменений"
    },
    {
      "key": "revision.empty",
      "value": "В памяти ещё нет изменений."
    },
    {
      "key": "revision.notice",
      "value": "Сохранение записывает только текущую ревизию. Оставьте автоматический .bak до проверки сохранения в игре."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Изменения с последней контрольной точки файла"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} изменений характеристик"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Изменено имя персонажа"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Изменено время игры"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Изменено положение или пункт назначения"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Изменён прогресс боссов"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} записей предметов инвентаря добавлено или удалено"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} записей камней или рун добавлено или удалено"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Поиск по инвентарю"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Название, тип, эффект…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Очистить"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Только избранные"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Добавить в избранное"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Убрать из избранного"
    },
    {
      "key": "forge.duplicate",
      "value": "Дублировать"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Создана копия с именем “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Импорт JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Экспорт JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Импорт пресетов Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Экспорт пресетов Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Импортировано {{count}} новых пресетов."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Библиотека пресетов успешно экспортирована."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Не удалось завершить операцию с библиотекой пресетов."
    }
  ],
  "de": [
    {
      "key": "preferences.compact",
      "value": "Kompakte Ansicht"
    },
    {
      "key": "preferences.comfortable",
      "value": "Komfortable Ansicht"
    },
    {
      "key": "revision.controls",
      "value": "Revision-Steuerung"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokale Überprüfung"
    },
    {
      "key": "revision.title",
      "value": "Änderungsprotokoll"
    },
    {
      "key": "revision.description",
      "value": "Änderungen im Arbeitsspeicher vor dem Speichern überprüfen. Rückgängig/Wiederherstellen schreibt nie automatisch in die Datei."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} Änderungen"
    },
    {
      "key": "revision.genericChange",
      "value": "Speicherdaten bearbeitet"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Gegenstandsmenge aktualisiert"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Waffenstufe aktualisiert"
    },
    {
      "key": "revision.itemAdded",
      "value": "Inventargegenstand hinzugefügt"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Ausrüstung direkt hinzugefügt"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Juwel oder Rune direkt hinzugefügt"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Inventargegenstand ersetzt"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Juwel oder Rune aktualisiert"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Juwel oder Rune konvertiert"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Ausrüstungs-Slotform aktualisiert"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Inhalt des Ausrüstungs-Slots aktualisiert"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Charakterwerte aktualisiert"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Charakterdaten aktualisiert"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Boss-Fortschritt aktualisiert"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Erweiterte Speicher-Flag angewendet"
    },
    {
      "key": "revision.undo",
      "value": "Rückgängig"
    },
    {
      "key": "revision.redo",
      "value": "Wiederherstellen"
    },
    {
      "key": "revision.close",
      "value": "Änderungsprotokoll schließen"
    },
    {
      "key": "revision.empty",
      "value": "Im Arbeitsspeicher wurden noch keine Änderungen protokolliert."
    },
    {
      "key": "revision.notice",
      "value": "Speichern schreibt nur die aktuelle Revision. Bewahre die automatische .bak-Sicherung, bis der Speicherstand im Spiel bestätigt wurde."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Änderungen seit dem letzten Dateikontrollpunkt"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} Statistikwert(e) geändert"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Charaktername geändert"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Spielzeit geändert"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Position oder Ziel geändert"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Boss-Fortschritt geändert"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} Inventarposten hinzugefügt oder entfernt"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} Juwel- oder Rune-Eintrag(e) hinzugefügt oder entfernt"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Inventar durchsuchen"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Name, Typ, Effekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Löschen"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Nur Favoriten"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Zu Favoriten hinzufügen"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Aus Favoriten entfernen"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplizieren"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Kopie namens \"{{name}}\" erstellt."
    },
    {
      "key": "forge.importPresets",
      "value": "JSON importieren"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON exportieren"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge-Voreinstellungen importieren"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge-Voreinstellungen exportieren"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} neue Voreinstellung(en) importiert."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Voreinstellungsbibliothek erfolgreich exportiert."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Die Operation der Voreinstellungsbibliothek konnte nicht abgeschlossen werden."
    }
  ],
  "it": [
    {
      "key": "preferences.compact",
      "value": "Vista compatta"
    },
    {
      "key": "preferences.comfortable",
      "value": "Vista comoda"
    },
    {
      "key": "revision.controls",
      "value": "Controlli revisione"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revisione locale"
    },
    {
      "key": "revision.title",
      "value": "Registro modifiche"
    },
    {
      "key": "revision.description",
      "value": "Esamina le modifiche in memoria prima di salvare. Annulla e ripristina non scrivono mai automaticamente sul file."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} modifiche"
    },
    {
      "key": "revision.genericChange",
      "value": "Dati di salvataggio modificati"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Quantità oggetto aggiornata"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Livello arma aggiornato"
    },
    {
      "key": "revision.itemAdded",
      "value": "Oggetto aggiunto all'inventario"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Equipaggiamento aggiunto direttamente"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gemma o Runa aggiunta direttamente"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Oggetto dell'inventario sostituito"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gemma o Runa aggiornata"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gemma o Runa convertita"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Forma dello slot dell'equipaggiamento aggiornata"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Contenuto dello slot dell'equipaggiamento aggiornato"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Statistiche del personaggio aggiornate"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Dati del personaggio aggiornati"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progresso boss aggiornato"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Flag di salvataggio avanzata applicata"
    },
    {
      "key": "revision.undo",
      "value": "Annulla"
    },
    {
      "key": "revision.redo",
      "value": "Ripristina"
    },
    {
      "key": "revision.close",
      "value": "Chiudi registro modifiche"
    },
    {
      "key": "revision.empty",
      "value": "Non sono state registrate modifiche in memoria."
    },
    {
      "key": "revision.notice",
      "value": "Il salvataggio scrive solo la revisione corrente. Mantieni il backup automatico .bak finché il salvataggio non è stato verificato nel gioco."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Modifiche dall'ultimo checkpoint del file"
    },
    {
      "key": "revision.summaryStats",
      "value": "Modificati {{count}} valori statistici"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nome del personaggio modificato"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Tempo di gioco modificato"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posizione o destinazione modificata"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progresso dei boss modificato"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} elementi dell'inventario aggiunti o rimossi"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} Gemme o Rune aggiunte o rimosse"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Cerca nell'inventario"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nome, tipo, effetto…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Cancella"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Solo preferiti"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Aggiungi ai preferiti"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Rimuovi dai preferiti"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplica"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Creata una copia chiamata “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importa JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Esporta JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importa preset di Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Esporta preset di Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importati {{count}} nuovi preset."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Libreria preset esportata con successo."
    },
    {
      "key": "forge.libraryFailed",
      "value": "L'operazione sulla libreria preset non è riuscita."
    }
  ],
  "nl": [
    {
      "key": "preferences.compact",
      "value": "Compacte weergave"
    },
    {
      "key": "preferences.comfortable",
      "value": "Comfortabele weergave"
    },
    {
      "key": "revision.controls",
      "value": "Revisiebediening"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokale controle"
    },
    {
      "key": "revision.title",
      "value": "Wijzigingslogboek"
    },
    {
      "key": "revision.description",
      "value": "Bekijk wijzigingen in het geheugen voordat u opslaat. Ongedaan maken en opnieuw uitvoeren schrijven nooit automatisch naar het bestand."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} wijzigingen"
    },
    {
      "key": "revision.genericChange",
      "value": "Opgeslagen gegevens bewerkt"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Itemaantal bijgewerkt"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Wapenniveau bijgewerkt"
    },
    {
      "key": "revision.itemAdded",
      "value": "Inventarisitem toegevoegd"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Uitrusting direct toegevoegd"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Steen of rune direct toegevoegd"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Inventarisitem vervangen"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Steen of rune bijgewerkt"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Steen of rune geconverteerd"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Uitrustingsslotvorm bijgewerkt"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Inhoud van uitrustingsslot bijgewerkt"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Personage-statistieken bijgewerkt"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Personagegegevens bijgewerkt"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Voortgang van baas bijgewerkt"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Geavanceerde save-vlag toegepast"
    },
    {
      "key": "revision.undo",
      "value": "Ongedaan maken"
    },
    {
      "key": "revision.redo",
      "value": "Opnieuw uitvoeren"
    },
    {
      "key": "revision.close",
      "value": "Wijzigingslogboek sluiten"
    },
    {
      "key": "revision.empty",
      "value": "Er zijn nog geen wijzigingen in het geheugen geregistreerd."
    },
    {
      "key": "revision.notice",
      "value": "Opslaan schrijft alleen de huidige revisie. Bewaar de automatische .bak-back-up totdat het opgeslagen bestand in het spel is gecontroleerd."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Wijzigingen sinds het laatste bestandscontrolepunt"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} statistiekwaarde(n) gewijzigd"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Personagenaam gewijzigd"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Speeltijd gewijzigd"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Positie of bestemming gewijzigd"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Voortgang van bazen gewijzigd"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} inventarisitem(s) toegevoegd of verwijderd"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} steen- of rune-record(s) toegevoegd of verwijderd"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Inventaris doorzoeken"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Naam, type, effect…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Wissen"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Alleen favorieten"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Aan favorieten toevoegen"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Uit favorieten verwijderen"
    },
    {
      "key": "forge.duplicate",
      "value": "Dupliceren"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Een kopie gemaakt met de naam “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "JSON importeren"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON exporteren"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge-presets importeren"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge-presets exporteren"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} nieuwe preset(s) geïmporteerd."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Presetbibliotheek succesvol geëxporteerd."
    },
    {
      "key": "forge.libraryFailed",
      "value": "De bewerking op de presetbibliotheek kon niet worden voltooid."
    }
  ],
  "pl": [
    {
      "key": "preferences.compact",
      "value": "Widok kompaktowy"
    },
    {
      "key": "preferences.comfortable",
      "value": "Widok komfortowy"
    },
    {
      "key": "revision.controls",
      "value": "Kontrolki rewizji"
    },
    {
      "key": "revision.eyebrow",
      "value": "Przegląd lokalny"
    },
    {
      "key": "revision.title",
      "value": "Dziennik zmian"
    },
    {
      "key": "revision.description",
      "value": "Przejrzyj zmiany w pamięci przed zapisem. Cofnij i ponów nie zapisują automatycznie do pliku."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} zmian"
    },
    {
      "key": "revision.genericChange",
      "value": "Zmodyfikowano dane zapisu"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Zmieniono ilość przedmiotu"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Zaktualizowano poziom broni"
    },
    {
      "key": "revision.itemAdded",
      "value": "Dodano przedmiot do ekwipunku"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Dodano wyposażenie bezpośrednio"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Bezpośrednio dodano klejnot lub runę"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Zastąpiono przedmiot w ekwipunku"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Zmieniono klejnot lub runę"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Przekształcono klejnot lub runę"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Zmieniono kształt gniazda wyposażenia"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Zmieniono zawartość gniazda wyposażenia"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Zaktualizowano statystyki postaci"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Zaktualizowano dane postaci"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Zaktualizowano postęp bossów"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Zastosowano zaawansowaną flagę zapisu"
    },
    {
      "key": "revision.undo",
      "value": "Cofnij"
    },
    {
      "key": "revision.redo",
      "value": "Ponów"
    },
    {
      "key": "revision.close",
      "value": "Zamknij dziennik zmian"
    },
    {
      "key": "revision.empty",
      "value": "Nie zanotowano jeszcze żadnych zmian w pamięci."
    },
    {
      "key": "revision.notice",
      "value": "Zapisuje jedynie bieżącą rewizję. Zachowaj automatyczny plik .bak, dopóki zapis nie zostanie zweryfikowany w grze."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Zmiany od ostatniego zapisu pliku"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} zmienionych wartości statystyk"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Zmieniono nazwę postaci"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Czas gry zmieniony"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Zmieniono pozycję lub cel"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Zmieniono postęp bossów"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} rekordów przedmiotów ekwipunku dodanych lub usuniętych"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} rekordów klejnotów lub run dodanych lub usuniętych"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Szukaj w ekwipunku"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nazwa, typ, efekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Wyczyść"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Tylko ulubione"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Dodaj do ulubionych"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Usuń z ulubionych"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplikuj"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Utworzono kopię o nazwie „{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importuj JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Eksportuj JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Import presetów Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Eksport presetów Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Zaimportowano {{count}} nowych presetów."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Biblioteka presetów została pomyślnie wyeksportowana."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Operacja na bibliotece presetów nie mogła zostać ukończona."
    }
  ],
  "tr": [
    {
      "key": "preferences.compact",
      "value": "Kompakt görünüm"
    },
    {
      "key": "preferences.comfortable",
      "value": "Konforlu görünüm"
    },
    {
      "key": "revision.controls",
      "value": "Değişiklik kontrolleri"
    },
    {
      "key": "revision.eyebrow",
      "value": "Yerel inceleme"
    },
    {
      "key": "revision.title",
      "value": "Değişiklik günlüğü"
    },
    {
      "key": "revision.description",
      "value": "Kaydetmeden önce bellekteki değişiklikleri inceleyin. Geri al ve yinele eylemleri dosyaya otomatik olarak yazmaz."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} değişiklik"
    },
    {
      "key": "revision.genericChange",
      "value": "Kayıt verileri düzenlendi"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Eşya miktarı güncellendi"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Silah seviyesi güncellendi"
    },
    {
      "key": "revision.itemAdded",
      "value": "Envantere eşya eklendi"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Ekipman doğrudan eklendi"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gem veya Rune doğrudan eklendi"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Envanter öğesi değiştirildi"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gem veya Rune güncellendi"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gem veya Rune dönüştürüldü"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Ekipman yuvası şekli güncellendi"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Ekipman yuvası içeriği güncellendi"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Karakter istatistikleri güncellendi"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Karakter verileri güncellendi"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Boss ilerlemesi güncellendi"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Gelişmiş bir kayıt bayrağı uygulandı"
    },
    {
      "key": "revision.undo",
      "value": "Geri al"
    },
    {
      "key": "revision.redo",
      "value": "Yinele"
    },
    {
      "key": "revision.close",
      "value": "Değişiklik günlüğünü kapat"
    },
    {
      "key": "revision.empty",
      "value": "Henüz bellekte değişiklik kaydedilmedi."
    },
    {
      "key": "revision.notice",
      "value": "Kaydetme yalnızca mevcut revizyonu yazar. Oyunda doğrulanana kadar otomatik .bak yedeğini saklayın."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Son dosya kontrol noktasından bu yana değişiklikler"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} istatistik değeri değişti"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Karakter adı değiştirildi"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Oynama süresi değişti"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Konum veya varış noktası değişti"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Boss ilerlemesi değişti"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} envanter öğesi kaydı eklendi veya kaldırıldı"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} Gem veya Rune kaydı eklendi veya kaldırıldı"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Envanteri ara"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "İsim, tür, etki…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Temizle"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Sadece favoriler"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Favorilere ekle"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Favorilerden kaldır"
    },
    {
      "key": "forge.duplicate",
      "value": "Çoğalt"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "“{{name}}” adlı bir kopya oluşturuldu."
    },
    {
      "key": "forge.importPresets",
      "value": "JSON içe aktar"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON dışa aktar"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge önayarlarını içe aktar"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge önayarlarını dışa aktar"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} yeni önayar içe aktarıldı."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Önayar kütüphanesi başarıyla dışa aktarıldı."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Önayar kütüphanesi işlemi tamamlanamadı."
    }
  ],
  "uk": [
    {
      "key": "preferences.compact",
      "value": "Компактний вигляд"
    },
    {
      "key": "preferences.comfortable",
      "value": "Комфортний вигляд"
    },
    {
      "key": "revision.controls",
      "value": "Керування змінами"
    },
    {
      "key": "revision.eyebrow",
      "value": "Локальний перегляд"
    },
    {
      "key": "revision.title",
      "value": "Журнал змін"
    },
    {
      "key": "revision.description",
      "value": "Перегляньте зміни в оперативній пам'яті перед збереженням. Скасування та повтор ніколи не записують файл автоматично."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} змін"
    },
    {
      "key": "revision.genericChange",
      "value": "Змінено дані збереження"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Оновлено кількість предмета"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Оновлено рівень зброї"
    },
    {
      "key": "revision.itemAdded",
      "value": "Додано предмет до інвентарю"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Додано спорядження безпосередньо"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Додано камінь або руну безпосередньо"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Замінено предмет в інвентарі"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Оновлено камінь або руну"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Перетворено камінь або руну"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Оновлено форму слота спорядження"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Оновлено вміст слота спорядження"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Оновлено характеристики персонажа"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Оновлено дані персонажа"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Оновлено прогрес босів"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Застосовано розширений прапорець збереження"
    },
    {
      "key": "revision.undo",
      "value": "Скасувати"
    },
    {
      "key": "revision.redo",
      "value": "Повторити"
    },
    {
      "key": "revision.close",
      "value": "Закрити журнал змін"
    },
    {
      "key": "revision.empty",
      "value": "Поки що не зафіксовано змін в оперативній пам'яті."
    },
    {
      "key": "revision.notice",
      "value": "Збереження записує лише поточну ревізію. Залиште автоматичну резервну копію .bak до підтвердження збереження в грі."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Зміни з останнього контрольного збереження файлу"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} змінено значень статистики"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Змінено ім'я персонажа"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Змінено ігровий час"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Змінено позицію або пункт призначення"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Змінено прогрес босів"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} запис(ів) предметів інвентарю додано або видалено"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} запис(ів) каменів або рун додано або видалено"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Пошук інвентарю"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Назва, тип, ефект…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Очистити"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Лише обране"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Додати в обране"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Вилучити з обраного"
    },
    {
      "key": "forge.duplicate",
      "value": "Створити копію"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Створено копію з іменем «{{name}}»."
    },
    {
      "key": "forge.importPresets",
      "value": "Імпортувати JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Експортувати JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Імпортувати пресети Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Експортувати пресети Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Імпортовано {{count}} нових пресетів."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Бібліотека пресетів успішно експортована."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Не вдалося виконати операцію з бібліотекою пресетів."
    }
  ],
  "ja": [
    {
      "key": "preferences.compact",
      "value": "コンパクト表示"
    },
    {
      "key": "preferences.comfortable",
      "value": "快適表示"
    },
    {
      "key": "revision.controls",
      "value": "リビジョン操作"
    },
    {
      "key": "revision.eyebrow",
      "value": "ローカル確認"
    },
    {
      "key": "revision.title",
      "value": "変更履歴"
    },
    {
      "key": "revision.description",
      "value": "保存前にメモリ上の変更を確認します。元に戻す/やり直しはファイルに自動で書き込まれません。"
    },
    {
      "key": "revision.changes",
      "value": "{{count}} 件の変更"
    },
    {
      "key": "revision.genericChange",
      "value": "セーブデータを編集"
    },
    {
      "key": "revision.quantityChanged",
      "value": "アイテム数を更新"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "武器強化レベルを更新"
    },
    {
      "key": "revision.itemAdded",
      "value": "所持品を追加"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "装備を直接追加"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "血晶石やルーンを直接追加"
    },
    {
      "key": "revision.itemReplaced",
      "value": "所持品を置換"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "血晶石やルーンを更新"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "血晶石やルーンを変換"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "装備スロット形状を更新"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "装備スロットの内容を更新"
    },
    {
      "key": "revision.statsUpdated",
      "value": "ステータスを更新"
    },
    {
      "key": "revision.characterUpdated",
      "value": "キャラクターデータを更新"
    },
    {
      "key": "revision.bossUpdated",
      "value": "ボス進行状況を更新"
    },
    {
      "key": "revision.flagUpdated",
      "value": "高度なセーブフラグを適用"
    },
    {
      "key": "revision.undo",
      "value": "元に戻す"
    },
    {
      "key": "revision.redo",
      "value": "やり直す"
    },
    {
      "key": "revision.close",
      "value": "変更履歴を閉じる"
    },
    {
      "key": "revision.empty",
      "value": "メモリ上の変更はまだ記録されていません。"
    },
    {
      "key": "revision.notice",
      "value": "保存すると現在のリビジョンのみが書き込まれます。ゲーム内でセーブを確認するまで、自動作成された .bak バックアップを保持してください。"
    },
    {
      "key": "revision.summaryTitle",
      "value": "最終ファイルチェックポイント以降の変更"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} 件のステータスが変更されました"
    },
    {
      "key": "revision.summaryUsername",
      "value": "キャラクター名が変更されました"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "プレイ時間が変更されました"
    },
    {
      "key": "revision.summaryPosition",
      "value": "位置または行き先が変更されました"
    },
    {
      "key": "revision.summaryBosses",
      "value": "ボス進行が変更されました"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} 件の所持品レコードが追加または削除されました"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} 件の血晶石またはルーンのレコードが追加または削除されました"
    },
    {
      "key": "inventory.searchInventory",
      "value": "所持品を検索"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "名前、タイプ、効果…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "クリア"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "お気に入りのみ"
    },
    {
      "key": "inventory.addFavorite",
      "value": "お気に入りに追加"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "お気に入りから削除"
    },
    {
      "key": "forge.duplicate",
      "value": "複製"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "「{{name}}」という名前のコピーを作成しました。"
    },
    {
      "key": "forge.importPresets",
      "value": "JSON をインポート"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON をエクスポート"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge プリセットをインポート"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge プリセットをエクスポート"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} 件の新しいプリセットをインポートしました。"
    },
    {
      "key": "forge.exportedStatus",
      "value": "プリセットライブラリを正常にエクスポートしました。"
    },
    {
      "key": "forge.libraryFailed",
      "value": "プリセットライブラリの操作を完了できませんでした。"
    }
  ],
  "ko": [
    {
      "key": "preferences.compact",
      "value": "간결 보기"
    },
    {
      "key": "preferences.comfortable",
      "value": "여유 있는 보기"
    },
    {
      "key": "revision.controls",
      "value": "변경 제어"
    },
    {
      "key": "revision.eyebrow",
      "value": "로컬 검토"
    },
    {
      "key": "revision.title",
      "value": "변경 기록"
    },
    {
      "key": "revision.description",
      "value": "저장하기 전에 메모리상의 변경사항을 검토하세요. 실행 취소와 다시 실행은 파일에 자동으로 기록되지 않습니다."
    },
    {
      "key": "revision.changes",
      "value": "{{count}}개 변경"
    },
    {
      "key": "revision.genericChange",
      "value": "세이브 데이터 수정됨"
    },
    {
      "key": "revision.quantityChanged",
      "value": "아이템 수량 변경됨"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "무기 레벨 변경됨"
    },
    {
      "key": "revision.itemAdded",
      "value": "인벤토리 아이템 추가됨"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "장비 직접 추가됨"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "젬/룬 직접 추가됨"
    },
    {
      "key": "revision.itemReplaced",
      "value": "인벤토리 아이템 교체됨"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "젬/룬 수정됨"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "젬/룬 변환됨"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "장비 슬롯 형태 변경됨"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "장비 슬롯 내용 변경됨"
    },
    {
      "key": "revision.statsUpdated",
      "value": "캐릭터 능력치 변경됨"
    },
    {
      "key": "revision.characterUpdated",
      "value": "캐릭터 데이터 변경됨"
    },
    {
      "key": "revision.bossUpdated",
      "value": "보스 진행도 변경됨"
    },
    {
      "key": "revision.flagUpdated",
      "value": "고급 세이브 플래그 적용됨"
    },
    {
      "key": "revision.undo",
      "value": "실행 취소"
    },
    {
      "key": "revision.redo",
      "value": "다시 실행"
    },
    {
      "key": "revision.close",
      "value": "변경 기록 닫기"
    },
    {
      "key": "revision.empty",
      "value": "메모리상의 변경사항이 아직 없습니다."
    },
    {
      "key": "revision.notice",
      "value": "저장하면 현재 리비전만 기록됩니다. 게임에서 저장을 확인하기 전까지 자동 생성된 .bak 백업을 유지하세요."
    },
    {
      "key": "revision.summaryTitle",
      "value": "마지막 파일 체크포인트 이후 변경사항"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}}개 능력치 값 변경"
    },
    {
      "key": "revision.summaryUsername",
      "value": "캐릭터 이름 변경됨"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "플레이 시간 변경됨"
    },
    {
      "key": "revision.summaryPosition",
      "value": "위치/목적지 변경됨"
    },
    {
      "key": "revision.summaryBosses",
      "value": "보스 진행도 변경됨"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}}개 인벤토리 아이템 레코드 추가/제거"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}}개 젬/룬 레코드 추가/제거"
    },
    {
      "key": "inventory.searchInventory",
      "value": "인벤토리 검색"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "이름, 종류, 효과…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "지우기"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "즐겨찾기만"
    },
    {
      "key": "inventory.addFavorite",
      "value": "즐겨찾기에 추가"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "즐겨찾기에서 제거"
    },
    {
      "key": "forge.duplicate",
      "value": "복제"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "이름이 “{{name}}”인 복사본을 생성했습니다."
    },
    {
      "key": "forge.importPresets",
      "value": "JSON 가져오기"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON 내보내기"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge 프리셋 가져오기"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge 프리셋 내보내기"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}}개의 새 프리셋을 가져왔습니다."
    },
    {
      "key": "forge.exportedStatus",
      "value": "프리셋 라이브러리 내보내기 완료."
    },
    {
      "key": "forge.libraryFailed",
      "value": "프리셋 라이브러리 작업을 완료할 수 없습니다."
    }
  ],
  "zh-CN": [
    {
      "key": "preferences.compact",
      "value": "紧凑视图"
    },
    {
      "key": "preferences.comfortable",
      "value": "舒适视图"
    },
    {
      "key": "revision.controls",
      "value": "修订控制"
    },
    {
      "key": "revision.eyebrow",
      "value": "本地审查"
    },
    {
      "key": "revision.title",
      "value": "变更记录"
    },
    {
      "key": "revision.description",
      "value": "在保存前查看内存中更改。撤销和重做不会自动写入文件。"
    },
    {
      "key": "revision.changes",
      "value": "{{count}} 项更改"
    },
    {
      "key": "revision.genericChange",
      "value": "编辑了存档数据"
    },
    {
      "key": "revision.quantityChanged",
      "value": "已更新物品数量"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "已更新武器等级"
    },
    {
      "key": "revision.itemAdded",
      "value": "已添加库存物品"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "直接添加装备"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "直接添加宝石或符文"
    },
    {
      "key": "revision.itemReplaced",
      "value": "替换了库存物品"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "已更新宝石或符文"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "已转换宝石或符文"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "已更新装备槽形状"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "已更新装备槽内容"
    },
    {
      "key": "revision.statsUpdated",
      "value": "已更新角色属性"
    },
    {
      "key": "revision.characterUpdated",
      "value": "已更新角色数据"
    },
    {
      "key": "revision.bossUpdated",
      "value": "已更新首领进度"
    },
    {
      "key": "revision.flagUpdated",
      "value": "已应用高级存档标记"
    },
    {
      "key": "revision.undo",
      "value": "撤销"
    },
    {
      "key": "revision.redo",
      "value": "重做"
    },
    {
      "key": "revision.close",
      "value": "关闭变更记录"
    },
    {
      "key": "revision.empty",
      "value": "尚未记录任何内存更改。"
    },
    {
      "key": "revision.notice",
      "value": "保存仅写入当前修订。请保留自动生成的 .bak 备份，直到在游戏中验证保存为止。"
    },
    {
      "key": "revision.summaryTitle",
      "value": "自上次文件检查点以来的更改"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} 个统计数值已更改"
    },
    {
      "key": "revision.summaryUsername",
      "value": "角色名称已更改"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "游玩时间已更改"
    },
    {
      "key": "revision.summaryPosition",
      "value": "位置或目的地已更改"
    },
    {
      "key": "revision.summaryBosses",
      "value": "首领进度已更改"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} 条库存物品记录已添加或移除"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} 条宝石或符文记录已添加或移除"
    },
    {
      "key": "inventory.searchInventory",
      "value": "搜索物品"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "名称、类型、效果…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "清除"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "仅显示收藏"
    },
    {
      "key": "inventory.addFavorite",
      "value": "添加到收藏"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "从收藏移除"
    },
    {
      "key": "forge.duplicate",
      "value": "复制"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "已创建名为“{{name}}”的副本。"
    },
    {
      "key": "forge.importPresets",
      "value": "导入 JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "导出 JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "导入 Forge 预设"
    },
    {
      "key": "forge.exportTitle",
      "value": "导出 Forge 预设"
    },
    {
      "key": "forge.importedStatus",
      "value": "已导入 {{count}} 个新预设。"
    },
    {
      "key": "forge.exportedStatus",
      "value": "预设库导出成功。"
    },
    {
      "key": "forge.libraryFailed",
      "value": "预设库操作无法完成。"
    }
  ],
  "sv": [
    {
      "key": "preferences.compact",
      "value": "Kompakt vy"
    },
    {
      "key": "preferences.comfortable",
      "value": "Bekväm vy"
    },
    {
      "key": "revision.controls",
      "value": "Revisionskontroller"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokal granskning"
    },
    {
      "key": "revision.title",
      "value": "Ändringslogg"
    },
    {
      "key": "revision.description",
      "value": "Granska förändringar i minnet innan du sparar. Ångra och gör om skriver aldrig automatiskt till filen."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} ändring(ar)"
    },
    {
      "key": "revision.genericChange",
      "value": "Redigerade spardata"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Uppdaterade mängd"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Uppdaterade vapennivå"
    },
    {
      "key": "revision.itemAdded",
      "value": "Lade till ett föremål i inventariet"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Lade till utrustning direkt"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Lade till en juvel eller rune direkt"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Ersatte ett föremål i inventariet"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Uppdaterade en juvel eller rune"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Konverterade en juvel eller rune"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Uppdaterade utrustningsplatsens form"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Uppdaterade utrustningsplatsens innehåll"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Uppdaterade karaktärens statistik"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Uppdaterade karaktärsdata"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Uppdaterade bossframsteg"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Tillämpade en avancerad sparflagga"
    },
    {
      "key": "revision.undo",
      "value": "Ångra"
    },
    {
      "key": "revision.redo",
      "value": "Gör om"
    },
    {
      "key": "revision.close",
      "value": "Stäng ändringslogg"
    },
    {
      "key": "revision.empty",
      "value": "Inga ändringar i minnet har registrerats ännu."
    },
    {
      "key": "revision.notice",
      "value": "Sparning skriver endast den aktuella revisionen. Behåll den automatiska .bak-backupen tills sparningen verifierats i spelet."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Ändringar sedan senaste filkontrollpunkten"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} statistikvärde(n) ändrade"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Karaktärsnamn ändrat"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Speltid ändrad"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Position eller destination ändrad"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Bossframsteg ändrat"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} inventariepost(er) tillagda eller borttagna"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} juvel- eller runepost(er) tillagda eller borttagna"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Sök i inventariet"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Namn, typ, effekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Rensa"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Endast favoriter"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Lägg till i favoriter"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Ta bort från favoriter"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplicera"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Skapade en kopia med namnet “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importera JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportera JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importera Forge-förinställningar"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exportera Forge-förinställningar"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importerade {{count}} nya förinställning(ar)."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Förinställningsbiblioteket exporterades."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Åtgärden för förinställningsbiblioteket kunde inte slutföras."
    }
  ],
  "cs": [
    {
      "key": "preferences.compact",
      "value": "Kompaktní zobrazení"
    },
    {
      "key": "preferences.comfortable",
      "value": "Pohodlné zobrazení"
    },
    {
      "key": "revision.controls",
      "value": "Ovládání revizí"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokální kontrola"
    },
    {
      "key": "revision.title",
      "value": "Záznam změn"
    },
    {
      "key": "revision.description",
      "value": "Prohlédněte změny v paměti před uložením. Akce zpět/znova nikdy automaticky nezapisují do souboru."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} změn"
    },
    {
      "key": "revision.genericChange",
      "value": "Upravená uložená data"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Aktualizované množství položky"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Aktualizována úroveň zbraně"
    },
    {
      "key": "revision.itemAdded",
      "value": "Přidán předmět do inventáře"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Vybavení přidáno přímo"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Přidán drahokam nebo runa přímo"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Nahrazen předmět v inventáři"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Aktualizován drahokam nebo runa"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Převeden drahokam nebo runa"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Aktualizován tvar slotu vybavení"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Aktualizován obsah slotu vybavení"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Aktualizovány statistiky postavy"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Aktualizována data postavy"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Aktualizován postup bossů"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Použit pokročilý flag"
    },
    {
      "key": "revision.undo",
      "value": "Zpět"
    },
    {
      "key": "revision.redo",
      "value": "Znovu"
    },
    {
      "key": "revision.close",
      "value": "Zavřít záznam změn"
    },
    {
      "key": "revision.empty",
      "value": "Dosud nebyly zaznamenány žádné změny v paměti."
    },
    {
      "key": "revision.notice",
      "value": "Uložením se zapíše pouze aktuální revize. Neodstraňujte automatickou zálohu .bak, dokud není uložení ověřeno ve hře."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Změny od posledního kontrolního bodu souboru"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} změněných statistických hodnot"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Změněno jméno postavy"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Změněn čas hraní"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Změněna pozice nebo cíl"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Změněn postup bossů"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} záznamů položek inventáře přidáno nebo odebráno"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} záznamů drahokamů nebo run přidáno nebo odebráno"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Prohledat inventář"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Název, typ, efekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Vymazat"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Pouze oblíbené"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Přidat do oblíbených"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Odebrat z oblíbených"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplikovat"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Vytvořena kopie s názvem “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importovat JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportovat JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Import přednastavení Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Export přednastavení Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importováno {{count}} nových přednastavení."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Knihovna přednastavení byla úspěšně exportována."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Operaci s knihovnou přednastavení nelze dokončit."
    }
  ],
  "ro": [
    {
      "key": "preferences.compact",
      "value": "Vizualizare compactă"
    },
    {
      "key": "preferences.comfortable",
      "value": "Vizualizare confortabilă"
    },
    {
      "key": "revision.controls",
      "value": "Controale revizuire"
    },
    {
      "key": "revision.eyebrow",
      "value": "Revizuire locală"
    },
    {
      "key": "revision.title",
      "value": "Jurnal modificări"
    },
    {
      "key": "revision.description",
      "value": "Revizuiește modificările din memorie înainte de salvare. Anularea și refacerea nu scriu niciodată automat în fișier."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} modificări"
    },
    {
      "key": "revision.genericChange",
      "value": "Date de salvare modificate"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Cantitate obiect actualizată"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Nivelul armei actualizat"
    },
    {
      "key": "revision.itemAdded",
      "value": "Obiect adăugat în inventar"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Echipament adăugat direct"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Gemă sau rună adăugată direct"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Obiect în inventar înlocuit"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Gemă sau rună actualizată"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Gemă sau rună convertită"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Forma slotului de echipament actualizată"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Conținut slot echipament actualizat"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Statistici personaj actualizate"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Datele personajului actualizate"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Progres șef actualizat"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Flag de salvare avansat aplicat"
    },
    {
      "key": "revision.undo",
      "value": "Anulează"
    },
    {
      "key": "revision.redo",
      "value": "Refă"
    },
    {
      "key": "revision.close",
      "value": "Închide jurnalul modificărilor"
    },
    {
      "key": "revision.empty",
      "value": "Nu au fost înregistrate încă modificări în memorie."
    },
    {
      "key": "revision.notice",
      "value": "Salvarea scrie doar revizia curentă. Păstrează copia automată .bak până la verificarea salvării în joc."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Modificări de la ultimul punct de control al fișierului"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} valori statistice modificate"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nume personaj schimbat"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Timp de joc modificat"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Poziție sau destinație modificată"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Progres boss modificat"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} înregistrări obiecte din inventar adăugate sau eliminate"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} înregistrări de gemă sau rună adăugate sau eliminate"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Caută în inventar"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nume, tip, efect…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Șterge"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Doar favorite"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Adaugă la favorite"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Elimină din favorite"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplică"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "S-a creat o copie numită “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importă JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Exportă JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importă presetări Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Exportă presetări Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "{{count}} preseturi noi importate."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Biblioteca de preseturi exportată cu succes."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Nu s-a putut finaliza operațiunea asupra bibliotecii de presetări."
    }
  ],
  "el": [
    {
      "key": "preferences.compact",
      "value": "Συμπαγής προβολή"
    },
    {
      "key": "preferences.comfortable",
      "value": "Άνετη προβολή"
    },
    {
      "key": "revision.controls",
      "value": "Έλεγχοι αναθεώρησης"
    },
    {
      "key": "revision.eyebrow",
      "value": "Τοπική ανασκόπηση"
    },
    {
      "key": "revision.title",
      "value": "Καταγραφή αλλαγών"
    },
    {
      "key": "revision.description",
      "value": "Ελέγξτε τις αλλαγές στη μνήμη πριν την αποθήκευση. Η αναίρεση και η επαναφορά δεν γράφουν ποτέ το αρχείο αυτόματα."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} αλλαγές"
    },
    {
      "key": "revision.genericChange",
      "value": "Επεξεργασμένα δεδομένα αποθήκευσης"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Ενημερώθηκε ποσότητα αντικειμένου"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Ενημερώθηκε επίπεδο όπλου"
    },
    {
      "key": "revision.itemAdded",
      "value": "Προστέθηκε αντικείμενο στο απόθεμα"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Προστέθηκε εξοπλισμός απευθείας"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Προστέθηκε Gem ή Rune απευθείας"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Αντικαταστάθηκε αντικείμενο στο απόθεμα"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Ενημερώθηκε Gem ή Rune"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Μετατράπηκε Gem ή Rune"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Ενημερώθηκε σχήμα υποδοχής εξοπλισμού"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Ενημερώθηκε το περιεχόμενο υποδοχής εξοπλισμού"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Ενημερώθηκαν στατιστικά χαρακτήρα"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Ενημερώθηκαν δεδομένα χαρακτήρα"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Ενημερώθηκε πρόοδος αφεντικού"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Εφαρμόστηκε προχωρημένη σημαία αποθήκευσης"
    },
    {
      "key": "revision.undo",
      "value": "Αναίρεση"
    },
    {
      "key": "revision.redo",
      "value": "Επαναφορά"
    },
    {
      "key": "revision.close",
      "value": "Κλείσιμο καταγραφής αλλαγών"
    },
    {
      "key": "revision.empty",
      "value": "Δεν έχουν καταγραφεί αλλαγές στη μνήμη."
    },
    {
      "key": "revision.notice",
      "value": "Η αποθήκευση γράφει μόνο την τρέχουσα αναθεώρηση. Διατηρήστε το αυτόματο αντίγραφο .bak μέχρι να επαληθευτεί η αποθήκευση στο παιχνίδι."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Αλλαγές από το τελευταίο σημείο ελέγχου αρχείου"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} τιμή(ές) στατιστικού τροποποιήθηκαν"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Αλλαγή ονόματος χαρακτήρα"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Αλλαγή χρόνου παιχνιδιού"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Αλλαγή θέσης ή προορισμού"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Αλλαγή προόδου αφεντικών"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} εγγραφή(ές) αντικειμένου αποθέματος προστέθηκαν ή αφαιρέθηκαν"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} εγγραφή(ές) Gem ή Rune προστέθηκαν ή αφαιρέθηκαν"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Αναζήτηση αποθέματος"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Όνομα, τύπος, αποτέλεσμα…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Καθαρισμός"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Μόνο αγαπημένα"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Προσθήκη στα αγαπημένα"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Αφαίρεση από αγαπημένα"
    },
    {
      "key": "forge.duplicate",
      "value": "Δημιουργία αντιγράφου"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Δημιουργήθηκε αντίγραφο με όνομα “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Εισαγωγή JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Εξαγωγή JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Εισαγωγή προεπιλογών Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Εξαγωγή προεπιλογών Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Εισήχθησαν {{count}} νέες προεπιλογές."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Η βιβλιοθήκη προεπιλογών εξήχθη με επιτυχία."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Η λειτουργία της βιβλιοθήκης προεπιλογών δεν μπόρεσε να ολοκληρωθεί."
    }
  ],
  "id": [
    {
      "key": "preferences.compact",
      "value": "Tampilan ringkas"
    },
    {
      "key": "preferences.comfortable",
      "value": "Tampilan nyaman"
    },
    {
      "key": "revision.controls",
      "value": "Kontrol revisi"
    },
    {
      "key": "revision.eyebrow",
      "value": "Tinjauan lokal"
    },
    {
      "key": "revision.title",
      "value": "Log perubahan"
    },
    {
      "key": "revision.description",
      "value": "Tinjau perubahan di memori sebelum menyimpan. Batalkan dan ulangi tidak akan menulis ke file secara otomatis."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} perubahan"
    },
    {
      "key": "revision.genericChange",
      "value": "Data simpanan diubah"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Jumlah item diperbarui"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Level senjata diperbarui"
    },
    {
      "key": "revision.itemAdded",
      "value": "Item inventaris ditambahkan"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Perlengkapan ditambahkan langsung"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Permata atau Rune ditambahkan langsung"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Item inventaris diganti"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Permata atau Rune diperbarui"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Permata atau Rune dikonversi"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Bentuk slot perlengkapan diperbarui"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Isi slot perlengkapan diperbarui"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Statistik karakter diperbarui"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Data karakter diperbarui"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Kemajuan bos diperbarui"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Flag simpanan lanjutan diterapkan"
    },
    {
      "key": "revision.undo",
      "value": "Batalkan"
    },
    {
      "key": "revision.redo",
      "value": "Ulangi"
    },
    {
      "key": "revision.close",
      "value": "Tutup log perubahan"
    },
    {
      "key": "revision.empty",
      "value": "Belum ada perubahan di memori."
    },
    {
      "key": "revision.notice",
      "value": "Menyimpan hanya menulis revisi saat ini. Pertahankan cadangan .bak otomatis sampai simpanan diverifikasi di dalam game."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Perubahan sejak checkpoint file terakhir"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} nilai statistik diubah"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Nama karakter diubah"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Waktu bermain diubah"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posisi atau tujuan diubah"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Kemajuan bos diubah"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} catatan item inventaris ditambahkan atau dihapus"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} catatan Permata atau Rune ditambahkan atau dihapus"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Cari inventaris"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nama, tipe, efek…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Bersihkan"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Hanya favorit"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Tambahkan ke favorit"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Hapus dari favorit"
    },
    {
      "key": "forge.duplicate",
      "value": "Gandakan"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Membuat salinan bernama “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Impor JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Ekspor JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Impor preset Forge"
    },
    {
      "key": "forge.exportTitle",
      "value": "Ekspor preset Forge"
    },
    {
      "key": "forge.importedStatus",
      "value": "Diimpor {{count}} preset baru."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Perpustakaan preset berhasil diekspor."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Operasi perpustakaan preset tidak dapat diselesaikan."
    }
  ],
  "da": [
    {
      "key": "preferences.compact",
      "value": "Kompakt visning"
    },
    {
      "key": "preferences.comfortable",
      "value": "Komfortabel visning"
    },
    {
      "key": "revision.controls",
      "value": "Ændringskontroller"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokal gennemgang"
    },
    {
      "key": "revision.title",
      "value": "Ændringslog"
    },
    {
      "key": "revision.description",
      "value": "Gennemgå ændringer i hukommelsen før gemning. Fortryd og gentag skriver aldrig automatisk til filen."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} ændringer"
    },
    {
      "key": "revision.genericChange",
      "value": "Redigerede gemmedata"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Opdateret vareantal"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Opdateret våbenniveau"
    },
    {
      "key": "revision.itemAdded",
      "value": "Tilføjede en genstand til inventaret"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Tilføjede udstyr direkte"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Tilføjede en Gem eller Rune direkte"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Udskiftede en genstand i inventaret"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Opdaterede en Gem eller Rune"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Konverterede en Gem eller Rune"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Opdaterede udstyrspladsens form"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Opdaterede indholdet i udstyrspladsen"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Opdaterede karakterstatistikker"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Opdaterede karakterdata"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Opdaterede boss-fremgang"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Anvendt et avanceret gemmeflag"
    },
    {
      "key": "revision.undo",
      "value": "Fortryd"
    },
    {
      "key": "revision.redo",
      "value": "Gentag"
    },
    {
      "key": "revision.close",
      "value": "Luk ændringsloggen"
    },
    {
      "key": "revision.empty",
      "value": "Ingen ændringer i hukommelsen er registreret endnu."
    },
    {
      "key": "revision.notice",
      "value": "Gemning skriver kun den aktuelle revision. Behold den automatiske .bak-backup indtil gemmet er verificeret i spillet."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Ændringer siden sidste fil-checkpoint"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} statistikværdi(er) ændret"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Karakternavn ændret"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Spilletid ændret"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Position eller destination ændret"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Boss-fremgang ændret"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} inventarpost(er) tilføjet eller fjernet"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} Gem- eller Runepost(er) tilføjet eller fjernet"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Søg i inventar"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Navn, type, effekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Ryd"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Kun favoritter"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Tilføj til favoritter"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Fjern fra favoritter"
    },
    {
      "key": "forge.duplicate",
      "value": "Dupliker"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Oprettede en kopi med navnet “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importer JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Eksporter JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importer Forge-forudindstillinger"
    },
    {
      "key": "forge.exportTitle",
      "value": "Eksporter Forge-forudindstillinger"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importerede {{count}} nye forudindstilling(er)."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Forudindstillingsbiblioteket blev eksporteret med succes."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Operationen for forudindstillingsbiblioteket kunne ikke gennemføres."
    }
  ],
  "fi": [
    {
      "key": "preferences.compact",
      "value": "Tiivis näkymä"
    },
    {
      "key": "preferences.comfortable",
      "value": "Mukava näkymä"
    },
    {
      "key": "revision.controls",
      "value": "Muutosten hallinta"
    },
    {
      "key": "revision.eyebrow",
      "value": "Paikallinen tarkastus"
    },
    {
      "key": "revision.title",
      "value": "Muutosloki"
    },
    {
      "key": "revision.description",
      "value": "Tarkista muistissa olevat muutokset ennen tallennusta. Kumoa- ja tee uudelleen -toiminnot eivät koskaan kirjoita tiedostoa automaattisesti."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} muutosta"
    },
    {
      "key": "revision.genericChange",
      "value": "Tallennustietoja muokattu"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Esineen määrä päivitetty"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Aseen taso päivitetty"
    },
    {
      "key": "revision.itemAdded",
      "value": "Lisätty inventaarioesine"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Lisätty varuste suoraan"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Lisätty jalokivi tai riimu suoraan"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Korvattu inventaarioesine"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Päivitetty jalokivi tai riimu"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Muunnettu jalokivi tai riimu"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Varustepaikan muoto päivitetty"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Varustepaikan sisältö päivitetty"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Päivitetty hahmon tilastot"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Päivitetty hahmon tiedot"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Pomon eteneminen päivitetty"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Sovellettu edistynyt tallennuslippu"
    },
    {
      "key": "revision.undo",
      "value": "Kumoa"
    },
    {
      "key": "revision.redo",
      "value": "Tee uudelleen"
    },
    {
      "key": "revision.close",
      "value": "Sulje muutosloki"
    },
    {
      "key": "revision.empty",
      "value": "Muistimuutoksia ei ole vielä kirjattu."
    },
    {
      "key": "revision.notice",
      "value": "Tallennus kirjoittaa vain nykyisen revision. Säilytä automaattinen .bak-varmuuskopio, kunnes tallennus on varmennettu pelissä."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Muutokset viimeisestä tallennuspisteestä"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} tilastoa muutettu"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Hahmon nimi muutettu"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Peliaika muutettu"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Sijainti tai kohde muutettu"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Pomon eteneminen muutettu"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} inventaarioesinettä lisätty tai poistettu"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} jalokiveä tai riimua lisätty tai poistettu"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Hae inventaariosta"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Nimi, tyyppi, vaikutus…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Tyhjennä"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Vain suosikit"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Lisää suosikkeihin"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Poista suosikeista"
    },
    {
      "key": "forge.duplicate",
      "value": "Kopioi"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Luotu kopio nimeltä “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Tuo JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Vie JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Tuo Forge-esiasetukset"
    },
    {
      "key": "forge.exportTitle",
      "value": "Vie Forge-esiasetukset"
    },
    {
      "key": "forge.importedStatus",
      "value": "Tuotu {{count}} uutta esiasetusta."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Esiasetuskirjasto viety onnistuneesti."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Esiasetuskirjaston toimintoa ei voitu suorittaa."
    }
  ],
  "hu": [
    {
      "key": "preferences.compact",
      "value": "Kompakt nézet"
    },
    {
      "key": "preferences.comfortable",
      "value": "Kényelmes nézet"
    },
    {
      "key": "revision.controls",
      "value": "Változtatások kezelése"
    },
    {
      "key": "revision.eyebrow",
      "value": "Helyi ellenőrzés"
    },
    {
      "key": "revision.title",
      "value": "Változásnapló"
    },
    {
      "key": "revision.description",
      "value": "Ellenőrizze a memóriában lévő módosításokat mentés előtt. A visszavonás és visszaállítás soha nem írja automatikusan a fájlt."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} módosítás"
    },
    {
      "key": "revision.genericChange",
      "value": "Mentés adatai módosítva"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Tárgy mennyisége frissítve"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Fegyver szintje frissítve"
    },
    {
      "key": "revision.itemAdded",
      "value": "Tárgy hozzáadva a készlethez"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Felszerelés közvetlenül hozzáadva"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Drágakő vagy rúna közvetlenül hozzáadva"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Készletbeli tárgy kicserélve"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Drágakő vagy rúna frissítve"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Drágakő vagy rúna átalakítva"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Felszerelési foglalat alakja frissítve"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Felszerelési foglalat tartalma frissítve"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Karakter statisztikái frissítve"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Karakter adatai frissítve"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Főnök előrehaladása frissítve"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Fejlett mentés zászló alkalmazva"
    },
    {
      "key": "revision.undo",
      "value": "Visszavonás"
    },
    {
      "key": "revision.redo",
      "value": "Visszaállítás"
    },
    {
      "key": "revision.close",
      "value": "Változásnapló bezárása"
    },
    {
      "key": "revision.empty",
      "value": "A memóriában még nincs rögzített módosítás."
    },
    {
      "key": "revision.notice",
      "value": "A mentés csak az aktuális revíziót írja. Tartsa meg az automatikus .bak mentést, amíg a mentés nincs ellenőrizve a játékban."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Változások az utolsó fájl-ellenőrzőpont óta"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} statisztikai érték módosult"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Karakter neve megváltozott"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Játékidő megváltozott"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Pozíció/cél megváltozott"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Főnökök előrehaladása megváltozott"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} készletbeli tárgyrekord hozzáadva vagy eltávolítva"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} drágakő vagy rúna rekord hozzáadva vagy eltávolítva"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Készlet keresése"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Név, típus, hatás…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Törlés"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Csak kedvencek"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Hozzáadás a kedvencekhez"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Eltávolítás a kedvencekből"
    },
    {
      "key": "forge.duplicate",
      "value": "Duplikálás"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Létrehozva egy „{{name}}” nevű másolat."
    },
    {
      "key": "forge.importPresets",
      "value": "JSON importálása"
    },
    {
      "key": "forge.exportPresets",
      "value": "JSON exportálása"
    },
    {
      "key": "forge.importTitle",
      "value": "Forge előbeállítások importálása"
    },
    {
      "key": "forge.exportTitle",
      "value": "Forge előbeállítások exportálása"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importálva {{count}} új előbeállítás."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Előbeállítások könyvtára sikeresen exportálva."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Az előbeállítás-könyvtár műveletét nem sikerült végrehajtani."
    }
  ],
  "nb": [
    {
      "key": "preferences.compact",
      "value": "Kompakt visning"
    },
    {
      "key": "preferences.comfortable",
      "value": "Komfortabel visning"
    },
    {
      "key": "revision.controls",
      "value": "Revisjonskontroller"
    },
    {
      "key": "revision.eyebrow",
      "value": "Lokal gjennomgang"
    },
    {
      "key": "revision.title",
      "value": "Endringslogg"
    },
    {
      "key": "revision.description",
      "value": "Gå gjennom endringer i minnet før lagring. Angre og gjør om skriver aldri til filen automatisk."
    },
    {
      "key": "revision.changes",
      "value": "{{count}} endringer"
    },
    {
      "key": "revision.genericChange",
      "value": "Redigert lagringsdata"
    },
    {
      "key": "revision.quantityChanged",
      "value": "Oppdatert gjenstandsantall"
    },
    {
      "key": "revision.weaponLevelChanged",
      "value": "Oppdatert våpennivå"
    },
    {
      "key": "revision.itemAdded",
      "value": "Lagt til gjenstand i inventar"
    },
    {
      "key": "revision.equipmentAdded",
      "value": "Lagt til utstyr direkte"
    },
    {
      "key": "revision.upgradeAdded",
      "value": "Lagt til Gem eller Rune direkte"
    },
    {
      "key": "revision.itemReplaced",
      "value": "Erstattet gjenstand i inventar"
    },
    {
      "key": "revision.upgradeEdited",
      "value": "Oppdatert Gem eller Rune"
    },
    {
      "key": "revision.upgradeConverted",
      "value": "Konvertert Gem eller Rune"
    },
    {
      "key": "revision.slotShapeChanged",
      "value": "Oppdatert utstyrsplassens form"
    },
    {
      "key": "revision.slotGemChanged",
      "value": "Oppdatert innhold i utstyrsplass"
    },
    {
      "key": "revision.statsUpdated",
      "value": "Oppdatert karakterstatistikk"
    },
    {
      "key": "revision.characterUpdated",
      "value": "Oppdatert karakterdata"
    },
    {
      "key": "revision.bossUpdated",
      "value": "Oppdatert bossframgang"
    },
    {
      "key": "revision.flagUpdated",
      "value": "Brukt avansert lagringsflagg"
    },
    {
      "key": "revision.undo",
      "value": "Angre"
    },
    {
      "key": "revision.redo",
      "value": "Gjør om"
    },
    {
      "key": "revision.close",
      "value": "Lukk endringslogg"
    },
    {
      "key": "revision.empty",
      "value": "Ingen endringer i minnet er registrert ennå."
    },
    {
      "key": "revision.notice",
      "value": "Lagring skriver kun den gjeldende revisjonen. Behold den automatiske .bak-sikkerhetskopien til lagringen er bekreftet i spillet."
    },
    {
      "key": "revision.summaryTitle",
      "value": "Endringer siden siste fil-sjekkpunkt"
    },
    {
      "key": "revision.summaryStats",
      "value": "{{count}} statistikkverdi(er) endret"
    },
    {
      "key": "revision.summaryUsername",
      "value": "Karakternavn endret"
    },
    {
      "key": "revision.summaryPlaytime",
      "value": "Spilletid endret"
    },
    {
      "key": "revision.summaryPosition",
      "value": "Posisjon eller destinasjon endret"
    },
    {
      "key": "revision.summaryBosses",
      "value": "Bossframgang endret"
    },
    {
      "key": "revision.summaryItems",
      "value": "{{count}} inventarpost(er) lagt til eller fjernet"
    },
    {
      "key": "revision.summaryUpgrades",
      "value": "{{count}} Gem eller Rune-oppføring(er) lagt til eller fjernet"
    },
    {
      "key": "inventory.searchInventory",
      "value": "Søk i inventaret"
    },
    {
      "key": "inventory.searchPlaceholder",
      "value": "Navn, type, effekt…"
    },
    {
      "key": "inventory.clearSearch",
      "value": "Tøm"
    },
    {
      "key": "inventory.favoritesOnly",
      "value": "Kun favoritter"
    },
    {
      "key": "inventory.addFavorite",
      "value": "Legg til i favoritter"
    },
    {
      "key": "inventory.removeFavorite",
      "value": "Fjern fra favoritter"
    },
    {
      "key": "forge.duplicate",
      "value": "Dupliser"
    },
    {
      "key": "forge.duplicateCreated",
      "value": "Opprettet en kopi kalt “{{name}}”."
    },
    {
      "key": "forge.importPresets",
      "value": "Importer JSON"
    },
    {
      "key": "forge.exportPresets",
      "value": "Eksporter JSON"
    },
    {
      "key": "forge.importTitle",
      "value": "Importer Forge-forhåndsinnstillinger"
    },
    {
      "key": "forge.exportTitle",
      "value": "Eksporter Forge-forhåndsinnstillinger"
    },
    {
      "key": "forge.importedStatus",
      "value": "Importerte {{count}} nye forhåndsinnstilling(er)."
    },
    {
      "key": "forge.exportedStatus",
      "value": "Forhåndsinnstillingsbibliotek eksportert."
    },
    {
      "key": "forge.libraryFailed",
      "value": "Operasjonen for forhåndsinnstillingsbiblioteket kunne ikke fullføres."
    }
  ]
};

Object.entries(v020FeatureTranslatedOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  translations.forEach(({ key, value }) => applyTranslationPath(translatedResource, key, value));
  resources[language] = translatedResource;
});

const v021RuneOriginEffectOverrides = {
  fr: "Effet d'origine rune",
  es: "Efecto de origen rúnico",
  "pt-PT": "Efeito de origem rúnica",
  "pt-BR": "Efeito de origem rúnica",
  ru: "Эффект рунического происхождения",
  de: "Effekt: Runenursprung",
  it: "Effetto di origine runica",
  nl: "Effect van rune-oorsprong",
  pl: "Efekt pochodzenia runicznego",
  tr: "Rün kaynaklı etki",
  uk: "Ефект рунічного походження",
  ja: "ルーン由来の効果",
  ko: "룬 유래 효과",
  "zh-CN": "符文来源效果",
  sv: "Effekt från runor",
  cs: "Efekt runového původu",
  ro: "Efect de origine runică",
  el: "Εφέ προέλευσης ρούνας",
  id: "Efek asal rune",
  da: "Runeoprindelseseffekt",
  fi: "Ruunaperäinen tehoste",
  hu: "Rúna eredetű hatás",
  nb: "Runeopprinnelseseffekt",
};

Object.entries(v021RuneOriginEffectOverrides).forEach(([language, value]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  applyTranslationPath(translatedResource, "inventory.runeOriginEffect", value);
  resources[language] = translatedResource;
});

const v021CharacterUiTranslatedOverrides = {
  "fr": {
    "exportFace": "Exporter le visage",
    "importFace": "Importer le visage",
    "saveFaceFile": "Enregistrer le fichier visage",
    "selectFaceFile": "Sélectionner un fichier visage",
    "faceExported": "Visage exporté avec succès.",
    "faceImported": "Visage importé avec succès.",
    "faceActionFailed": "L'action sur le visage n'a pas pu être effectuée.",
    "iszStatus": "Statut Isz :",
    "fixIsz": "Corriger Isz",
    "iszFixed": "Le statut d'Isz a été mis à jour.",
    "iszFixFailed": "Impossible de mettre à jour le statut d'Isz."
  },
  "es": {
    "exportFace": "Exportar rostro",
    "importFace": "Importar rostro",
    "saveFaceFile": "Guardar archivo de rostro",
    "selectFaceFile": "Seleccionar un archivo de rostro",
    "faceExported": "Rostro exportado correctamente.",
    "faceImported": "Rostro importado correctamente.",
    "faceActionFailed": "No se pudo completar la acción con el rostro.",
    "iszStatus": "Estado de Isz:",
    "fixIsz": "Reparar Isz",
    "iszFixed": "El estado de Isz se actualizó.",
    "iszFixFailed": "No se pudo actualizar el estado de Isz."
  },
  "pt-PT": {
    "exportFace": "Exportar rosto",
    "importFace": "Importar rosto",
    "saveFaceFile": "Guardar ficheiro de rosto",
    "selectFaceFile": "Selecionar um ficheiro de rosto",
    "faceExported": "Rosto exportado com sucesso.",
    "faceImported": "Rosto importado com sucesso.",
    "faceActionFailed": "Não foi possível concluir a ação no rosto.",
    "iszStatus": "Estado de Isz:",
    "fixIsz": "Corrigir Isz",
    "iszFixed": "Estado de Isz atualizado.",
    "iszFixFailed": "Não foi possível atualizar o estado de Isz."
  },
  "pt-BR": {
    "exportFace": "Exportar rosto",
    "importFace": "Importar rosto",
    "saveFaceFile": "Salvar arquivo de rosto",
    "selectFaceFile": "Selecionar um arquivo de rosto",
    "faceExported": "Rosto exportado com sucesso.",
    "faceImported": "Rosto importado com sucesso.",
    "faceActionFailed": "A ação no rosto não pôde ser concluída.",
    "iszStatus": "Status de Isz:",
    "fixIsz": "Corrigir Isz",
    "iszFixed": "Estado de Isz atualizado.",
    "iszFixFailed": "Não foi possível atualizar o estado de Isz."
  },
  "ru": {
    "exportFace": "Экспорт лица",
    "importFace": "Импорт лица",
    "saveFaceFile": "Сохранить файл лица",
    "selectFaceFile": "Выбрать файл лица",
    "faceExported": "Лицо успешно экспортировано.",
    "faceImported": "Лицо успешно импортировано.",
    "faceActionFailed": "Действие с лицом не удалось.",
    "iszStatus": "Isz статус:",
    "fixIsz": "Исправить Isz",
    "iszFixed": "Статус Isz обновлён.",
    "iszFixFailed": "Не удалось обновить статус Isz."
  },
  "de": {
    "exportFace": "Gesicht exportieren",
    "importFace": "Gesicht importieren",
    "saveFaceFile": "Gesichtsdatei speichern",
    "selectFaceFile": "Gesichtsdatei auswählen",
    "faceExported": "Gesicht erfolgreich exportiert.",
    "faceImported": "Gesicht erfolgreich importiert.",
    "faceActionFailed": "Die Aktion für das Gesicht konnte nicht abgeschlossen werden.",
    "iszStatus": "Isz-Status:",
    "fixIsz": "Isz beheben",
    "iszFixed": "Isz-Status wurde aktualisiert.",
    "iszFixFailed": "Isz-Status konnte nicht aktualisiert werden."
  },
  "it": {
    "exportFace": "Esporta volto",
    "importFace": "Importa volto",
    "saveFaceFile": "Salva file volto",
    "selectFaceFile": "Seleziona un file volto",
    "faceExported": "Volto esportato con successo.",
    "faceImported": "Volto importato con successo.",
    "faceActionFailed": "Impossibile completare l'azione sul volto.",
    "iszStatus": "Stato di Isz:",
    "fixIsz": "Ripara Isz",
    "iszFixed": "Lo stato di Isz è stato aggiornato.",
    "iszFixFailed": "Impossibile aggiornare lo stato di Isz."
  },
  "nl": {
    "exportFace": "Exporteer gezicht",
    "importFace": "Importeer gezicht",
    "saveFaceFile": "Gezichtsbestand opslaan",
    "selectFaceFile": "Selecteer een gezichtsbestand",
    "faceExported": "Gezicht succesvol geëxporteerd.",
    "faceImported": "Gezicht succesvol geïmporteerd.",
    "faceActionFailed": "De bewerking voor het gezicht kon niet worden voltooid.",
    "iszStatus": "Isz-status:",
    "fixIsz": "Isz repareren",
    "iszFixed": "Isz-status is bijgewerkt.",
    "iszFixFailed": "Isz-status kon niet worden bijgewerkt."
  },
  "pl": {
    "exportFace": "Eksportuj twarz",
    "importFace": "Importuj twarz",
    "saveFaceFile": "Zapisz plik twarzy",
    "selectFaceFile": "Wybierz plik twarzy",
    "faceExported": "Twarz została pomyślnie wyeksportowana.",
    "faceImported": "Twarz została pomyślnie zaimportowana.",
    "faceActionFailed": "Nie można ukończyć operacji na twarzy.",
    "iszStatus": "Status Isz:",
    "fixIsz": "Napraw Isz",
    "iszFixed": "Status Isz został zaktualizowany.",
    "iszFixFailed": "Nie można zaktualizować statusu Isz."
  },
  "tr": {
    "exportFace": "Yüzü dışa aktar",
    "importFace": "Yüzü içe aktar",
    "saveFaceFile": "Yüz dosyasını kaydet",
    "selectFaceFile": "Bir yüz dosyası seç",
    "faceExported": "Yüz başarıyla dışa aktarıldı.",
    "faceImported": "Yüz başarıyla içe aktarıldı.",
    "faceActionFailed": "Yüz işlemi tamamlanamadı.",
    "iszStatus": "Isz durumu:",
    "fixIsz": "Isz'i düzelt",
    "iszFixed": "Isz durumu güncellendi.",
    "iszFixFailed": "Isz durumu güncellenemedi."
  },
  "uk": {
    "exportFace": "Експортувати обличчя",
    "importFace": "Імпортувати обличчя",
    "saveFaceFile": "Зберегти файл обличчя",
    "selectFaceFile": "Вибрати файл обличчя",
    "faceExported": "Обличчя успішно експортовано.",
    "faceImported": "Обличчя успішно імпортовано.",
    "faceActionFailed": "Не вдалося виконати дію з обличчям.",
    "iszStatus": "Isz статус:",
    "fixIsz": "Виправити Isz",
    "iszFixed": "Статус Isz оновлено.",
    "iszFixFailed": "Не вдалося оновити статус Isz."
  },
  "ja": {
    "exportFace": "顔をエクスポート",
    "importFace": "顔をインポート",
    "saveFaceFile": "顔ファイルを保存",
    "selectFaceFile": "顔ファイルを選択",
    "faceExported": "顔を正常にエクスポートしました。",
    "faceImported": "顔を正常にインポートしました。",
    "faceActionFailed": "顔の操作を完了できませんでした。",
    "iszStatus": "Iszステータス:",
    "fixIsz": "Iszを修正",
    "iszFixed": "Iszステータスが更新されました。",
    "iszFixFailed": "Iszステータスを更新できませんでした。"
  },
  "ko": {
    "exportFace": "얼굴 내보내기",
    "importFace": "얼굴 가져오기",
    "saveFaceFile": "얼굴 파일 저장",
    "selectFaceFile": "얼굴 파일 선택",
    "faceExported": "얼굴이 성공적으로 내보내졌습니다.",
    "faceImported": "얼굴이 성공적으로 가져와졌습니다.",
    "faceActionFailed": "얼굴 작업을 완료할 수 없습니다.",
    "iszStatus": "Isz 상태:",
    "fixIsz": "Isz 수정",
    "iszFixed": "Isz 상태가 업데이트되었습니다.",
    "iszFixFailed": "Isz 상태를 업데이트할 수 없습니다."
  },
  "zh-CN": {
    "exportFace": "导出人脸",
    "importFace": "导入人脸",
    "saveFaceFile": "保存人脸文件",
    "selectFaceFile": "选择人脸文件",
    "faceExported": "人脸导出成功。",
    "faceImported": "人脸导入成功。",
    "faceActionFailed": "无法完成该人脸操作。",
    "iszStatus": "Isz 状态:",
    "fixIsz": "修复 Isz",
    "iszFixed": "Isz 状态已更新。",
    "iszFixFailed": "无法更新 Isz 状态。"
  },
  "sv": {
    "exportFace": "Exportera ansikte",
    "importFace": "Importera ansikte",
    "saveFaceFile": "Spara ansiktsfil",
    "selectFaceFile": "Välj en ansiktsfil",
    "faceExported": "Ansikte exporterades.",
    "faceImported": "Ansikte importerades.",
    "faceActionFailed": "Åtgärden för ansiktet kunde inte slutföras.",
    "iszStatus": "Isz-status:",
    "fixIsz": "Åtgärda Isz",
    "iszFixed": "Isz-status uppdaterad.",
    "iszFixFailed": "Kunde inte uppdatera Isz-status."
  },
  "cs": {
    "exportFace": "Exportovat tvář",
    "importFace": "Importovat tvář",
    "saveFaceFile": "Uložit soubor tváře",
    "selectFaceFile": "Vybrat soubor tváře",
    "faceExported": "Tvář úspěšně exportována.",
    "faceImported": "Tvář úspěšně importována.",
    "faceActionFailed": "Akci s tváří nelze dokončit.",
    "iszStatus": "Stav Isz:",
    "fixIsz": "Opravit Isz",
    "iszFixed": "Stav Isz byl aktualizován.",
    "iszFixFailed": "Stav Isz nelze aktualizovat."
  },
  "ro": {
    "exportFace": "Exportă față",
    "importFace": "Importă față",
    "saveFaceFile": "Salvează fișierul feței",
    "selectFaceFile": "Selectează un fișier al feței",
    "faceExported": "Fața a fost exportată cu succes.",
    "faceImported": "Fața a fost importată cu succes.",
    "faceActionFailed": "Acțiunea pe față nu a putut fi finalizată.",
    "iszStatus": "Stare Isz:",
    "fixIsz": "Repară Isz",
    "iszFixed": "Starea Isz a fost actualizată.",
    "iszFixFailed": "Starea Isz nu a putut fi actualizată."
  },
  "el": {
    "exportFace": "Εξαγωγή προσώπου",
    "importFace": "Εισαγωγή προσώπου",
    "saveFaceFile": "Αποθήκευση αρχείου προσώπου",
    "selectFaceFile": "Επιλέξτε αρχείο προσώπου",
    "faceExported": "Το πρόσωπο εξήχθη με επιτυχία.",
    "faceImported": "Το πρόσωπο εισήχθη με επιτυχία.",
    "faceActionFailed": "Η ενέργεια για το πρόσωπο δεν ολοκληρώθηκε.",
    "iszStatus": "Κατάσταση Isz:",
    "fixIsz": "Διόρθωση Isz",
    "iszFixed": "Η κατάσταση του Isz ενημερώθηκε.",
    "iszFixFailed": "Δεν ήταν δυνατή η ενημέρωση της κατάστασης του Isz."
  },
  "id": {
    "exportFace": "Ekspor wajah",
    "importFace": "Impor wajah",
    "saveFaceFile": "Simpan berkas wajah",
    "selectFaceFile": "Pilih berkas wajah",
    "faceExported": "Wajah berhasil diekspor.",
    "faceImported": "Wajah berhasil diimpor.",
    "faceActionFailed": "Tindakan pada wajah tidak dapat diselesaikan.",
    "iszStatus": "Status Isz:",
    "fixIsz": "Perbaiki Isz",
    "iszFixed": "Status Isz diperbarui.",
    "iszFixFailed": "Status Isz tidak dapat diperbarui."
  },
  "da": {
    "exportFace": "Eksporter ansigt",
    "importFace": "Importer ansigt",
    "saveFaceFile": "Gem ansigtsfil",
    "selectFaceFile": "Vælg en ansigtsfil",
    "faceExported": "Ansigt eksporteret.",
    "faceImported": "Ansigt importeret.",
    "faceActionFailed": "Handlingen for ansigtet kunne ikke gennemføres.",
    "iszStatus": "Isz-status:",
    "fixIsz": "Ret Isz",
    "iszFixed": "Isz-status blev opdateret.",
    "iszFixFailed": "Isz-status kunne ikke opdateres."
  },
  "fi": {
    "exportFace": "Vie kasvot",
    "importFace": "Tuo kasvot",
    "saveFaceFile": "Tallenna kasvotiedosto",
    "selectFaceFile": "Valitse kasvotiedosto",
    "faceExported": "Kasvot viety onnistuneesti.",
    "faceImported": "Kasvot tuotu onnistuneesti.",
    "faceActionFailed": "Kasvotoimintoa ei voitu suorittaa.",
    "iszStatus": "Isz tila:",
    "fixIsz": "Korjaa Isz",
    "iszFixed": "Isz-tila päivitettiin.",
    "iszFixFailed": "Iszin tilaa ei voitu päivittää."
  },
  "hu": {
    "exportFace": "Arc exportálása",
    "importFace": "Arc importálása",
    "saveFaceFile": "Arcfájl mentése",
    "selectFaceFile": "Válasszon arcfájlt",
    "faceExported": "Arc sikeresen exportálva.",
    "faceImported": "Arc sikeresen importálva.",
    "faceActionFailed": "Nem sikerült végrehajtani az arc műveletet.",
    "iszStatus": "Isz állapota:",
    "fixIsz": "Isz javítása",
    "iszFixed": "Isz állapota frissítve.",
    "iszFixFailed": "Nem sikerült frissíteni az Isz állapotát."
  },
  "nb": {
    "exportFace": "Eksporter ansikt",
    "importFace": "Importer ansikt",
    "saveFaceFile": "Lagre ansiktsfil",
    "selectFaceFile": "Velg en ansiktsfil",
    "faceExported": "Ansikt eksportert.",
    "faceImported": "Ansikt importert.",
    "faceActionFailed": "Handling for ansiktet kunne ikke fullføres.",
    "iszStatus": "Isz-status:",
    "fixIsz": "Fiks Isz",
    "iszFixed": "Isz-status ble oppdatert.",
    "iszFixFailed": "Kunne ikke oppdatere Isz-status."
  }
};


Object.entries(v021CharacterUiTranslatedOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  Object.entries(translations).forEach(([key, value]) => {
    applyTranslationPath(translatedResource, `characterForm.${key}`, value);
  });
  resources[language] = translatedResource;
});


// Final localization completeness pass: replace the remaining English fallbacks
// detected in active UI resources without changing keys or fallback behavior.
const finalI18nAuditOverrides = {
  "cs": {
    "characterForm.teleport": "Teleport:",
    "forge.builtIn.arcane-surge.name": "Arkanový nápor",
    "forge.builtIn.bloodtinge-hunter.name": "Lovec Bloodtinge",
    "forge.builtIn.blunt-breaker.name": "Lámač tupých",
    "forge.builtIn.bolt-surge.name": "Bleskový nápor",
    "forge.builtIn.elemental-ascendant.name": "Elementální vzestup",
    "forge.builtIn.endless-hunt.name": "Nekonečné lovení",
    "forge.builtIn.flame-surge.name": "Plamenný nápor",
    "forge.builtIn.forged-endurance.name": "Kovaná výdrž",
    "forge.builtIn.glass-cannon.name": "Skleněné dělo",
    "forge.builtIn.last-stand.name": "Poslední odpor",
    "forge.builtIn.sustained-hunt.name": "Vytrvalé lovení",
    "forge.builtIn.thrust-specialist.name": "Specialista na bodné"
  },
  "da": {
    "characterForm.teleport": "Teleport:",
    "forge.builtIn.abyssal-vitality.name": "Afgrundens vitalitet +75",
    "forge.gemForge": "Ædelstenssmedje",
    "forge.runeForge": "Runesmedje",
    "inventory.gems": "Ædelstene",
    "update.version": "Version {{version}}"
  },
  "de": {
    "characterForm.name": "Name:",
    "characterForm.teleport": "Teleportieren:",
    "forge.builtIn.bloodtinge-hunter.name": "Bloodtinge‑Jäger",
    "forge.builtIn.last-stand.name": "Letzter Widerstand",
    "sidebar.flags": "Flaggen",
    "update.version": "Version {{version}}"
  },
  "el": {
    "forge.builtIn.bloodtinge-hunter.name": "Κυνηγός Bloodtinge"
  },
  "es": {
    "forge.categories.Elemental": "Elemental",
    "forge.categories.Experimental": "Experimental",
    "forge.categories.Personal": "Personal",
    "forge.personal": "Personal",
    "forge.presets": "Preajustes"
  },
  "fi": {
    "forge.builtIn.abyssal-vitality.name": "Abyssaalinen elinvoima +75",
    "forge.gemForge": "Jalokiviverstas",
    "forge.runeForge": "Riimuverstas"
  },
  "fr": {
    "update.version": "Version {{version}}"
  },
  "hu": {
    "forge.gemForge": "Drágakőműhely",
    "forge.runeForge": "Rúnaműhely"
  },
  "id": {
    "characterForm.teleport": "Teleportasi:",
    "forge.builtIn.bloodtinge-hunter.name": "Pemburu Bloodtinge",
    "forge.categories.Elemental": "Elemental",
    "inventory.catalogArmors": "Baju Besi",
    "inventory.item": "Barang",
    "inventory.type.chalice": "cawan",
    "inventory.type.item": "Barang",
    "inventory.type.key": "kunci"
  },
  "ko": {
    "forge.builtIn.bloodtinge-hunter.name": "블러딩티지 헌터"
  },
  "nb": {
    "forge.builtIn.abyssal-vitality.name": "Avgrunnens livskraft +75",
    "forge.builtIn.all-damage-vanguard.name": "Forpost",
    "forge.builtIn.apex-nourishing.name": "Apex nærende",
    "forge.builtIn.apex-physical.name": "Apex fysisk",
    "forge.builtIn.arcane-surge.name": "Arkan bølge",
    "forge.builtIn.bloodtinge-hunter.name": "Bloodtinge‑jeger",
    "forge.builtIn.blunt-breaker.name": "Slagknuser",
    "forge.builtIn.bolt-surge.name": "Lynbølge",
    "forge.builtIn.elemental-ascendant.name": "Elementær oppstigning",
    "forge.builtIn.endless-hunt.name": "Endeløs jakt",
    "forge.builtIn.flame-surge.name": "Flammebølge",
    "forge.builtIn.forged-endurance.name": "Smidd utholdenhet",
    "forge.builtIn.glass-cannon.name": "Glasskanon",
    "forge.builtIn.last-stand.name": "Siste forsvar",
    "forge.builtIn.sustained-hunt.name": "Varig jakt",
    "forge.builtIn.thrust-specialist.name": "Stikkspesialist",
    "forge.categories.Elemental": "Elementær",
    "forge.gemForge": "Perlesmed",
    "forge.presets": "Forhåndsinnstillinger",
    "forge.runeForge": "Runesmed",
    "inventory.gems": "Perler"
  },
  "nl": {
    "forge.effect": "Effect {{index}}",
    "sidebar.flags": "Vlaggen"
  },
  "pl": {
    "characterForm.teleport": "Teleportacja:",
    "forge.builtIn.abyssal-vitality.name": "Witalność Otchłani +75",
    "forge.builtIn.bloodtinge-hunter.name": "Łowca Bloodtinge"
  },
  "pt-BR": {
    "forge.builtIn.bloodtinge-hunter.name": "Caçador de Bloodtinge",
    "forge.categories.Elemental": "Elemental",
    "forge.categories.Experimental": "Experimental",
    "inventory.item": "item",
    "inventory.type.chalice": "cálice",
    "inventory.type.item": "item",
    "inventory.type.key": "chave",
    "sidebar.flags": "Bandeiras"
  },
  "pt-PT": {
    "forge.builtIn.bloodtinge-hunter.name": "Caçador de Bloodtinge",
    "forge.categories.Elemental": "Elemental",
    "forge.categories.Experimental": "Experimental",
    "inventory.item": "item",
    "inventory.type.chalice": "cálice",
    "inventory.type.item": "item",
    "inventory.type.key": "chave",
    "sidebar.flags": "Bandeiras"
  },
  "ro": {
    "forge.builtIn.bloodtinge-hunter.name": "Vânător Bloodtinge",
    "forge.categories.Elemental": "Elemental",
    "forge.categories.Experimental": "Experimental",
    "forge.categories.Personal": "Personal",
    "forge.personal": "Personal",
    "inventory.catalog": "Catalog"
  },
  "ru": {
    "forge.builtIn.bloodtinge-hunter.name": "Охотник Bloodtinge"
  },
  "sv": {
    "forge.builtIn.bloodtinge-hunter.name": "Bloodtingejägare",
    "update.version": "Version {{version}}"
  },
  "tr": {
    "forge.builtIn.abyssal-vitality.name": "Uçurum Canı +75",
    "forge.builtIn.bloodtinge-hunter.name": "Bloodtinge Avcısı",
    "forge.builtIn.glass-cannon.name": "Kırılgan Güç",
    "forge.categories.Elemental": "Elementsel"
  },
  "uk": {
    "forge.builtIn.abyssal-vitality.name": "Життєвість Безодні +75",
    "forge.builtIn.all-damage-vanguard.name": "Авангард",
    "forge.builtIn.apex-nourishing.name": "Пікове живлення",
    "forge.builtIn.apex-physical.name": "Пік фізичної сили",
    "forge.builtIn.arcane-surge.name": "Арканний сплеск",
    "forge.builtIn.bloodtinge-hunter.name": "Мисливець Bloodtinge",
    "forge.builtIn.blunt-breaker.name": "Руйнівник тупих",
    "forge.builtIn.bolt-surge.name": "Блискавичний сплеск",
    "forge.builtIn.elemental-ascendant.name": "Повелитель стихій",
    "forge.builtIn.endless-hunt.name": "Нескінченне полювання",
    "forge.builtIn.flame-surge.name": "Полум'яний сплеск",
    "forge.builtIn.forged-endurance.name": "Кована витривалість",
    "forge.builtIn.glass-cannon.name": "Скляна гармата",
    "forge.builtIn.last-stand.name": "Останній опір",
    "forge.builtIn.sustained-hunt.name": "Тривале полювання",
    "forge.builtIn.thrust-specialist.name": "Спеціаліст із колючих"
  },
  "zh-CN": {
    "forge.builtIn.abyssal-vitality.name": "深渊活力 +75",
    "forge.builtIn.bloodtinge-hunter.name": "血质猎人"
  }
};
Object.entries(finalI18nAuditOverrides).forEach(([language, translations]) => {
  const translatedResource = { ...(resources[language] ?? {}) };
  Object.entries(translations).forEach(([key, value]) => {
    applyTranslationPath(translatedResource, key, value);
  });
  resources[language] = translatedResource;
});
Object.keys(resources).forEach((language) => {
  const flags = flagOverrides[language] ?? {};
  resources[language] = {
    ...(resources[language] ?? {}),
    flags: { ...en.flags, ...flagOverrides.en, ...(resources[language]?.flags ?? {}), ...flags },
    actions: { ...en.actions, ...(resources[language]?.actions ?? {}) },
  };
});

const LocalizationContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

function readStoredLanguage() {
  try {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.some(({ code }) => code === stored) ? stored : "en";
  } catch {
    return "en";
  }
}

function readKey(source, key) {
  return key.split(".").reduce((value, segment) => value?.[segment], source);
}

function interpolate(value, values) {
  return String(value).replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ""));
}

export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = (nextLanguage) => {
    const languageExists = SUPPORTED_LANGUAGES.some(({ code }) => code === nextLanguage);
    setLanguageState(languageExists ? nextLanguage : "en");
  };

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The interface remains usable if persistent storage is unavailable.
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t(key, values = {}) {
      const translated = readKey(resources[language], key);
      const fallback = readKey(en, key);
      return interpolate(translated ?? fallback ?? key, values);
    },
  }), [language]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  return useContext(LocalizationContext);
}

export function getSupportedLanguageLabel(code) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
