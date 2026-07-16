import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Client Portal | YK-Online",
  description:
    "Client access portal for YK Online project materials, handover documents and support.",
};

const documentTypes = [
  "Project handover notes",
  "Marketing templates and workflows",
  "Brand and content guidelines",
  "Implementation support materials",
];

const supportItems = [
  {
    title: "Project materials",
    text: "Order-related files, templates and notes are assigned to the client account after payment confirmation.",
  },
  {
    title: "Service handover",
    text: "Meeting notes, recommendations and next-step summaries are attached to the order workspace.",
  },
  {
    title: "Support contact",
    text: "Clients can reply to the order e-mail or contact info@yk-online.eu for help with delivered materials.",
  },
];

export default function ClientPortalPage() {
  return (
    <main className="client-portal">
      <section className="client-portal__hero">
        <div className="container client-portal__grid">
          <div className="client-portal__intro">
            <span className="client-portal__eyebrow">Client access</span>
            <h1>Project materials and support in one place</h1>
            <p>
              Access handover documents, marketing materials, templates and
              support information connected to your YK Online order.
            </p>
            <div className="client-portal__trust">
              <span>Secure client workspace</span>
              <span>Order based access</span>
              <span>Support by e-mail</span>
            </div>
          </div>

          <aside className="portal-login" aria-label="Client portal login">
            <div className="portal-login__header">
              <div>
                <span className="portal-login__label">YK Online</span>
                <h2>Client portal</h2>
              </div>
              <span className="portal-login__status">Access</span>
            </div>

            <form className="portal-login__form">
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </label>
              <button type="button" className="btn btn--primary btn--full">
                Sign in
              </button>
            </form>

            <div className="portal-login__helper">
              <p>
                New client? Use the billing e-mail from your order. Password
                setup link is sent after payment confirmation.
              </p>
              <Link href="/contact">Need help with access?</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="client-portal__body">
        <div className="container client-portal__content">
          <div className="portal-panel portal-panel--documents">
            <div className="portal-panel__head">
              <span className="portal-panel__kicker">Workspace</span>
              <h2>Available after order confirmation</h2>
            </div>
            <div className="portal-doc-list">
              {documentTypes.map((item) => (
                <div className="portal-doc" key={item}>
                  <span className="portal-doc__icon">PDF</span>
                  <div>
                    <strong>{item}</strong>
                    <small>Assigned to client order workspace</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-panel">
            <div className="portal-panel__head">
              <span className="portal-panel__kicker">Delivery model</span>
              <h2>How client handover works</h2>
            </div>
            <div className="portal-support-grid">
              {supportItems.map((item) => (
                <article className="portal-support" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
