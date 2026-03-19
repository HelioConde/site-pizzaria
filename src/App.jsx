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

import db from "./data/db.json";
import styles from "./App.module.css";

function normalizeHomeProduct(product) {
  return {
    id: product.id,
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
  const { sections } = db;
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

        const { data, error } = await supabase
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
            sort_order,
            created_at
          `)
          .eq("is_active", true)
          .eq("is_featured", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        setProducts((data ?? []).map(normalizeHomeProduct));
      } catch (error) {
        console.error("Erro ao carregar destaques da home:", error);

        if (!isMounted) return;

        setProducts([]);
        setProductsError(
          "Não foi possível carregar os produtos em destaque no momento."
        );
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadHighlightProducts();

    const channel = supabase
      .channel("home-highlights-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadHighlightProducts();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <main id="inicio">
        <Carousel slides={sections.carousel} />

        <section id="destaques" aria-busy={isLoadingProducts}>
          <Highlights data={sections.highlights} products={products} />

          {!isLoadingProducts && productsError ? (
            <div className={styles.highlightError}>{productsError}</div>
          ) : null}
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