import styles from "../Admin.module.css";

export default function AdminContentHeader({ kicker, title, subtitle }) {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </section>
  );
}