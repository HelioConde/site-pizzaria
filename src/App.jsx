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
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import Menu from "./pages/Menu/Menu";
import Account from "./pages/Account/Account";
import ScrollToHash from "./components/utils/ScrollToHash";
import Admin from "./pages/Admin/Admin";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import useAuthRole from "./hooks/useAuthRole";

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

function AuthRedirect({ isLoading, isAuthenticated, userRole }) {
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (userRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (userRole === "delivery") {
    return <Navigate to="/motoboy" replace />;
  }

  return <Navigate to="/account" replace />;
}

function AppContent() {
  const location = useLocation();
  const { isLoading, isAuthenticated, userRole } = useAuthRole();

  const hideNavbarRoutes = ["/auth", "/admin", "/motoboy"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar ? <Navbar /> : null}
      <ScrollToHash />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
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
          path="/admin"
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
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}