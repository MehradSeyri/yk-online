import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů | YK-Online",
  description: "Zásady ochrany osobních údajů / Privacy Policy — YK-Online",
};

const CS = `
<div class="legal-notice">
  Ochrana vašich osobních údajů je pro nás prioritou. Tyto zásady popisují, jaké osobní údaje shromažďujeme, proč a jak je zpracováváme. Zpracování se řídí Nařízením Evropského parlamentu a Rady (EU) č. 2016/679 (GDPR) a zákonem č. 110/2019 Sb., o zpracování osobních údajů.
</div>

<h2>1. Správce osobních údajů</h2>
<p><strong>Správce:</strong> YK Online, s.r.o.<br>
   <strong>IČO:</strong> 24062421<br>
   <strong>Adresa:</strong> Radimovická 1773/15, Chodov, 149 00 Praha<br>
   <strong>E-mail:</strong> <a href="mailto:info@yk-online.eu">info@yk-online.eu</a><br>
   <strong>Web:</strong> <a href="https://yk-online.eu">https://yk-online.eu</a>
</p>
<p>Správce je fyzická nebo právnická osoba, která určuje účely a způsoby zpracování osobních údajů.</p>

<h2>2. Jaké osobní údaje zpracováváme</h2>

<h3>a) Registrační údaje (uživatelský účet)</h3>
<ul>
  <li>Jméno a příjmení</li>
  <li>E-mailová adresa</li>
  <li>Zaheslovaný otisk hesla (heslo v čitelné podobě neuchováváme)</li>
  <li>Datum registrace</li>
</ul>

<h3>b) Objednávkové a fakturační údaje</h3>
<ul>
  <li>Jméno / název firmy, adresa, IČO/DIČ (jsou-li relevantní)</li>
  <li>Přehled objednaných služeb a plateb</li>
  <li>Kontaktní e-mail pro zasílání faktur</li>
</ul>

<h3>c) Kontaktní formulář</h3>
<ul>
  <li>Jméno</li>
  <li>E-mailová adresa</li>
  <li>Obsah zprávy</li>
</ul>

<h3>d) Technická provozní data</h3>
<ul>
  <li>IP adresa (anonymizovaná po 90 dnech)</li>
  <li>Typ prohlížeče a zařízení</li>
  <li>Navštívené stránky a čas návštěvy (provozní logy)</li>
</ul>

<h2>3. Účely a právní základy zpracování</h2>

<h3>Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)</h3>
<p>Správa uživatelského účtu, zpracování objednávek a plateb, komunikace při poskytování objednaných služeb.</p>

<h3>Oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR)</h3>
<p>Provoz a technické zabezpečení webu, ochrana před podvody a bezpečnostními incidenty, zlepšování kvality služeb na základě agregovaných dat.</p>

<h3>Splnění právní povinnosti (čl. 6 odst. 1 písm. c) GDPR)</h3>
<p>Vedení účetnictví a daňové evidence (zákon č. 563/1991 Sb.), uchovávání faktur (po dobu 10 let).</p>

<h3>Souhlas (čl. 6 odst. 1 písm. a) GDPR)</h3>
<p>Zasílání obchodních sdělení a newsletterů — pouze pokud jste nám k tomu udělili výslovný souhlas. Souhlas lze kdykoli odvolat.</p>

<h2>4. Doba uchovávání osobních údajů</h2>
<ul>
  <li><strong>Uživatelský účet:</strong> po dobu trvání smluvního vztahu a 3 roky po jeho ukončení.</li>
  <li><strong>Fakturace a účetnictví:</strong> 10 let od vystavení dokladu (zákonná povinnost).</li>
  <li><strong>Kontaktní formulář:</strong> 2 roky od přijetí zprávy, není-li z ní uzavřena smlouva.</li>
  <li><strong>Provozní logy:</strong> maximálně 12 měsíců.</li>
  <li><strong>Souhlasy se zasíláním newsletterů:</strong> do odvolání souhlasu, poté bez zbytečného odkladu.</li>
</ul>

<h2>5. Příjemci a předávání údajů</h2>
<p>Osobní údaje neprodáváme ani nepronajímáme třetím stranám. Údaje mohou být sdíleny s důvěryhodnými zpracovateli za účelem provozování webu a poskytování služeb:</p>
<ul>
  <li><strong>Poskytovatel webhostingu</strong> — provoz serverové infrastruktury (EU hosting).</li>
  <li><strong>Platební brána</strong> — po jejím zprovoznění; zpracovatel bude uveden v aktualizované verzi těchto zásad.</li>
  <li><strong>Účetní software</strong> — pro vedení daňové evidence.</li>
</ul>
<p>Veškeří zpracovatelé jsou vázáni smlouvou o zpracování osobních údajů a dodržují GDPR. Údaje nejsou předávány do třetích zemí mimo EHP, pokud není zajištěna adekvátní ochrana (standardní smluvní doložky EU).</p>

<h2>6. Vaše práva</h2>
<p>Jako subjekt údajů máte tato práva:</p>
<ul>
  <li><strong>Právo na přístup</strong> — získat potvrzení, zda zpracováváme vaše údaje, a kopii zpracovaných dat.</li>
  <li><strong>Právo na opravu</strong> — opravit nepřesné nebo doplnit neúplné údaje.</li>
  <li><strong>Právo na výmaz ("právo být zapomenut")</strong> — požádat o smazání údajů, pokud nejsou nezbytné pro splnění zákonné povinnosti.</li>
  <li><strong>Právo na omezení zpracování</strong> — dočasně omezit zpracování, pokud zpochybňujete přesnost údajů nebo zákonnost zpracování.</li>
  <li><strong>Právo na přenositelnost</strong> — obdržet své údaje v strojově čitelném formátu (např. JSON/CSV).</li>
  <li><strong>Právo vznést námitku</strong> — namítat zpracování na základě oprávněného zájmu.</li>
  <li><strong>Právo odvolat souhlas</strong> — kdykoli odvolat souhlas se zpracováním (newsletters apod.) bez vlivu na zákonnost předchozího zpracování.</li>
</ul>
<p>Práva uplatňujte e-mailem na <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>. Odpovíme do <strong>30 dnů</strong>.</p>
<p>Máte také právo podat stížnost u dozorového orgánu:<br>
   <strong>Úřad pro ochranu osobních údajů (ÚOOÚ)</strong><br>
   Pplk. Sochora 27, 170 00 Praha 7<br>
   <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">www.uoou.cz</a>
</p>

<h2>7. Cookies</h2>
<p>Web yk-online.eu používá pouze technicky nezbytné cookies pro správnou funkci webu (správa relace, uložení jazykové preference). Analytické ani reklamní cookies bez vašeho souhlasu nepoužíváme.</p>
<ul>
  <li><code>yk_lang</code> — uložení jazykové preference (CS/EN), platnost: relace / localStorage.</li>
</ul>
<p>Web v současné době neobsahuje skripty třetích stran, které by vytvářely sledovací cookies.</p>

<h2>8. Zabezpečení osobních údajů</h2>
<p>Přijímáme technická a organizační opatření k ochraně osobních údajů před neoprávněným přístupem, ztrátou nebo zneužitím:</p>
<ul>
  <li>Přenos dat šifrovaný pomocí protokolu HTTPS/TLS.</li>
  <li>Hesla uchováváme výhradně v hashované podobě.</li>
  <li>Přístup k datům je omezen pouze na oprávněné osoby.</li>
</ul>

<h2>9. Změny těchto zásad</h2>
<p>Tyto zásady ochrany osobních údajů mohou být průběžně aktualizovány. O podstatných změnách vás budeme informovat e-mailem nebo oznámením na webu. Datum poslední aktualizace je uveden v záhlaví tohoto dokumentu.</p>

<h2>10. Kontakt</h2>
<p>Veškeré dotazy, žádosti o uplatnění práv nebo stížnosti směřujte na:<br>
   <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>
</p>
`;

const EN = `
<div class="legal-notice">
  Protecting your personal data is our priority. This Privacy Policy describes what personal data we collect, why, and how we process it. Processing is governed by EU Regulation 2016/679 (GDPR) and Czech Act No. 110/2019 Coll. on the Processing of Personal Data.
</div>

<h2>1. Data Controller</h2>
<p><strong>Controller:</strong> YK Online, s.r.o.<br>
   <strong>Company ID (IČO):</strong> 24062421<br>
   <strong>Address:</strong> Radimovická 1773/15, Chodov, 149 00 Praha<br>
   <strong>E-mail:</strong> <a href="mailto:info@yk-online.eu">info@yk-online.eu</a><br>
   <strong>Website:</strong> <a href="https://yk-online.eu">https://yk-online.eu</a>
</p>

<h2>2. Personal Data We Process</h2>

<h3>a) Registration data (user account)</h3>
<ul>
  <li>First and last name</li>
  <li>E-mail address</li>
  <li>Hashed password (we never store passwords in plain text)</li>
  <li>Date of registration</li>
</ul>

<h3>b) Order and billing data</h3>
<ul>
  <li>Name / company name, address, VAT number (where applicable)</li>
  <li>History of ordered services and payments</li>
  <li>Billing e-mail address</li>
</ul>

<h3>c) Contact form data</h3>
<ul>
  <li>Name</li>
  <li>E-mail address</li>
  <li>Message content</li>
</ul>

<h3>d) Technical operational data</h3>
<ul>
  <li>IP address (anonymised after 90 days)</li>
  <li>Browser type and device</li>
  <li>Pages visited and time of visit (server logs)</li>
</ul>

<h2>3. Purposes and Legal Bases</h2>

<h3>Contract performance (Art. 6(1)(b) GDPR)</h3>
<p>User account management, order and payment processing, communication in the course of delivering ordered services.</p>

<h3>Legitimate interests (Art. 6(1)(f) GDPR)</h3>
<p>Website operation and security, fraud prevention and security incident response, improving service quality using aggregated data.</p>

<h3>Legal obligation (Art. 6(1)(c) GDPR)</h3>
<p>Bookkeeping and tax records (Czech Accounting Act No. 563/1991 Coll.), storage of invoices for 10 years.</p>

<h3>Consent (Art. 6(1)(a) GDPR)</h3>
<p>Sending commercial communications and newsletters — only where you have given explicit consent. Consent may be withdrawn at any time.</p>

<h2>4. Data Retention Periods</h2>
<ul>
  <li><strong>User account:</strong> for the duration of the contractual relationship and 3 years after its termination.</li>
  <li><strong>Invoices and accounting:</strong> 10 years from date of issue (statutory obligation).</li>
  <li><strong>Contact form:</strong> 2 years from receipt, unless a contract arises from the enquiry.</li>
  <li><strong>Server logs:</strong> maximum 12 months.</li>
  <li><strong>Newsletter consent:</strong> until consent is withdrawn, then deleted without undue delay.</li>
</ul>

<h2>5. Recipients and Data Transfers</h2>
<p>We do not sell or rent personal data to third parties. Data may be shared with trusted processors for website operation and service delivery:</p>
<ul>
  <li><strong>Web hosting provider</strong> — server infrastructure within the EEA.</li>
  <li><strong>Payment gateway</strong> — once activated; the processor will be named in an updated version of this policy.</li>
  <li><strong>Accounting software</strong> — for tax record management.</li>
</ul>
<p>All processors are bound by data processing agreements and comply with GDPR. Data is not transferred to third countries outside the EEA unless adequate protection is ensured (EU Standard Contractual Clauses).</p>

<h2>6. Your Rights</h2>
<ul>
  <li><strong>Right of access</strong> — obtain confirmation of whether we process your data and a copy of it.</li>
  <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data.</li>
  <li><strong>Right to erasure ("right to be forgotten")</strong> — request deletion where data is no longer necessary or a legal obligation does not require retention.</li>
  <li><strong>Right to restriction</strong> — temporarily restrict processing where you contest the accuracy or lawfulness of processing.</li>
  <li><strong>Right to data portability</strong> — receive your data in a machine-readable format (e.g. JSON/CSV).</li>
  <li><strong>Right to object</strong> — object to processing based on legitimate interests.</li>
  <li><strong>Right to withdraw consent</strong> — withdraw consent (for newsletters etc.) at any time without affecting the lawfulness of prior processing.</li>
</ul>
<p>To exercise your rights, e-mail <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>. We will respond within <strong>30 days</strong>.</p>
<p>You also have the right to lodge a complaint with a supervisory authority:<br>
   <strong>Czech Data Protection Office (ÚOOÚ)</strong><br>
   Pplk. Sochora 27, 170 00 Prague 7, Czech Republic<br>
   <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">www.uoou.cz</a>
</p>

<h2>7. Cookies</h2>
<p>yk-online.eu uses only technically necessary cookies required for the website to function (session management, language preference storage). We do not use analytics or advertising cookies without your consent.</p>
<ul>
  <li><code>yk_lang</code> — stores language preference (CS/EN); stored in localStorage (session scope).</li>
</ul>
<p>The website does not currently embed third-party scripts that would create tracking cookies.</p>

<h2>8. Data Security</h2>
<p>We implement technical and organisational measures to protect personal data against unauthorised access, loss, or misuse:</p>
<ul>
  <li>All data transmission is encrypted using HTTPS/TLS.</li>
  <li>Passwords are stored exclusively as cryptographic hashes.</li>
  <li>Access to personal data is restricted to authorised personnel only.</li>
</ul>

<h2>9. Changes to This Policy</h2>
<p>This Privacy Policy may be updated from time to time. We will notify you of material changes by e-mail or a notice on the website. The effective date at the top of this page reflects the most recent update.</p>

<h2>10. Contact</h2>
<p>For any questions, rights requests, or complaints, please contact us at:<br>
   <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>
</p>
`;

export default function PrivacyPage() {
  return (
    <LegalShell
      titleCs="Zásady ochrany osobních údajů"
      titleEn="Privacy Policy"
      updatedCs="Platné od 5. dubna 2026"
      updatedEn="Effective from April 5, 2026"
      contentCs={CS}
      contentEn={EN}
    />
  );
}
