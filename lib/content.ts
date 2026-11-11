/**
 * Site text that has no home in the admin database yet (from the design and
 * viraasat_schema.sql seeds). Items in [brackets] are placeholders to fill in.
 */

export const brand = {
  name: "VIRAASAT GRIHA",
  nameHi: "विरासत गृह",
  tagline: "A Home for Indian Art & Heritage",
  eyebrow: "From Kashmir to Kanyakumari",
  footerBlurb:
    "A home for Indian art and heritage. Explore each craft by its city, watch how it is made, and bring a piece home.",
  madeIn: "Made with care in India",
};

export const home = {
  bestHeading: "Best of Indian art",
  mapHeading: "Map of Indian Crafts",
  mapHeadingHi: "भारत के शिल्प का मानचित्र",
  cartouche: "BHARATAVARSHA",
  cartoucheHi: "भारतवर्ष",
  mapDisclaimer: "Stylised outline, approximate. Swap in a licensed boundary file before launch.",
  regionsHeading: "Featured Regions",
};

export const popularSearches = ["Ceramics", "Silk", "Painting", "Marble", "Karnataka"];

export const about = {
  eyebrow: "About Viraasat Griha",
  title: "A home for Indian art and heritage",
  intro:
    "Every craft in India belongs to a place and a family of hands. We built Viraasat Griha so you can start from the map, meet the city, watch the work being made and bring a piece home.",
  story: "[Short founder or team story goes here.]",
  values: [
    {
      heading: "Made by hand, place by place",
      body: "Each piece is tied to the city where its craft is made, so you always know where it comes from and who made it.",
    },
    { heading: "Fair to the makers", body: "[Describe how makers are paid and how partnerships are chosen.]" },
    {
      heading: "Made to last",
      body: "We show materials, size and care for every piece, so what arrives is something you keep and pass on.",
    },
  ],
  steps: [
    { heading: "Explore the map", body: "Pick a city on the map of Indian crafts and read the story of its art." },
    { heading: "Watch it being made", body: "See the maker at work and meet the shops that sell the craft." },
    { heading: "Bring it home", body: "Choose a piece, pay securely and we pack it by hand and ship it to you." },
  ],
};

/** Support details: fill in to show them on the contact page. */
export const support = {
  email: null as string | null,
  phone: null as string | null,
  hours: null as string | null,
  address: null as string | null,
  replyTime: null as string | null,
};

export const contactTopics = [
  { value: "craft", label: "Question about a craft" },
  { value: "order", label: "An order" },
  { value: "shipping_returns", label: "Shipping or returns" },
  { value: "work_with_us", label: "Working with us" },
  { value: "other", label: "Something else" },
] as const;

export const stateHindi: Record<string, string> = {
  "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "असम", Bihar: "बिहार",
  Chhattisgarh: "छत्तीसगढ़", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा",
  "Himachal Pradesh": "हिमाचल प्रदेश", Jharkhand: "झारखंड", Karnataka: "कर्नाटक", Kerala: "केरल",
  "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपुर", Meghalaya: "मेघालय",
  Mizoram: "मिज़ोरम", Nagaland: "नागालैंड", Odisha: "ओडिशा", Punjab: "पंजाब",
  Rajasthan: "राजस्थान", Sikkim: "सिक्किम", "Tamil Nadu": "तमिलनाडु", Telangana: "तेलंगाना",
  Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखंड", "West Bengal": "पश्चिम बंगाल",
  Delhi: "दिल्ली", "Jammu and Kashmir": "जम्मू और कश्मीर", Ladakh: "लद्दाख", Puducherry: "पुडुचेरी",
};

/**
 * A placeholder price for a craft card, until Shopify holds real products and prices.
 * Deterministic from the product's slug, so the same card always shows the same number.
 */
export function dummyPriceValue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 900 + (h % 52) * 100; // ₹900 to ₹6,000, in steps of ₹100
}

export function dummyPrice(seed: string): string {
  return `₹${dummyPriceValue(seed).toLocaleString("en-IN")}`;
}

const VARIANT_PIECES = ["bowl", "plate", "vase", "box"];
const VARIANT_TAGS = ["New", "Bestseller", "Gift", "Set"];

export type DummyVariant = { name: string; tag: string; price: string };

/**
 * Four placeholder "products" for one craft, for the city page's shop preview.
 * There is only one real craft record per city; this stands in for the future
 * Shopify collection until real products exist.
 */
export function dummyVariants(craft: string, productSlug: string): DummyVariant[] {
  return VARIANT_PIECES.map((piece, i) => ({
    name: `${craft} ${piece}`,
    tag: VARIANT_TAGS[i],
    price: dummyPrice(`${productSlug}-${i}`),
  }));
}

/** Spelled-out counts for "Eleven cities so far". */
export function countWord(n: number): string {
  const w = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  return n < w.length ? w[n] : String(n);
}
