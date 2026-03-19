import styles from "./Button.module.css";

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type,
  ...props
}) {
  const isNativeButton = Comp === "button";

  const cls = [
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Comp
      className={cls}
      disabled={isNativeButton ? disabled : undefined}
      aria-disabled={!isNativeButton && disabled ? "true" : undefined}
      type={isNativeButton ? type || "button" : undefined}
      {...props}
    />
  );
}