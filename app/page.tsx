import { I18nProvider } from "./components/i18n";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import FeatureBlocks from "./components/FeatureBlocks";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import CtaBanner from "./components/CtaBanner";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <I18nProvider>
      <Nav />
      <main>
        <Hero />
        <FeatureBlocks />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CtaBanner />
        <Faq />
      </main>
      <Footer />
    </I18nProvider>
  );
}
