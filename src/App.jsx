import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/NavBar";
import Carousel from "./components/ui/Carousel/Carousel";
import Highlights from "./components/sections/Highlights/Highlights";
import HowItWorks from "./components/sections/HowItWorks/HowItWorks";
import Testimonials from "./components/sections/Testimonials/Testimonials";
import FinalCta from "./components/sections/FinalCta/FinalCta";
import Footer from "./components/sections/Footer/Footer";

import Checkout from "./pages/Checkout/Checkout";
import Auth from "./pages/Auth/Auth";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import Menu from "./pages/Menu/Menu";
import Account from "./pages/Account/Account";
import ScrollToHash from "./components/utils/ScrollToHash";

import db from "./data/db.json";

function Home() {
  const { sections } = db;

  return (
    <>
      <main id="inicio">
        <Carousel slides={sections.carousel} />

        <section id="destaques">
          <Highlights
            data={sections.highlights}
            pizzas={db.cardapio.pizzas}
          />
        </section>

        <section id="como-funciona">
          <HowItWorks data={sections.howItWorks} />
        </section>

        <section id="depoimentos">
          <Testimonials data={sections.testimonials} />
        </section>

        <section id="fazer-pedido">
          <FinalCta />
        </section>
      </main>

      <Footer store={db.store} footer={sections.footer} />
    </>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <ScrollToHash />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </>
  );
}