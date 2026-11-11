"use client";

import { useState } from "react";
import type { Customer } from "@/lib/customer-auth";

const TABS = ["Past orders", "Addresses", "Account details"] as const;

function statusClass(status: string): string {
  if (status === "Delivered") return "order-status delivered";
  if (status === "Processing") return "order-status processing";
  return "order-status";
}

export default function AccountTabs({ customer }: { customer: Customer }) {
  const [tab, setTab] = useState(0);

  return (
    <div className="account-layout">
      <nav className="account-nav" aria-label="Account sections">
        {TABS.map((name, i) => (
          <button key={name} type="button" role="tab" aria-selected={i === tab} aria-controls="account-panel" onClick={() => setTab(i)}>
            <span>{name}</span><span aria-hidden="true">›</span>
          </button>
        ))}
        <a className="logout" href="/api/auth/logout">Log out</a>
      </nav>

      <div id="account-panel" className="account-panel" role="tabpanel">
        {tab === 0 && (
          <>
            <h2 className="display h2s">Past orders</h2>
            {customer.orders.length ? (
              customer.orders.map((o) => (
                <div key={o.id} className="order-card">
                  <div className="head">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="num">Order {o.number}</span>
                      <span className="placed">Placed on {o.date}</span>
                    </div>
                    <span className={statusClass(o.status)}>{o.status}</span>
                  </div>
                  <div className="foot">
                    <div className="thumbs">
                      {o.images.length
                        ? o.images.map((src, k) => <img key={k} src={src} alt="" />)
                        : <span style={{ fontSize: 14, color: "var(--muted)" }}>No photo</span>}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{o.total}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="account-empty">No orders yet. Once you buy a piece, it will show up here.</p>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            <h2 className="display h2s">Addresses</h2>
            {customer.addresses.length ? (
              <div className="address-grid">
                {customer.addresses.map((a) => (
                  <div key={a.id} className="address-card">
                    <div className="nm-row">
                      <span className="nm">{a.name ?? "Address"}</span>
                      {a.isDefault && <span className="default-tag">Default</span>}
                    </div>
                    <span className="lines">
                      {a.address1}{a.address2 ? `, ${a.address2}` : ""}<br />
                      {[a.city, a.province, a.zip].filter(Boolean).join(", ")}<br />
                      {a.phone}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="account-empty">No saved addresses yet. One is saved the first time you check out.</p>
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <h2 className="display h2s">Account details</h2>
            <div className="details-grid">
              <div className="row2">
                <label><span className="k">First name</span><span className="v">{customer.firstName || "—"}</span></label>
                <label><span className="k">Last name</span><span className="v">{customer.lastName || "—"}</span></label>
              </div>
              <label><span className="k">Email</span><span className="v">{customer.email || "—"}</span></label>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                You log in with a code sent to your email, so there is no password to manage. Editing these details is coming soon.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
