import styles from "../Menu.module.css";

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className={styles.searchWrap}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Buscar pizza ou ingrediente..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="search"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        aria-label="Buscar produtos do cardápio"
      />

      {value ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={onClear}
          aria-label="Limpar busca"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}