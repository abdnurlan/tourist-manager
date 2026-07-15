import heroImg from "@/assets/hero-mountains.jpg";
import bakuImg from "@/assets/tour-baku.jpg";
import gabalaImg from "@/assets/tour-gabala.jpg";
import shekiImg from "@/assets/tour-sheki.jpg";
import gobustanImg from "@/assets/tour-gobustan.jpg";
import naftalanImg from "@/assets/tour-naftalan.jpg";
import lankaranImg from "@/assets/tour-lankaran.jpg";
import offroadImg from "@/assets/tour-offroad.jpg";

export type Lang = "az" | "en" | "he" | "ar" | "ru";
export type CategoryKey = "mountain" | "history" | "nature" | "wellness" | "coast" | "offroad";

export type DayPlan = { title: string; description: string };
export type TourLocale = {
  title: string;
  region: string;
  highlights: string[];
  overview: string;
  itinerary: DayPlan[];
  included: string[];
  excluded: string[];
};

export type Tour = {
  id: string;
  category: CategoryKey;
  duration: number;
  groupSize: string;
  price: number;
  rating: number;
  image: string;
  gallery?: string[];
  i18n: Record<Lang, TourLocale>;
};

export const TOURS: Tour[] = [
  {
    id: "khinalug", category: "mountain", duration: 2, groupSize: "4–12", price: 220, rating: 4.9, image: heroImg,
    i18n: {
      az: {
        title: "Xınalıq və Qubanın Dağları", region: "Quba · Xınalıq",
        highlights: ["Avropanın ən yüksək yaşayış məntəqəsi", "Tənzə şəlaləsi", "Yerli mətbəx"],
        overview: "Bakıdan Qubaya, oradan da Avropanın ən yüksək kəndi sayılan Xınalığa 2 günlük macəra. Off-road yollar, qədim memarlıq, qonaqpərvər ailələr və unudulmaz dağ panoramları.",
        itinerary: [
          { title: "1-ci gün: Bakı → Quba → Xınalıq", description: "Səhər Bakıdan yola çıxış, yolboyu Beşbarmaq dağında qısa dayanacaq, Qubada nahar və günortadan sonra Xınalığa qalxış. Axşam yerli ailədə şam yeməyi və gecələmə." },
          { title: "2-ci gün: Xınalıq → Tənzə şəlaləsi → Bakı", description: "Səhər yeməyindən sonra kənd gəzintisi, ləzgilərin və xınalıqlıların həyatı ilə tanışlıq. Sonra Tənzə şəlaləsinə yürüyüş, nahar və Bakıya qayıdış." },
        ],
        included: ["Komfortlu nəqliyyat", "1 gecə ailə qonaqlığında qalma", "Səhər yeməyi və 2 axşam yeməyi", "Bələdçi xidməti", "Sığorta"],
        excluded: ["Spirtli içkilər", "Şəxsi xərclər", "Bəxşiş"],
      },
      en: {
        title: "Khinalug and the Quba Mountains", region: "Quba · Khinalug",
        highlights: ["One of Europe's highest villages", "Tenze waterfall", "Local cuisine"],
        overview: "A 2-day adventure from Baku to Quba and up to Khinalug — one of the highest continuously inhabited villages in Europe. Off-road tracks, ancient architecture, welcoming families and unforgettable mountain panoramas.",
        itinerary: [
          { title: "Day 1: Baku → Quba → Khinalug", description: "Morning departure from Baku, short stop at Beshbarmag mountain, lunch in Quba and afternoon ascent to Khinalug. Dinner with a local family and overnight stay." },
          { title: "Day 2: Khinalug → Tenze waterfall → Baku", description: "After breakfast a village walk, meeting locals, then a hike to the Tenze waterfall, lunch and return to Baku." },
        ],
        included: ["Comfortable transport", "1 night with a local family", "Breakfast and 2 dinners", "English-speaking guide", "Insurance"],
        excluded: ["Alcoholic beverages", "Personal expenses", "Tips"],
      },
      he: {
        title: "חינלוק והרי קובה", region: "קובה · חינלוק",
        highlights: ["מהכפרים הגבוהים באירופה", "מפל טנזה", "מטבח מקומי"],
        overview: "הרפתקה של יומיים מבאקו לקובה ולחינלוק — אחד הכפרים המאוכלסים הגבוהים באירופה. שבילי שטח, אדריכלות עתיקה, משפחות מארחות ונופי הרים מרהיבים.",
        itinerary: [
          { title: "יום 1: באקו → קובה → חינלוק", description: "יציאה בבוקר מבאקו, עצירה קצרה בהר בשברמאג, צהריים בקובה ועלייה לחינלוק. ארוחת ערב עם משפחה מקומית ולינה." },
          { title: "יום 2: חינלוק → מפל טנזה → באקו", description: "לאחר ארוחת בוקר סיור בכפר והיכרות עם התושבים, טיול רגלי למפל טנזה, ארוחת צהריים וחזרה לבאקו." },
        ],
        included: ["הסעות נוחות", "לינה אחת אצל משפחה מקומית", "ארוחת בוקר ושתי ארוחות ערב", "מדריך", "ביטוח"],
        excluded: ["משקאות אלכוהוליים", "הוצאות אישיות", "טיפים"],
      },
      ar: {
        title: "خيناليق وجبال قوبا", region: "قوبا · خيناليق",
        highlights: ["إحدى أعلى القرى في أوروبا", "شلال تنزه", "المطبخ المحلي"],
        overview: "مغامرة لمدة يومين من باكو إلى قوبا وصعودًا إلى خيناليق — إحدى أعلى القرى المأهولة باستمرار في أوروبا. مسارات وعرة، وعمارة عريقة، وعائلات مضيافة، ومناظر جبلية بانورامية لا تُنسى.",
        itinerary: [
          { title: "اليوم الأول: باكو ← قوبا ← خيناليق", description: "انطلاق صباحي من باكو، مع توقف قصير عند جبل بشبارماق، وغداء في قوبا وصعود بعد الظهر إلى خيناليق. عشاء مع عائلة محلية ومبيت ليلة." },
          { title: "اليوم الثاني: خيناليق ← شلال تنزه ← باكو", description: "بعد الفطور جولة سيرًا في القرية والتعرف على السكان المحليين، ثم رحلة مشي إلى شلال تنزه، وغداء والعودة إلى باكو." },
        ],
        included: ["مواصلات مريحة", "ليلة واحدة مع عائلة محلية", "الفطور ووجبتا عشاء", "مرشد يتحدث الإنجليزية", "تأمين"],
        excluded: ["المشروبات الكحولية", "المصاريف الشخصية", "الإكراميات"],
      },
      ru: {
        title: "Хыналыг и горы Губы", region: "Губа · Хыналыг",
        highlights: ["Одна из самых высокогорных деревень Европы", "Водопад Тензе", "Местная кухня"],
        overview: "Двухдневное приключение из Баку в Губу и подъём в Хыналыг — одну из самых высокогорных постоянно населённых деревень Европы. Бездорожье, древняя архитектура, гостеприимные семьи и незабываемые горные панорамы.",
        itinerary: [
          { title: "День 1: Баку → Губа → Хыналыг", description: "Утренний выезд из Баку, короткая остановка у горы Бешбармаг, обед в Губе и дневной подъём в Хыналыг. Ужин в местной семье и ночёвка." },
          { title: "День 2: Хыналыг → водопад Тензе → Баку", description: "После завтрака прогулка по деревне и знакомство с местными жителями, затем поход к водопаду Тензе, обед и возвращение в Баку." },
        ],
        included: ["Комфортабельный транспорт", "1 ночь в местной семье", "Завтрак и 2 ужина", "Англоговорящий гид", "Страховка"],
        excluded: ["Алкогольные напитки", "Личные расходы", "Чаевые"],
      },
    },
  },
  {
    id: "baku", category: "history", duration: 1, groupSize: "2–15", price: 65, rating: 4.8, image: bakuImg,
    i18n: {
      az: {
        title: "İçərişəhər və Bakının Sirləri", region: "Bakı",
        highlights: ["Qız Qalası", "Şirvanşahlar Sarayı", "Gecə Bakısı"],
        overview: "Bakının ürəyinə — İçərişəhərə bir günlük səyahət. UNESCO siyahısındakı abidələr, dar küçələr, karvansaraylar və axşam Xəzər sahili gəzintisi.",
        itinerary: [
          { title: "Səhər: İçərişəhər turu", description: "Şirvanşahlar Sarayı, Qız Qalası və qədim karvansaraylar." },
          { title: "Günorta: Yerli nahar", description: "Tarixi restoranda ənənəvi Azərbaycan mətbəxi." },
          { title: "Axşam: Bulvar və Alov Qüllələri", description: "Bakı bulvarı boyu gəzinti, Alov Qüllələrinin işıq şousu." },
        ],
        included: ["Peşəkar bələdçi", "Muzey biletləri", "Nahar"],
        excluded: ["Nəqliyyat (yerli)", "Şəxsi xərclər"],
      },
      en: {
        title: "Old City and the Secrets of Baku", region: "Baku",
        highlights: ["Maiden Tower", "Palace of the Shirvanshahs", "Baku by night"],
        overview: "A one-day journey into the heart of Baku — the UNESCO-listed Old City. Ancient monuments, narrow streets, caravanserais and an evening stroll along the Caspian.",
        itinerary: [
          { title: "Morning: Old City tour", description: "Palace of the Shirvanshahs, Maiden Tower and old caravanserais." },
          { title: "Midday: Local lunch", description: "Traditional Azerbaijani cuisine in a historic restaurant." },
          { title: "Evening: Boulevard & Flame Towers", description: "Walk along the seaside boulevard and the Flame Towers light show." },
        ],
        included: ["Professional guide", "Museum tickets", "Lunch"],
        excluded: ["Local transport", "Personal expenses"],
      },
      he: {
        title: "העיר העתיקה וסודות באקו", region: "באקו",
        highlights: ["מגדל הבתולה", "ארמון השירוואנשאהים", "באקו בלילה"],
        overview: "מסע יומי ללב באקו — העיר העתיקה ברשימת אונסק\"ו. אנדרטאות, סמטאות, קרוואנסראיים וטיול ערב לאורך הים הכספי.",
        itinerary: [
          { title: "בוקר: סיור בעיר העתיקה", description: "ארמון השירוואנשאהים, מגדל הבתולה וקרוואנסראיים." },
          { title: "צהריים: ארוחה מקומית", description: "מטבח אזרבייג'ני מסורתי במסעדה היסטורית." },
          { title: "ערב: הטיילת ומגדלי הלהבה", description: "טיילת לאורך הים ומופע אורות של מגדלי הלהבה." },
        ],
        included: ["מדריך מקצועי", "כרטיסי מוזיאון", "ארוחת צהריים"],
        excluded: ["הסעות מקומיות", "הוצאות אישיות"],
      },
      ar: {
        title: "المدينة القديمة وأسرار باكو", region: "باكو",
        highlights: ["برج العذراء", "قصر الشيروانشاهات", "باكو ليلًا"],
        overview: "رحلة ليوم واحد إلى قلب باكو — المدينة القديمة المدرجة في قائمة اليونسكو. آثار عريقة، وأزقة ضيقة، وخانات، ونزهة مسائية على ساحل بحر قزوين.",
        itinerary: [
          { title: "الصباح: جولة في المدينة القديمة", description: "قصر الشيروانشاهات وبرج العذراء والخانات القديمة." },
          { title: "الظهيرة: غداء محلي", description: "المطبخ الأذربيجاني التقليدي في مطعم تاريخي." },
          { title: "المساء: الكورنيش وأبراج اللهب", description: "نزهة على طول كورنيش البحر وعرض الأضواء في أبراج اللهب." },
        ],
        included: ["مرشد محترف", "تذاكر المتاحف", "الغداء"],
        excluded: ["المواصلات المحلية", "المصاريف الشخصية"],
      },
      ru: {
        title: "Старый город и тайны Баку", region: "Баку",
        highlights: ["Девичья башня", "Дворец Ширваншахов", "Баку ночью"],
        overview: "Однодневное путешествие в сердце Баку — Старый город, внесённый в список ЮНЕСКО. Древние памятники, узкие улочки, караван-сараи и вечерняя прогулка вдоль Каспия.",
        itinerary: [
          { title: "Утро: экскурсия по Старому городу", description: "Дворец Ширваншахов, Девичья башня и старинные караван-сараи." },
          { title: "Полдень: местный обед", description: "Традиционная азербайджанская кухня в историческом ресторане." },
          { title: "Вечер: бульвар и Пламенные башни", description: "Прогулка по приморскому бульвару и световое шоу Пламенных башен." },
        ],
        included: ["Профессиональный гид", "Билеты в музеи", "Обед"],
        excluded: ["Местный транспорт", "Личные расходы"],
      },
    },
  },
  {
    id: "gabala", category: "nature", duration: 2, groupSize: "4–12", price: 185, rating: 4.9, image: gabalaImg,
    i18n: {
      az: {
        title: "Qəbələ — Yaşıl Dağlar Kəşfi", region: "Qəbələ",
        highlights: ["Tufandağ kanat yolu", "Yeddi Gözəl şəlaləsi", "Nohur gölü"],
        overview: "Qafqazın yamyaşıl ətəklərində 2 günlük istirahət. Kanat yolu, şəlalələr, göl kənarında piknik və yerli şərab dadma.",
        itinerary: [
          { title: "1-ci gün: Bakı → Qəbələ", description: "Səhər yola çıxış, Şamaxıda dayanacaq, Qəbələdə otelə yerləşmə və Nohur gölü gəzintisi." },
          { title: "2-ci gün: Tufandağ və şəlalələr", description: "Tufandağ kanat yolu ilə zirvəyə qalxış, Yeddi Gözəl şəlaləsinə yürüyüş və Bakıya qayıdış." },
        ],
        included: ["Nəqliyyat", "1 gecə 4★ oteldə qalma", "Səhər yeməyi", "Bələdçi"],
        excluded: ["Nahar və axşam yeməyi", "Kanat yolu bileti"],
      },
      en: {
        title: "Gabala — Green Mountains Discovery", region: "Gabala",
        highlights: ["Tufandag cable car", "Seven Beauties waterfall", "Lake Nohur"],
        overview: "Two days in the green foothills of the Caucasus. Cable car, waterfalls, a lakeside picnic and a local wine tasting.",
        itinerary: [
          { title: "Day 1: Baku → Gabala", description: "Morning departure, stop in Shamakhi, hotel check-in and Lake Nohur walk." },
          { title: "Day 2: Tufandag & waterfalls", description: "Cable car to the summit, hike to the Seven Beauties waterfall and return to Baku." },
        ],
        included: ["Transport", "1 night in a 4★ hotel", "Breakfast", "Guide"],
        excluded: ["Lunch and dinner", "Cable car ticket"],
      },
      he: {
        title: "גבלה — גילוי ההרים הירוקים", region: "גבלה",
        highlights: ["רכבל טופנדאג", "מפל שבע היפהפיות", "אגם נוהור"],
        overview: "יומיים במורדות הירוקים של הקווקז. רכבל, מפלים, פיקניק לחוף האגם וטעימת יין מקומי.",
        itinerary: [
          { title: "יום 1: באקו → גבלה", description: "יציאה בבוקר, עצירה בשמאחה, צ'ק־אין במלון וטיול לאגם נוהור." },
          { title: "יום 2: טופנדאג ומפלים", description: "עלייה ברכבל לפסגה, טיול למפל שבע היפהפיות וחזרה לבאקו." },
        ],
        included: ["הסעות", "לילה במלון 4★", "ארוחת בוקר", "מדריך"],
        excluded: ["צהריים וערב", "כרטיס רכבל"],
      },
      ar: {
        title: "قابالا — اكتشاف الجبال الخضراء", region: "قابالا",
        highlights: ["تلفريك توفانداغ", "شلال الحسناوات السبع", "بحيرة نوهور"],
        overview: "يومان في السفوح الخضراء لجبال القوقاز. تلفريك وشلالات ونزهة على ضفاف البحيرة وتذوق النبيذ المحلي.",
        itinerary: [
          { title: "اليوم الأول: باكو ← قابالا", description: "انطلاق صباحي، وتوقف في شماخي، وتسجيل الوصول إلى الفندق ونزهة إلى بحيرة نوهور." },
          { title: "اليوم الثاني: توفانداغ والشلالات", description: "تلفريك إلى القمة، ورحلة مشي إلى شلال الحسناوات السبع والعودة إلى باكو." },
        ],
        included: ["المواصلات", "ليلة واحدة في فندق 4★", "الفطور", "مرشد"],
        excluded: ["الغداء والعشاء", "تذكرة التلفريك"],
      },
      ru: {
        title: "Габала — открытие зелёных гор", region: "Габала",
        highlights: ["Канатная дорога Туфандаг", "Водопад Семь красавиц", "Озеро Нохур"],
        overview: "Два дня в зелёных предгорьях Кавказа. Канатная дорога, водопады, пикник на берегу озера и дегустация местного вина.",
        itinerary: [
          { title: "День 1: Баку → Габала", description: "Утренний выезд, остановка в Шамахы, заселение в отель и прогулка к озеру Нохур." },
          { title: "День 2: Туфандаг и водопады", description: "Подъём по канатной дороге на вершину, поход к водопаду Семь красавиц и возвращение в Баку." },
        ],
        included: ["Транспорт", "1 ночь в отеле 4★", "Завтрак", "Гид"],
        excluded: ["Обед и ужин", "Билет на канатную дорогу"],
      },
    },
  },
  {
    id: "sheki", category: "history", duration: 2, groupSize: "2–14", price: 175, rating: 4.9, image: shekiImg,
    i18n: {
      az: {
        title: "Şəki Xanlığının İzində", region: "Şəki",
        highlights: ["Xan Sarayı və şəbəkə", "Karvansaray", "Piti və halva"],
        overview: "İpək Yolunun unudulmaz şəhəri Şəkiyə 2 günlük tarix səyahəti. Şəbəkə ustaları, qədim karvansaray və məşhur Şəki halvası.",
        itinerary: [
          { title: "1-ci gün: Bakı → Şəki", description: "Yol boyu Şamaxı və Lahıc kəndində qısa dayanacaq, axşam Şəkidə karvansarayda qalma." },
          { title: "2-ci gün: Xan Sarayı və emalatxanalar", description: "Şəki Xan Sarayı, şəbəkə ustalarının emalatxanası, piti və halva dadma, sonra Bakıya qayıdış." },
        ],
        included: ["Nəqliyyat", "1 gecə karvansarayda qalma", "Səhər yeməyi", "Bələdçi", "Muzey biletləri"],
        excluded: ["Nahar və axşam yeməyi"],
      },
      en: {
        title: "In the Footsteps of the Sheki Khanate", region: "Sheki",
        highlights: ["Khan's Palace & shebeke", "Caravanserai", "Piti and halva"],
        overview: "A two-day history tour to the unforgettable Silk Road city of Sheki — shebeke craftsmen, an ancient caravanserai and the famous Sheki halva.",
        itinerary: [
          { title: "Day 1: Baku → Sheki", description: "Short stops in Shamakhi and the village of Lahij, evening stay in the Sheki caravanserai." },
          { title: "Day 2: Khan's Palace & workshops", description: "Sheki Khan's Palace, a shebeke workshop, tasting of piti and halva, then return to Baku." },
        ],
        included: ["Transport", "1 night in a caravanserai", "Breakfast", "Guide", "Museum tickets"],
        excluded: ["Lunch and dinner"],
      },
      he: {
        title: "בעקבות הח'אנות של שקי", region: "שקי",
        highlights: ["ארמון הח'אן ושבקה", "קרוואנסראי", "פיטי וחלווה"],
        overview: "סיור היסטוריה של יומיים בשקי, עיר דרך המשי הבלתי נשכחת — אומני שבקה, קרוואנסראי עתיק והחלווה המפורסמת.",
        itinerary: [
          { title: "יום 1: באקו → שקי", description: "עצירות קצרות בשמאחה ובכפר לאהיג', לינה בערב בקרוואנסראי בשקי." },
          { title: "יום 2: ארמון הח'אן וסדנאות", description: "ארמון הח'אן, סדנת שבקה, טעימת פיטי וחלווה, חזרה לבאקו." },
        ],
        included: ["הסעות", "לילה בקרוואנסראי", "ארוחת בוקר", "מדריך", "כרטיסי מוזיאון"],
        excluded: ["צהריים וערב"],
      },
      ar: {
        title: "على خطى خانية شكي", region: "شكي",
        highlights: ["قصر الخان والشبكة", "الخان (الكاروانسراي)", "البيتي والحلوى"],
        overview: "جولة تاريخية لمدة يومين إلى مدينة شكي التي لا تُنسى على طريق الحرير — حرفيو الشبكة، وخان عريق، وحلوى شكي الشهيرة.",
        itinerary: [
          { title: "اليوم الأول: باكو ← شكي", description: "توقفات قصيرة في شماخي وقرية لاهيج، ومبيت مسائي في كاروانسراي شكي." },
          { title: "اليوم الثاني: قصر الخان والورش", description: "قصر خان شكي، وورشة الشبكة، وتذوق البيتي والحلوى، ثم العودة إلى باكو." },
        ],
        included: ["المواصلات", "ليلة واحدة في كاروانسراي", "الفطور", "مرشد", "تذاكر المتاحف"],
        excluded: ["الغداء والعشاء"],
      },
      ru: {
        title: "По следам Шекинского ханства", region: "Шеки",
        highlights: ["Дворец хана и шебеке", "Караван-сарай", "Пити и халва"],
        overview: "Двухдневный исторический тур в незабываемый город Шёлкового пути Шеки — мастера шебеке, древний караван-сарай и знаменитая шекинская халва.",
        itinerary: [
          { title: "День 1: Баку → Шеки", description: "Короткие остановки в Шамахы и селе Лагич, вечерняя ночёвка в шекинском караван-сарае." },
          { title: "День 2: Дворец хана и мастерские", description: "Дворец шекинских ханов, мастерская шебеке, дегустация пити и халвы, затем возвращение в Баку." },
        ],
        included: ["Транспорт", "1 ночь в караван-сарае", "Завтрак", "Гид", "Билеты в музеи"],
        excluded: ["Обед и ужин"],
      },
    },
  },
  {
    id: "gobustan", category: "nature", duration: 1, groupSize: "2–18", price: 55, rating: 4.7, image: gobustanImg,
    i18n: {
      az: {
        title: "Qobustan və Palçıq Vulkanları", region: "Qobustan",
        highlights: ["Qaya rəsmləri (UNESCO)", "Palçıq vulkanları", "Səhra mənzərəsi"],
        overview: "Bakıdan cəmi 1 saatlıq məsafədə — 40 000 illik qaya rəsmləri və dünyanın ən aktiv palçıq vulkanları.",
        itinerary: [
          { title: "Səhər: Qobustan Milli Parkı", description: "Petroqliflər muzeyi və qədim qaya rəsmləri ilə tanışlıq." },
          { title: "Günorta: Palçıq vulkanları", description: "Off-road avtomobillərlə vulkan ərazisinə səfər." },
        ],
        included: ["Nəqliyyat", "Bələdçi", "Park bileti"],
        excluded: ["Nahar"],
      },
      en: {
        title: "Gobustan and the Mud Volcanoes", region: "Gobustan",
        highlights: ["Rock art (UNESCO)", "Mud volcanoes", "Desert landscape"],
        overview: "Just an hour from Baku — 40,000-year-old rock carvings and some of the world's most active mud volcanoes.",
        itinerary: [
          { title: "Morning: Gobustan National Park", description: "Petroglyph museum and ancient rock art." },
          { title: "Midday: Mud volcanoes", description: "Off-road ride into the volcano fields." },
        ],
        included: ["Transport", "Guide", "Park ticket"],
        excluded: ["Lunch"],
      },
      he: {
        title: "גובוסטן והרי הבוץ", region: "גובוסטן",
        highlights: ["ציורי סלע (אונסק\"ו)", "הרי געש בוציים", "נוף מדברי"],
        overview: "במרחק שעה מבאקו — ציורי סלע בני 40,000 שנה והרי הגעש הבוציים הפעילים בעולם.",
        itinerary: [
          { title: "בוקר: הפארק הלאומי גובוסטן", description: "מוזיאון פטרוגליפים וציורי סלע עתיקים." },
          { title: "צהריים: הרי הבוץ", description: "נסיעת שטח אל שדות הר הגעש." },
        ],
        included: ["הסעות", "מדריך", "כרטיס פארק"],
        excluded: ["ארוחת צהריים"],
      },
      ar: {
        title: "قوبوستان وبراكين الطين", region: "قوبوستان",
        highlights: ["النقوش الصخرية (اليونسكو)", "براكين الطين", "المناظر الصحراوية"],
        overview: "على بُعد ساعة واحدة فقط من باكو — نقوش صخرية عمرها 40,000 عام وبعض أنشط براكين الطين في العالم.",
        itinerary: [
          { title: "الصباح: منتزه قوبوستان الوطني", description: "متحف النقوش الصخرية والرسوم الصخرية العريقة." },
          { title: "الظهيرة: براكين الطين", description: "جولة عبر الطرق الوعرة إلى حقول البراكين." },
        ],
        included: ["المواصلات", "مرشد", "تذكرة المنتزه"],
        excluded: ["الغداء"],
      },
      ru: {
        title: "Гобустан и грязевые вулканы", region: "Гобустан",
        highlights: ["Наскальные рисунки (ЮНЕСКО)", "Грязевые вулканы", "Пустынный пейзаж"],
        overview: "Всего в часе езды от Баку — наскальные рисунки возрастом 40 000 лет и одни из самых активных грязевых вулканов в мире.",
        itinerary: [
          { title: "Утро: Национальный парк Гобустан", description: "Музей петроглифов и древние наскальные рисунки." },
          { title: "Полдень: грязевые вулканы", description: "Поездка по бездорожью к вулканическим полям." },
        ],
        included: ["Транспорт", "Гид", "Билет в парк"],
        excluded: ["Обед"],
      },
    },
  },
  {
    id: "naftalan", category: "wellness", duration: 3, groupSize: "1–6", price: 320, rating: 4.8, image: naftalanImg,
    i18n: {
      az: {
        title: "Naftalan Müalicə Turu", region: "Naftalan",
        highlights: ["Naftalan vanna prosedurları", "Spa və masaj", "Tam pansion"],
        overview: "Dünyada yeganə olan müalicəvi naftalan neftinin vətənində 3 günlük spa və sağlamlıq turu.",
        itinerary: [
          { title: "1-ci gün: Gəliş və ilkin müayinə", description: "Otelə yerləşmə, həkim müayinəsi və ilk istirahət proseduru." },
          { title: "2-ci gün: Tam müalicə günü", description: "Naftalan vannaları, masaj və fizioterapiya." },
          { title: "3-ci gün: Yekun və yola düşmə", description: "Səhər prosedurları, son məsləhət və Bakıya qayıdış." },
        ],
        included: ["3 gecə otel + tam pansion", "Tibbi müayinə", "5 prosedur", "Nəqliyyat"],
        excluded: ["Əlavə prosedurlar", "Şəxsi xərclər"],
      },
      en: {
        title: "Naftalan Wellness Tour", region: "Naftalan",
        highlights: ["Naftalan oil baths", "Spa and massage", "Full board"],
        overview: "Three days of spa & wellness in the home of the world's only therapeutic naftalan oil.",
        itinerary: [
          { title: "Day 1: Arrival & check-up", description: "Hotel check-in, medical assessment and a first relaxing procedure." },
          { title: "Day 2: Full treatment day", description: "Naftalan baths, massage and physiotherapy." },
          { title: "Day 3: Wrap-up & departure", description: "Morning procedures, final consultation and return to Baku." },
        ],
        included: ["3 nights hotel + full board", "Medical assessment", "5 procedures", "Transport"],
        excluded: ["Extra procedures", "Personal expenses"],
      },
      he: {
        title: "טיול בריאות בנפטלן", region: "נפטלן",
        highlights: ["אמבטיות נפט נפטלן", "ספא ועיסוי", "פנסיון מלא"],
        overview: "שלושה ימי ספא ובריאות בעיר נפטלן, מקור שמן הנפט הטיפולי הייחודי בעולם.",
        itinerary: [
          { title: "יום 1: הגעה ובדיקה", description: "צ'ק־אין במלון, הערכה רפואית וטיפול ראשון." },
          { title: "יום 2: יום טיפולים מלא", description: "אמבטיות נפטלן, עיסוי ופיזיותרפיה." },
          { title: "יום 3: סיכום וחזרה", description: "טיפולי בוקר, ייעוץ אחרון וחזרה לבאקו." },
        ],
        included: ["3 לילות מלון + פנסיון מלא", "בדיקה רפואית", "5 טיפולים", "הסעות"],
        excluded: ["טיפולים נוספים", "הוצאות אישיות"],
      },
      ar: {
        title: "جولة الاستشفاء في نفتالان", region: "نفتالان",
        highlights: ["حمامات نفط نفتالان", "السبا والتدليك", "إقامة كاملة"],
        overview: "ثلاثة أيام من السبا والاستشفاء في موطن نفط نفتالان العلاجي الوحيد في العالم.",
        itinerary: [
          { title: "اليوم الأول: الوصول والفحص", description: "تسجيل الوصول إلى الفندق، والتقييم الطبي، وأول جلسة استرخاء." },
          { title: "اليوم الثاني: يوم علاجي كامل", description: "حمامات نفتالان والتدليك والعلاج الطبيعي." },
          { title: "اليوم الثالث: الختام والمغادرة", description: "جلسات صباحية، والاستشارة الأخيرة والعودة إلى باكو." },
        ],
        included: ["3 ليالٍ في الفندق + إقامة كاملة", "التقييم الطبي", "5 جلسات علاجية", "المواصلات"],
        excluded: ["الجلسات الإضافية", "المصاريف الشخصية"],
      },
      ru: {
        title: "Оздоровительный тур в Нафталан", region: "Нафталан",
        highlights: ["Нафталановые ванны", "Спа и массаж", "Полный пансион"],
        overview: "Три дня спа и оздоровления на родине единственной в мире лечебной нафталановой нефти.",
        itinerary: [
          { title: "День 1: прибытие и осмотр", description: "Заселение в отель, медицинское обследование и первая расслабляющая процедура." },
          { title: "День 2: полный день процедур", description: "Нафталановые ванны, массаж и физиотерапия." },
          { title: "День 3: завершение и отъезд", description: "Утренние процедуры, заключительная консультация и возвращение в Баку." },
        ],
        included: ["3 ночи в отеле + полный пансион", "Медицинское обследование", "5 процедур", "Транспорт"],
        excluded: ["Дополнительные процедуры", "Личные расходы"],
      },
    },
  },
  {
    id: "lankaran", category: "coast", duration: 2, groupSize: "4–12", price: 195, rating: 4.8, image: lankaranImg,
    i18n: {
      az: {
        title: "Lənkəran və Hirkan Meşələri", region: "Lənkəran · Lerik",
        highlights: ["Çay plantasiyaları", "Talış dağları", "Xəzər sahili"],
        overview: "Cənubun yaşıl güşəsinə 2 günlük səfər — Hirkan meşələri, çay plantasiyaları və əsrlik insanlar yurdu Lerik.",
        itinerary: [
          { title: "1-ci gün: Bakı → Lənkəran", description: "Sahil yolu ilə Lənkərana yol, çay plantasiyalarına səfər, axşam yerli mətbəxlə tanışlıq." },
          { title: "2-ci gün: Lerik və Hirkan", description: "Lerikdə uzunömürlülər muzeyi, Hirkan Milli Parkında yürüyüş, Bakıya qayıdış." },
        ],
        included: ["Nəqliyyat", "1 gecə otel", "Səhər yeməyi", "Bələdçi"],
        excluded: ["Nahar və axşam yeməyi"],
      },
      en: {
        title: "Lankaran and the Hyrcanian Forests", region: "Lankaran · Lerik",
        highlights: ["Tea plantations", "Talysh mountains", "Caspian coast"],
        overview: "Two days in the green south — Hyrcanian forests, tea plantations and Lerik, land of centenarians.",
        itinerary: [
          { title: "Day 1: Baku → Lankaran", description: "Drive along the coast, visit a tea plantation, evening of local cuisine." },
          { title: "Day 2: Lerik & Hyrcan", description: "Museum of longevity in Lerik, hike in Hyrcan National Park, return to Baku." },
        ],
        included: ["Transport", "1 night hotel", "Breakfast", "Guide"],
        excluded: ["Lunch and dinner"],
      },
      he: {
        title: "לנקרן ויערות הירקניה", region: "לנקרן · לריק",
        highlights: ["מטעי תה", "הרי טליש", "חוף הים הכספי"],
        overview: "יומיים בדרום הירוק — יערות הירקניה, מטעי תה ולריק, ארץ הקשישים בני המאה.",
        itinerary: [
          { title: "יום 1: באקו → לנקרן", description: "נסיעה לאורך החוף, ביקור במטע תה, ערב של מטבח מקומי." },
          { title: "יום 2: לריק וירקניה", description: "מוזיאון אריכות הימים בלריק, טיול בפארק הלאומי, חזרה לבאקו." },
        ],
        included: ["הסעות", "לילה במלון", "ארוחת בוקר", "מדריך"],
        excluded: ["צהריים וערב"],
      },
      ar: {
        title: "لنكران وغابات هيركان", region: "لنكران · لريك",
        highlights: ["مزارع الشاي", "جبال طاليش", "ساحل بحر قزوين"],
        overview: "يومان في الجنوب الأخضر — غابات هيركان، ومزارع الشاي، ولريك، أرض المعمّرين.",
        itinerary: [
          { title: "اليوم الأول: باكو ← لنكران", description: "قيادة على طول الساحل، وزيارة مزرعة شاي، وأمسية من المطبخ المحلي." },
          { title: "اليوم الثاني: لريك وهيركان", description: "متحف طول العمر في لريك، ورحلة مشي في منتزه هيركان الوطني، والعودة إلى باكو." },
        ],
        included: ["المواصلات", "ليلة واحدة في الفندق", "الفطور", "مرشد"],
        excluded: ["الغداء والعشاء"],
      },
      ru: {
        title: "Ленкорань и Гирканские леса", region: "Ленкорань · Лерик",
        highlights: ["Чайные плантации", "Талышские горы", "Каспийское побережье"],
        overview: "Два дня на зелёном юге — Гирканские леса, чайные плантации и Лерик, край долгожителей.",
        itinerary: [
          { title: "День 1: Баку → Ленкорань", description: "Поездка вдоль побережья, посещение чайной плантации, вечер местной кухни." },
          { title: "День 2: Лерик и Гиркан", description: "Музей долголетия в Лерике, поход в Гирканский национальный парк, возвращение в Баку." },
        ],
        included: ["Транспорт", "1 ночь в отеле", "Завтрак", "Гид"],
        excluded: ["Обед и ужин"],
      },
    },
  },
  {
    id: "offroad", category: "offroad", duration: 2, groupSize: "2–8", price: 280, rating: 4.9, image: offroadImg,
    i18n: {
      az: {
        title: "Şahdağ Offroad Ekspedisiyası", region: "Quba · Şahdağ",
        highlights: ["4x4 dağ marşrutu", "Çay keçidləri və yamaclar", "Çadır düşərgəsi və tonqal"],
        overview: "Təcrübəli sürücülərlə 2 günlük 4x4 ekspedisiya — Şahdağın yan yollarında, çay keçidlərində və alp çəmənliklərində adrenalin dolu macəra.",
        itinerary: [
          { title: "1-ci gün: Bakı → Şahdağ baza", description: "4x4 avtomobillərlə Şahdağa, off-road marşrutu, axşam çadır düşərgəsi və tonqal başında şam yeməyi." },
          { title: "2-ci gün: Alp çəmənlikləri", description: "Səhər yürüyüşü, yüksək yamaclarda sürüş, nahar və Bakıya qayıdış." },
        ],
        included: ["4x4 nəqliyyat + sürücü", "Çadır və yataq avadanlığı", "Bütün yemək", "Bələdçi", "Sığorta"],
        excluded: ["Şəxsi avadanlıq", "Spirtli içkilər"],
      },
      en: {
        title: "Shahdag Offroad Expedition", region: "Quba · Shahdag",
        highlights: ["4x4 mountain trail", "River crossings & ridges", "Tent camp and bonfire"],
        overview: "A 2-day 4x4 expedition with experienced drivers — adrenaline on Shahdag's back tracks, river crossings and alpine meadows.",
        itinerary: [
          { title: "Day 1: Baku → Shahdag base", description: "Drive in 4x4s to Shahdag, an off-road trail, evening tent camp and bonfire dinner." },
          { title: "Day 2: Alpine meadows", description: "Morning hike, driving on high ridges, lunch and return to Baku." },
        ],
        included: ["4x4 transport + driver", "Tent & sleeping kit", "All meals", "Guide", "Insurance"],
        excluded: ["Personal gear", "Alcoholic beverages"],
      },
      he: {
        title: "מסע אופרוד שאהדאג", region: "קובה · שאהדאג",
        highlights: ["מסלול הרים 4x4", "חציית נחלים ורכסים", "מחנה אוהלים ומדורה"],
        overview: "משלחת 4x4 של יומיים עם נהגים מנוסים — אדרנלין בשבילי שאהדאג, חציות נחלים ואחו אלפיני.",
        itinerary: [
          { title: "יום 1: באקו → בסיס שאהדאג", description: "נסיעה ברכבי 4x4 לשאהדאג, מסלול שטח, מחנה אוהלים וארוחת ערב סביב המדורה." },
          { title: "יום 2: אחו אלפיני", description: "טיול בוקר, נהיגה ברכסים גבוהים, צהריים וחזרה לבאקו." },
        ],
        included: ["רכבי 4x4 + נהג", "ציוד אוהל ושינה", "כל הארוחות", "מדריך", "ביטוח"],
        excluded: ["ציוד אישי", "משקאות אלכוהוליים"],
      },
      ar: {
        title: "رحلة الطرق الوعرة في شاهداغ", region: "قوبا · شاهداغ",
        highlights: ["مسار جبلي بسيارات 4x4", "عبور الأنهار والمرتفعات", "مخيم الخيام والنار"],
        overview: "رحلة استكشافية لمدة يومين بسيارات 4x4 مع سائقين محترفين — أدرينالين على دروب شاهداغ الجانبية، وعبور الأنهار، والمروج الجبلية.",
        itinerary: [
          { title: "اليوم الأول: باكو ← قاعدة شاهداغ", description: "القيادة بسيارات 4x4 إلى شاهداغ، ومسار على الطرق الوعرة، ومخيم خيام مسائي وعشاء حول النار." },
          { title: "اليوم الثاني: المروج الجبلية", description: "رحلة مشي صباحية، والقيادة على المرتفعات العالية، والغداء والعودة إلى باكو." },
        ],
        included: ["مواصلات 4x4 + سائق", "معدات الخيام والنوم", "جميع الوجبات", "مرشد", "تأمين"],
        excluded: ["المعدات الشخصية", "المشروبات الكحولية"],
      },
      ru: {
        title: "Внедорожная экспедиция на Шахдаг", region: "Губа · Шахдаг",
        highlights: ["Горный маршрут на 4x4", "Переправы через реки и хребты", "Палаточный лагерь и костёр"],
        overview: "Двухдневная экспедиция на внедорожниках 4x4 с опытными водителями — адреналин на глухих тропах Шахдага, переправы через реки и альпийские луга.",
        itinerary: [
          { title: "День 1: Баку → база Шахдаг", description: "Поездка на внедорожниках 4x4 к Шахдагу, маршрут по бездорожью, вечерний палаточный лагерь и ужин у костра." },
          { title: "День 2: альпийские луга", description: "Утренний поход, езда по высоким хребтам, обед и возвращение в Баку." },
        ],
        included: ["Транспорт 4x4 + водитель", "Палатка и спальное снаряжение", "Все приёмы пищи", "Гид", "Страховка"],
        excluded: ["Личное снаряжение", "Алкогольные напитки"],
      },
    },
  },
];

export const T = {
  az: {
    locale: "az-AZ", dir: "ltr" as const,
    brand: "M4STrip",
    nav: { tours: "Turlar", how: "Necə işləyir", contact: "Əlaqə", book: "Rezervasiya" },
    hero: { badge: "Azərbaycanı kəşf et", title1: "Doğma torpağın", title2: "möcüzələri", subtitle: "Xınalığın dağlarından Lənkəranın çay bağlarınadək — sənin marşrutun, sənin tempinlə.", searchPh: "Bölgə və ya tur axtar...", cta: "Turları gör" },
    stats: [{ k: "40+", v: "Daxili marşrut" }, { k: "12", v: "Bölgə" }, { k: "8K+", v: "Məmnun turist" }, { k: "4.9", v: "Orta reytinq" }],
    tours: { eyebrow: "Turlar", title: "Marşrutunu seç", subtitle: "Hər mövsüm üçün hazırlanmış turlar — yerli bələdçilər, kiçik qruplar, sənin tempin.", perPerson: "Bir nəfər üçün", book: "Rezerv et", details: "Detallı bax", empty: "Bu axtarışa uyğun tur tapılmadı.", days: "gün", people: "nəfər" },
    cats: { all: "Hamısı", mountain: "Dağ", history: "Tarix", nature: "Təbiət", wellness: "Müalicə", coast: "Sahil", offroad: "Offroad" },
    how: { eyebrow: "Necə işləyir", title: "Üç sadə addımda səyahətə hazır", steps: [{ t: "Marşrutu seç", d: "Kataloqdan ilgi sahənə uyğun turu seç və ya bizdən fərdi marşrut istə." }, { t: "Qrupu təsdiqlə", d: "Tarixi, qrup ölçüsünü və əlavə xidmətləri rahatlıqla seç." }, { t: "Yola çıx", d: "Yerli bələdçi sizi qarşılayır — qalanı kəşf etmək sizə qalır." }] },
    cta: { title: "Fərdi marşrut hazırlayaq", subtitle: "Tarixi, büdcəni və maraqlarını bildir — 24 saat ərzində sənə uyğun tur təklifi göndərək.", ph: "Email və ya WhatsApp", btn: "Təklif al" },
    footer: "Bütün hüquqlar qorunur.",
    detail: { back: "Geri", overview: "Tura ümumi baxış", itinerary: "Marşrut", included: "Qiymətə daxildir", excluded: "Qiymətə daxil deyil", bookNow: "İndi rezerv et", duration: "Müddət", group: "Qrup", rating: "Reytinq", price: "Qiymət", notFound: "Tur tapılmadı" },
    reviews: { eyebrow: "Rəylər", title: "Müştəri rəyləri", subtitle: "Bizimlə səyahət edən qonaqlarımızın təəssüratları.", tourLabel: "Tur" },

  },
  en: {
    locale: "en-US", dir: "ltr" as const,
    brand: "M4STrip",
    nav: { tours: "Tours", how: "How it works", contact: "Contact", book: "Book now" },
    hero: { badge: "Discover Azerbaijan", title1: "Wonders of your", title2: "homeland", subtitle: "From the peaks of Khinalug to the tea gardens of Lankaran — your route, your pace.", searchPh: "Search a region or tour...", cta: "Browse tours" },
    stats: [{ k: "40+", v: "Domestic routes" }, { k: "12", v: "Regions" }, { k: "8K+", v: "Happy travelers" }, { k: "4.9", v: "Average rating" }],
    tours: { eyebrow: "Tours", title: "Pick your route", subtitle: "Tours crafted for every season — local guides, small groups, your pace.", perPerson: "Per person", book: "Book", details: "View details", empty: "No tours match your search.", days: "days", people: "people" },
    cats: { all: "All", mountain: "Mountain", history: "History", nature: "Nature", wellness: "Wellness", coast: "Coast", offroad: "Offroad" },
    how: { eyebrow: "How it works", title: "Ready to travel in three simple steps", steps: [{ t: "Pick a route", d: "Choose a tour from the catalog or request a custom itinerary." }, { t: "Confirm the group", d: "Set the date, group size and add-ons with ease." }, { t: "Set off", d: "Your local guide meets you — the rest is for you to discover." }] },
    cta: { title: "Let's build a custom itinerary", subtitle: "Tell us the date, budget and interests — we'll send a tailored offer within 24 hours.", ph: "Email or WhatsApp", btn: "Get offer" },
    footer: "All rights reserved.",
    detail: { back: "Back", overview: "Overview", itinerary: "Itinerary", included: "What's included", excluded: "Not included", bookNow: "Book now", duration: "Duration", group: "Group", rating: "Rating", price: "Price", notFound: "Tour not found" },
    reviews: { eyebrow: "Reviews", title: "What our travelers say", subtitle: "Impressions from guests who traveled with us.", tourLabel: "Tour" },

  },
  he: {
    locale: "he-IL", dir: "rtl" as const,
    brand: "M4STrip",
    nav: { tours: "טיולים", how: "איך זה עובד", contact: "צור קשר", book: "להזמין" },
    hero: { badge: "גלו את אזרבייג'ן", title1: "פלאי", title2: "המולדת", subtitle: "מפסגות חינלוק עד מטעי התה של לנקרן — המסלול שלכם, בקצב שלכם.", searchPh: "חיפוש אזור או טיול...", cta: "לכל הטיולים" },
    stats: [{ k: "40+", v: "מסלולים פנימיים" }, { k: "12", v: "אזורים" }, { k: "8K+", v: "מטיילים מרוצים" }, { k: "4.9", v: "דירוג ממוצע" }],
    tours: { eyebrow: "טיולים", title: "בחרו את המסלול", subtitle: "טיולים לכל עונה — מדריכים מקומיים, קבוצות קטנות, הקצב שלכם.", perPerson: "לאדם", book: "הזמן", details: "לפרטים", empty: "לא נמצאו טיולים מתאימים.", days: "ימים", people: "אנשים" },
    cats: { all: "הכל", mountain: "הרים", history: "היסטוריה", nature: "טבע", wellness: "בריאות", coast: "חוף", offroad: "אופרוד" },
    how: { eyebrow: "איך זה עובד", title: "מוכנים לדרך בשלושה צעדים פשוטים", steps: [{ t: "בחרו מסלול", d: "בחרו טיול מהקטלוג או בקשו מסלול מותאם אישית." }, { t: "אשרו את הקבוצה", d: "קבעו תאריך, גודל קבוצה ושירותים נוספים בקלות." }, { t: "צאו לדרך", d: "המדריך המקומי יקבל אתכם — והשאר נתון לכם לגלות." }] },
    cta: { title: "נבנה לכם מסלול אישי", subtitle: "ספרו לנו על התאריך, התקציב והתחומים — תוך 24 שעות נשלח הצעה מותאמת.", ph: "אימייל או וואטסאפ", btn: "קבלו הצעה" },
    footer: "כל הזכויות שמורות.",
    detail: { back: "חזרה", overview: "סקירה", itinerary: "מסלול", included: "מה כלול", excluded: "לא כלול", bookNow: "הזמן עכשיו", duration: "משך", group: "קבוצה", rating: "דירוג", price: "מחיר", notFound: "הטיול לא נמצא" },
    reviews: { eyebrow: "ביקורות", title: "מה המטיילים שלנו אומרים", subtitle: "רשמים מהאורחים שטיילו איתנו.", tourLabel: "טיול" },

  },
  ar: {
    locale: "ar", dir: "rtl" as const,
    brand: "M4STrip",
    nav: { tours: "الجولات", how: "كيف نعمل", contact: "تواصل معنا", book: "احجز الآن" },
    hero: { badge: "اكتشف أذربيجان", title1: "عجائب", title2: "الوطن", subtitle: "من قمم خيناليق إلى بساتين الشاي في لنكران — مسارك، على إيقاعك.", searchPh: "ابحث عن منطقة أو جولة...", cta: "تصفّح الجولات" },
    stats: [{ k: "40+", v: "مسارات محلية" }, { k: "12", v: "منطقة" }, { k: "8K+", v: "مسافر سعيد" }, { k: "4.9", v: "متوسط التقييم" }],
    tours: { eyebrow: "الجولات", title: "اختر مسارك", subtitle: "جولات مصمّمة لكل موسم — مرشدون محليون، مجموعات صغيرة، على إيقاعك.", perPerson: "للفرد", book: "احجز", details: "عرض التفاصيل", empty: "لا توجد جولات تطابق بحثك.", days: "أيام", people: "أشخاص" },
    cats: { all: "الكل", mountain: "الجبال", history: "التاريخ", nature: "الطبيعة", wellness: "الاستشفاء", coast: "الساحل", offroad: "الطرق الوعرة" },
    how: { eyebrow: "كيف نعمل", title: "جاهز للسفر في ثلاث خطوات بسيطة", steps: [{ t: "اختر مساراً", d: "اختر جولة من الكتالوج أو اطلب مساراً مخصصاً." }, { t: "أكّد المجموعة", d: "حدّد التاريخ وحجم المجموعة والخدمات الإضافية بكل سهولة." }, { t: "انطلق", d: "يستقبلك مرشدك المحلي — والباقي متروك لك لتكتشفه." }] },
    cta: { title: "لنصمّم لك مساراً مخصصاً", subtitle: "أخبرنا بالتاريخ والميزانية واهتماماتك — وسنرسل لك عرضاً مخصصاً خلال 24 ساعة.", ph: "البريد الإلكتروني أو واتساب", btn: "احصل على عرض" },
    footer: "جميع الحقوق محفوظة.",
    detail: { back: "رجوع", overview: "نظرة عامة", itinerary: "المسار", included: "ما يشمله السعر", excluded: "غير مشمول", bookNow: "احجز الآن", duration: "المدة", group: "المجموعة", rating: "التقييم", price: "السعر", notFound: "الجولة غير موجودة" },
    reviews: { eyebrow: "التقييمات", title: "ماذا يقول مسافرونا", subtitle: "انطباعات من ضيوف سافروا معنا.", tourLabel: "الجولة" },

  },
  ru: {
    locale: "ru-RU", dir: "ltr" as const,
    brand: "M4STrip",
    nav: { tours: "Туры", how: "Как это работает", contact: "Контакты", book: "Забронировать" },
    hero: { badge: "Откройте Азербайджан", title1: "Чудеса вашей", title2: "родины", subtitle: "От вершин Хыналыга до чайных плантаций Ленкорани — ваш маршрут, ваш темп.", searchPh: "Поиск региона или тура...", cta: "Смотреть туры" },
    stats: [{ k: "40+", v: "Маршрутов по стране" }, { k: "12", v: "Регионов" }, { k: "8K+", v: "Довольных туристов" }, { k: "4.9", v: "Средний рейтинг" }],
    tours: { eyebrow: "Туры", title: "Выберите маршрут", subtitle: "Туры на любой сезон — местные гиды, небольшие группы, ваш темп.", perPerson: "За человека", book: "Забронировать", details: "Подробнее", empty: "По вашему запросу туров не найдено.", days: "дней", people: "чел." },
    cats: { all: "Все", mountain: "Горы", history: "История", nature: "Природа", wellness: "Оздоровление", coast: "Побережье", offroad: "Внедорожье" },
    how: { eyebrow: "Как это работает", title: "Готовы к путешествию за три простых шага", steps: [{ t: "Выберите маршрут", d: "Выберите тур из каталога или закажите индивидуальный маршрут." }, { t: "Подтвердите группу", d: "Легко выберите дату, размер группы и дополнительные услуги." }, { t: "Отправляйтесь", d: "Вас встречает местный гид — остальное вам предстоит открыть." }] },
    cta: { title: "Составим индивидуальный маршрут", subtitle: "Сообщите дату, бюджет и интересы — в течение 24 часов пришлём персональное предложение.", ph: "Email или WhatsApp", btn: "Получить предложение" },
    footer: "Все права защищены.",
    detail: { back: "Назад", overview: "Обзор", itinerary: "Маршрут", included: "Что включено", excluded: "Не включено", bookNow: "Забронировать", duration: "Длительность", group: "Группа", rating: "Рейтинг", price: "Цена", notFound: "Тур не найден" },
    reviews: { eyebrow: "Отзывы", title: "Что говорят наши путешественники", subtitle: "Впечатления гостей, путешествовавших с нами.", tourLabel: "Тур" },

  },
};

// ============= Customer reviews =============
export type Review = {
  id: string;
  rating: number;
  tourId: string;
  avatar: string;
  i18n: Record<Lang, { name: string; location: string; text: string }>;
};

export const REVIEWS: Review[] = [
  {
    id: "r1", rating: 5, tourId: "khinalug",
    avatar: "https://i.pravatar.cc/120?img=47",
    i18n: {
      az: { name: "Aynur Məmmədova", location: "Bakı, Azərbaycan", text: "Xınalıq turu həyatımın ən yaddaqalan səyahətlərindən biri oldu. Bələdçimiz çox səmimi idi, yerli ailədə keçirdiyimiz gecə isə əsl möcüzə. Mütləq yenidən gələcəyəm!" },
      en: { name: "Aynur Mammadova", location: "Baku, Azerbaijan", text: "The Khinalug tour was one of the most memorable trips of my life. Our guide was warm and welcoming, and the night we spent with a local family felt magical. I'll definitely come back!" },
      he: { name: "איינור ממדובה", location: "באקו, אזרבייג'ן", text: "הטיול לחינלוק היה מהמסעות הבלתי נשכחים בחיי. המדריך היה מקסים, והלילה אצל משפחה מקומית היה קסום. אחזור בוודאות!" },
      ar: { name: "أينور محمدوفا", location: "باكو، أذربيجان", text: "كانت جولة خيناليق واحدة من أكثر الرحلات التي لا تُنسى في حياتي. كان مرشدنا ودوداً ومرحّباً، والليلة التي قضيناها مع عائلة محلية بدت كالسحر. سأعود بالتأكيد!" },
      ru: { name: "Айнур Мамедова", location: "Баку, Азербайджан", text: "Тур в Хыналыг стал одним из самых незабываемых путешествий в моей жизни. Наш гид был тёплым и гостеприимным, а ночь, которую мы провели в местной семье, была просто волшебной. Обязательно вернусь!" },
    },
  },
  {
    id: "r2", rating: 5, tourId: "sheki",
    avatar: "https://i.pravatar.cc/120?img=12",
    i18n: {
      az: { name: "David Cohen", location: "Tel-Əviv, İsrail", text: "Şəki turu mükəmməl təşkil olunmuşdu. Karvansarayda gecələmə, halva dadma və şəbəkə emalatxanası — hər detal düşünülmüşdü. Təşəkkürlər!" },
      en: { name: "David Cohen", location: "Tel Aviv, Israel", text: "The Sheki tour was perfectly organized. Staying in the caravanserai, tasting halva and visiting the shebeke workshop — every detail was thought through. Thank you!" },
      he: { name: "דוד כהן", location: "תל אביב, ישראל", text: "הטיול לשקי היה מאורגן בצורה מושלמת. לינה בקרוואנסראי, טעימת חלווה וסדנת שבקה — כל פרט תוכנן היטב. תודה!" },
      ar: { name: "ديفيد كوهين", location: "تل أبيب، إسرائيل", text: "كانت جولة شكي منظّمة بشكل مثالي. الإقامة في الكاروانسراي، وتذوق الحلوى، وزيارة ورشة الشبكة — كل التفاصيل كانت مدروسة. شكراً لكم!" },
      ru: { name: "Дэвид Коэн", location: "Тель-Авив, Израиль", text: "Тур в Шеки был организован безупречно. Проживание в караван-сарае, дегустация халвы и посещение мастерской шебеке — каждая деталь была продумана. Спасибо!" },
    },
  },
  {
    id: "r3", rating: 5, tourId: "gabala",
    avatar: "https://i.pravatar.cc/120?img=32",
    i18n: {
      az: { name: "Sarah Johnson", location: "London, İngiltərə", text: "Qəbələdəki təbiət inanılmazdır. Tufandağ kanat yolu və Yeddi Gözəl şəlaləsi nəfəs kəsirdi. Kiçik qrup formatı da çox rahat idi." },
      en: { name: "Sarah Johnson", location: "London, UK", text: "The nature in Gabala is unreal. The Tufandag cable car and the Seven Beauties waterfall were breathtaking. The small group format was very comfortable." },
      he: { name: "שרה ג'ונסון", location: "לונדון, בריטניה", text: "הטבע בגבלה מדהים. הרכבל בטופנדאג ומפל שבע היפהפיות עוצרי נשימה. פורמט הקבוצה הקטנה היה נוח מאוד." },
      ar: { name: "سارة جونسون", location: "لندن، المملكة المتحدة", text: "الطبيعة في قبالة لا تُصدَّق. كان التلفريك في توفانداغ وشلال الجميلات السبع يخطفان الأنفاس. كما أن صيغة المجموعة الصغيرة كانت مريحة جداً." },
      ru: { name: "Сара Джонсон", location: "Лондон, Великобритания", text: "Природа в Габале нереальная. Канатная дорога Туфандаг и водопад Семи Красавиц захватывали дух. Формат небольшой группы был очень комфортным." },
    },
  },
  {
    id: "r4", rating: 5, tourId: "offroad",
    avatar: "https://i.pravatar.cc/120?img=15",
    i18n: {
      az: { name: "Rəşad Əliyev", location: "Sumqayıt, Azərbaycan", text: "Şahdağ offroad ekspedisiyası tam adrenalin idi. Peşəkar sürücülər, mükəmməl 4x4 avtomobillər və gecə tonqal ətrafında söhbətlər — hər şey əla idi." },
      en: { name: "Rashad Aliyev", location: "Sumgayit, Azerbaijan", text: "The Shahdag offroad expedition was pure adrenaline. Professional drivers, great 4x4s and evening chats around the fire — everything was excellent." },
      he: { name: "רשאד עלייב", location: "סומגאיט, אזרבייג'ן", text: "משלחת האופרוד בשאהדאג הייתה אדרנלין טהור. נהגים מקצועיים, רכבי 4x4 מעולים ושיחות ערב סביב המדורה — הכול היה מצוין." },
      ar: { name: "رشاد علييف", location: "سومقاييت، أذربيجان", text: "كانت رحلة شاهداغ على الطرق الوعرة أدرينالين خالص. سائقون محترفون، وسيارات دفع رباعي رائعة، وأحاديث مسائية حول النار — كان كل شيء ممتازاً." },
      ru: { name: "Рашад Алиев", location: "Сумгаит, Азербайджан", text: "Внедорожная экспедиция на Шахдаг — это чистый адреналин. Профессиональные водители, отличные внедорожники 4x4 и вечерние беседы у костра — всё было великолепно." },
    },
  },
  {
    id: "r5", rating: 4, tourId: "naftalan",
    avatar: "https://i.pravatar.cc/120?img=25",
    i18n: {
      az: { name: "Elena Petrova", location: "Moskva, Rusiya", text: "Naftalan proseduraları həqiqətən sağlamlığıma faydalı oldu. Otel rahat, işçilər peşəkardır. Yeganə istəyim daha uzun tur olsun." },
      en: { name: "Elena Petrova", location: "Moscow, Russia", text: "The Naftalan procedures really helped my health. The hotel was comfortable and the staff professional. My only wish is for a longer tour." },
      he: { name: "אלנה פטרובה", location: "מוסקבה, רוסיה", text: "הטיפולים בנפטלן באמת עזרו לבריאותי. המלון נוח והצוות מקצועי. הייתי שמחה על טיול ארוך יותר." },
      ar: { name: "إيلينا بيتروفا", location: "موسكو، روسيا", text: "ساعدت إجراءات النفطلان صحتي حقاً. كان الفندق مريحاً والطاقم محترفاً. أمنيتي الوحيدة هي أن تكون الجولة أطول." },
      ru: { name: "Елена Петрова", location: "Москва, Россия", text: "Процедуры в Нафталане действительно помогли моему здоровью. Отель был комфортным, а персонал профессиональным. Единственное моё пожелание — чтобы тур был подольше." },
    },
  },
  {
    id: "r6", rating: 5, tourId: "baku",
    avatar: "https://i.pravatar.cc/120?img=53",
    i18n: {
      az: { name: "Yosef Levi", location: "Yerusəlim, İsrail", text: "İçərişəhər turu bir günə çox şey sığdırdı. Bələdçi ivritcə səlis danışırdı, Alov Qüllələrinin şousu isə əla final oldu." },
      en: { name: "Yosef Levi", location: "Jerusalem, Israel", text: "The Old City tour packed so much into one day. Our guide spoke fluent Hebrew and the Flame Towers show was a perfect finale." },
      he: { name: "יוסף לוי", location: "ירושלים, ישראל", text: "סיור העיר העתיקה הצליח להכיל המון ביום אחד. המדריך דיבר עברית שוטפת ומופע מגדלי הלהבה היה סיום מושלם." },
      ar: { name: "يوسف ليفي", location: "القدس، إسرائيل", text: "استطاعت جولة المدينة القديمة أن تحتوي على الكثير في يوم واحد. تحدّث مرشدنا العبرية بطلاقة، وكان عرض أبراج اللهب خاتمة مثالية." },
      ru: { name: "Йосеф Леви", location: "Иерусалим, Израиль", text: "Тур по Старому городу вместил так много всего за один день. Наш гид свободно говорил на иврите, а шоу Пламенеющих башен стало идеальным завершением." },
    },
  },
];


export const CAT_KEYS: Array<"all" | CategoryKey> = ["all", "mountain", "history", "nature", "wellness", "coast", "offroad"];
export const LANGS: Array<{ code: Lang; label: string; native: string }> = [
  { code: "az", label: "AZ", native: "Azərbaycan" },
  { code: "en", label: "EN", native: "English" },
  { code: "ru", label: "RU", native: "Русский" },
  { code: "ar", label: "AR", native: "العربية" },
  { code: "he", label: "HE", native: "עברית" },
];

const VALID_LANGS: Lang[] = ["az", "en", "he", "ar", "ru"];
const LANG_KEY = "seyahet-lang";
export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "az";
  const v = window.localStorage.getItem(LANG_KEY) as Lang | null;
  return v && VALID_LANGS.includes(v) ? v : "az";
}
export function setStoredLang(lang: Lang) {
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, lang);
}
