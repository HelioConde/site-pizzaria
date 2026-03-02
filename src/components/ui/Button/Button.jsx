import styles from "./Button.module.css";

export default function Button({
  as = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const Comp = as;

  return (
    <Comp className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`} {...props}>
      {children}
    </Comp>
  );
}