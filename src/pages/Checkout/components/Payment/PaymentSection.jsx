import styles from "./PaymentSection.module.css";

export default function PaymentSection({
    paymentMethod,
    needsChange,
    changeFor,
    onChange,
}) {
    return (
        <div className={styles.wrapper}>
            <h3 className={styles.title}>Forma de pagamento</h3>

            <div className={styles.optionList}>
                <label
                    className={`${styles.optionCard} ${
                        paymentMethod === "dinheiro" ? styles.optionCardActive : ""
                    }`}
                >
                    <input
                        className={styles.inputHidden}
                        type="radio"
                        name="paymentMethod"
                        value="dinheiro"
                        checked={paymentMethod === "dinheiro"}
                        onChange={onChange}
                    />
                    <div className={styles.optionContent}>
                        <div>
                            <strong className={styles.optionTitle}>Dinheiro</strong>
                            <p className={styles.optionDescription}>
                                Pague na entrega e informe se precisa de troco.
                            </p>
                        </div>
                        <span className={styles.optionCheck} />
                    </div>
                </label>

                {paymentMethod === "dinheiro" ? (
                    <div className={styles.extraBox}>
                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                name="needsChange"
                                checked={needsChange}
                                onChange={onChange}
                            />
                            <span>Preciso de troco</span>
                        </label>

                        {needsChange ? (
                            <label className={styles.field}>
                                <span>Troco para quanto?</span>
                                <input
                                    type="text"
                                    name="changeFor"
                                    value={changeFor}
                                    onChange={onChange}
                                    placeholder="Ex: 60,00"
                                />
                            </label>
                        ) : null}
                    </div>
                ) : null}

                <label
                    className={`${styles.optionCard} ${
                        paymentMethod === "cartao_entrega"
                            ? styles.optionCardActive
                            : ""
                    }`}
                >
                    <input
                        className={styles.inputHidden}
                        type="radio"
                        name="paymentMethod"
                        value="cartao_entrega"
                        checked={paymentMethod === "cartao_entrega"}
                        onChange={onChange}
                    />
                    <div className={styles.optionContent}>
                        <div>
                            <strong className={styles.optionTitle}>
                                Cartão na entrega
                            </strong>
                            <p className={styles.optionDescription}>
                                Pague ao receber com cartão e maquininha.
                            </p>
                        </div>
                        <span className={styles.optionCheck} />
                    </div>
                </label>

                <label
                    className={`${styles.optionCard} ${
                        paymentMethod === "pagamento_online"
                            ? styles.optionCardActive
                            : ""
                    }`}
                >
                    <input
                        className={styles.inputHidden}
                        type="radio"
                        name="paymentMethod"
                        value="pagamento_online"
                        checked={paymentMethod === "pagamento_online"}
                        onChange={onChange}
                    />
                    <div className={styles.optionContent}>
                        <div>
                            <strong className={styles.optionTitle}>
                                Pagamento online
                            </strong>
                            <p className={styles.optionDescription}>
                                Finalize com Stripe: cartão, boleto e métodos digitais.
                            </p>
                        </div>
                        <span className={styles.optionCheck} />
                    </div>
                </label>
            </div>
        </div>
    );
}