import { useEffect, useMemo, useState } from "react";
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

function normalizeImageUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) return "";

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  let normalized = rawValue
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .replace(/^\.?\//, "")
    .replace(/^admin\/+/i, "")
    .replace(/^site-pizzaria\/+/i, "")
    .replace(/\\/g, "/");

  if (!normalized) return "";

  const duplicatedImagesPathPattern = /^(images\/pizzas\/)+(.*)$/i;
  const duplicatedMatch = normalized.match(duplicatedImagesPathPattern);

  if (duplicatedMatch) {
    const finalSegment = duplicatedMatch[2] || "";
    normalized = `images/pizzas/${finalSegment}`.replace(/\/+/g, "/");
  }

  normalized = normalized.replace(/^\/+/, "");

  return normalized;
}

function resolvePreviewImage(value) {
  const normalizedValue = normalizeImageUrl(value);

  if (!normalizedValue) return "";

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return `${import.meta.env.BASE_URL}${normalizedValue}`;
}

export default function ProductForm({
  categories,
  onSubmit,
  onCancel,
  initialData = null,
  submitLabel = "Criar produto",
  title = "Novo Produto",
}) {
  const [form, setForm] = useState(initialForm);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setForm(initialForm);
      setImagePreviewError(false);
      return;
    }

    setForm({
      name: initialData.name ?? "",
      description: initialData.description ?? "",
      price:
        initialData.price !== null && initialData.price !== undefined
          ? String(initialData.price)
          : "",
      old_price:
        initialData.old_price !== null && initialData.old_price !== undefined
          ? String(initialData.old_price)
          : "",
      category_id: initialData.category_id ?? "",
      image_url: normalizeImageUrl(initialData.image_url ?? ""),
      tag: initialData.tag ?? "",
      rating:
        initialData.rating !== null && initialData.rating !== undefined
          ? String(initialData.rating)
          : "",
      is_active: !!initialData.is_active,
      is_featured: !!initialData.is_featured,
    });

    setImagePreviewError(false);
  }, [initialData]);

  const previewImageSrc = useMemo(
    () => resolvePreviewImage(form.image_url),
    [form.image_url]
  );

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "image_url"
            ? normalizeImageUrl(value)
            : value,
    }));

    if (name === "image_url") {
      setImagePreviewError(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      name: String(form.name || "").trim(),
      description: String(form.description || "").trim(),
      tag: String(form.tag || "").trim(),
      image_url: normalizeImageUrl(form.image_url),
    };

    onSubmit(payload);
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
          min="0"
          value={form.price}
          onChange={handleChange}
          required
        />

        <input
          name="old_price"
          placeholder="Preço antigo"
          type="number"
          step="0.01"
          min="0"
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
          min="0"
          max="5"
          value={form.rating}
          onChange={handleChange}
        />

        <input
          name="image_url"
          placeholder="URL da imagem ou images/pizzas/arquivo.png"
          value={form.image_url}
          onChange={handleChange}
        />
      </div>

      {form.image_url ? (
        <div className={styles.imagePreviewBox}>
          <span className={styles.previewLabel}>Prévia da imagem</span>

          {!imagePreviewError && previewImageSrc ? (
            <img
              src={previewImageSrc}
              alt={form.name || "Prévia do produto"}
              className={styles.imagePreview}
              onError={() => setImagePreviewError(true)}
            />
          ) : (
            <p className={styles.previewError}>
              Não foi possível carregar a imagem. Verifique o caminho informado.
            </p>
          )}

          <p className={styles.previewHint}>
            Caminho salvo: <strong>{normalizeImageUrl(form.image_url)}</strong>
          </p>
        </div>
      ) : null}

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