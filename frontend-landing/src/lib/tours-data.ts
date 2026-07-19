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

// One event on a tour day (scheduled program item).
export type TourDayEvent = {
  title: string;
  type: string;
  time: string | null;
  location: string | null;
};

// One calendar day of a dated tour: active when it has a scheduled program,
// otherwise a free/rest day.
export type TourDay = {
  date: string; // YYYY-MM-DD
  active: boolean;
  events: TourDayEvent[];
};

// A bookable dated departure = an internal Tour linked to this catalog tour.
// Price is inherited from the catalog; remaining = capacity - bookedSeats.
export type TourDate = {
  id: string; // internal tour id
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  capacity: number;
  bookedSeats: number;
  price: number;
  status: string; // planned | active | completed | cancelled
  days: TourDay[]; // day-by-day program (active/rest)
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
  dates: TourDate[];
};


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
    detail: { back: "Geri", overview: "Tura ümumi baxış", itinerary: "Marşrut", included: "Qiymətə daxildir", excluded: "Qiymətə daxil deyil", bookNow: "İndi rezerv et", duration: "Müddət", group: "Qrup", rating: "Reytinq", price: "Qiymət", notFound: "Tur tapılmadı", dates: "Mövcud tarixlər", noDates: "Hazırda açıq tarix yoxdur", seats: "yer", schedule: "Gün-gün proqram", restDay: "Sərbəst gün", activeDays: "aktiv gün", restDays: "sərbəst gün" },
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
    detail: { back: "Back", overview: "Overview", itinerary: "Itinerary", included: "What's included", excluded: "Not included", bookNow: "Book now", duration: "Duration", group: "Group", rating: "Rating", price: "Price", notFound: "Tour not found", dates: "Available dates", noDates: "No open dates right now", seats: "seats", schedule: "Day-by-day program", restDay: "Free day", activeDays: "active days", restDays: "free days" },
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
    detail: { back: "חזרה", overview: "סקירה", itinerary: "מסלול", included: "מה כלול", excluded: "לא כלול", bookNow: "הזמן עכשיו", duration: "משך", group: "קבוצה", rating: "דירוג", price: "מחיר", notFound: "הטיול לא נמצא", dates: "תאריכים זמינים", noDates: "אין תאריכים פתוחים כרגע", seats: "מקומות", schedule: "תוכנית יומית", restDay: "יום חופשי", activeDays: "ימי פעילות", restDays: "ימים חופשיים" },
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
    detail: { back: "رجوع", overview: "نظرة عامة", itinerary: "المسار", included: "ما يشمله السعر", excluded: "غير مشمول", bookNow: "احجز الآن", duration: "المدة", group: "المجموعة", rating: "التقييم", price: "السعر", notFound: "الجولة غير موجودة", dates: "التواريخ المتاحة", noDates: "لا توجد تواريخ متاحة حالياً", seats: "مقاعد", schedule: "برنامج يومي", restDay: "يوم حر", activeDays: "أيام نشطة", restDays: "أيام حرة" },
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
    detail: { back: "Назад", overview: "Обзор", itinerary: "Маршрут", included: "Что включено", excluded: "Не включено", bookNow: "Забронировать", duration: "Длительность", group: "Группа", rating: "Рейтинг", price: "Цена", notFound: "Тур не найден", dates: "Доступные даты", noDates: "Сейчас нет открытых дат", seats: "мест", schedule: "Программа по дням", restDay: "Свободный день", activeDays: "активных дней", restDays: "свободных дней" },
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
