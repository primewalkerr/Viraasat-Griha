"use server";

import { contactTopics } from "@/lib/content";
import { saveContactMessage } from "@/lib/site";

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Bots fill the hidden "website" field; quietly accept and drop.
  if (String(form.get("website") ?? "").trim()) return { ok: true, message: "Thank you. We will reply soon." };

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const orderName = String(form.get("order") ?? "").trim() || null;
  const topic = String(form.get("topic") ?? "");
  const message = String(form.get("message") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 120) errors.name = "Please shorten your name.";
  if (!EMAIL.test(email) || email.length > 200) errors.email = "Please enter a valid email address, like name@example.com.";
  if (!contactTopics.some((t) => t.value === topic)) errors.topic = "Please choose a topic.";
  if (message.length < 5) errors.message = "Please write a short message.";
  else if (message.length > 5000) errors.message = "Please keep the message under 5,000 characters.";
  if (orderName && orderName.length > 40) errors.order = "That order number looks too long.";
  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };

  try {
    saveContactMessage({ name, email, orderName, topic, message });
  } catch (e) {
    console.error("contact form:", e);
    return { ok: false, message: "Sorry, your message could not be sent just now. Please try again in a few minutes." };
  }
  return { ok: true, message: `Thank you, ${name.split(" ")[0]}. Your message has reached us and a real person will reply by email.` };
}
