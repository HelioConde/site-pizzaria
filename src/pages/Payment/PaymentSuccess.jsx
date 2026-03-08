import { Link, useSearchParams } from "react-router-dom";
import styles from "./PaymentSuccess.module.css";

const STATUS_STEPS = [
    { key: "paid", label: "Pagamento aprovado" },
    { key: "preparing", label: "Em preparo" },
    { key: "delivery", label: "Saiu para entrega" },
    { key: "delivered", label: "Entregue" },
];

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    const currentStatus = "preparing";

    const currentStepIndex = STATUS_STEPS.findIndex(
        (step) => step.key === currentStatus
    );

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <section className={styles.card}>
                    <span className={styles.kicker}>Pedido confirmado</span>

                    <div className={styles.iconWrap}>
                        <div className={styles.icon}>✓</div>
                    </div>

                    <h1 className={styles.title}>Pagamento aprovado com sucesso</h1>

                    <p className={styles.subtitle}>
                        Seu pedido foi recebido pela <strong>Base Studio Pizzas</strong> e
                        já foi enviado para a etapa de preparo.
                    </p>

                    <div className={styles.statusHighlight}>
                        <span className={styles.statusBadge}>Status atual</span>
                        <strong className={styles.statusValue}>Em preparo</strong>
                        <p className={styles.statusText}>
                            Nossa equipe já começou a preparar seu pedido.
                            <div className={styles.estimate}>
                                Tempo estimado: 35–45 minutos
                            </div>
                        </p>
                    </div>

                    <div className={styles.timelineBox}>
                        <h2 className={styles.sectionTitle}>Acompanhamento do pedido</h2>

                        <div className={styles.timeline}>
                            {STATUS_STEPS.map((step, index) => {
                                const isDone = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div key={step.key} className={styles.timelineItem}>
                                        <div
                                            className={`${styles.timelineMarker} ${isDone ? styles.timelineMarkerDone : ""
                                                } ${isCurrent ? styles.timelineMarkerCurrent : ""}`}
                                        >
                                            {isDone ? "✓2" : ""}
                                        </div>

                                        <div className={styles.timelineContent}>
                                            <p
                                                className={`${styles.timelineLabel} ${isDone ? styles.timelineLabelDone : ""
                                                    }`}
                                            >
                                                {step.label}
                                            </p>

                                            {isCurrent ? (
                                                <p className={styles.timelineCurrentText}>
                                                    Etapa atual do seu pedido
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <h2 className={styles.sectionTitle}>Resumo</h2>

                        <p className={styles.infoText}>
                            O pagamento foi confirmado e seu pedido já está sendo preparado.
                            Em breve ele seguirá para entrega.
                        </p>

                        {sessionId ? (
                            <div className={styles.sessionBox}>
                                <span className={styles.sessionLabel}>
                                    Referência da sessão Stripe
                                </span>
                                <code className={styles.sessionValue}>{sessionId}</code>
                            </div>
                        ) : null}

                        <p className={styles.tip}>
                            No próximo passo, esta página poderá consultar o banco em tempo
                            real para exibir mudanças como <strong>Em preparo</strong>,
                            <strong> Saiu para entrega</strong> e <strong>Entregue</strong>.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Link to="/menu" className={styles.secondaryBtn}>
                            Voltar ao cardápio
                        </Link>

                        <Link to={`/order/${sessionId}`} className={styles.primaryBtn}>
                            Acompanhar pedido
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}