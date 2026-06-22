import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

const en: Dict = {
  // nav
  "nav.home": "Home",
  "nav.menu": "Sweets",
  "nav.about": "Our Story",
  "nav.contact": "Visit Us",
  "nav.admin": "Admin",
  "nav.account": "Account",
  "nav.signin": "Sign in",
  "nav.cart": "Box",
  "nav.menuLabel": "Menu",
  "nav.favorites": "Favorites",
  // header strip
  "header.openNow": "Open today · Fresh trays every hour",
  // home
  "home.h1.line1": "Crafted",
  "home.h1.line2": "by hand,",
  "home.h1.line3": "fit for royalty.",
  "home.intro":
    "Royal Sweets is a family confectionery in Al-Sumou crafting baklava, kunafa, and Levantine pastries from the finest pistachios, almonds and clarified butter — boxed and delivered to your door.",
  "home.orderNow": "Order a box",
  "home.ourStory": "Our story",
  "home.feature.delivery": "Same-day delivery",
  "home.feature.fire": "Hand-crafted daily",
  "home.feature.local": "Premium pistachios",
  "home.review": "\"The kunafa naameh melts on the tongue — the most refined I've tasted.\"",
  "home.reviewBy": "— Layla S., regular guest",
  "home.todaysSpecial": "Today's special",
  "home.specialOffer": "−15% on gift boxes",
  "home.browse": "Browse the boutique",
  "home.seeAll": "See all",
  "home.chefsPicks": "The royal selection",
  "home.featuredA": "Our",
  "home.featuredB": "signature",
  "home.featuredC": "trays",
  "home.popular": "Loved this week",
  "home.viewFull": "View the full menu →",
  "home.ctaTitle": "First order? Save 20% on your gift box.",
  "home.ctaBody1": "Use code",
  "home.ctaBody2": "at checkout. Free local delivery on boxes over 50 SAR.",
  "home.ctaButton": "Start your box",
  // menu
  "menu.kicker": "The boutique",
  "menu.titleA": "Every piece,",
  "menu.titleB": "freshly baked.",
  "menu.subtitle": "Browse our trays, build your box and have it delivered the same day.",
  "menu.search": "Search sweets…",
  "menu.empty": "No sweets match your search.",
  // food card
  "card.save": "Save",
  "card.min": "min",
  "card.cal": "cal",
  "card.add": "Add",
  "fav.add": "Save to favorites",
  "fav.remove": "Remove from favorites",
  "fav.title": "Your favorites",
  "fav.subtitle": "Sweets you've saved for later.",
  "fav.empty": "No favorites yet. Tap the heart on any sweet to save it.",
  "fav.browse": "Browse the boutique",
  // reviews
  "reviews.title": "Reviews",
  "reviews.count": "reviews",
  "reviews.empty": "No reviews yet. Be the first to share after your box arrives.",
  "reviews.rate": "Rate",
  "reviews.yourRating": "Your rating",
  "reviews.yourComment": "Your comment",
  "reviews.placeholder": "Tell us what you loved (or didn't)…",
  "reviews.submit": "Submit review",
  "reviews.update": "Update review",
  "reviews.cancel": "Cancel",
  "reviews.saved": "Review saved",
  "reviews.edit": "Edit review",
  "reviews.write": "Review",
  // cart
  "cart.emptyTitle": "Your box is empty",
  "cart.emptyBody": "Add a few sweets from the boutique and they'll show up here.",
  "cart.browse": "Browse sweets",
  "cart.title": "Your gift box",
  "cart.itemsReady": "pieces · ready when you are",
  "cart.remove": "Remove",
  "cart.summary": "Order summary",
  "cart.subtotal": "Subtotal",
  "cart.delivery": "Delivery",
  "cart.tax": "VAT",
  "cart.total": "Total",
  "cart.checkout": "Checkout",
  "cart.addMore": "Add more sweets",
  // footer
  "footer.brand": "Royal Sweets",
  "footer.brandAr": "حلويات الملكي",
  "footer.about":
    "A family confectionery in Al-Sumou specialising in hand-crafted Levantine sweets — baklava, kunafa, mafroukeh and more — boxed with care and delivered fresh.",
  "footer.visit": "Visit",
  "footer.address": "Al-Sumou Center, Asfi, Al-Sumou",
  "footer.hours": "Open daily · 9am – 11pm",
  "footer.phone": "0598 356 306",
  "footer.explore": "Explore",
  "footer.copyright": "Crafted with care, served like royalty.",
  // language
  "lang.switch": "العربية",
};

const ar: Dict = {
  "nav.home": "الرئيسية",
  "nav.menu": "الحلويات",
  "nav.about": "قصتنا",
  "nav.contact": "زورنا",
  "nav.admin": "الإدارة",
  "nav.account": "حسابي",
  "nav.signin": "تسجيل الدخول",
  "nav.cart": "السلة",
  "nav.menuLabel": "القائمة",
  "nav.favorites": "المفضّلة",
  "header.openNow": "مفتوح اليوم · صواني طازجة كل ساعة",
  "home.h1.line1": "صناعةٌ",
  "home.h1.line2": "يدويّة،",
  "home.h1.line3": "تليقُ بالملوك.",
  "home.intro":
    "حلويات الملكي محلٌّ عائليّ في السموع يصنع البقلاوة والكنافة والحلويات الشاميّة من أجود الفستق واللوز والسمن البلدي — تُغلَّف وتُوصَل إلى بابك.",
  "home.orderNow": "اطلب علبتك",
  "home.ourStory": "قصتنا",
  "home.feature.delivery": "توصيل في نفس اليوم",
  "home.feature.fire": "صناعة يدويّة يوميّاً",
  "home.feature.local": "فستقٌ فاخر",
  "home.review": "«الكنافة الناعمة تذوبُ على اللسان — الأرقى التي تذوّقتها.»",
  "home.reviewBy": "— ليلى س.، زبونة دائمة",
  "home.todaysSpecial": "عرض اليوم",
  "home.specialOffer": "خصم ١٥٪ على علب الإهداء",
  "home.browse": "تجوّل في البوتيك",
  "home.seeAll": "عرض الكل",
  "home.chefsPicks": "اختيارات الملكي",
  "home.featuredA": "صوانينا",
  "home.featuredB": "المميّزة",
  "home.featuredC": "لهذا الأسبوع",
  "home.popular": "الأكثر طلباً",
  "home.viewFull": "عرض القائمة كاملة ←",
  "home.ctaTitle": "أوّل طلب؟ خصم ٢٠٪ على علبة الإهداء.",
  "home.ctaBody1": "استخدم الكود",
  "home.ctaBody2": "عند الدفع. توصيل مجّاني محلّياً للطلبات فوق ٥٠ ر.س.",
  "home.ctaButton": "ابدأ علبتك",
  "menu.kicker": "البوتيك",
  "menu.titleA": "كلّ قطعةٍ",
  "menu.titleB": "تُخبَز اليوم.",
  "menu.subtitle": "تصفّح صوانينا، صمّم علبتك، واستلمها في نفس اليوم.",
  "menu.search": "ابحث عن حلوى…",
  "menu.empty": "لا توجد حلويات مطابقة لبحثك.",
  "card.save": "وفّر",
  "card.min": "دقيقة",
  "card.cal": "سعرة",
  "card.add": "أضف",
  "fav.add": "أضف إلى المفضّلة",
  "fav.remove": "إزالة من المفضّلة",
  "fav.title": "المفضّلة لديك",
  "fav.subtitle": "الحلويات التي حفظتها لوقتٍ لاحق.",
  "fav.empty": "لا توجد مفضّلات بعد. اضغط القلب على أي حلوى لحفظها.",
  "fav.browse": "تصفّح البوتيك",
  "reviews.title": "التقييمات",
  "reviews.count": "تقييم",
  "reviews.empty": "لا توجد تقييمات بعد. كن أوّل من يشاركنا رأيه بعد وصول علبتك.",
  "reviews.rate": "قيّم",
  "reviews.yourRating": "تقييمك",
  "reviews.yourComment": "تعليقك",
  "reviews.placeholder": "أخبرنا بما أعجبك (أو لم يعجبك)…",
  "reviews.submit": "إرسال التقييم",
  "reviews.update": "تحديث التقييم",
  "reviews.cancel": "إلغاء",
  "reviews.saved": "تم حفظ التقييم",
  "reviews.edit": "تعديل التقييم",
  "reviews.write": "تقييم",
  "cart.emptyTitle": "علبتك فارغة",
  "cart.emptyBody": "أضف بعض الحلويات من البوتيك وستظهر هنا.",
  "cart.browse": "تصفّح الحلويات",
  "cart.title": "علبة الإهداء",
  "cart.itemsReady": "قطعة · جاهزة متى شئت",
  "cart.remove": "حذف",
  "cart.summary": "ملخّص الطلب",
  "cart.subtotal": "المجموع الفرعي",
  "cart.delivery": "التوصيل",
  "cart.tax": "ضريبة القيمة المضافة",
  "cart.total": "الإجمالي",
  "cart.checkout": "إتمام الشراء",
  "cart.addMore": "أضف المزيد",
  "footer.brand": "حلويات الملكي",
  "footer.brandAr": "حلويات الملكي",
  "footer.about":
    "محلٌّ عائليّ في السموع متخصّصٌ بالحلويات الشاميّة اليدويّة — البقلاوة، الكنافة، المفروكة وأكثر — تُغلَّف بعنايةٍ وتُوصَل طازجة.",
  "footer.visit": "زورنا",
  "footer.address": "مجمع السموع سنتر، أصفي، السموع",
  "footer.hours": "يوميّاً · ٩ صباحاً – ١١ مساءً",
  "footer.phone": "٠٥٩٨ ٣٥٦ ٣٠٦",
  "footer.explore": "استكشف",
  "footer.copyright": "صُنعت بعناية، تُقدَّم كالملوك.",
  "lang.switch": "English",
};

const dictionaries: Record<Locale, Dict> = { en, ar };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "royalsweets.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "ar" ? "ar" : "en";
  });

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, dir]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
