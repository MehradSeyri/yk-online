import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Kontakt | YK-Online",
  description: "Kontakt / Contact details — YK Online, s.r.o.",
};

const CS = `
<div class="legal-notice">
  Toto je oficiální kontaktní stránka společnosti <strong>YK Online, s.r.o.</strong>.
  Pro dotazy k objednávkám, platbám, reklamacím nebo odstoupení od smlouvy nás
  kontaktujte níže uvedenými kanály.
</div>

<h2>Identifikace společnosti</h2>
<p><strong>Obchodní firma:</strong> YK Online, s.r.o.<br>
   <strong>Sídlo:</strong> Radimovická 1773/15, Chodov, 149 00 Praha<br>
   <strong>IČO:</strong> 24062421
</p>

<h2>Kontaktní údaje</h2>
<p><strong>E-mail:</strong> <a href="mailto:info@yk-online.eu">info@yk-online.eu</a><br>
   <strong>Telefon:</strong> <a href="tel:+420775170443">+420 775 170 443</a><br>
   <strong>Web:</strong> <a href="https://yk-online.eu">https://yk-online.eu</a>
</p>

<h2>Zákaznická podpora</h2>
<ul>
  <li>Dotazy k objednávkám a platbám: e-mailem nebo telefonicky.</li>
  <li>Reklamace a odstoupení od smlouvy: viz <a href="/complaints">Reklamační řád</a>.</li>
  <li>Ochrana osobních údajů: viz <a href="/privacy">Zásady ochrany osobních údajů</a>.</li>
  <li>Obchodní podmínky: viz <a href="/terms">Obchodní podmínky</a>.</li>
</ul>
`;

const EN = `
<div class="legal-notice">
  This is the official contact page of <strong>YK Online, s.r.o.</strong>.
  For questions about orders, payments, complaints, or withdrawal requests,
  please use the contact channels below.
</div>

<h2>Company Identification</h2>
<p><strong>Business name:</strong> YK Online, s.r.o.<br>
   <strong>Registered address:</strong> Radimovická 1773/15, Chodov, 149 00 Praha<br>
   <strong>Company ID (IČO):</strong> 24062421
</p>

<h2>Contact Details</h2>
<p><strong>E-mail:</strong> <a href="mailto:info@yk-online.eu">info@yk-online.eu</a><br>
   <strong>Phone:</strong> <a href="tel:+420775170443">+420 775 170 443</a><br>
   <strong>Website:</strong> <a href="https://yk-online.eu">https://yk-online.eu</a>
</p>

<h2>Customer Support</h2>
<ul>
  <li>Order and payment support: by e-mail or phone.</li>
  <li>Complaints and withdrawal: see <a href="/complaints">Complaints Policy</a>.</li>
  <li>Personal data processing: see <a href="/privacy">Privacy Policy</a>.</li>
  <li>Commercial terms: see <a href="/terms">Terms and Conditions</a>.</li>
</ul>
`;

export default function ContactPage() {
  return (
    <LegalShell
      titleCs="Kontakt"
      titleEn="Contact"
      updatedCs="Aktualizováno: 2. července 2026"
      updatedEn="Updated: July 2, 2026"
      contentCs={CS}
      contentEn={EN}
    />
  );
}
