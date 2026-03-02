import Navbar from "./components/layout/Navbar";
import Carousel from "./components/ui/Carousel";

export default function App() {
  return (
    <>
      <Navbar />

      {/* Só pra testar os links */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
        <section id="inicio" style={{ padding: "80px 0" }}>
            <Carousel />
        </section>

        <section id="cardapio" style={{ padding: "80px 0" }}>
          <h2>Cardápio</h2>
        </section>

        <section id="como-funciona" style={{ padding: "80px 0" }}>
          <h2>Como funciona</h2>
        </section>

        <section id="depoimentos" style={{ padding: "80px 0" }}>
          <h2>Depoimentos</h2>
        </section>

        <section id="fazer-pedido" style={{ padding: "80px 0" }}>
          <h2>Fazer pedido</h2>
        </section>
      </main>
    </>
  );
}