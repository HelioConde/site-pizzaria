import { useEffect, useState } from "react";
import styles from "../Admin.module.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  old_price: "",
  category_id: "",
  image_url: "",
  tag: "",
  rating: "",
  is_active: true,
  is_featured: false,
};

export default function ProductForm({
  categories,
  onSubmit,
  onCancel,
  initialData = null,
  submitLabel = "Criar produto",
  title = "Novo Produto",
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!initialData) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: initialData.name ?? "",
      description: initialData.description ?? "",
      price: initialData.price ?? "",
      old_price: initialData.old_price ?? "",
      category_id: initialData.category_id ?? "",
      image_url: initialData.image_url ?? "",
      tag: initialData.tag ?? "",
      rating: initialData.rating ?? "",
      is_active: !!initialData.is_active,
      is_featured: !!initialData.is_featured,
    });
  }, [initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form className={styles.productForm} onSubmit={handleSubmit}>
      <h3>{title}</h3>

      <div className={styles.formGrid}>
        <input
          name="name"
          placeholder="Nome do produto"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="price"
          placeholder="Preço"
          type="number"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          required
        />

        <input
          name="old_price"
          placeholder="Preço antigo"
          type="number"
          step="0.01"
          value={form.old_price}
          onChange={handleChange}
        />

        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          required
        >
          <option value="">Selecione categoria</option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          name="tag"
          placeholder="Tag (Promo, Top, etc)"
          value={form.tag}
          onChange={handleChange}
        />

        <input
          name="rating"
          placeholder="Rating"
          type="number"
          step="0.1"
          value={form.rating}
          onChange={handleChange}
        />

        <input
          name="image_url"
          placeholder="URL da imagem"
          value={form.image_url}
          onChange={handleChange}
        />
      </div>

      <textarea
        name="description"
        placeholder="Descrição"
        value={form.description}
        onChange={handleChange}
      />

      <div className={styles.formChecks}>
        <label>
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Produto ativo
        </label>

        <label>
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured}
            onChange={handleChange}
          />
          Destaque
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryActionButton}>
          {submitLabel}
        </button>

        <button
          type="button"
          className={styles.secondaryActionButton}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}