import styles from "./Checkout.module.css";
import useCheckout from "./hooks/useCheckout";

import CheckoutHeader from "./components/CheckoutHeader";
import CheckoutModeSelector from "./components/CheckoutModeSelector";
import CheckoutAccountSection from "./components/CheckoutAccountSection";
import CheckoutGuestSection from "./components/CheckoutGuestSection";
import CheckoutNewAddressSection from "./components/CheckoutNewAddressSection";
import CheckoutHelpCard from "./components/CheckoutHelpCard";
import CheckoutSummary from "./components/CheckoutSummary";
import CheckoutMessage from "./components/CheckoutMessage";

export default function Checkout() {
  const checkout = useCheckout();

  return (
    <main className={styles.page}>
      <CheckoutHeader />

      <section className={styles.content}>
        <div className={styles.containerGrid}>
          <div className={styles.left}>
            {checkout.mode === null ? (
              <CheckoutModeSelector
                onContinueAsGuest={checkout.handleContinueAsGuest}
              />
            ) : null}

            {checkout.mode === "account" ? (
              <CheckoutAccountSection
                user={checkout.user}
                savedAddresses={checkout.savedAddresses}
                selectedAddressId={checkout.selectedAddressId}
                isDeletingAddress={checkout.isDeletingAddress}
                onSignOut={checkout.handleSignOutAndReset}
                onStartNewAddress={checkout.handleStartNewAddress}
                onSelectAddress={checkout.handleSelectAddress}
                onDeleteAddress={checkout.handleDeleteAddress}
              />
            ) : null}

            {checkout.mode === "guest" ? (
              <CheckoutGuestSection
                deliveryForm={checkout.deliveryForm}
                handleDeliveryChange={checkout.handleDeliveryChange}
                onBackToModeSelection={checkout.handleBackToModeSelection}
              />
            ) : null}

            {checkout.mode === "account" &&
            (checkout.showNewAddressForm ||
              checkout.savedAddresses.length === 0) ? (
              <CheckoutNewAddressSection
                deliveryForm={checkout.deliveryForm}
                handleDeliveryChange={checkout.handleDeliveryChange}
                handleSaveNewAddress={checkout.handleSaveNewAddress}
                isSavingAddress={checkout.isSavingAddress}
              />
            ) : null}

            <CheckoutMessage
              cepLoading={checkout.cepLoading}
              isGeocoding={checkout.isGeocoding}
              canShowMap={checkout.canShowMap}
              message={checkout.message}
            />

            <CheckoutHelpCard />
          </div>

          <aside className={styles.right}>
            <CheckoutSummary
              cartItems={checkout.cartItems}
              subtotal={checkout.subtotal}
              deliveryFee={checkout.deliveryFee}
              total={checkout.total}
              estimatedDelivery={checkout.estimatedDelivery}
              summaryNameText={checkout.summaryNameText}
              summaryAddressText={checkout.summaryAddressText}
              summaryRegionText={checkout.summaryRegionText}
              activeDelivery={checkout.activeDelivery}
              hasAddressReadyForMap={checkout.hasAddressReadyForMap}
              skipMapSelection={checkout.skipMapSelection}
              setSkipMapSelection={checkout.setSkipMapSelection}
              setDeliveryLat={checkout.setDeliveryLat}
              setDeliveryLng={checkout.setDeliveryLng}
              setHasConfirmedMapLocation={checkout.setHasConfirmedMapLocation}
              setMessage={checkout.setMessage}
              setIsGeocoding={checkout.setIsGeocoding}
              lastGeocodeKeyRef={checkout.lastGeocodeKeyRef}
              deliveryLat={checkout.deliveryLat}
              deliveryLng={checkout.deliveryLng}
              hasConfirmedMapLocation={checkout.hasConfirmedMapLocation}
              handleDeliveryChange={checkout.handleDeliveryChange}
              PAYMENT_METHOD={checkout.PAYMENT_METHOD}
              isSubmitting={checkout.isSubmitting}
              handleConfirmOrder={checkout.handleConfirmOrder}
              confirmValidationError={checkout.confirmValidationError}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}