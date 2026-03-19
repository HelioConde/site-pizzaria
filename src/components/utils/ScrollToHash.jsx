import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MAX_SCROLL_ATTEMPTS = 12;
const SCROLL_RETRY_DELAY = 80;

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    let timeoutId = null;
    let attempts = 0;
    let cancelled = false;

    function clearScheduledTimeout() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }

    function decodeHashToId(rawHash) {
      if (!rawHash || typeof rawHash !== "string") return "";
      return decodeURIComponent(rawHash.replace(/^#/, "")).trim();
    }

    function tryScrollToElement(elementId) {
      if (cancelled || !elementId) return;

      const element = document.getElementById(elementId);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      if (attempts >= MAX_SCROLL_ATTEMPTS) {
        return;
      }

      attempts += 1;

      timeoutId = window.setTimeout(() => {
        requestAnimationFrame(() => {
          tryScrollToElement(elementId);
        });
      }, SCROLL_RETRY_DELAY);
    }

    if (!hash) {
      if (pathname === "/") {
        scrollToTop();
      }

      return () => {
        cancelled = true;
        clearScheduledTimeout();
      };
    }

    const elementId = decodeHashToId(hash);

    if (!elementId) {
      return () => {
        cancelled = true;
        clearScheduledTimeout();
      };
    }

    timeoutId = window.setTimeout(() => {
      requestAnimationFrame(() => {
        tryScrollToElement(elementId);
      });
    }, 60);

    return () => {
      cancelled = true;
      clearScheduledTimeout();
    };
  }, [pathname, hash]);

  return null;
}