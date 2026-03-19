import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { CART_STORAGE_KEY } from "../checkout.constants";
import { sanitizeCartItem } from "../checkout.utils";
import { loadStoreSettingsService } from "../services/checkout.service";

export default function useCheckoutSession({
  setCartItems,
  setStoreSettings,
  setUser,
  setIsLoggedIn,
  setMode,
  setDeliveryForm,
  setMessage,
  mapUserMetadataToForm,
  onLoadAddresses,
}) {
  useEffect(() => {
    async function loadCheckoutData() {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart.map(sanitizeCartItem).filter(Boolean));
          }
        }

        const storeSettings = await loadStoreSettingsService();
        setStoreSettings(storeSettings);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Erro ao buscar sessão:", sessionError);
        }

        const currentUser = session?.user ?? null;

        if (currentUser) {
          const metadata = currentUser.user_metadata ?? {};

          setUser(currentUser);
          setIsLoggedIn(true);
          setMode("account");
          setDeliveryForm((prev) => ({
            ...prev,
            ...mapUserMetadataToForm(metadata),
            paymentMethod: prev.paymentMethod || "",
            needsChange: prev.needsChange || false,
            changeFor: prev.changeFor || "",
          }));

          await onLoadAddresses(currentUser.id, metadata);
        }
      } catch (error) {
        console.error("Erro ao carregar checkout:", error);
        setMessage("Não foi possível carregar os dados do checkout.");
      }
    }

    loadCheckoutData();
  }, [
    setCartItems,
    setStoreSettings,
    setUser,
    setIsLoggedIn,
    setMode,
    setDeliveryForm,
    setMessage,
    mapUserMetadataToForm,
    onLoadAddresses,
  ]);
}