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
];

const en = {
  language: {
    label: "Language",
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
    nav: { controls: "Ovládání souboru uložené pozice", activeSave: "Aktivní pozice", noSaveLoaded: "Není načtena žádná pozice", openFileToBegin: "Chcete-li začít, otevřete dešifrovaný soubor postavy", openSave: "Otevřít pozici", saveChanges: "Uložit změny" },
    unsaved: { eyebrow: "Neuložené změny", title: "Uložit před zavřením?", description: "Aktuální úpravy nebyly zapsány do souboru uložené pozice. Chcete-li je zachovat, vyberte Uložit změny, nebo je zavřením bez uložení zahoďte.", cancel: "Zrušit", discard: "Zavřít bez uložení", save: "Uložit změny", saving: "Ukládání…" },
    sidebar: { workspace: "Pracovní prostor editoru", characterData: "Data postavy", inventory: "Inventář", inventoryDescription: "Předměty a vybavení", storage: "Úložiště", storageDescription: "Uložené předměty", stats: "Statistiky", statsDescription: "Vlastnosti a ozvěny", character: "Postava", characterDescription: "Identita a pozice", bosses: "Bossové", bossesDescription: "Stav postupu", flags: "Příznaky", flagsDescription: "Pokročilá nastavení", backupTitle: "Nejdřív záloha", backupDescription: "Otevřením pozice se před změnami vytvoří kopie .bak." },
    flags: { eyebrow: "Pokročilá nastavení pozice", title: "Známé příznaky", introduction: "Zde jsou zobrazeny pouze nezávisle zdokumentované vzory bajtů. Neznámé offsety jsou záměrně vynechány, aby byla pozice chráněna před náhodným poškozením.", listLabel: "Známé příznaky pozice", safetyTitle: "Před použitím příznaku", safetyDescription: "Používejte vždy jednu změnu a potom zvolte Uložit změny. Automatickou zálohu ponechte, dokud se postava nenačte normálně." },
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
