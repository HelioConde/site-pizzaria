import Navbar from "./components/layout/Navbar";
import Carousel from "./components/ui/Carousel/Carousel";
import styles from "./App.module.css";

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Carousel />

        <section id="cardapio" className={styles.section}>
          <div className={styles.container}>
            <h2>Cardápio</h2>
            <p>Em breve: lista de pizzas, categorias e filtros.</p>
          </div>
        </section>

        <section id="como-funciona" className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2>Como funciona</h2>
            <p>Em breve: passo a passo do pedido, preparo e entrega.</p>
          </div>
        </section>

        <section id="depoimentos" className={styles.section}>
          <div className={styles.container}>
            <h2>Depoimentos</h2>
            <p>Em breve: avaliações e comentários de clientes.</p>
          </div>
        </section>

        <section id="fazer-pedido" className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2>Fazer pedido</h2>
            <p>Em breve: botão abrir WhatsApp / checkout.</p>
          </div>
        </section>
      </main>
    </>
  );
}