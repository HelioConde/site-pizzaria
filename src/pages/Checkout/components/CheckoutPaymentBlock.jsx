import PaymentSection from "./Payment/PaymentSection";
import CheckoutConfirmSection from "./CheckoutConfirmSection";
import Button from "../../../components/ui/Button/Button";
import styles from "../Checkout.module.css";

export default function CheckoutPaymentBlock({
  hasAddressReadyForMap,
  skipMapSelection,
  setSkipMapSelection,
  setDeliveryLat,
  setDeliveryLng,
  setHasConfirmedMapLocation,
  setMessage,
  setIsGeocoding,
  lastGeocodeKeyRef,
  deliveryLat,
  deliveryLng,
  DeliveryLocationPicker,
  hasConfirmedMapLocation,
  activeDelivery,
  handleDeliveryChange,
  PAYMENT_METHOD,
  isSubmitting,
  handleConfirmOrder,
  confirmValidationError,
}) {
  return (
    <>
      {hasAddressReadyForMap ? (
        <div className={styles.mapConfirmSection}>
          <h3 className={styles.summaryDeliveryTitle}>
            Localização no mapa (opcional)
          </h3>

          <p className={styles.summaryDeliveryText}>
            📍 Ative para acompanhar o pedido em tempo real.
          </p>

          <div className={styles.mapToggleActions}>
            {!skipMapSelection ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSkipMapSelection(true);
                  setDeliveryLat(null);
                  setDeliveryLng(null);
                  setHasConfirmedMapLocation(false);
                  setMessage("");
                  setIsGeocoding(false);
                }}
              >
                Não usar mapa
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSkipMapSelection(false);
                  setMessage("");
                  if (lastGeocodeKeyRef?.current !== undefined) {
                    lastGeocodeKeyRef.current = "";
                  }
                }}
              >
                Usar mapa
              </Button>
            )}
          </div>

          {!skipMapSelection ? (
            <>
              <DeliveryLocationPicker
                latitude={deliveryLat ?? -15.8794}
                longitude={deliveryLng ?? -48.0844}
                onChange={(lat, lng) => {
                  setDeliveryLat(lat);
                  setDeliveryLng(lng);
                  setHasConfirmedMapLocation(true);
                  setMessage("");
                }}
              />

              {hasConfirmedMapLocation ? (
                <p className={styles.mapConfirmed}>✔ Local confirmado</p>
              ) : null}
            </>
          ) : (
            <p className={styles.summaryDeliveryText}>
              Pedido sem rastreamento em tempo real.
            </p>
          )}
        </div>
      ) : null}

      <div className={styles.paymentBlock}>
        <h3 className={styles.summaryDeliveryTitle}>Pagamento</h3>

        <PaymentSection
          paymentMethod={activeDelivery.paymentMethod}
          needsChange={activeDelivery.needsChange}
          changeFor={activeDelivery.changeFor}
          onChange={handleDeliveryChange}
          paymentMethods={PAYMENT_METHOD}
        />

        {activeDelivery.paymentMethod === PAYMENT_METHOD.ONLINE ? (
          <p className={styles.summaryDeliveryText}>
            O pagamento online será finalizado na próxima etapa, em uma página
            segura.
          </p>
        ) : null}
      </div>

      <CheckoutConfirmSection
        paymentMethod={activeDelivery.paymentMethod}
        paymentMethods={PAYMENT_METHOD}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmOrder}
        confirmValidationError={confirmValidationError}
      />
    </>
  );
}