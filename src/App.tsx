import { AboutSection } from "./components/AboutSection";
import { FloatingNav } from "./components/FloatingNav";
import { HeroSection } from "./components/HeroSection";
import { ProductShowcase } from "./components/ProductShowcase";

export default function App() {
  return (
    <>
      <FloatingNav />
      <main>
        <HeroSection />
        <AboutSection />
        <ProductShowcase />
      </main>
    </>
  );
}
