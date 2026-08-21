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
    forge: { runePresetPlaceholder: "Sélectionnez un preset de rune" },
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
