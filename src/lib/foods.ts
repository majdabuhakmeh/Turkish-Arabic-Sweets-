import baklavaPistachioAsset from "@/assets/sweet-baklava-pistachio.jpg.asset.json";
import kunafaCheeseAsset from "@/assets/sweet-kunafa-cheese.jpg.asset.json";
import kunafaNaamehAsset from "@/assets/sweet-kunafa-naameh.jpg.asset.json";
import harissaAsset from "@/assets/sweet-harissa-pistachio.jpg.asset.json";
import mafroukehAsset from "@/assets/sweet-mafroukeh.jpg.asset.json";
import fingerBaklavaAsset from "@/assets/sweet-finger-baklava.jpg.asset.json";
import baklavaRollsAsset from "@/assets/sweet-baklava-rolls.jpg.asset.json";
import warbatAsset from "@/assets/sweet-warbat.jpg.asset.json";
import almondBaklavaAsset from "@/assets/sweet-almond-baklava.jpg.asset.json";
import layaliAsset from "@/assets/sweet-layali.jpg.asset.json";
import kunafaSliceAsset from "@/assets/sweet-kunafa-slice.jpg.asset.json";
import trayAssortmentAsset from "@/assets/sweet-tray-assortment.jpg.asset.json";

export type Food = {
  id: string;
  name: string;
  nameAr?: string;
  tagline: string;
  taglineAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  prepTime: number;
  calories: number;
  rating: number;
  reviews: number;
  spice: 0 | 1 | 2 | 3;
  ingredients: string[];
  popular?: boolean;
  featured?: boolean;
};

export const categories = [
  { id: "all", name: "All", nameAr: "الكل" },
  { id: "baklava", name: "Baklava", nameAr: "بقلاوة" },
  { id: "kunafa", name: "Kunafa", nameAr: "كنافة" },
  { id: "trays", name: "Gift Trays", nameAr: "صواني الإهداء" },
  { id: "warbat", name: "Warbat", nameAr: "ورقيّات" },
  { id: "cakes", name: "Levantine Cakes", nameAr: "حلويات شاميّة" },
];

export const foods: Food[] = [
  {
    id: "baklava-pistachio",
    name: "Pistachio Baklava",
    nameAr: "بقلاوة بالفستق",
    tagline: "Phyllo, clarified butter, Aleppo pistachio",
    taglineAr: "رقائق، سمن بلدي، فستق حلبي",
    description:
      "Forty hand-layered sheets of paper-thin phyllo, brushed with clarified butter, filled with crushed Aleppo pistachios and finished with rose-syrup glaze.",
    descriptionAr:
      "أربعون طبقةً من رقائق الفيلو الشفّافة مدهونةً بالسمن البلدي، محشوّة بالفستق الحلبي المطحون ومُروَّاة بقطر ماء الورد.",
    price: 38,
    originalPrice: 45,
    image: baklavaPistachioAsset.url,
    category: "baklava",
    prepTime: 25,
    calories: 320,
    rating: 4.9,
    reviews: 412,
    spice: 0,
    ingredients: ["Phyllo", "Aleppo pistachio", "Clarified butter", "Rose-water syrup"],
    featured: true,
    popular: true,
  },
  {
    id: "kunafa-cheese",
    name: "Kunafa Nabulsiyeh",
    nameAr: "كنافة نابلسيّة",
    tagline: "Crispy semolina, melted akkawi, pistachio",
    taglineAr: "شعيرات السميد، جبنة عكاوي، فستق",
    description:
      "Hand-pulled semolina threads layered over fresh akkawi cheese, baked until golden, then drowned in warm orange-blossom syrup and dusted with pistachio.",
    descriptionAr:
      "شعيرات السميد المسحوبة يدوياً فوق جبنة العكاوي الطازجة، تُخبز حتى الذهبي ثم تُغمر بقطر ماء الزهر الدافئ وتُرشّ بالفستق.",
    price: 32,
    image: kunafaCheeseAsset.url,
    category: "kunafa",
    prepTime: 18,
    calories: 480,
    rating: 4.9,
    reviews: 358,
    spice: 0,
    ingredients: ["Semolina", "Akkawi cheese", "Orange-blossom syrup", "Pistachio"],
    featured: true,
    popular: true,
  },
  {
    id: "kunafa-naameh",
    name: "Kunafa Naameh",
    nameAr: "كنافة ناعمة",
    tagline: "Fine kataifi, ashta cream, candied cherry",
    taglineAr: "شعيرات ناعمة، قشطة، كرز مسكّر",
    description:
      "The signature smooth kunafa — a velvet layer of fine kataifi piped with ashta cream and crowned with a candied cherry. Boxed warm.",
    descriptionAr:
      "كنافتنا الناعمة المميّزة — طبقة مخمليّة من الشعيرات الرقيقة مع القشطة وكرزة مسكّرة في الأعلى. تُغلَّف دافئة.",
    price: 36,
    image: kunafaNaamehAsset.url,
    category: "kunafa",
    prepTime: 20,
    calories: 420,
    rating: 4.9,
    reviews: 287,
    spice: 0,
    ingredients: ["Fine kataifi", "Ashta cream", "Candied cherry", "Pistachio"],
    featured: true,
  },
  {
    id: "harissa-pistachio",
    name: "Harissa with Ashta",
    nameAr: "هريسة بالقشطة",
    tagline: "Semolina cake, ashta layer, pistachio crumb",
    taglineAr: "كيك السميد، طبقة القشطة، فتات الفستق",
    description:
      "Tender semolina cake split and layered with fresh ashta cream, drenched in lemon-scented syrup and dusted with pistachio crumb.",
    descriptionAr:
      "كيكة السميد الطريّة مقسومة وممتلئة بالقشطة الطازجة، مرويّة بقطر الليمون ومرشوشة بفتات الفستق.",
    price: 28,
    image: harissaAsset.url,
    category: "cakes",
    prepTime: 15,
    calories: 360,
    rating: 4.8,
    reviews: 192,
    spice: 0,
    ingredients: ["Semolina", "Ashta cream", "Lemon syrup", "Pistachio"],
    popular: true,
  },
  {
    id: "mafroukeh",
    name: "Mafroukeh Pistachio",
    nameAr: "مفروكة بالفستق",
    tagline: "Semolina dough, ashta, blanket of pistachio",
    taglineAr: "عجينة السميد، قشطة، طبقة فستق",
    description:
      "Crumbly semolina dough enriched with ghee, layered with thick ashta and blanketed with finely ground pistachios.",
    descriptionAr:
      "عجينة السميد المفتّتة بالسمن، طبقة من القشطة الكثيفة ومغطاة بالفستق المطحون ناعماً.",
    price: 34,
    image: mafroukehAsset.url,
    category: "cakes",
    prepTime: 22,
    calories: 410,
    rating: 4.8,
    reviews: 156,
    spice: 0,
    ingredients: ["Semolina", "Ghee", "Ashta", "Pistachio"],
    featured: true,
  },
  {
    id: "finger-baklava",
    name: "Pistachio Fingers",
    nameAr: "أصابع بالفستق",
    tagline: "Crispy kataifi rolls, syrup-glazed",
    taglineAr: "أصابع شعيريّة مقرمشة بالقطر",
    description:
      "Hand-rolled kataifi fingers filled with whole pistachios, baked golden and brushed with a light sugar syrup.",
    descriptionAr:
      "أصابع شعيريّة ملفوفة يدوياً ومحشوّة بحبّات الفستق الكاملة، تُخبز ذهبيّةً ثم تُدهن بقطر السكر الخفيف.",
    price: 26,
    image: fingerBaklavaAsset.url,
    category: "baklava",
    prepTime: 14,
    calories: 280,
    rating: 4.7,
    reviews: 203,
    spice: 0,
    ingredients: ["Kataifi", "Pistachio", "Sugar syrup", "Butter"],
    popular: true,
  },
  {
    id: "baklava-rolls",
    name: "Phyllo Rolls (Borma)",
    nameAr: "برمة بالفستق",
    tagline: "Tight phyllo rolls packed with pistachio",
    taglineAr: "لفائف فيلو ممتلئة بالفستق",
    description:
      "Tightly rolled phyllo cylinders generously stuffed with pistachios — sliced to reveal the bright green centre.",
    descriptionAr:
      "لفائف فيلو محكمة محشوّة بسخاءٍ بالفستق — تُقطَّع لتُظهر لونها الأخضر النابض.",
    price: 42,
    image: baklavaRollsAsset.url,
    category: "baklava",
    prepTime: 20,
    calories: 340,
    rating: 4.8,
    reviews: 178,
    spice: 0,
    ingredients: ["Phyllo", "Pistachio", "Ghee", "Syrup"],
  },
  {
    id: "warbat",
    name: "Warbat with Ashta",
    nameAr: "ورقيّات بالقشطة",
    tagline: "Triangular phyllo, ashta heart, pistachio",
    taglineAr: "مثلّثات فيلو، قلب قشطة، فستق",
    description:
      "Crisp triangular pockets of phyllo with a generous heart of fresh ashta — finished with a sprinkle of crushed pistachio.",
    descriptionAr:
      "مثلّثات فيلو مقرمشة بقلبٍ سخيّ من القشطة الطازجة — وتُرشّ بالفستق المهروس.",
    price: 30,
    image: warbatAsset.url,
    category: "warbat",
    prepTime: 16,
    calories: 290,
    rating: 4.8,
    reviews: 142,
    spice: 0,
    ingredients: ["Phyllo", "Ashta", "Pistachio", "Syrup"],
  },
  {
    id: "almond-baklava",
    name: "Almond Fingers (Asabe)",
    nameAr: "أصابع باللوز",
    tagline: "Mussel-shaped phyllo, whole almond crown",
    taglineAr: "أصابع فيلو مزيّنة بحبّة لوز",
    description:
      "Hand-shaped phyllo mussels filled with sweet cream, each crowned with a single roasted almond.",
    descriptionAr:
      "أصابع فيلو على شكل المحار محشوّة بالقشدة الحلوة، ومزيّنة بحبّة لوزٍ محمّصة.",
    price: 36,
    image: almondBaklavaAsset.url,
    category: "baklava",
    prepTime: 18,
    calories: 310,
    rating: 4.7,
    reviews: 134,
    spice: 0,
    ingredients: ["Phyllo", "Almond", "Cream", "Syrup"],
  },
  {
    id: "layali-lubnan",
    name: "Layali Lubnan",
    nameAr: "ليالي لبنان",
    tagline: "Semolina pudding, ashta, rose syrup",
    taglineAr: "مهلبيّة السميد، قشطة، قطر الورد",
    description:
      "Cool semolina pudding layered with ashta cream and finished with rose-water syrup and pistachio.",
    descriptionAr:
      "مهلبيّة السميد الباردة مع طبقة من القشطة ومُروّاة بقطر ماء الورد والفستق.",
    price: 24,
    image: layaliAsset.url,
    category: "cakes",
    prepTime: 12,
    calories: 240,
    rating: 4.7,
    reviews: 98,
    spice: 0,
    ingredients: ["Semolina", "Ashta", "Rose water", "Pistachio"],
  },
  {
    id: "kunafa-slice",
    name: "Kunafa Mabrumeh",
    nameAr: "كنافة مبرومة",
    tagline: "Rolled kunafa, pistachio core, syrup glaze",
    taglineAr: "كنافة ملفوفة بقلبٍ من الفستق",
    description:
      "Crisp rolled kunafa sliced to reveal a generous pistachio core, brushed with light syrup.",
    descriptionAr:
      "كنافة ملفوفة مقرمشة، تُقطَّع لتكشف قلباً سخيّاً من الفستق، وتُدهن بقطر خفيف.",
    price: 34,
    image: kunafaSliceAsset.url,
    category: "kunafa",
    prepTime: 18,
    calories: 380,
    rating: 4.8,
    reviews: 167,
    spice: 0,
    ingredients: ["Kunafa threads", "Pistachio", "Butter", "Syrup"],
  },
  {
    id: "royal-tray",
    name: "The Royal Mixed Tray",
    nameAr: "صينية الملكي المشكّلة",
    tagline: "An assortment of our nine signature sweets",
    taglineAr: "تشكيلة من تسع حلوياتٍ مميّزة",
    description:
      "A presentation tray with a tasting of every signature: baklava, mussels, fingers, kunafa squares, warbat and more — perfect for gifting.",
    descriptionAr:
      "صينية تقديم بتشكيلةٍ من جميع توقيعاتنا: بقلاوة، أصابع، كنافة، ورقيّات والمزيد — مثاليّة للإهداء.",
    price: 120,
    originalPrice: 145,
    image: trayAssortmentAsset.url,
    category: "trays",
    prepTime: 30,
    calories: 0,
    rating: 5.0,
    reviews: 261,
    spice: 0,
    ingredients: ["Pistachio", "Almond", "Cashew", "Ashta", "Phyllo", "Kataifi"],
    featured: true,
    popular: true,
  },
];

export const getFood = (id: string) => foods.find((f) => f.id === id);

export function localizedFood(f: Food, locale: "en" | "ar") {
  if (locale === "ar") {
    return {
      name: f.nameAr ?? f.name,
      tagline: f.taglineAr ?? f.tagline,
      description: f.descriptionAr ?? f.description,
    };
  }
  return { name: f.name, tagline: f.tagline, description: f.description };
}

export function localizedCategoryName(
  c: { name: string; nameAr?: string },
  locale: "en" | "ar",
) {
  return locale === "ar" ? c.nameAr ?? c.name : c.name;
}
