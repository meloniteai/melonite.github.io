import { FloatingNav } from "./components/FloatingNav";
import { HeroSection } from "./components/HeroSection";
import { InstallSection } from "./components/InstallSection";
import { ProductShowcase } from "./components/ProductShowcase";

export default function App() {
  return (
    <>
      <FloatingNav />
      <main>
        <HeroSection />
        <InstallSection />
        <ProductShowcase />
      </main>
    </>
  );
}
