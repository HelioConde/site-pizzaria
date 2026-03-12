import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

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

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setCategories(data || []);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategories([]);
      setMessage("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();

    const channel = supabase
      .channel("admin-categories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_categories",
        },
        loadCategories
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleCreateCategory() {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setMessage("Digite um nome para a categoria.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nextSortOrder =
        categories.length > 0
          ? Math.max(...categories.map((item) => Number(item.sort_order || 0))) + 1
          : 1;

      const { error } = await supabase.from("product_categories").insert({
        name: trimmedName,
        slug: generateSlug(trimmedName),
        is_active: true,
        sort_order: nextSortOrder,
      });

      if (error) throw error;

      setNewCategoryName("");
      setMessage("Categoria criada com sucesso.");
      await loadCategories();
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      setMessage(error.message || "Não foi possível criar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(category) {
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("product_categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (error) throw error;

      setMessage(
        category.is_active
          ? "Categoria desativada com sucesso."
          : "Categoria ativada com sucesso."
      );

      await loadCategories();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      setMessage("Não foi possível atualizar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(category) {
    const trimmedName = String(category.name || "").trim();

    if (!trimmedName) {
      setMessage("O nome da categoria não pode ficar vazio.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("product_categories")
        .update({
          name: trimmedName,
          slug: generateSlug(trimmedName),
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (error) throw error;

      setEditingId(null);
      setMessage("Categoria atualizada com sucesso.");
      await loadCategories();
    } catch (error) {
      console.error("Erro ao editar categoria:", error);
      setMessage("Não foi possível editar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  function handleCategoryNameChange(categoryId, value) {
    setCategories((prev) =>
      prev.map((item) =>
        item.id === categoryId ? { ...item, name: value } : item
      )
    );
  }

  return (
    <>
      <AdminContentHeader
        kicker="Catálogo"
        title="Categorias"
        subtitle="Organize o cardápio por grupos e melhore a navegação do cliente."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.categoryCreateBar}>
            <input
              type="text"
              className={styles.categoryCreateInput}
              placeholder="Nova categoria (ex: Pizzas especiais)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />

            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={handleCreateCategory}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Criar"}
            </button>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando categorias...</p>
            </div>
          ) : !categories.length ? (
            <div className={styles.emptyState}>
              <p>Nenhuma categoria cadastrada.</p>
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {categories.map((category) => {
                const isEditing = editingId === category.id;

                return (
                  <article key={category.id} className={styles.categoryCard}>
                    <div className={styles.categoryCardHeader}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.categoryEditInput}
                          value={category.name}
                          onChange={(e) =>
                            handleCategoryNameChange(category.id, e.target.value)
                          }
                        />
                      ) : (
                        <h3 className={styles.categoryTitle}>{category.name}</h3>
                      )}

                      <span
                        className={`${styles.categoryStatus} ${
                          category.is_active
                            ? styles.categoryStatusActive
                            : styles.categoryStatusInactive
                        }`}
                      >
                        {category.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <div className={styles.categoryMeta}>
                      <span>Slug: {category.slug}</span>
                      <span>Ordem: {category.sort_order ?? 0}</span>
                    </div>

                    <div className={styles.categoryActions}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className={styles.primaryActionButton}
                            onClick={() => handleSaveEdit(category)}
                            disabled={saving}
                          >
                            Salvar
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryActionButton}
                            onClick={() => {
                              setEditingId(null);
                              loadCategories();
                            }}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.secondaryActionButton}
                            onClick={() => {
                              setEditingId(category.id);
                              setMessage("");
                            }}
                            disabled={saving}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryActionButton}
                            onClick={() => handleToggleActive(category)}
                            disabled={saving}
                          >
                            {category.is_active ? "Desativar" : "Ativar"}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}