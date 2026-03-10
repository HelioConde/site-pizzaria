import styles from "../Menu.module.css";

export default function CategoryFilters({
  categories,
  activeCategory,
  onChangeCategory,
}) {
  return (
    <div className={styles.filters}>
      <button
        type="button"
        className={`${styles.filterBtn} ${
          activeCategory === "all" ? styles.filterActive : ""
        }`}
        onClick={() => onChangeCategory("all")}
      >
        Todas
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`${styles.filterBtn} ${
            activeCategory === category.id ? styles.filterActive : ""
          }`}
          onClick={() => onChangeCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}