import pizza from "@/assets/food-pizza.jpg";
import burger from "@/assets/food-burger.jpg";
import pasta from "@/assets/food-pasta.jpg";
import shawarma from "@/assets/food-shawarma.jpg";
import salad from "@/assets/food-salad.jpg";
import dessert from "@/assets/food-dessert.jpg";

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
  { id: "pizza", name: "Pizza", nameAr: "بيتزا" },
  { id: "burgers", name: "Burgers", nameAr: "برجر" },
  { id: "pasta", name: "Pasta", nameAr: "معكرونة" },
  { id: "shawarma", name: "Shawarma", nameAr: "شاورما" },
  { id: "salads", name: "Salads", nameAr: "سلطات" },
  { id: "desserts", name: "Desserts", nameAr: "حلويات" },
];

export const foods: Food[] = [
  {
    id: "margherita",
    name: "Burrata Margherita",
    nameAr: "مارغريتا بالبوراتا",
    tagline: "Wood-fired, San Marzano, fior di latte",
    taglineAr: "مطهوّة على الحطب، طماطم سان مارزانو، فيور دي لاتي",
    description:
      "Our signature Neapolitan pie — 72-hour cold-fermented dough, blistered in a 900°F oven, finished with creamy burrata and torn basil.",
    descriptionAr:
      "بيتزا نابولي المميّزة لدينا — عجينة مخمّرة على البارد لمدة ٧٢ ساعة، مشوية في فرنٍ بدرجة ٤٨٠°م، ومُتوّجة بجبنة البوراتا الكريميّة وأوراق الريحان.",
    price: 16,
    originalPrice: 19,
    image: pizza,
    category: "pizza",
    prepTime: 18,
    calories: 720,
    rating: 4.9,
    reviews: 312,
    spice: 0,
    ingredients: ["Sourdough", "San Marzano", "Fior di latte", "Burrata", "Basil", "Olive oil"],
    featured: true,
    popular: true,
  },
  {
    id: "double-smash",
    name: "Double Smash Burger",
    nameAr: "دبل سماش برجر",
    tagline: "Aged cheddar, caramelized onions, brioche",
    taglineAr: "شيدر معتّق، بصل مكرمل، خبز بريوش",
    description:
      "Two thin-smashed wagyu patties stacked with melty aged cheddar, sweet onions and our house sauce on a buttered brioche bun.",
    descriptionAr:
      "قطعتا لحم واغيو مهروستان رفيعتان مع جبنة شيدر معتّقة ذائبة، بصل حلو وصلصة البيت في خبز بريوش بالزبدة.",
    price: 14,
    image: burger,
    category: "burgers",
    prepTime: 14,
    calories: 880,
    rating: 4.8,
    reviews: 248,
    spice: 1,
    ingredients: ["Wagyu beef", "Aged cheddar", "Caramelized onion", "Brioche", "House sauce"],
    popular: true,
  },
  {
    id: "truffle-pasta",
    name: "Black Truffle Tagliatelle",
    nameAr: "تالياتيلي بالكمأة السوداء",
    tagline: "Hand-cut pasta, parmigiano, truffle butter",
    taglineAr: "معكرونة مقطّعة يدوياً، بارميجيانو، زبدة الكمأة",
    description:
      "Silky ribbons of hand-cut tagliatelle tossed in truffle butter with shavings of 24-month parmigiano.",
    descriptionAr:
      "شرائط تالياتيلي حريريّة مقطّعة يدوياً، مُتبّلة بزبدة الكمأة ورقائق جبن البارميجيانو المعتّق ٢٤ شهراً.",
    price: 22,
    image: pasta,
    category: "pasta",
    prepTime: 16,
    calories: 640,
    rating: 4.9,
    reviews: 187,
    spice: 0,
    ingredients: ["Tagliatelle", "Black truffle", "Parmigiano", "Cream", "Butter"],
    featured: true,
  },
  {
    id: "chicken-shawarma",
    name: "Chargrilled Chicken Shawarma",
    nameAr: "شاورما دجاج مشوية",
    tagline: "Saffron yogurt, pickled chili, garlic toum",
    taglineAr: "لبن الزعفران، فلفل مخلّل، ثومية",
    description:
      "Marinated overnight in 12 spices, slow-roasted on a vertical spit, wrapped in warm saj bread with toum and pickles.",
    descriptionAr:
      "مُتبّلة طوال الليل بـ١٢ نوعاً من البهارات، مشوية ببطء على السيخ العمودي، ملفوفة بخبز الصاج الدافئ مع الثومية والمخلّل.",
    price: 11,
    image: shawarma,
    category: "shawarma",
    prepTime: 12,
    calories: 560,
    rating: 4.7,
    reviews: 421,
    spice: 2,
    ingredients: ["Chicken thigh", "Toum", "Pickles", "Saj bread", "Saffron yogurt"],
    popular: true,
  },
  {
    id: "caesar-salad",
    name: "Chargrilled Caesar",
    nameAr: "سلطة سيزر مشوية",
    tagline: "Baby gem, anchovy, sourdough croutons",
    taglineAr: "خس بيبي جيم، أنشوجة، خبز محمّص",
    description:
      "Crisp baby gem lettuce, chargrilled chicken, white anchovy dressing, parmigiano and torn sourdough croutons.",
    descriptionAr:
      "خس بيبي جيم مقرمش، دجاج مشوي، صلصة الأنشوجة البيضاء، جبن بارميجيانو وقطع خبز العجين المخمّر.",
    price: 13,
    image: salad,
    category: "salads",
    prepTime: 10,
    calories: 480,
    rating: 4.6,
    reviews: 156,
    spice: 0,
    ingredients: ["Baby gem", "Anchovy", "Parmigiano", "Sourdough", "Chicken"],
  },
  {
    id: "lava-cake",
    name: "Molten Chocolate Lava",
    nameAr: "كيك الشوكولاتة السائلة",
    tagline: "Valrhona 70%, vanilla bean ice cream",
    taglineAr: "شوكولاتة فالرونا ٧٠٪، آيس كريم الفانيليا",
    description:
      "Warm dark chocolate cake with a molten core, gold leaf and a quenelle of Madagascar vanilla bean ice cream.",
    descriptionAr:
      "كيكة شوكولاتة داكنة دافئة بقلبٍ سائل، مزيّنة برقائق الذهب، تُقدَّم مع آيس كريم فانيليا مدغشقر.",
    price: 9,
    image: dessert,
    category: "desserts",
    prepTime: 8,
    calories: 540,
    rating: 4.9,
    reviews: 298,
    spice: 0,
    ingredients: ["Valrhona chocolate", "Butter", "Vanilla ice cream", "Gold leaf"],
    featured: true,
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
