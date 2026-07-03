import { Hero } from "@/components/hero";
import { Services, WhyUs } from "@/components/sections";
import { Pricing } from "@/components/pricing";
import { Contact } from "@/components/contact-footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Pricing />
      <WhyUs />
      <Contact />
    </>
  );
}
