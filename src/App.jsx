import Navbar from "./components/layout/Navbar";
import Carousel from "./components/ui/Carousel/Carousel";
import Highlights from "./components/sections/Highlights/Highlights";
import HowItWorks from "./components/sections/HowItWorks/HowItWorks";
import Testimonials from "./components/sections/Testimonials/Testimonials";
import FinalCta from "./components/sections/FinalCta/FinalCta";
import Footer from "./components/sections/Footer/Footer";

import db from "./data/db.json";

export default function App() {
  const { sections, cardapio, site } = db;

  return (
    <>
      <Navbar />

      <main>
        <Carousel slides={sections.carousel} />

        <section id="destaques">
          <Highlights
            data={sections.highlights}
            pizzas={cardapio.pizzas}
          />
        </section>

        <section id="como-funciona">
          <HowItWorks data={sections.howItWorks} />
        </section>

        <section id="depoimentos">
          <Testimonials data={sections.testimonials} />
        </section>

        <section id="fazer-pedido" style={{ padding: "64px 0" }}>
          <FinalCta id="fazer-pedido" />
        </section>
      </main>

      <Footer store={db.store} footer={sections.footer} />
    </>
  );
}