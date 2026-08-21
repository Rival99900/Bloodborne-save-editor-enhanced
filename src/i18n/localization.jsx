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
