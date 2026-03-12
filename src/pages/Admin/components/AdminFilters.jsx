import styles from "../Admin.module.css";

export default function AdminFilters({
  filters,
  statusFilter,
  onChangeFilter,
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filterGroup}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`${styles.filterButton} ${
              statusFilter === filter.value ? styles.filterButtonActive : ""
            }`}
            onClick={() => onChangeFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}