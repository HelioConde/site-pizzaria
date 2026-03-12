import styles from "../Admin.module.css";

export default function AdminSidebar({
  sections,
  activeSection,
  onChangeSection,
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <span className={styles.sidebarTitle}>Painel Admin</span>

        <nav className={styles.sidebarNav} aria-label="Navegação administrativa">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`${styles.sidebarButton} ${
                activeSection === section.key ? styles.sidebarButtonActive : ""
              }`}
              onClick={() => onChangeSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}