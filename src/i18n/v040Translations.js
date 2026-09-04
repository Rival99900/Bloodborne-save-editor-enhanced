// New v0.4.0 strings are kept together so their 13-language coverage can be audited.
const strings = {
  fr: {
    capacity: ["Emplacements libres", "Inventaire", "Stockage", "Gemmes", "Runes", "Les gemmes et les runes utilisent la même réserve sûre d’enregistrements."],
    repair: ["Sauvegarde chargée après réparation de l’expansion binaire CRLF.", "Compatibilité Apollo", "Alignement binaire réparé", "Le fichier avait été agrandi par une conversion LF vers CRLF en mode texte. L’éditeur a réparé sa copie en mémoire ; le .bak conserve exactement le fichier original.", "Continuer"],
    bosses: ["Progression de la chasse", "Chronologie des boss", "{{defeated}} / {{total}} vaincus", "Parcours principal", "Optionnel", "DLC"],
    phases: ["Yharnam central", "Faubourg de la Cathédrale et Hemwick", "Bois interdits et Byrgenwerth", "Branches optionnelles", "La lune de sang", "Finale du Rêve du chasseur", "Cauchemar du chasseur"],
    names: ["Bête cléricale", "Père Gascoigne", "Vicaire Amelia", "Émissaire céleste", "Ebrietas, fille du Cosmos", "Monstre affamé", "Ombre de Yharnam", "Rom, l’Araignée stupide", "Sorcière de Hemwick", "Le Ressuscité", "Martyr Logarius", "Sombrebête Paarl", "Amygdala", "Nourrice de Mergo", "Micolash, hôte du Cauchemar", "Gehrman, le premier chasseur", "Présence lunaire", "Ludwig le Maudit", "Échecs vivants", "Lady Maria de la Tour de l’Horloge astrale", "Orphelin de Kos", "Laurence, le premier vicaire"],
    npcNames: ["La Poupée", "Eileen le Corbeau", "Alfred", "Djura", "Arianna", "Adella", "Habitant de la chapelle", "Iosefka", "Gilbert", "Patches l’Araignée", "Valtr", "Simon l’Affligé"],
  },
  it: {
    capacity: ["Slot liberi", "Inventario", "Deposito", "Gemme", "Rune", "Gemme e rune usano la stessa riserva sicura di record."],
    repair: ["Salvataggio caricato dopo la riparazione dell’espansione binaria CRLF.", "Compatibilità Apollo", "Allineamento binario riparato", "Il file era stato espanso da una conversione LF-CRLF in modalità testo. L’editor ne ha riparato la copia in memoria; il .bak conserva il file originale esatto.", "Continua"],
    bosses: ["Avanzamento della caccia", "Cronologia dei boss", "{{defeated}} / {{total}} sconfitti", "Percorso principale", "Opzionale", "DLC"],
    phases: ["Yharnam centrale", "Quartiere della Cattedrale e Hemwick", "Boschi proibiti e Byrgenwerth", "Diramazioni opzionali", "La luna di sangue", "Finale del Sogno del Cacciatore", "Incubo del Cacciatore"],
    names: ["Belva chierica", "Padre Gascoigne", "Vicario Amelia", "Emissario celeste", "Ebrietas, Figlia del Cosmo", "Belva assetata di sangue", "Ombra di Yharnam", "Rom, il Ragno ottuso", "Strega di Hemwick", "Il Rinato", "Martire Logarius", "Bestia oscura Paarl", "Amygdala", "Balia di Mergo", "Micolash, Signore dell’Incubo", "Gehrman, il Primo Cacciatore", "Presenza della Luna", "Ludwig il Dannato", "Fallimenti viventi", "Lady Maria della Torre dell’Orologio astrale", "Orfano di Kos", "Laurence, il Primo Vicario"],
    npcNames: ["La Bambola", "Eileen il Corvo", "Alfred", "Djura", "Arianna", "Adella", "Abitante della cappella", "Iosefka", "Gilbert", "Patches il Ragno", "Valtr", "Simon lo Straziato"],
  },
  de: {
    capacity: ["Freie Plätze", "Inventar", "Lager", "Edelsteine", "Runen", "Edelsteine und Runen verwenden denselben sicheren Datensatzvorrat."],
    repair: ["Speicherstand nach Reparatur der binären CRLF-Erweiterung geladen.", "Apollo-Kompatibilität", "Binärausrichtung repariert", "Die Datei wurde durch eine LF-zu-CRLF-Umwandlung im Textmodus vergrößert. Der Editor hat die Kopie im Arbeitsspeicher repariert; die .bak-Datei bewahrt das exakte Original.", "Weiter"],
    bosses: ["Fortschritt der Jagd", "Boss-Zeitleiste", "{{defeated}} / {{total}} besiegt", "Hauptweg", "Optional", "DLC"],
    phases: ["Zentral-Yharnam", "Kathedralenbezirk und Hemwick", "Verbotener Wald und Byrgenwerth", "Optionale Abzweigungen", "Der Blutmond", "Finale im Traum des Jägers", "Albtraum des Jägers"],
    names: ["Kleriker-Bestie", "Pater Gascoigne", "Vikarin Amelia", "Himmlischer Gesandter", "Ebrietas, Tochter des Kosmos", "Bluthungrige Bestie", "Schatten von Yharnam", "Rom, die geistlose Spinne", "Hexe von Hemwick", "Der Wiedergeborene", "Märtyrer Logarius", "Dunkelbestie Paarl", "Amygdala", "Mergos Amme", "Micolash, Wirt des Albtraums", "Gehrman, der erste Jäger", "Mondpräsenz", "Ludwig, der Verfluchte", "Lebendige Misserfolge", "Lady Maria vom Astralen Uhrturm", "Waise von Kos", "Laurence, der erste Vikar"],
    npcNames: ["Die Puppe", "Eileen die Krähe", "Alfred", "Djura", "Arianna", "Adella", "Kapellenbewohner", "Iosefka", "Gilbert", "Patches die Spinne", "Valtr", "Simon der Gequälte"],
  },
  es: {
    capacity: ["Huecos libres", "Inventario", "Almacén", "Gemas", "Runas", "Las gemas y las runas comparten la misma reserva segura de registros."],
    repair: ["Partida cargada tras reparar la expansión binaria CRLF.", "Compatibilidad con Apollo", "Alineación binaria reparada", "El archivo se había ampliado por una conversión LF a CRLF en modo texto. El editor reparó la copia en memoria; el .bak conserva el archivo original exacto.", "Continuar"],
    bosses: ["Progreso de la cacería", "Cronología de jefes", "{{defeated}} / {{total}} derrotados", "Ruta principal", "Opcional", "DLC"],
    phases: ["Yharnam Central", "Distrito de la Catedral y Hemwick", "Bosque Prohibido y Byrgenwerth", "Rutas opcionales", "La luna de sangre", "Final del Sueño del Cazador", "Pesadilla del Cazador"],
    names: ["Bestia clérigo", "Padre Gascoigne", "Vicaria Amelia", "Emisario celestial", "Ebrietas, Hija del Cosmos", "Bestia sedienta de sangre", "Sombra de Yharnam", "Rom, la Araña Vacua", "Bruja de Hemwick", "El Renacido", "Mártir Logarius", "Bestia oscura Paarl", "Amygdala", "Nodriza de Mergo", "Micolash, huésped de la Pesadilla", "Gehrman, el Primer Cazador", "Presencia lunar", "Ludwig, el Maldito", "Fracasos vivientes", "Lady Maria de la Torre del Reloj Astral", "Huérfano de Kos", "Laurence, el Primer Vicario"],
    npcNames: ["La Muñeca", "Eileen la Cuervo", "Alfred", "Djura", "Arianna", "Adella", "Habitante de la capilla", "Iosefka", "Gilbert", "Patches la Araña", "Valtr", "Simon el Atormentado"],
  },
  nl: {
    capacity: ["Vrije plaatsen", "Inventaris", "Opslag", "Edelstenen", "Runen", "Edelstenen en runen delen dezelfde veilige recordpool."],
    repair: ["Opslag geladen na herstel van binaire CRLF-uitbreiding.", "Apollo-compatibiliteit", "Binaire uitlijning hersteld", "Het bestand was vergroot door een LF-naar-CRLF-conversie in tekstmodus. De editor herstelde de kopie in het geheugen; de .bak bewaart het exacte origineel.", "Doorgaan"],
    bosses: ["Voortgang van de jacht", "Boss-tijdlijn", "{{defeated}} / {{total}} verslagen", "Hoofdroute", "Optioneel", "DLC"],
    phases: ["Centraal Yharnam", "Kathedraalwijk en Hemwick", "Verboden Bos en Byrgenwerth", "Optionele vertakkingen", "De bloedmaan", "Finale in de Jagersdroom", "De Jagersnachtmerrie"],
    names: ["Geestelijke Beest", "Vader Gascoigne", "Vicaris Amelia", "Hemelse Afgezant", "Ebrietas, Dochter van de Kosmos", "Bloeddorstig Beest", "Schaduw van Yharnam", "Rom, de Lege Spin", "Heks van Hemwick", "De Herborene", "Martelaar Logarius", "Donkerbeest Paarl", "Amygdala", "Mergo’s Voedster", "Micolash, Gastheer van de Nachtmerrie", "Gehrman, de Eerste Jager", "Maanpresentie", "Ludwig, de Vervloekte", "Levende Mislukkingen", "Lady Maria van de Astrale Klokkentoren", "Wees van Kos", "Laurence, de Eerste Vicaris"],
    npcNames: ["De Pop", "Eileen de Kraai", "Alfred", "Djura", "Arianna", "Adella", "Kapelbewoner", "Iosefka", "Gilbert", "Patches de Spin", "Valtr", "Simon de Gekwelde"],
  },
  pl: {
    capacity: ["Wolne miejsca", "Ekwipunek", "Magazyn", "Klejnoty", "Runy", "Klejnoty i runy korzystają z tej samej bezpiecznej puli rekordów."],
    repair: ["Zapis wczytano po naprawie binarnego rozszerzenia CRLF.", "Zgodność z Apollo", "Naprawiono wyrównanie binarne", "Plik został powiększony przez konwersję LF na CRLF w trybie tekstowym. Edytor naprawił kopię w pamięci; plik .bak zachowuje dokładny oryginał.", "Kontynuuj"],
    bosses: ["Postęp polowania", "Oś czasu bossów", "Pokonano {{defeated}} / {{total}}", "Główna ścieżka", "Opcjonalny", "DLC"],
    phases: ["Centralne Yharnam", "Okręg Katedralny i Hemwick", "Zakazany Las i Byrgenwerth", "Opcjonalne odgałęzienia", "Krwawy księżyc", "Finał Snu Łowcy", "Koszmar Łowcy"],
    names: ["Bestia Kleryka", "Ojciec Gascoigne", "Wikariusz Amelia", "Niebiański Emisariusz", "Ebrietas, Córka Kosmosu", "Bestia Żądna Krwi", "Cień Yharnam", "Rom, Tępy Pająk", "Wiedźma z Hemwick", "Odrodzony", "Męczennik Logarius", "Mroczna Bestia Paarl", "Amygdala", "Mamka Mergo", "Micolash, Gospodarz Koszmaru", "Gehrman, Pierwszy Łowca", "Obecność Księżyca", "Ludwig Przeklęty", "Żywe Porażki", "Lady Maria z Astralnej Wieży Zegarowej", "Sierota Kos", "Laurence, Pierwszy Wikariusz"],
    npcNames: ["Lalka", "Eileen Wrona", "Alfred", "Djura", "Arianna", "Adella", "Mieszkaniec kaplicy", "Iosefka", "Gilbert", "Patches Pająk", "Valtr", "Simon Udręczony"],
  },
  ru: {
    capacity: ["Свободные места", "Инвентарь", "Хранилище", "Самоцветы", "Руны", "Самоцветы и руны используют один безопасный пул записей."],
    repair: ["Сохранение загружено после исправления двоичного расширения CRLF.", "Совместимость с Apollo", "Двоичное выравнивание исправлено", "Файл был увеличен преобразованием LF в CRLF в текстовом режиме. Редактор исправил копию в памяти; файл .bak сохраняет точный оригинал.", "Продолжить"],
    bosses: ["Ход охоты", "Хронология боссов", "Побеждено: {{defeated}} / {{total}}", "Основной путь", "Необязательный", "DLC"],
    phases: ["Центральный Ярнам", "Соборный округ и Хемвик", "Запретный лес и Бюргенверт", "Необязательные ответвления", "Кровавая луна", "Финал Сна охотника", "Кошмар охотника"],
    names: ["Церковное чудовище", "Отец Гаскойн", "Викарий Амелия", "Небесный посланник", "Ибраитас, Дочь Космоса", "Чудовище-кровоглот", "Тень Ярнама", "Ром, Праздный Паук", "Ведьма Хемвика", "Возродившийся", "Мученик Логариус", "Чёрное чудовище Паарл", "Амигдала", "Кормилица Мерго", "Миколаш, Хозяин Кошмара", "Герман, Первый охотник", "Присутствие луны", "Людвиг Проклятый", "Живые неудачи", "Леди Мария из Астральной часовой башни", "Сирота Кос", "Лоуренс, Первый викарий"],
    npcNames: ["Кукла", "Эйлин Ворон", "Альфред", "Джура", "Арианна", "Аделла", "Обитатель часовни", "Йозефка", "Гилберт", "Лоскутик-паук", "Вальтр", "Саймон Страдалец"],
  },
  da: {
    capacity: ["Ledige pladser", "Inventar", "Lager", "Ædelsten", "Runer", "Ædelsten og runer deler den samme sikre datapulje."],
    repair: ["Gemt spil indlæst efter reparation af binær CRLF-udvidelse.", "Apollo-kompatibilitet", "Binær justering repareret", "Filen var blevet udvidet af en LF-til-CRLF-konvertering i teksttilstand. Editorens kopi i hukommelsen blev repareret; .bak bevarer den nøjagtige original.", "Fortsæt"],
    bosses: ["Jagtens fremskridt", "Boss-tidslinje", "{{defeated}} / {{total}} besejret", "Hovedrute", "Valgfri", "DLC"],
    phases: ["Centrale Yharnam", "Cathedral Ward og Hemwick", "Forbidden Woods og Byrgenwerth", "Valgfrie grene", "Blodmånen", "Finalen i Hunter's Dream", "Hunter's Nightmare"],
    names: ["Klerikalt bæst", "Fader Gascoigne", "Vikar Amelia", "Himmelsk udsending", "Ebrietas, Kosmos' datter", "Blodhungrende bæst", "Yharnams skygge", "Rom, den tomme edderkop", "Heksen fra Hemwick", "Den genfødte", "Martyren Logarius", "Mørkebæst Paarl", "Amygdala", "Mergos amme", "Micolash, mareridtets vært", "Gehrman, den første jæger", "Månens tilstedeværelse", "Ludwig, den forbandede", "Levende fiaskoer", "Lady Maria fra det astrale klokketårn", "Kos' forældreløse", "Laurence, den første vikar"],
    npcNames: ["Dukken", "Eileen Kragen", "Alfred", "Djura", "Arianna", "Adella", "Kapelbeboeren", "Iosefka", "Gilbert", "Patches Edderkoppen", "Valtr", "Simon den Plagede"],
  },
  nb: {
    capacity: ["Ledige plasser", "Inventar", "Lager", "Edelstener", "Runer", "Edelstener og runer deler den samme sikre datapuljen."],
    repair: ["Lagringen ble lastet etter reparasjon av binær CRLF-utvidelse.", "Apollo-kompatibilitet", "Binær justering reparert", "Filen var utvidet av en LF-til-CRLF-konvertering i tekstmodus. Redigereren reparerte kopien i minnet; .bak bevarer den nøyaktige originalen.", "Fortsett"],
    bosses: ["Jaktens fremdrift", "Boss-tidslinje", "{{defeated}} / {{total}} beseiret", "Hovedrute", "Valgfri", "DLC"],
    phases: ["Sentrale Yharnam", "Cathedral Ward og Hemwick", "Forbidden Woods og Byrgenwerth", "Valgfrie grener", "Blodmånen", "Finalen i Hunter's Dream", "Hunter's Nightmare"],
    names: ["Klerikerbeistet", "Fader Gascoigne", "Vikar Amelia", "Himmelsk utsending", "Ebrietas, kosmos' datter", "Blodtørstig beist", "Yharnams skygge", "Rom, den tomme edderkoppen", "Heksen fra Hemwick", "Den gjenfødte", "Martyren Logarius", "Mørkebeistet Paarl", "Amygdala", "Mergos amme", "Micolash, marerittets vert", "Gehrman, den første jegeren", "Månens nærvær", "Ludwig, den forbannede", "Levende fiaskoer", "Lady Maria fra det astrale klokketårnet", "Kos' foreldreløse", "Laurence, den første vikaren"],
    npcNames: ["Dukken", "Eileen Kråka", "Alfred", "Djura", "Arianna", "Adella", "Kapellbeboeren", "Iosefka", "Gilbert", "Patches Edderkoppen", "Valtr", "Simon den Plagede"],
  },
  fi: {
    capacity: ["Vapaat paikat", "Tavaraluettelo", "Varasto", "Jalokivet", "Riimut", "Jalokivet ja riimut käyttävät samaa turvallista tietuevarantoa."],
    repair: ["Tallennus ladattiin binäärisen CRLF-laajennuksen korjauksen jälkeen.", "Apollo-yhteensopivuus", "Binäärikohdistus korjattu", "Tiedosto oli laajentunut tekstitilan LF–CRLF-muunnoksessa. Editori korjasi muistissa olevan kopion; .bak säilyttää tarkan alkuperäisen tiedoston.", "Jatka"],
    bosses: ["Metsästyksen eteneminen", "Pomojen aikajana", "{{defeated}} / {{total}} voitettu", "Pääreitti", "Valinnainen", "DLC"],
    phases: ["Keski-Yharnam", "Cathedral Ward ja Hemwick", "Forbidden Woods ja Byrgenwerth", "Valinnaiset haarat", "Verikuu", "Hunter's Dreamin loppu", "Hunter's Nightmare"],
    names: ["Papiston peto", "Isä Gascoigne", "Vikaari Amelia", "Taivaallinen lähettiläs", "Ebrietas, kosmoksen tytär", "Verenhimoinen peto", "Yharnamin varjo", "Rom, tyhjä hämähäkki", "Hemwickin noita", "Uudestisyntynyt", "Marttyyri Logarius", "Pimeäpeto Paarl", "Amygdala", "Mergon imettäjä", "Micolash, painajaisen isäntä", "Gehrman, ensimmäinen metsästäjä", "Kuun läsnäolo", "Ludwig kirottu", "Elävät epäonnistumiset", "Lady Maria astraalisesta kellotornista", "Kosin orpo", "Laurence, ensimmäinen vikaari"],
    npcNames: ["Nukke", "Eileen Varis", "Alfred", "Djura", "Arianna", "Adella", "Kappelin asukas", "Iosefka", "Gilbert", "Patches Hämähäkki", "Valtr", "Simon Piinattu"],
  },
  sv: {
    capacity: ["Lediga platser", "Inventarie", "Förvaring", "Ädelstenar", "Runor", "Ädelstenar och runor delar samma säkra datapool."],
    repair: ["Sparfilen lästes in efter reparation av binär CRLF-expansion.", "Apollo-kompatibilitet", "Binär justering reparerad", "Filen hade utökats av en LF-till-CRLF-konvertering i textläge. Redigeraren reparerade kopian i minnet; .bak bevarar det exakta originalet.", "Fortsätt"],
    bosses: ["Jaktens framsteg", "Bossarnas tidslinje", "{{defeated}} / {{total}} besegrade", "Huvudväg", "Valfri", "DLC"],
    phases: ["Centrala Yharnam", "Cathedral Ward och Hemwick", "Forbidden Woods och Byrgenwerth", "Valfria grenar", "Blodmånen", "Finalen i Hunter's Dream", "Hunter's Nightmare"],
    names: ["Klerikala besten", "Fader Gascoigne", "Vikarie Amelia", "Himmelsk emissarie", "Ebrietas, kosmos dotter", "Blodtörstig best", "Yharnams skugga", "Rom, den tomma spindeln", "Häxan från Hemwick", "Den återfödda", "Martyren Logarius", "Mörkerbesten Paarl", "Amygdala", "Mergos amma", "Micolash, mardrömmens värd", "Gehrman, den första jägaren", "Månens närvaro", "Ludwig, den förbannade", "Levande misslyckanden", "Lady Maria från det astrala klocktornet", "Kos föräldralösa", "Laurence, den första vikarien"],
    npcNames: ["Dockan", "Eileen Kråkan", "Alfred", "Djura", "Arianna", "Adella", "Kapellinvånaren", "Iosefka", "Gilbert", "Patches Spindeln", "Valtr", "Simon den Plågade"],
  },
  tr: {
    capacity: ["Boş yuvalar", "Envanter", "Depolama", "Kan taşları", "Rünler", "Kan taşları ve rünler aynı güvenli kayıt havuzunu kullanır."],
    repair: ["Kayıt, ikili CRLF genişletmesi onarıldıktan sonra yüklendi.", "Apollo uyumluluğu", "İkili hizalama onarıldı", "Dosya, metin modundaki LF-CRLF dönüşümü nedeniyle büyümüştü. Düzenleyici bellekteki kopyayı onardı; .bak özgün dosyayı aynen korur.", "Devam"],
    bosses: ["Avın ilerlemesi", "Boss zaman çizelgesi", "{{defeated}} / {{total}} yenildi", "Ana yol", "İsteğe bağlı", "DLC"],
    phases: ["Merkez Yharnam", "Katedral Bölgesi ve Hemwick", "Yasak Orman ve Byrgenwerth", "İsteğe bağlı yollar", "Kanlı ay", "Avcı'nın Rüyası finali", "Avcı'nın Kâbusu"],
    names: ["Ruhban Canavarı", "Peder Gascoigne", "Vekil Amelia", "Göksel Elçi", "Kozmosun Kızı Ebrietas", "Kana Susamış Canavar", "Yharnam'ın Gölgesi", "Rom, Boş Örümcek", "Hemwick Cadısı", "Yeniden Doğan", "Şehit Logarius", "Karanlık Canavar Paarl", "Amygdala", "Mergo'nun Dadısı", "Micolash, Kâbusun Ev Sahibi", "Gehrman, İlk Avcı", "Ay Varlığı", "Lanetli Ludwig", "Yaşayan Başarısızlıklar", "Astral Saat Kulesi'nden Lady Maria", "Kos'un Yetimi", "Laurence, İlk Vekil"],
    npcNames: ["Oyuncak Bebek", "Karga Eileen", "Alfred", "Djura", "Arianna", "Adella", "Şapel Sakini", "Iosefka", "Gilbert", "Örümcek Patches", "Valtr", "Acılı Simon"],
  },
  "pt-PT": {
    capacity: ["Espaços livres", "Inventário", "Armazenamento", "Gemas", "Runas", "As gemas e as runas partilham a mesma reserva segura de registos."],
    repair: ["Gravação carregada após reparar a expansão binária CRLF.", "Compatibilidade com Apollo", "Alinhamento binário reparado", "O ficheiro tinha sido aumentado por uma conversão LF para CRLF em modo de texto. O editor reparou a cópia em memória; o .bak preserva o ficheiro original exato.", "Continuar"],
    bosses: ["Progresso da caçada", "Cronologia dos chefes", "{{defeated}} / {{total}} derrotados", "Percurso principal", "Opcional", "DLC"],
    phases: ["Yharnam Central", "Distrito da Catedral e Hemwick", "Bosques Proibidos e Byrgenwerth", "Ramificações opcionais", "A lua de sangue", "Final do Sonho do Caçador", "Pesadelo do Caçador"],
    names: ["Fera Clerical", "Padre Gascoigne", "Vigária Amelia", "Emissário Celestial", "Ebrietas, Filha do Cosmos", "Fera Sedenta de Sangue", "Sombra de Yharnam", "Rom, a Aranha Apática", "Bruxa de Hemwick", "O Renascido", "Mártir Logarius", "Fera Negra Paarl", "Amygdala", "Ama de Mergo", "Micolash, Anfitrião do Pesadelo", "Gehrman, o Primeiro Caçador", "Presença Lunar", "Ludwig, o Amaldiçoado", "Fracassos Vivos", "Lady Maria da Torre do Relógio Astral", "Órfão de Kos", "Laurence, o Primeiro Vigário"],
    npcNames: ["A Boneca", "Eileen, a Corva", "Alfred", "Djura", "Arianna", "Adella", "Habitante da capela", "Iosefka", "Gilbert", "Patches, a Aranha", "Valtr", "Simon, o Atormentado"],
  },
};

const capacityKeys = ["title", "inventory", "storage", "gems", "runes", "sharedPool"];
const repairKeys = ["compatibilityRepairedStatus", "compatibilityEyebrow", "compatibilityTitle", "compatibilityDescription", "continue"];
const bossKeys = ["timelineEyebrow", "timelineTitle", "progress", "required", "optional", "dlc"];
const phaseKeys = ["centralYharnam", "cathedralWard", "forbiddenWoods", "optionalBranches", "bloodMoon", "finale", "huntersNightmare"];
const nameKeys = ["clericBeast", "fatherGascoigne", "vicarAmelia", "celestialEmissary", "ebrietas", "bloodStarvedBeast", "shadowOfYharnam", "rom", "witchOfHemwick", "oneReborn", "martyrLogarius", "darkbeastPaarl", "amygdala", "mergosWetNurse", "micolash", "gehrman", "moonPresence", "ludwig", "livingFailures", "ladyMaria", "orphanOfKos", "laurence"];
const npcNameKeys = ["plainDoll", "eileen", "alfred", "djura", "arianna", "adella", "chapelDweller", "iosefka", "gilbert", "patches", "valtr", "simon"];

const mapValues = (prefix, keys, values) => Object.fromEntries(keys.map((key, index) => [`${prefix}.${key}`, values[index]]));

export const v040Translations = Object.fromEntries(
  Object.entries(strings).map(([language, value]) => [language, {
    ...mapValues("capacity", capacityKeys, value.capacity),
    ...mapValues("saveFlow", repairKeys, value.repair),
    ...mapValues("bosses", bossKeys, value.bosses),
    ...mapValues("bosses.phases", phaseKeys, value.phases),
    ...mapValues("bossNames", nameKeys, value.names),
    ...mapValues("npcNames", npcNameKeys, value.npcNames),
  }]),
);

export const v040TranslationKeys = [
  ...capacityKeys.map((key) => `capacity.${key}`),
  ...repairKeys.map((key) => `saveFlow.${key}`),
  ...bossKeys.map((key) => `bosses.${key}`),
  ...phaseKeys.map((key) => `bosses.phases.${key}`),
  ...nameKeys.map((key) => `bossNames.${key}`),
  ...npcNameKeys.map((key) => `npcNames.${key}`),
];
