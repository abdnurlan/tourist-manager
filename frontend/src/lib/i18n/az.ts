/* ─────────────────────────────────────────────────────────────
   Tur Planlayıcı — Azerbaijani dictionary (CONTRACT §9)
   Single source of all user-facing strings. No English may leak.
   ───────────────────────────────────────────────────────────── */

export const az = {
  // §9.1 App / brand
  app: {
    name: "Tur Planlayıcı",
    tagline: "Şəxsi tur planlayıcınız",
  },

  // §9.2 Navigation
  nav: {
    dashboard: "Ana səhifə",
    tours: "Turlar",
    calendar: "Təqvim",
    search: "Axtarış",
    ai: "AI Köməkçi",
    settings: "Tənzimləmələr",
  },

  // §9.3 Screen titles
  screen: {
    login: "Giriş",
    dashboard: "Ana səhifə",
    tours: "Turlar",
    tour_new: "Yeni tur",
    tour_detail: "Tur təfərrüatı",
    event_new: "Yeni tədbir",
    event_edit: "Tədbiri redaktə et",
    calendar: "Təqvim",
    search: "Axtarış",
    ai: "AI Köməkçi",
    settings: "Tənzimləmələr",
  },

  // §9.4 Common actions / buttons
  action: {
    save: "Yadda saxla",
    cancel: "Ləğv et",
    delete: "Sil",
    edit: "Redaktə et",
    create: "Yarat",
    add: "Əlavə et",
    back: "Geri",
    close: "Bağla",
    confirm: "Təsdiqlə",
    search: "Axtar",
    login: "Daxil ol",
    logout: "Çıxış",
    add_tour: "Tur əlavə et",
    add_event: "Tədbir əlavə et",
    view_all: "Hamısına bax",
    send: "Göndər",
    retry: "Yenidən cəhd et",
    today: "Bu gün",
    filter: "Filtr",
    clear: "Təmizlə",
  },

  // §9.5 Auth / login
  auth: {
    title: "Xoş gəlmisiniz",
    subtitle: "Davam etmək üçün daxil olun",
    username: "İstifadəçi adı",
    password: "Şifrə",
    username_placeholder: "İstifadəçi adınızı daxil edin",
    password_placeholder: "Şifrənizi daxil edin",
    submit: "Daxil ol",
    logging_in: "Daxil olunur...",
    logout_confirm: "Çıxış etmək istədiyinizə əminsiniz?",
  },

  // §9.6 Field labels
  field: {
    title: "Başlıq",
    description: "Təsvir",
    start_date: "Başlama tarixi",
    end_date: "Bitmə tarixi",
    date: "Tarix",
    time: "Saat",
    type: "Növ",
    location: "Məkan",
    participants: "İştirakçılar",
    phone: "Telefon",
    price: "Qiymət",
    currency: "Valyuta",
    payment_status: "Ödəniş statusu",
    reminder_time: "Xatırlatma vaxtı",
    attachment: "Əlavə",
    notes: "Qeydlər",
    status: "Status",
    source: "Mənbə",
    full_name: "Ad, soyad",
    passport: "Pasport nömrəsi",
    nationality: "Vətəndaşlıq",
    optional: "(istəyə bağlı)",
  },

  // §9.7 Validation messages
  validation: {
    required: "Bu sahə tələb olunur.",
    title_required: "Başlıq tələb olunur.",
    date_required: "Tarix tələb olunur.",
    start_required: "Başlama tarixi tələb olunur.",
    end_required: "Bitmə tarixi tələb olunur.",
    end_after_start: "Bitmə tarixi başlama tarixindən sonra olmalıdır.",
    invalid_date: "Tarix formatı yanlışdır.",
    invalid_time: "Saat formatı yanlışdır (SS:DD).",
    invalid_price: "Qiymət düzgün rəqəm olmalıdır.",
    min_chars: "Ən azı {n} simvol olmalıdır.",
    username_required: "İstifadəçi adı tələb olunur.",
    password_required: "Şifrə tələb olunur.",
  },

  // §9.8 Empty states
  empty: {
    tours: {
      title: "Hələ tur yoxdur",
      subtitle: "İlk turunuzu yaradın və ya Telegram bot vasitəsilə əlavə edin.",
    },
    events: {
      title: "Bu turda tədbir yoxdur",
      subtitle: "İlk tədbiri əlavə edin.",
    },
    today: {
      title: "Bu gün üçün plan yoxdur",
      subtitle: "Bu gün heç bir tədbiriniz yoxdur. Dincəlin!",
    },
    calendar: {
      title: "Bu aralıqda tədbir yoxdur",
      subtitle: "Başqa tarix aralığı seçin.",
    },
    search: {
      title: "Nəticə tapılmadı",
      subtitle: "Başqa açar söz ilə yenidən axtarın.",
      idle: "Axtarışa başlamaq üçün yazın.",
    },
    ai: {
      title: "Söhbət hələ başlamayıb",
      subtitle: 'Aşağıdan sual yazın, məsələn: "Bu gün planım nədir?"',
    },
    reminders: {
      title: "Xatırlatma yoxdur",
    },
    activity: {
      title: "Fəaliyyət yoxdur",
    },
  },

  // §9.9 Toasts / notifications
  toast: {
    tour_created: "Tur yaradıldı.",
    tour_updated: "Tur yeniləndi.",
    tour_deleted: "Tur silindi.",
    event_created: "Tədbir əlavə edildi.",
    event_updated: "Tədbir yeniləndi.",
    event_deleted: "Tədbir silindi.",
    saved: "Yadda saxlanıldı.",
    deleted: "Silindi.",
    error: "Xəta baş verdi.",
    network_error: "Şəbəkə xətası. İnternet bağlantısını yoxlayın.",
    login_success: "Xoş gəldiniz!",
    logout_success: "Çıxış edildi.",
    copied: "Kopyalandı.",
    delete_confirm:
      "Silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.",
  },

  // §9.10 Dashboard
  dashboard: {
    greeting_morning: "Sabahınız xeyir",
    greeting_day: "Salam",
    greeting_evening: "Axşamınız xeyir",
    today_plan: "Bugünkü plan",
    upcoming_events: "Yaxın tədbirlər",
    upcoming_tours: "Yaxın turlar",
    active_tours: "Aktiv turlar",
    stat_active_tours: "Aktiv turlar",
    stat_today_events: "Bugünkü tədbirlər",
    stat_waiting: "Gözləyən",
    reminders: "Xatırlatmalar",
    recent_activity: "Son fəaliyyət",
    telegram: "Telegram",
    weather: "Hava",
    weather_soon: "Hava məlumatı tezliklə əlavə olunacaq.",
    // Screen-local (Dashboard) additions
    today_events: "Bu günün tədbirləri",
    today_reminders: "Bu günün xatırlatmaları",
    quick_actions: "Sürətli əməliyyatlar",
    quick_new_tour: "Yeni tur",
    quick_new_event: "Yeni tədbir",
    quick_ai: "AI Köməkçi",
    quick_calendar: "Təqvim",
    no_upcoming_events: "Yaxınlaşan tədbir yoxdur",
    no_active_tours: "Aktiv tur yoxdur",
    no_upcoming_tours: "Yaxınlaşan tur yoxdur",
    waiting_today: "Bu gün gözləyən işlər",
    waiting_today_done: "Bu gün gözləyən iş yoxdur. Hər şey hazırdır!",
    weather_location: "Yer",
  },

  // §9.11 Telegram status labels
  telegram: {
    connected: "Qoşulub",
    disconnected: "Qoşulmayıb",
    mode_webhook: "Webhook rejimi",
    mode_polling: "Sorğu (polling) rejimi",
    last_message: "Son mesaj",
  },

  // §9.12 Event type labels
  eventType: {
    transfer: "Transfer",
    hotel: "Otel",
    restaurant: "Restoran",
    tour: "Tur",
    flight: "Uçuş",
    note: "Qeyd",
    other: "Digər",
  },

  // §9.13 Event status labels
  eventStatus: {
    planned: "Planlaşdırılıb",
    done: "Tamamlanıb",
    cancelled: "Ləğv edilib",
  },

  // §9.14 Tour status labels
  tourStatus: {
    planned: "Planlaşdırılıb",
    active: "Aktiv",
    completed: "Tamamlanıb",
    cancelled: "Ləğv edilib",
  },

  // §9.15 Payment status labels
  payment: {
    unpaid: "Ödənilməyib",
    partial: "Qismən",
    paid: "Ödənilib",
  },

  // §9.16 Source labels
  source: {
    manual: "Əl ilə",
    telegram: "Telegram",
    ai: "AI",
  },

  // §9.17 / §9.18 / §9.19 Calendar
  calendar: {
    months: [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "İyun",
      "İyul",
      "Avqust",
      "Sentyabr",
      "Oktyabr",
      "Noyabr",
      "Dekabr",
    ],
    monthsShort: [
      "Yan",
      "Fev",
      "Mar",
      "Apr",
      "May",
      "İyn",
      "İyl",
      "Avq",
      "Sen",
      "Okt",
      "Noy",
      "Dek",
    ],
    // Week starts Monday
    weekdays: [
      "Bazar ertəsi",
      "Çərşənbə axşamı",
      "Çərşənbə",
      "Cümə axşamı",
      "Cümə",
      "Şənbə",
      "Bazar",
    ],
    weekdaysShort: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"],
    today: "Bu gün",
    tomorrow: "Sabah",
    month: "Ay",
    week: "Həftə",
    day: "Gün",
    agenda: "Cədvəl",
    next: "Növbəti",
    prev: "Əvvəlki",
    no_events: "Tədbir yoxdur",
  },

  // §9.20 Day-section
  tour: {
    day_word: "gün",
  },

  // §9.21 Settings
  settings: {
    account: "Hesab",
    username: "İstifadəçi adı",
    role: "Rol",
    telegram: "Telegram bot",
    telegram_status: "Bot statusu",
    about: "Haqqında",
    version: "Versiya",
    logout: "Çıxış",
    language: "Dil",
    language_value: "Azərbaycan dili",
    appearance: "Görünüş",
    theme_light: "İşıqlı",
    theme_dark: "Qaranlıq",
    // Screen-local keys (Tənzimləmələr ekranı)
    subtitle: "Hesab, dil, Telegram və tətbiq haqqında məlumat",
    profile: "Profil",
    role_admin: "Administrator",
    language_only: "Hazırda yalnız Azərbaycan dili dəstəklənir.",
    telegram_how_title: "Necə qoşulmalı?",
    telegram_how_body:
      "Telegram-da botu açın və /start əmrini göndərin. Yalnız sahibin hesabı bota giriş əldə edir. Qoşulduqdan sonra turları və tədbirləri birbaşa Telegram üzərindən idarə edə bilərsiniz.",
    telegram_never: "Hələ mesaj yoxdur",
    telegram_mode: "Rejim",
    currency: "Defolt valyuta",
    currency_hint:
      "Yeni tədbirlər üçün ilkin valyuta (yalnız bu cihazda saxlanılır).",
    about_body:
      "Şəxsi tur planlayıcı — turlar, transferlər, otellər və gündəlik proqramınızı bir yerdə idarə edin.",
    logout_action: "Hesabdan çıxış",
    logout_hint: "Cari sessiyanı bağlayıb giriş səhifəsinə qayıdın.",
    logging_out: "Çıxış edilir...",
  },

  // §9.22 AI assistant
  ai: {
    title: "AI Köməkçi",
    placeholder: "Sualınızı yazın...",
    thinking: "Düşünür...",
    history: "Tarixçə",
    not_configured: "AI hələ konfiqurasiya olunmayıb.",
    example_1: "Bu gün planım nədir?",
    example_2: "Sabah nə işlərim var?",
    example_3: "Bakı turunun proqramını göstər.",
    // Screen-local keys (AI Köməkçi ekranı)
    subtitle: "Telegram və ChatGPT üzərindən işləyir",
    intro_greeting: "Salam! Mən sizin AI Köməkçinizəm.",
    intro_body:
      "Mən Telegram və ChatGPT üzərində işləyirəm və davamlı olaraq genişlənirəm. Turlarınızı planlaya, transferlər əlavə edə və gününüzün proqramını göstərə bilərəm.",
    suggestions_title: "Nümunə əmrlər",
    suggestion_1: "18-22 iyun üçün Bakı turu yarat.",
    suggestion_2: "Sabah saat 9-da transfer əlavə et.",
    suggestion_3: "Bu gün planım nədir?",
    suggestion_4: "Bu həftə restoran tədbirlərini göstər.",
    suggestion_5: "Aktiv turlarımı göstər.",
    history_title: "Söhbət tarixçəsi",
    history_subtitle: "Telegram və veb söhbətləriniz",
    history_empty_title: "Hələ söhbət yoxdur",
    history_empty_subtitle:
      "Aşağıdan ilk sualınızı yazın və ya Telegram bot vasitəsilə yazışın.",
    you: "Siz",
    assistant: "AI Köməkçi",
    now: "İndi",
    send: "Göndər",
    error_reply: "Cavab alınmadı. Yenidən cəhd edin.",
    voice_message: "Səs mesajı",
    photo_message: "Şəkil",
    document_message: "Sənəd",
    command_message: "Əmr",
  },

  // Search screen (screen-local labels)
  search: {
    placeholder: "Tur, tədbir, məkan, telefon axtarın...",
    tours_group: "Turlar",
    events_group: "Tədbirlər",
    results_count: "{n} nəticə",
    searching: "Axtarılır...",
  },

  // AI intent labels (backend intent.go → AZ). Unknown intents hide the badge.
  aiIntent: {
    create_tour: "Yeni tur",
    add_event: "Tədbir əlavə et",
    today_plan: "Bugünkü plan",
    tomorrow_plan: "Sabahkı plan",
    list_tours: "Turlar",
    list_active: "Aktiv turlar",
    filter_events: "Tədbirləri süz",
    show_tour_program: "Tur proqramı",
    find_event: "Tədbir tap",
    set_event_price: "Qiymət təyin et",
  },

  // Event create/edit form (screen-local copy)
  event: {
    form: {
      reminder_hint: "Xatırlatma vaxtını seçin",
      attachment_placeholder: "Sənəd və ya şəkil linki",
      participants_placeholder: "Adlar (istəyə bağlı)",
      none_payment: "Seçilməyib",
      // Progressive disclosure — "daha çox detal" bölməsi və qrupları
      more_details: "Daha çox detal",
      less_details: "Detalları gizlə",
      group_place: "Yer və əlaqə",
      group_payment: "Ödəniş",
      group_reminder: "Xatırlatma",
      group_extra: "Əlavə və qeydlər",
      // Nisbi xatırlatma seçimləri (mütləq datetime əvəzinə)
      reminder_none: "Xatırlatma yoxdur",
      reminder_at_time: "Tədbir vaxtında",
      reminder_10m: "10 dəqiqə əvvəl",
      reminder_1h: "1 saat əvvəl",
      reminder_3h: "3 saat əvvəl",
      reminder_1d: "1 gün əvvəl",
      reminder_needs_time: "Xatırlatma üçün əvvəlcə tarix (və vaxt) seçin",
    },
    // Tip-spesifik sahə etiketləri (details JSON)
    details: {
      from: "Haradan",
      to: "Haraya",
      driver: "Maşın / Sürücü",
      driver_phone: "Sürücü telefonu",
      hotel_name: "Otel adı",
      address: "Ünvan",
      check_in: "Giriş (check-in)",
      check_out: "Çıxış (check-out)",
      room: "Otaq növü / nömrəsi",
      venue: "Məkan adı",
      reservation_time: "Rezervasiya vaxtı",
      party_size: "Nəfər sayı",
      guests_label: "Qonaqlar",
      guests_hint: "Bu tədbirdə iştirak edən turistlər",
      no_guests: "Əvvəlcə tura qonaq əlavə edin",
    },
  },

  // Qonaqlar (turistlər — tura bağlı)
  guest: {
    section_title: "Qonaqlar",
    add: "Qonaq əlavə et",
    edit: "Qonağı redaktə et",
    empty_title: "Hələ qonaq yoxdur",
    empty_subtitle: "Bu tura turist əlavə edin",
    delete_confirm: "Bu qonağı silmək istəyirsiniz?",
    created: "Qonaq əlavə edildi",
    updated: "Qonaq yeniləndi",
    deleted: "Qonaq silindi",
    name_required: "Ad tələb olunur",
  },

  // §9.23 Misc / status / loading
  common: {
    loading: "Yüklənir...",
    error_title: "Nə isə səhv getdi",
    error_subtitle: "Xəta baş verdi. Yenidən cəhd edin.",
    not_found_title: "Səhifə tapılmadı",
    not_found_subtitle: "Axtardığınız səhifə mövcud deyil.",
    go_home: "Ana səhifəyə qayıt",
    yes: "Bəli",
    no: "Xeyr",
    all: "Hamısı",
    none: "Yoxdur",
    days: "gün",
    tour: "tur",
    tours: "tur",
    event: "tədbir",
    events: "tədbir",
  },
} as const;

export type Dictionary = typeof az;

// Convenience typed accessors for enum → label maps.
import type {
  EventType,
  EventStatus,
  TourStatus,
  PaymentStatus,
  EventSource,
} from "@/lib/types";

export const eventTypeLabel = (t: EventType): string => az.eventType[t];
export const eventStatusLabel = (s: EventStatus): string => az.eventStatus[s];
export const tourStatusLabel = (s: TourStatus): string => az.tourStatus[s];
export const paymentLabel = (p: PaymentStatus): string => az.payment[p];
export const sourceLabel = (s: EventSource): string => az.source[s];

/** AI intent → Azerbaijani label. Returns undefined for unknown intents (badge hidden). */
export const intentLabel = (intent: string): string | undefined =>
  (az.aiIntent as Record<string, string>)[intent];

/** Replace {n} style placeholders. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
