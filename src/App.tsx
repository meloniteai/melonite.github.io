import { DownloadSection } from "./components/DownloadSection";
import { FloatingNav } from "./components/FloatingNav";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { NetPositiveSection } from "./components/NetPositiveSection";
import { ProductShowcase } from "./components/ProductShowcase";

export default function App() {
  return (
    <>
      <FloatingNav />
      <main>
        <HeroSection />
        <ProductShowcase />
        <NetPositiveSection />
        <DownloadSection />
      </main>
      <Footer />
    </>
  );
}
