import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/layout/NavBar";
import Carousel from "./components/ui/Carousel/Carousel";
import Highlights from "./components/sections/Highlights/Highlights";
import HowItWorks from "./components/sections/HowItWorks/HowItWorks";
import Testimonials from "./components/sections/Testimonials/Testimonials";
import FinalCta from "./components/sections/FinalCta/FinalCta";
import Footer from "./components/sections/Footer/Footer";

import Motoboy from "./pages/Motoboy/Motoboy";
import Checkout from "./pages/Checkout/Checkout";
import Auth from "./pages/Auth/Auth";
import PaymentSuccess from "./pages/PaymentSuccess/PaymentSuccess";
import PaymentOnlineCheck from "./pages/PaymentOnlineCheck/PaymentOnlineCheck";
import Menu from "./pages/Menu/Menu";
import Account from "./pages/Account/Account";
import ScrollToHash from "./components/utils/ScrollToHash";
import Admin from "./pages/Admin/Admin";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import useAuthRole from "./hooks/useAuthRole";
import { supabase } from "./lib/supabase";

import styles from "./App.module.css";

const homeSections = {
  carousel: [
    {
      id: "hero-1",
      title: "Pizzas com pedido rápido e experiência moderna",
      subtitle:
        "Monte seu pedido, acompanhe a entrega e finalize tudo de forma simples.",
      ctaLabel: "Fazer pedido",
      ctaTo: "/menu",
      secondaryCtaLabel: "Saiba mais",
      secondaryCtaTo: "/#como-funciona",
    },
    {
      id: "hero-2",
      title: "Acompanhe seu pedido com mais praticidade",
      subtitle:
        "Uma experiência pensada para facilitar o pedido, o pagamento e a entrega.",
      ctaLabel: "Ver cardápio",
      ctaTo: "/menu",
      secondaryCtaLabel: "Avaliações",
      secondaryCtaTo: "/#depoimentos",
    },
    {
      id: "hero-3",
      title: "Sua pizzaria digital com visual moderno",
      subtitle:
        "Projeto com foco em performance, usabilidade e fluxo de compra intuitivo.",
      ctaLabel: "Explorar menu",
      ctaTo: "/menu",
      secondaryCtaLabel: "Como funciona",
      secondaryCtaTo: "/#como-funciona",
    },
  ],
  howItWorks: {
    title: "Como funciona",
    subtitle: "Seu pedido em poucos passos.",
    steps: [
      {
        id: "step-1",
        icon: "cart",
        title: "Escolha sua pizza",
        description: "Abra o cardápio e selecione seus sabores favoritos.",
      },
      {
        id: "step-2",
        icon: "slice",
        title: "Finalize o pedido",
        description: "Informe seu endereço e escolha a forma de pagamento.",
      },
      {
        id: "step-3",
        icon: "bike",
        title: "Receba em casa",
        description: "Acompanhe o preparo e a entrega do seu pedido.",
      },
    ],
  },
  testimonials: {
    title: "Avaliações",
    subtitle: "O que nossos clientes acham da experiência.",
    items: [
      {
        id: "testimonial-1",
        name: "Cliente Base",
        city: "Brasília - DF",
        rating: 5,
        text: "Pedido rápido, visual bonito e experiência muito boa no celular.",
      },
      {
        id: "testimonial-2",
        name: "Cliente Premium",
        city: "Brasília - DF",
        rating: 5,
        text: "Fluxo de compra simples e acompanhamento bem organizado.",
      },
    ],
  },
  footer: {
    credits: {
      author: "Hélio Conde",
      note: "Projeto de portfólio.",
    },
  },
};

function normalizeHomeProduct(product) {
  return {
    id: product.product_id ?? product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: Number(product.price || 0),
    oldPrice: product.old_price != null ? Number(product.old_price) : null,
    rating: product.rating != null ? Number(product.rating) : null,
    tag: product.tag || null,
    image: product.image_url || null,
    active: !!product.is_active,
    hero: !!product.is_featured,
    sortOrder: Number(product.sort_order || 0),
    totalSold: Number(product.total_sold || 0),
  };
}

function FullPageFeedback({ title, message }) {
  return (
    <main className={styles.feedbackContainer}>
      <div className={styles.feedbackBox}>
        <h1 className={styles.feedbackTitle}>{title}</h1>
        <p className={styles.feedbackText}>{message}</p>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <FullPageFeedback
      title="Página não encontrada"
      message="A rota que você tentou acessar não existe ou foi movida."
    />
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHighlightProducts() {
      try {
        if (isMounted) {
          setProductsError("");
          setIsLoadingProducts(true);
        }

        const { data: salesData, error: salesError } = await supabase
          .from("product_sales_summary")
          .select(`
            product_id,
            slug,
            name,
            description,
            price,
            old_price,
            rating,
            tag,
            image_url,
            is_active,
            is_featured,
            sort_order,
            total_sold
          `)
          .eq("is_active", true)
          .order("total_sold", { ascending: false })
          .limit(2);

        if (salesError) throw salesError;

        let finalProducts = (salesData ?? []).map(normalizeHomeProduct);

        if (finalProducts.length < 2) {
          const { data: featuredData, error: featuredError } = await supabase
            .from("products")
            .select(`
              id,
              slug,
              name,
              description,
              price,
              old_price,
              rating,
              tag,
              image_url,
              is_active,
              is_featured,
              sort_order
            `)
            .eq("is_active", true)
            .eq("is_featured", true)
            .order("sort_order", { ascending: true })
            .limit(4);

          if (featuredError) throw featuredError;

          const fallbackProducts = (featuredData ?? []).map(normalizeHomeProduct);
          const existingIds = new Set(finalProducts.map((product) => product.id));

          for (const product of fallbackProducts) {
            if (!existingIds.has(product.id)) {
              finalProducts.push(product);
            }

            if (finalProducts.length >= 2) break;
          }
        }

        if (!isMounted) return;

        setProducts(finalProducts);
      } catch (error) {
        console.error("Erro ao carregar home:", error);

        if (!isMounted) return;

        setProducts([]);
        setProductsError("Erro ao carregar produtos.");
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadHighlightProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <main id="inicio">
        <Carousel slides={homeSections.carousel} />

        <section id="destaques" aria-busy={isLoadingProducts}>
          <Highlights products={products} />

          {!isLoadingProducts && productsError ? (
            <div className={styles.highlightError}>{productsError}</div>
          ) : null}
        </section>

        <section id="como-funciona">
          <HowItWorks data={homeSections.howItWorks} />
        </section>

        <section id="depoimentos">
          <Testimonials data={homeSections.testimonials} />
        </section>

        <section id="fazer-pedido">
          <FinalCta />
        </section>
      </main>

      <Footer footer={homeSections.footer} />
    </>
  );
}

function AuthRedirect({ isLoading, isAuthenticated, userRole }) {
  if (isLoading) {
    return (
      <FullPageFeedback
        title="Carregando..."
        message="Estamos verificando sua sessão."
      />
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (userRole === "delivery") {
    return <Navigate to="/motoboy" replace />;
  }

  return <Navigate to="/account" replace />;
}

function AppContent() {
  const location = useLocation();
  const { isLoading, isAuthenticated, userRole } = useAuthRole();

  const shouldHideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/motoboy");

  return (
    <>
      {!shouldHideNavbar ? <Navbar /> : null}
      <ScrollToHash />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-online-check" element={<PaymentOnlineCheck />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        <Route
          path="/auth"
          element={
            <AuthRedirect
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
            />
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
            >
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
              allowedRoles={["admin"]}
            >
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/motoboy"
          element={
            <ProtectedRoute
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
              allowedRoles={["delivery"]}
            >
              <Motoboy />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}