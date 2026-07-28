import { FloatingNav } from "./components/FloatingNav";
import { FogTransition } from "./components/FogTransition";
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
        <FogTransition />
        <ProductShowcase />
        <NetPositiveSection />
      </main>
      <Footer />
    </>
  );
}
