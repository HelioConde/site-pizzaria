import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import ProductForm from "../components/ProductForm";
import ConfirmDialog from "../../../components/ui/ConfirmDialog/ConfirmDialog";
import styles from "../Admin.module.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function generateSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  return normalized.replace(/^\/+/, "");
}

function resolveImageUrl(path) {
  const normalized = normalizeImageUrl(path);

  if (!normalized) return "";

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${import.meta.env.BASE_URL}${normalized}`;
}

export default function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, slug, name, sort_order")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          slug,
          name,
          description,
          price,
          old_price,
          rating,
          tag,
          image_url,
          is_active,
          is_featured,
          sort_order,
          category_id,
          created_at,
          updated_at
        `)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setProducts(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProducts([]);
      setMessage("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadCategories(), loadProducts()]);
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel("admin-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, loadProducts]);

  function resetFormState() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleCreateProduct(data) {
    try {
      const name = String(data.name || "").trim();
      const slug = generateSlug(name);

      const { error } = await supabase.from("products").insert({
        name,
        description: String(data.description || "").trim() || null,
        price: Number(data.price || 0),
        old_price:
          data.old_price !== "" && data.old_price != null
            ? Number(data.old_price)
            : null,
        category_id: data.category_id || null,
        image_url: normalizeImageUrl(data.image_url) || null,
        tag: String(data.tag || "").trim() || null,
        rating:
          data.rating !== "" && data.rating != null
            ? Number(data.rating)
            : null,
        is_active: !!data.is_active,
        is_featured: !!data.is_featured,
        slug,
      });

      if (error) throw error;

      resetFormState();
      await loadProducts();
      setMessage("Produto criado com sucesso.");
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      setMessage(error.message || "Erro ao criar produto.");
    }
  }

  async function handleEditProduct(data) {
    if (!editingProduct) return;

    try {
      const name = String(data.name || "").trim();
      const slug = generateSlug(name);

      const { error } = await supabase
        .from("products")
        .update({
          name,
          description: String(data.description || "").trim() || null,
          price: Number(data.price || 0),
          old_price:
            data.old_price !== "" && data.old_price != null
              ? Number(data.old_price)
              : null,
          category_id: data.category_id || null,
          image_url: normalizeImageUrl(data.image_url) || null,
          tag: String(data.tag || "").trim() || null,
          rating:
            data.rating !== "" && data.rating != null
              ? Number(data.rating)
              : null,
          is_active: !!data.is_active,
          is_featured: !!data.is_featured,
          slug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      resetFormState();
      await loadProducts();
      setMessage("Produto atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      setMessage(error.message || "Erro ao editar produto.");
    }
  }

  async function handleToggleActive(product) {
    setUpdatingId(product.id);
    setMessage("");

    try {
      const nextIsActive = !product.is_active;

      const { error } = await supabase
        .from("products")
        .update({
          is_active: nextIsActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, is_active: nextIsActive }
            : item
        )
      );

      setMessage(
        nextIsActive
          ? "Produto ativado com sucesso."
          : "Produto desativado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      setMessage("Não foi possível atualizar o produto.");
    } finally {
      setUpdatingId(null);
    }
  }

  function requestDeleteProduct(product) {
    if (!product?.id) return;

    setProductToDelete(product);
    setConfirmOpen(true);
    setMessage("");
  }

  function closeDeleteDialog() {
    if (deletingId) return;

    setConfirmOpen(false);
    setProductToDelete(null);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete?.id) return;

    setDeletingId(productToDelete.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.filter((item) => item.id !== productToDelete.id)
      );

      if (editingProduct?.id === productToDelete.id) {
        resetFormState();
      }

      setMessage("Produto excluído com sucesso.");
      setConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      setMessage(error.message || "Não foi possível excluir o produto.");
    } finally {
      setDeletingId(null);
    }
  }

  const categoriesById = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {});
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (filter === "active") {
      return products.filter((product) => product.is_active);
    }

    if (filter === "inactive") {
      return products.filter((product) => !product.is_active);
    }

    return products;
  }, [products, filter]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.is_active).length,
      inactive: products.filter((product) => !product.is_active).length,
      featured: products.filter((product) => product.is_featured).length,
    };
  }, [products]);

  return (
    <>
      <AdminContentHeader
        kicker="Catálogo"
        title="Produtos"
        subtitle="Gerencie os produtos exibidos no cardápio, controle disponibilidade e prepare a base para edição completa."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
                setMessage("");
              }}
            >
              + Novo Produto
            </button>
          </div>

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Total</span>
              <strong>{stats.total}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Ativos</span>
              <strong>{stats.active}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Inativos</span>
              <strong>{stats.inactive}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Destaques</span>
              <strong>{stats.featured}</strong>
            </article>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterButton} ${
                  filter === "all" ? styles.filterButtonActive : ""
                }`}
                onClick={() => setFilter("all")}
              >
                Todos
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${
                  filter === "active" ? styles.filterButtonActive : ""
                }`}
                onClick={() => setFilter("active")}
              >
                Ativos
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${
                  filter === "inactive" ? styles.filterButtonActive : ""
                }`}
                onClick={() => setFilter("inactive")}
              >
                Inativos
              </button>
            </div>
          </div>

          {showForm ? (
            <ProductForm
              categories={categories}
              initialData={editingProduct}
              title={editingProduct ? "Editar Produto" : "Novo Produto"}
              submitLabel={editingProduct ? "Salvar alterações" : "Criar produto"}
              onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}
              onCancel={resetFormState}
            />
          ) : null}

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando produtos...</p>
            </div>
          ) : !filteredProducts.length ? (
            <div className={styles.emptyState}>
              <p>Nenhum produto encontrado para este filtro.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => {
                const category = categoriesById[product.category_id];
                const resolvedImageUrl = resolveImageUrl(product.image_url);
                const isBusy =
                  updatingId === product.id || deletingId === product.id;

                return (
                  <article key={product.id} className={styles.productCard}>
                    <div className={styles.productImageWrap}>
                      {resolvedImageUrl ? (
                        <img
                          src={resolvedImageUrl}
                          alt={product.name}
                          className={styles.productImage}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.productImagePlaceholder}>🍕</div>
                      )}
                    </div>

                    <div className={styles.productBody}>
                      <div className={styles.productTop}>
                        <div>
                          <h3 className={styles.productTitle}>{product.name}</h3>
                          <p className={styles.productCategory}>
                            {category?.name || "Sem categoria"}
                          </p>
                        </div>

                        <span
                          className={`${styles.productStatus} ${
                            product.is_active
                              ? styles.productStatusActive
                              : styles.productStatusInactive
                          }`}
                        >
                          {product.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p className={styles.productDescription}>
                        {product.description || "Sem descrição cadastrada."}
                      </p>

                      <div className={styles.productMeta}>
                        <strong className={styles.productPrice}>
                          {formatPrice(product.price)}
                        </strong>

                        {product.old_price ? (
                          <span className={styles.productOldPrice}>
                            {formatPrice(product.old_price)}
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.productTags}>
                        {product.tag ? (
                          <span className={styles.productTag}>{product.tag}</span>
                        ) : null}

                        {product.is_featured ? (
                          <span className={styles.productTag}>Destaque</span>
                        ) : null}

                        {product.rating ? (
                          <span className={styles.productTag}>
                            ⭐ {Number(product.rating).toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.productActions}>
                        <button
                          type="button"
                          className={styles.secondaryActionButton}
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                            setMessage("");
                          }}
                          disabled={isBusy}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={styles.secondaryActionButton}
                          onClick={() => handleToggleActive(product)}
                          disabled={isBusy}
                        >
                          {updatingId === product.id
                            ? "Atualizando..."
                            : product.is_active
                              ? "Desativar"
                              : "Ativar"}
                        </button>

                        <button
                          type="button"
                          className={styles.secondaryActionButton}
                          onClick={() => requestDeleteProduct(product)}
                          disabled={isBusy}
                        >
                          {deletingId === product.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${
          productToDelete?.name || "este produto"
        }"? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProduct}
        onCancel={closeDeleteDialog}
        loading={deletingId != null}
      />
    </>
  );
}