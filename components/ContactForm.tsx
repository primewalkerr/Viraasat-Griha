"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/contact/actions";
import { contactTopics } from "@/lib/content";

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);
  const err = (k: string) => state?.errors?.[k];

  if (state?.ok) {
    return (
      <div className="contact-form" role="status">
        <h2 className="display" style={{ fontSize: 32 }}>Message sent</h2>
        <p className="notice ok">{state.message}</p>
      </div>
    );
  }

  const field = (k: string, label: string, input: React.ReactNode) => (
    <label className="field">
      <span>{label}</span>
      {input}
      {err(k) && <span id={`${k}-err`} style={{ color: "#7d2c22", fontSize: 14 }}>{err(k)}</span>}
    </label>
  );
  const aria = (k: string) => (err(k) ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <form action={action} className="contact-form" noValidate>
      <h2 className="display" style={{ fontSize: 32 }}>Send a message</h2>
      {state && !state.ok && <p className="notice err" role="alert">{state.message}</p>}
      <div className="form-row">
        {field("name", "Your name", <input name="name" autoComplete="name" placeholder="Full name" required maxLength={120} {...aria("name")} />)}
        {field("email", "Email", <input name="email" type="email" autoComplete="email" placeholder="name@example.com" required {...aria("email")} />)}
      </div>
      <div className="form-row">
        {field("order", "Order number (optional)", <input name="order" placeholder="For example #1023" maxLength={40} {...aria("order")} />)}
        {field("topic", "Topic", (
          <select name="topic" defaultValue="craft" {...aria("topic")}>
            {contactTopics.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        ))}
      </div>
      {field("message", "Message", <textarea name="message" rows={5} placeholder="How can we help?" required maxLength={5000} {...aria("message")} />)}
      <div className="hp" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div><button type="submit" className="btn" disabled={pending}>{pending ? "Sending…" : "Send message"}</button></div>
    </form>
  );
}
