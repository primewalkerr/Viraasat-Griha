import Link from "next/link";
import type { ReactNode } from "react";

/** Draft wording from the design. [Brackets] are to fill in; have a lawyer review before launch. */
export type LegalDoc = { title: string; summary: string; updated: string; sections: { heading: string; body: ReactNode }[] };

export const shipping: LegalDoc = {
  title: "Shipping and returns",
  summary: "How your order reaches you, and what to do if it is not right.",
  updated: "[date]",
  sections: [
    { heading: "Where we deliver", body: <>We deliver across India to [list of serviceable PIN codes or “all PIN codes we can reach”]. International delivery is [not available yet / available to listed countries].</> },
    { heading: "Delivery time", body: <>Orders are packed within [number] working days and usually arrive in [range] working days after dispatch. Made-to-order pieces can take [range] weeks and the product page says so.</> },
    { heading: "Shipping charges", body: <>Shipping is [free above ₹ amount / a flat ₹ amount / calculated at checkout]. The exact charge is shown before you pay.</> },
    { heading: "Packaging", body: <>Every piece is wrapped and boxed by hand. Fragile items such as ceramics get extra protection.</> },
    { heading: "Tracking your order", body: <>Once your order ships we email you the courier name and tracking number. You can also see the status under My account, in your orders.</> },
    { heading: "Returns and exchanges", body: <>You can return an unused piece within [number] days of delivery. Custom or made-to-order items [can / cannot] be returned. Start a return by writing to [support email].</> },
    { heading: "Damaged or wrong items", body: <>If something arrives damaged or is not what you ordered, send us photos within [number] days and we will replace it or refund you.</> },
    { heading: "Refunds", body: <>Approved refunds go back to the original payment method within [number] working days of us receiving the piece.</> },
  ],
};

export const terms: LegalDoc = {
  title: "Terms of use",
  summary: "The rules for using Viraasat Griha and buying from it.",
  updated: "[date]",
  sections: [
    { heading: "Using this site", body: <>By using the site you agree to these terms. You must be [18] or older to place an order, or have a parent or guardian do it for you.</> },
    { heading: "Your account", body: <>You log in with your email. You are responsible for keeping your email account secure and for what happens under your login.</> },
    { heading: "Products and prices", body: <>We take care to describe each piece accurately. Handmade pieces vary slightly, and colours can look different on screen. Prices are in Indian rupees and include [taxes / taxes shown at checkout].</> },
    { heading: "Orders and payment", body: <>An order is confirmed when we send you a confirmation email. Payments are processed by [payment partner]. We may cancel an order if an item is unavailable or a price is shown wrongly, and we will refund you in full.</> },
    { heading: "Shipping and returns", body: <>Delivery and returns are covered on the <Link href="/shipping">shipping and returns</Link> page, which is part of these terms.</> },
    { heading: "Content and ownership", body: <>Photos, text and videos on the site belong to Viraasat Griha or its makers and partners. Please do not copy or reuse them without asking.</> },
    { heading: "Limits on our liability", body: <>To the extent the law allows, we are not responsible for indirect losses. Nothing here limits your rights under Indian consumer law.</> },
    { heading: "Changes and governing law", body: <>We may update these terms and will show the date above. These terms are governed by the laws of India, with courts at [city, state]. Questions? <Link href="/contact">Contact us</Link>.</> },
  ],
};

export const privacy: LegalDoc = {
  title: "Privacy policy",
  summary: "What we collect, why, and the choices you have.",
  updated: "[date]",
  sections: [
    { heading: "What we collect", body: <>Your name, email, mobile number, delivery addresses, order history and the messages you send us. We also collect basic usage data such as pages viewed and device type.</> },
    { heading: "How we use it", body: <>To process and deliver orders, show your account and orders, answer your questions and, if you agree, send you news about new cities and crafts.</> },
    { heading: "Payments", body: <>Card, UPI and bank details are entered with our payment partner, [payment partner]. We never see or store your full card details.</> },
    { heading: "Who we share it with", body: <>Delivery partners who need your name, address and phone to reach you, our payment and email providers, and authorities where the law requires. We do not sell your personal data.</> },
    { heading: "Cookies and analytics", body: <>We use cookies to keep your bag and login working and, with your consent, to understand how the site is used. You can change this at any time in your browser or in our cookie settings.</> },
    { heading: "Your choices", body: <>You can see, correct or delete your information under My account, or by writing to [support email]. You can unsubscribe from news emails with one click.</> },
    { heading: "How long we keep it", body: <>We keep order records for [number] years for accounts and tax rules, and other data only as long as it is needed.</> },
    { heading: "Security and contact", body: <>We protect your data with [measures]. For privacy questions or complaints, contact [name of grievance officer] at [email address].</> },
  ],
};
