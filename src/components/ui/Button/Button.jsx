import styles from "./Button.module.css";

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const cls = [
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    className,
  ].filter(Boolean).join(" ");

  return <Comp className={cls} {...props} />;
}