import { Footer } from "./Footer";

export function ProductShowcase() {
  return (
    <section className="product-showcase" aria-label="Melonite desktop application preview">
      <img
        className="pixel-strip pixel-strip-a"
        src="/figma/updated/sparse-strip-top-purple.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className="pixel-strip pixel-strip-b"
        src="/figma/updated/sparse-strip-bottom-purple.png"
        alt=""
        aria-hidden="true"
      />
      <div className="product-canvas">
        <img
          className="product-preview-image"
          src="/figma/updated/product-preview-raw-1.png"
          width="2784"
          height="1888"
          alt="Melonite desktop app showing an agent iteration session"
        />
      </div>
      <Footer />
      <span id="discord" className="discord-anchor" aria-hidden="true" />
    </section>
  );
}
