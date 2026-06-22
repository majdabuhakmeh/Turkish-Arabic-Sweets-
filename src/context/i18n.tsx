import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

const en: Dict = {
  // nav
  "nav.home": "Home",
  "nav.menu": "Menu",
  "nav.about": "Our Story",
  "nav.contact": "Contact",
  "nav.admin": "Admin",
  "nav.account": "Account",
  "nav.signin": "Sign in",
  "nav.cart": "Cart",
  "nav.menuLabel": "Menu",
  // header strip
  "header.openNow": "Open now · Delivering in 28 min",
  // home
  "home.h1.line1": "Fire-kissed",
  "home.h1.line2": "flavours,",
  "home.h1.line3": "at your door.",
  "home.intro":
    "Saffron is a neighborhood kitchen obsessed with slow-fermented dough, hand-cut pasta and chargrilled everything. Order in under a minute.",
  "home.orderNow": "Order now",
  "home.ourStory": "Our story",
  "home.feature.delivery": "30-min delivery",
  "home.feature.fire": "Wood-fired",
  "home.feature.local": "Local sourced",
  "home.review": "\"Best pizza I've had outside Naples.\"",
  "home.reviewBy": "— Maya R., regular",
  "home.todaysSpecial": "Today's special",
  "home.specialOffer": "−15% off pizzas",
  "home.browse": "Browse the kitchen",
  "home.seeAll": "See all",
  "home.chefsPicks": "Chef's picks",
  "home.featuredA": "Tonight's",
  "home.featuredB": "featured",
  "home.featuredC": "plates",
  "home.popular": "Popular this week",
  "home.viewFull": "View full menu →",
  "home.ctaTitle": "First order? Save 20% on us.",
  "home.ctaBody1": "Use code",
  "home.ctaBody2": "at checkout. Delivery in 30 minutes or it's on the house.",
  "home.ctaButton": "Start your order",
  // menu
  "menu.kicker": "The menu",
  "menu.titleA": "Every plate,",
  "menu.titleB": "made today.",
  "menu.subtitle": "Browse, customize and add to your bag — delivery in 30 minutes or less.",
  "menu.search": "Search dishes…",
  "menu.empty": "No dishes match your search.",
  // food card
  "card.save": "Save",
  "card.min": "min",
  "card.cal": "cal",
  "card.add": "Add",
  "fav.add": "Save to favorites",
  "fav.remove": "Remove from favorites",
  "fav.title": "Your favorites",
  "fav.subtitle": "Dishes you've saved for later.",
  "fav.empty": "No favorites yet. Tap the heart on any dish to save it.",
  "fav.browse": "Browse menu",
  "nav.favorites": "Favorites",
  // reviews
  "reviews.title": "Reviews",
  "reviews.count": "reviews",
  "reviews.empty": "No reviews yet. Be the first to share your thoughts after your order arrives.",
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
  "cart.emptyTitle": "Your bag is empty",
  "cart.emptyBody": "Add a few dishes from the menu and they'll show up here.",
  "cart.browse": "Browse menu",
  "cart.title": "Your bag",
  "cart.itemsReady": "items · ready when you are",
  "cart.remove": "Remove",
  "cart.summary": "Order summary",
  "cart.subtotal": "Subtotal",
  "cart.delivery": "Delivery",
  "cart.tax": "Tax",
  "cart.total": "Total",
  "cart.checkout": "Checkout",
  "cart.addMore": "Add more dishes",
  // footer
  "footer.brand": "Royal Sweets",
  "footer.about":
    "A neighborhood kitchen serving wood-fired pies, smash burgers and slow-braised classics — delivered to your door in under 30 minutes.",
  "footer.visit": "Visit",
  "footer.address": "221 Oak Street",
  "footer.hours": "Open daily 11am – 11pm",
  "footer.phone": "+1 (415) 555-0142",
  "footer.explore": "Explore",
  "footer.copyright": "Made with fire and saffron.",
  // language
  "lang.switch": "العربية",
};

const ar: Dict = {
  "nav.home": "الرئيسية",
  "nav.menu": "القائمة",
  "nav.about": "قصتنا",
  "nav.contact": "تواصل",
  "nav.admin": "الإدارة",
  "nav.account": "حسابي",
  "nav.signin": "تسجيل الدخول",
  "nav.cart": "السلة",
  "nav.menuLabel": "القائمة",
  "header.openNow": "مفتوح الآن · التوصيل خلال ٢٨ دقيقة",
  "home.h1.line1": "نكهاتٌ",
  "home.h1.line2": "من النار،",
  "home.h1.line3": "إلى بابك.",
  "home.intro":
    "زعفران مطبخٌ مُحبٌّ لعجين التخمير البطيء، والمعكرونة المقطّعة يدوياً، وكلِّ ما يُشوى على الجمر. اطلب في أقل من دقيقة.",
  "home.orderNow": "اطلب الآن",
  "home.ourStory": "قصتنا",
  "home.feature.delivery": "توصيل خلال ٣٠ دقيقة",
  "home.feature.fire": "مطهوّ على الحطب",
  "home.feature.local": "مكوّنات محليّة",
  "home.review": "«أفضل بيتزا تذوقتها خارج نابولي.»",
  "home.reviewBy": "— مايا ر.، زبونة دائمة",
  "home.todaysSpecial": "عرض اليوم",
  "home.specialOffer": "خصم ١٥٪ على البيتزا",
  "home.browse": "تجوّل في المطبخ",
  "home.seeAll": "عرض الكل",
  "home.chefsPicks": "اختيارات الشيف",
  "home.featuredA": "أطباق",
  "home.featuredB": "الليلة",
  "home.featuredC": "المميّزة",
  "home.popular": "الأكثر طلباً هذا الأسبوع",
  "home.viewFull": "عرض القائمة كاملة ←",
  "home.ctaTitle": "أول طلب؟ خصم ٢٠٪ على حسابنا.",
  "home.ctaBody1": "استخدم الكود",
  "home.ctaBody2": "عند الدفع. التوصيل خلال ٣٠ دقيقة أو الطلب على حسابنا.",
  "home.ctaButton": "ابدأ طلبك",
  "menu.kicker": "القائمة",
  "menu.titleA": "كل طبقٍ",
  "menu.titleB": "يُعدّ اليوم.",
  "menu.subtitle": "تصفّح، خصّص، وأضف إلى سلتك — التوصيل خلال ٣٠ دقيقة أو أقل.",
  "menu.search": "ابحث عن طبق…",
  "menu.empty": "لا توجد أطباق مطابقة لبحثك.",
  "card.save": "وفّر",
  "card.min": "دقيقة",
  "card.cal": "سعرة",
  "card.add": "أضف",
  "fav.add": "أضف إلى المفضّلة",
  "fav.remove": "إزالة من المفضّلة",
  "fav.title": "المفضّلة لديك",
  "fav.subtitle": "الأطباق التي حفظتها لوقتٍ لاحق.",
  "fav.empty": "لا توجد مفضّلات بعد. اضغط القلب على أي طبق لحفظه.",
  "fav.browse": "تصفّح القائمة",
  "nav.favorites": "المفضّلة",
  "reviews.title": "التقييمات",
  "reviews.count": "تقييم",
  "reviews.empty": "لا توجد تقييمات بعد. كن أول من يشاركنا رأيه بعد وصول طلبك.",
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
  "cart.emptyTitle": "سلتك فارغة",
  "cart.emptyBody": "أضف بعض الأطباق من القائمة وستظهر هنا.",
  "cart.browse": "تصفّح القائمة",
  "cart.title": "سلتك",
  "cart.itemsReady": "أصناف · جاهزة متى شئت",
  "cart.remove": "حذف",
  "cart.summary": "ملخص الطلب",
  "cart.subtotal": "المجموع الفرعي",
  "cart.delivery": "التوصيل",
  "cart.tax": "الضريبة",
  "cart.total": "الإجمالي",
  "cart.checkout": "إتمام الشراء",
  "cart.addMore": "أضف المزيد",
  "footer.brand": "مطبخ زعفران",
  "footer.about":
    "مطبخٌ في الحيّ يقدّم البيتزا المطهوّة على الحطب، والبرجر، والأطباق المطبوخة على نارٍ هادئة — يصلك خلال ٣٠ دقيقة.",
  "footer.visit": "زورنا",
  "footer.address": "شارع البلوط ٢٢١",
  "footer.hours": "يوميًا من ١١ صباحًا حتى ١١ مساءً",
  "footer.phone": "+١ (٤١٥) ٥٥٥-٠١٤٢",
  "footer.explore": "استكشف",
  "footer.copyright": "صُنع بالنار والزعفران.",
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