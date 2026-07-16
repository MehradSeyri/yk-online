import type { Metadata } from "next";
import Link from "next/link";
import { ClientPortalLogin } from "./portal-login";

export const metadata: Metadata = {
  title: "Client Portal | YK-Online",
  description:
    "Client access portal for YK Online project materials, handover documents and support.",
};

export default function ClientPortalPage() {
  return (
    <main className="client-portal">
      <section className="client-portal__simple">
        <ClientPortalLogin />
        <p className="client-portal__note">
          Access is created for the billing e-mail used in your order. Project
          materials, handover documents and support notes are available after
          payment confirmation. Need help?{" "}
          <Link href="/contact">Contact support</Link>.
        </p>
      </section>
    </main>
  );
}
