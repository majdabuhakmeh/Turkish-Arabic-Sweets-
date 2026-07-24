import baklavaPistachioImg from "@/assets/baklava2.jpg";
import kunafaCheeseImg from "@/assets/knafeh 2.jpg";
import kunafaNaamehImg from "@/assets/كنافة نابلسية.jpg";
import harissaImg from "@/assets/هريسة بالقشطة.jpg";
import mafroukehImg from "@/assets/مفروكة.jpg";
import fingerBaklavaImg from "@/assets/اصابع بالفستق.jpg";
import baklavaRollsImg from "@/assets/برمة.jpg";
import warbatImg from "@/assets/kolaj.jpg";
import almondBaklavaImg from "@/assets/اصابع باللوز.jpg";
import layaliImg from "@/assets/ليالي-لبنان.jpg";
import kunafaSliceImg from "@/assets/كنافة-مبرومة.jpg";
import trayAssortmentImg from "@/assets/طبق مشل.jpg";

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
  ingredientsAr?: string[];
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
    image: baklavaPistachioImg,
    category: "baklava",
    prepTime: 25,
    calories: 320,
    rating: 4.9,
    reviews: 412,
    spice: 0,
    ingredients: ["Phyllo", "Aleppo pistachio", "Clarified butter", "Rose-water syrup"],
    ingredientsAr: ["فيلو", "فستق حلبي", "سمن بلدي", "قطر ماء الورد"],
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
    image: kunafaNaamehImg,
    category: "kunafa",
    prepTime: 18,
    calories: 480,
    rating: 4.9,
    reviews: 358,
    spice: 0,
    ingredients: ["Semolina", "Akkawi cheese", "Orange-blossom syrup", "Pistachio"],
    ingredientsAr: ["سميد", "جبنة عكاوي", "قطر ماء الزهر", "فستق"],
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
    image: kunafaCheeseImg,
    category: "kunafa",
    prepTime: 20,
    calories: 420,
    rating: 4.9,
    reviews: 287,
    spice: 0,
    ingredients: ["Fine kataifi", "Ashta cream", "Candied cherry", "Pistachio"],
    ingredientsAr: ["شعيرية ناعمة", "قشطة", "كرز مسكّر", "فستق"],
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
    image: harissaImg,
    category: "cakes",
    prepTime: 15,
    calories: 360,
    rating: 4.8,
    reviews: 192,
    spice: 0,
    ingredients: ["Semolina", "Ashta cream", "Lemon syrup", "Pistachio"],
    ingredientsAr: ["سميد", "قشطة", "قطر ليمون", "فستق"],
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
    image: mafroukehImg,
    category: "cakes",
    prepTime: 22,
    calories: 410,
    rating: 4.8,
    reviews: 156,
    spice: 0,
    ingredients: ["Semolina", "Ghee", "Ashta", "Pistachio"],
    ingredientsAr: ["سميد", "سمن", "قشطة", "فستق"],
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
    image: fingerBaklavaImg,
    category: "baklava",
    prepTime: 14,
    calories: 280,
    rating: 4.7,
    reviews: 203,
    spice: 0,
    ingredients: ["Kataifi", "Pistachio", "Sugar syrup", "Butter"],
    ingredientsAr: ["كنافة شعيرية", "فستق", "قطر سكر", "زبدة"],
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
    image: baklavaRollsImg,
    category: "baklava",
    prepTime: 20,
    calories: 340,
    rating: 4.8,
    reviews: 178,
    spice: 0,
    ingredients: ["Phyllo", "Pistachio", "Ghee", "Syrup"],
    ingredientsAr: ["فيلو", "فستق", "سمن", "قطر"],
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
    image: warbatImg,
    category: "warbat",
    prepTime: 16,
    calories: 290,
    rating: 4.8,
    reviews: 142,
    spice: 0,
    ingredients: ["Phyllo", "Ashta", "Pistachio", "Syrup"],
    ingredientsAr: ["فيلو", "قشطة", "فستق", "قطر"],
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
    image: almondBaklavaImg,
    category: "baklava",
    prepTime: 18,
    calories: 310,
    rating: 4.7,
    reviews: 134,
    spice: 0,
    ingredients: ["Phyllo", "Almond", "Cream", "Syrup"],
    ingredientsAr: ["فيلو", "لوز", "قشدة", "قطر"],
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
    image: layaliImg,
    category: "cakes",
    prepTime: 12,
    calories: 240,
    rating: 4.7,
    reviews: 98,
    spice: 0,
    ingredients: ["Semolina", "Ashta", "Rose water", "Pistachio"],
    ingredientsAr: ["سميد", "قشطة", "ماء ورد", "فستق"],
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
    image: kunafaSliceImg,
    category: "kunafa",
    prepTime: 18,
    calories: 380,
    rating: 4.8,
    reviews: 167,
    spice: 0,
    ingredients: ["Kunafa threads", "Pistachio", "Butter", "Syrup"],
    ingredientsAr: ["شعيرية كنافة", "فستق", "زبدة", "قطر"],
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
    image: trayAssortmentImg,
    category: "trays",
    prepTime: 30,
    calories: 0,
    rating: 5.0,
    reviews: 261,
    spice: 0,
    ingredients: ["Pistachio", "Almond", "Cashew", "Ashta", "Phyllo", "Kataifi"],
    ingredientsAr: ["فستق", "لوز", "كاجو", "قشطة", "فيلو", "كنافة شعيرية"],
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
      ingredients: f.ingredientsAr ?? f.ingredients,
    };
  }
  return { name: f.name, tagline: f.tagline, description: f.description, ingredients: f.ingredients };
}

export function localizedCategoryName(
  c: { name: string; nameAr?: string },
  locale: "en" | "ar",
) {
  return locale === "ar" ? c.nameAr ?? c.name : c.name;
}
