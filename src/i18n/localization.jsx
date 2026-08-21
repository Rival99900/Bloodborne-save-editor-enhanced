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
    addDirect: "Add directly",
    addEquipment: "Add equipment",
    gemShape: "Gem shape",
    runeType: "Rune type",
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
      addDirect: "Ajouter directement",
      addEquipment: "Ajouter l’équipement",
      gemShape: "Forme de gemme",
      runeType: "Type de rune",
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
