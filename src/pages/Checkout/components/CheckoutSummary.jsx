import { Link } from "react-router-dom";
import styles from "../Checkout.module.css";
import { formatPrice } from "../checkout.utils";
import CheckoutPaymentBlock from "./CheckoutPaymentBlock";
import DeliveryLocationPicker from "../../../components/maps/DeliveryLocationPicker";

export default function CheckoutSummary({
  cartItems,
  subtotal,
  deliveryFee,
  total,
  estimatedDelivery,
  summaryNameText,
  summaryAddressText,
  summaryRegionText,
  activeDelivery,
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
  hasConfirmedMapLocation,
  handleDeliveryChange,
  PAYMENT_METHOD,
  isSubmitting,
  handleConfirmOrder,
  confirmValidationError,
}) {
  return (
    <section className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <h2 className={styles.sectionTitle}>Resumo do pedido</h2>

        <div className={styles.summaryPills}>
          <div className={styles.summaryPill}>
            <span>🕒 Entrega estimada</span>
            <strong>{estimatedDelivery}</strong>
          </div>

          <div className={styles.summaryPillSafe}>🔒 Checkout seguro</div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Seu carrinho está vazio.</p>
          <Link to="/menu" className={styles.emptyLink}>
            Ir para o cardápio
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.summaryList}>
            {cartItems.map((item, index) => (
              <div
                key={`${item.id ?? item.productId ?? item.name}-${index}`}
                className={styles.summaryItem}
              >
                <div className={styles.summaryItemTop}>
                  <strong>
                    {item.quantity}x {item.name}
                  </strong>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>

                {item.removedIngredients?.length > 0 ? (
                  <p className={styles.summaryItemNote}>
                    {item.removedIngredients.join(" • ")}
                  </p>
                ) : null}

                {item.notes ? (
                  <p className={styles.summaryItemNote}>{item.notes}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className={styles.totalBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className={styles.totalRow}>
              <span>Entrega</span>
              <strong>{formatPrice(deliveryFee)}</strong>
            </div>

            <div className={`${styles.totalRow} ${styles.totalFinal}`}>
              <span>Total a pagar</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <div className={styles.summaryDelivery}>
            <h3 className={styles.summaryDeliveryTitle}>Entrega</h3>

            <p className={styles.summaryDeliveryText}>{summaryNameText}</p>
            <p className={styles.summaryDeliveryText}>{summaryAddressText}</p>

            {activeDelivery.complement ? (
              <p className={styles.summaryDeliveryText}>
                Complemento: {activeDelivery.complement}
              </p>
            ) : null}

            {activeDelivery.reference ? (
              <p className={styles.summaryDeliveryText}>
                Referência: {activeDelivery.reference}
              </p>
            ) : null}

            {summaryRegionText ? (
              <p className={styles.summaryDeliveryText}>
                {summaryRegionText}
              </p>
            ) : null}

            <CheckoutPaymentBlock
              hasAddressReadyForMap={hasAddressReadyForMap}
              skipMapSelection={skipMapSelection}
              setSkipMapSelection={setSkipMapSelection}
              setDeliveryLat={setDeliveryLat}
              setDeliveryLng={setDeliveryLng}
              setHasConfirmedMapLocation={setHasConfirmedMapLocation}
              setMessage={setMessage}
              setIsGeocoding={setIsGeocoding}
              lastGeocodeKeyRef={lastGeocodeKeyRef}
              deliveryLat={deliveryLat}
              deliveryLng={deliveryLng}
              DeliveryLocationPicker={DeliveryLocationPicker}
              hasConfirmedMapLocation={hasConfirmedMapLocation}
              activeDelivery={activeDelivery}
              handleDeliveryChange={handleDeliveryChange}
              PAYMENT_METHOD={PAYMENT_METHOD}
              isSubmitting={isSubmitting}
              handleConfirmOrder={handleConfirmOrder}
              confirmValidationError={confirmValidationError}
            />
          </div>
        </>
      )}
    </section>
  );
}