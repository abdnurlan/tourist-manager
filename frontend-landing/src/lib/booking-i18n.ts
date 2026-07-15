import type { Lang } from "@/lib/tours-data";

type BookingCopy = {
  steps: [string, string, string];
  description: string;
  travelDate: string;
  selectDate: string;
  peopleCount: string;
  people: string;
  fullName: string;
  namePlaceholder: string;
  phone: string;
  email: string;
  emailPlaceholder: string;
  total: string;
  continueToPayment: string;
  date: string;
  totalAmount: string;
  cardNumber: string;
  expiry: string;
  secureNote: string;
  back: string;
  processing: string;
  pay: string;
  confirmed: string;
  confirmationPrefix: string;
  confirmationSuffix: string;
  tour: string;
  amount: string;
  close: string;
};

export const BOOKING_COPY: Record<Lang, BookingCopy> = {
  az: {
    steps: ["Detallar", "Ödəniş", "Təsdiq"],
    description: "Tur rezervasiyası",
    travelDate: "Səyahət tarixi",
    selectDate: "Tarix seç",
    peopleCount: "Nəfər sayı",
    people: "nəfər",
    fullName: "Ad və soyad",
    namePlaceholder: "Ayan Məmmədov",
    phone: "Telefon",
    email: "Email",
    emailPlaceholder: "sen@example.com",
    total: "Cəmi",
    continueToPayment: "Ödənişə keç",
    date: "Tarix",
    totalAmount: "Ümumi məbləğ",
    cardNumber: "Kart nömrəsi",
    expiry: "Bitmə tarixi",
    secureNote: "Ödənişiniz şifrələnir. Bu demo rejimidir — real kartdan məbləğ tutulmur.",
    back: "Geri",
    processing: "Ödəniş edilir...",
    pay: "ödə",
    confirmed: "Rezervasiya təsdiqləndi",
    confirmationPrefix: "Təsdiq detalları",
    confirmationSuffix: "ünvanına göndərildi.",
    tour: "Tur",
    amount: "Məbləğ",
    close: "Bağla",
  },
  en: {
    steps: ["Details", "Payment", "Confirmation"],
    description: "Tour booking",
    travelDate: "Travel date",
    selectDate: "Select a date",
    peopleCount: "Number of travelers",
    people: "people",
    fullName: "Full name",
    namePlaceholder: "Alex Morgan",
    phone: "Phone",
    email: "Email",
    emailPlaceholder: "you@example.com",
    total: "Total",
    continueToPayment: "Continue to payment",
    date: "Date",
    totalAmount: "Total amount",
    cardNumber: "Card number",
    expiry: "Expiry date",
    secureNote: "Your payment is encrypted. This is a demo — your card will not be charged.",
    back: "Back",
    processing: "Processing...",
    pay: "Pay",
    confirmed: "Booking confirmed",
    confirmationPrefix: "Confirmation details were sent to",
    confirmationSuffix: ".",
    tour: "Tour",
    amount: "Amount",
    close: "Close",
  },
  he: {
    steps: ["פרטים", "תשלום", "אישור"],
    description: "הזמנת טיול",
    travelDate: "תאריך הנסיעה",
    selectDate: "בחרו תאריך",
    peopleCount: "מספר מטיילים",
    people: "מטיילים",
    fullName: "שם מלא",
    namePlaceholder: "נועה כהן",
    phone: "טלפון",
    email: "אימייל",
    emailPlaceholder: "you@example.com",
    total: "סה״כ",
    continueToPayment: "המשך לתשלום",
    date: "תאריך",
    totalAmount: "סכום כולל",
    cardNumber: "מספר כרטיס",
    expiry: "תאריך תפוגה",
    secureNote: "התשלום מוצפן. זהו מצב הדגמה — הכרטיס לא יחויב.",
    back: "חזרה",
    processing: "מעבד תשלום...",
    pay: "שלמו",
    confirmed: "ההזמנה אושרה",
    confirmationPrefix: "פרטי האישור נשלחו אל",
    confirmationSuffix: ".",
    tour: "טיול",
    amount: "סכום",
    close: "סגירה",
  },
  ar: {
    steps: ["التفاصيل", "الدفع", "التأكيد"],
    description: "حجز الجولة",
    travelDate: "تاريخ السفر",
    selectDate: "اختر التاريخ",
    peopleCount: "عدد المسافرين",
    people: "أشخاص",
    fullName: "الاسم الكامل",
    namePlaceholder: "ليلى أحمد",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    total: "المجموع",
    continueToPayment: "المتابعة إلى الدفع",
    date: "التاريخ",
    totalAmount: "المبلغ الإجمالي",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ الانتهاء",
    secureNote: "دفعتك مشفّرة. هذا وضع تجريبي — لن يتم خصم أي مبلغ من بطاقتك.",
    back: "رجوع",
    processing: "جارٍ الدفع...",
    pay: "ادفع",
    confirmed: "تم تأكيد الحجز",
    confirmationPrefix: "أُرسلت تفاصيل التأكيد إلى",
    confirmationSuffix: ".",
    tour: "الجولة",
    amount: "المبلغ",
    close: "إغلاق",
  },
  ru: {
    steps: ["Детали", "Оплата", "Подтверждение"],
    description: "Бронирование тура",
    travelDate: "Дата поездки",
    selectDate: "Выберите дату",
    peopleCount: "Количество туристов",
    people: "чел.",
    fullName: "Имя и фамилия",
    namePlaceholder: "Анна Иванова",
    phone: "Телефон",
    email: "Email",
    emailPlaceholder: "you@example.com",
    total: "Итого",
    continueToPayment: "Перейти к оплате",
    date: "Дата",
    totalAmount: "Общая сумма",
    cardNumber: "Номер карты",
    expiry: "Срок действия",
    secureNote: "Платёж зашифрован. Это деморежим — средства с карты не списываются.",
    back: "Назад",
    processing: "Оплата...",
    pay: "Оплатить",
    confirmed: "Бронирование подтверждено",
    confirmationPrefix: "Детали подтверждения отправлены на",
    confirmationSuffix: ".",
    tour: "Тур",
    amount: "Сумма",
    close: "Закрыть",
  },
};
