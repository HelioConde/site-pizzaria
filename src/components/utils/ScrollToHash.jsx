import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const id = hash.replace("#", "");

    const tryScroll = () => {
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    const timeout = setTimeout(() => {
      requestAnimationFrame(tryScroll);
    }, 120);

    return () => clearTimeout(timeout);
  }, [pathname, hash]);

  return null;
}