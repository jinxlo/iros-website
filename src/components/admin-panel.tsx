"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AdminContentEditor } from "@/components/admin-content-editor";
import { localizedPath, type Locale } from "@/lib/content";

type AdminPanelProps = {
  locale: Locale;
};

type ModuleId =
  | "overview"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "sales"
  | "inventory"
  | "cms"
  | "odoo"
  | "settings";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  odoo_id?: string | null;
  is_active?: boolean;
};

type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
};

type ApiMessage = {
  tone: "idle" | "success" | "error" | "info";
  text: string;
};

type OdooCounts = {
  products?: number;
  brands?: number;
  categories?: number;
};

type AnalyzedOdooProduct = {
  index: number;
  odoo_id: number;
  sku: string;
  name: string;
  brand: string;
  odoo_category: string;
  category: string;
  subcategory: string;
  has_image: boolean;
  confidence: "high" | "manual-review";
};

type OdooAnalysis = {
  total: number;
  brands: Array<{ brand: string; count: number }>;
  placements: Array<{ placement: string; count: number }>;
  manualReview: AnalyzedOdooProduct[];
  products: AnalyzedOdooProduct[];
};

type AdminProduct = {
  id: string;
  odoo_id: string | null;
  sku: string;
  name: string;
  slug: string;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  brand: string;
  category: string;
  image_count: number;
  image_url: string | null;
  sync_status: string;
};

function messageClass(tone: ApiMessage["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-blue-200 bg-blue-50 text-[var(--brand-blue)]";
}

function formatCounts(counts?: OdooCounts) {
  if (!counts) {
    return "Sin resultados todavía";
  }

  return `Productos: ${counts.products ?? 0} · Marcas: ${counts.brands ?? 0} · Categorías: ${counts.categories ?? 0}`;
}

function moduleIcon(id: ModuleId) {
  const icons: Record<ModuleId, string> = {
    overview: "01",
    products: "02",
    categories: "03",
    orders: "04",
    customers: "05",
    sales: "06",
    inventory: "07",
    cms: "08",
    odoo: "09",
    settings: "10",
  };

  return icons[id];
}

function ModuleShell({ kicker, title, body, children }: { kicker: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">{kicker}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--brand-blue)]">{detail}</p>
    </article>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-[var(--brand-blue)] shadow-sm">I</div>
      <h3 className="mt-4 text-2xl font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[var(--brand-cyan)] focus:ring-4 focus:ring-[rgba(10,154,211,0.12)] ${props.className || ""}`}
    />
  );
}

export function AdminPanel({ locale }: AdminPanelProps) {
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [adminApiKey, setAdminApiKey] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem("iros-admin-api-key") || "",
  );
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryParentSlug, setCategoryParentSlug] = useState("");
  const [remoteCategories, setRemoteCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [syncLimit, setSyncLimit] = useState(50);
  const [analyzeAll, setAnalyzeAll] = useState(false);
  const [analysis, setAnalysis] = useState<OdooAnalysis>();
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [productStatus, setProductStatus] = useState<"all" | "published" | "draft">("all");
  const [productMessage, setProductMessage] = useState<ApiMessage>({
    tone: "info",
    text: locale === "es" ? "Carga productos reales desde Supabase." : "Load real products from Supabase.",
  });
  const [categoryMessage, setCategoryMessage] = useState<ApiMessage>({
    tone: "info",
    text: locale === "es" ? "Carga o crea categorías conectadas a Supabase." : "Load or create categories connected to Supabase.",
  });
  const [brandMessage, setBrandMessage] = useState<ApiMessage>({
    tone: "info",
    text: locale === "es" ? "Extrae marcas reales desde Odoo." : "Pull real brands from Odoo.",
  });
  const [odooMessage, setOdooMessage] = useState<ApiMessage>({
    tone: "info",
    text: locale === "es" ? "Ejecuta preview antes de sincronizar." : "Run preview before syncing.",
  });
  const [odooCounts, setOdooCounts] = useState<OdooCounts>();
  const imageReadyCount = analysis?.products.filter((product) => product.has_image).length || 0;
  const draftMissingImageCount = analysis ? analysis.total - imageReadyCount : 0;

  const labels =
    locale === "es"
      ? {
          title: "Administración iroselectronics",
          subtitle: "Operación central para catálogo, ventas, clientes, contenido, inventario e integraciones.",
          store: "Tienda",
          modules: {
            overview: "Resumen",
            products: "Productos",
            categories: "Categorías",
            orders: "Órdenes",
            customers: "Clientes",
            sales: "Ventas",
            inventory: "Inventario",
            cms: "CMS",
            odoo: "Odoo Sync",
            settings: "Ajustes",
          },
        }
      : {
          title: "iroselectronics administration",
          subtitle: "Central operations for catalog, sales, customers, content, inventory, and integrations.",
          store: "Store",
          modules: {
            overview: "Overview",
            products: "Products",
            categories: "Categories",
            orders: "Orders",
            customers: "Customers",
            sales: "Sales",
            inventory: "Inventory",
            cms: "CMS",
            odoo: "Odoo Sync",
            settings: "Settings",
          },
        };
  const nav = (Object.keys(labels.modules) as ModuleId[]).map((id) => ({ id, label: labels.modules[id] }));

  function updateAdminApiKey(value: string) {
    setAdminApiKey(value);
    window.localStorage.setItem("iros-admin-api-key", value);
  }

  async function adminRequest<T>(url: string, init: RequestInit = {}) {
    const token = await getSessionToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": adminApiKey.trim(),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    return payload;
  }

  async function getSessionToken() {
    const rawSession = window.localStorage.getItem("sb-gkwbbznwfztcujzdjggh-auth-token");

    if (!rawSession) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawSession) as { access_token?: string };
      return parsed.access_token;
    } catch {
      return undefined;
    }
  }

  async function loadProducts(status = productStatus) {
    try {
      setProductMessage({ tone: "info", text: locale === "es" ? "Cargando productos reales..." : "Loading real products..." });
      const payload = await adminRequest<{ products?: AdminProduct[] }>(`/api/admin/products?status=${status}&limit=200`);
      setAdminProducts(payload.products || []);
      setProductMessage({
        tone: "success",
        text: locale === "es"
          ? `${payload.products?.length || 0} productos cargados desde Supabase.`
          : `${payload.products?.length || 0} products loaded from Supabase.`,
      });
    } catch (error) {
      setProductMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudieron cargar productos." : "Could not load products.",
      });
    }
  }

  async function loadCategories() {
    try {
      setCategoryMessage({ tone: "info", text: locale === "es" ? "Cargando categorías..." : "Loading categories..." });
      const payload = await adminRequest<{ categories?: AdminCategory[] }>("/api/admin/categories");
      setRemoteCategories(payload.categories || []);
      setCategoryMessage({
        tone: "success",
        text: locale === "es"
          ? `${payload.categories?.length || 0} categorías cargadas.`
          : `${payload.categories?.length || 0} categories loaded.`,
      });
    } catch (error) {
      setCategoryMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudieron cargar las categorías." : "Could not load categories.",
      });
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryName.trim()) {
      setCategoryMessage({ tone: "error", text: locale === "es" ? "El nombre es requerido." : "Name is required." });
      return;
    }

    try {
      setCategoryMessage({ tone: "info", text: locale === "es" ? "Guardando categoría..." : "Saving category..." });
      const payload = await adminRequest<{ category: AdminCategory }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
          slug: categorySlug || undefined,
          parent_slug: categoryParentSlug || undefined,
        }),
      });

      setRemoteCategories((current) => {
        const filtered = current.filter((category) => category.id !== payload.category.id);
        return [...filtered, payload.category].sort((a, b) => a.name.localeCompare(b.name));
      });
      setCategoryName("");
      setCategorySlug("");
      setCategoryParentSlug("");
      setCategoryMessage({ tone: "success", text: `${payload.category.name} guardada.` });
    } catch (error) {
      setCategoryMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudo guardar la categoría." : "Could not save category.",
      });
    }
  }

  async function pullBrands() {
    try {
      setBrandMessage({ tone: "info", text: locale === "es" ? "Leyendo marcas desde Odoo..." : "Reading brands from Odoo..." });
      const payload = await adminRequest<{ brands?: AdminBrand[]; count?: number }>("/api/admin/brands", {
        method: "POST",
        body: JSON.stringify({ limit: syncLimit }),
      });

      setBrands(payload.brands || []);
      setBrandMessage({ tone: "success", text: locale === "es" ? `${payload.count || 0} marcas sincronizadas.` : `${payload.count || 0} brands synced.` });
    } catch (error) {
      setBrandMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudieron sincronizar marcas." : "Could not sync brands.",
      });
    }
  }

  async function previewOdoo() {
    try {
      setOdooMessage({ tone: "info", text: locale === "es" ? "Consultando preview de Odoo..." : "Requesting Odoo preview..." });
      const limit = analyzeAll ? "all" : String(syncLimit);
      const payload = await adminRequest<{ counts?: OdooCounts }>(`/api/odoo/preview?limit=${limit}`);
      setOdooCounts(payload.counts);
      setOdooMessage({ tone: "success", text: `${locale === "es" ? "Preview listo." : "Preview ready."} ${formatCounts(payload.counts)}` });
    } catch (error) {
      setOdooMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudo consultar Odoo." : "Could not query Odoo.",
      });
    }
  }

  async function syncOdoo() {
    try {
      setOdooMessage({ tone: "info", text: locale === "es" ? "Sincronizando catálogo..." : "Syncing catalog..." });
      const payload = await adminRequest<{ counts?: OdooCounts }>("/api/odoo/sync", {
        method: "POST",
        body: JSON.stringify({ limit: analyzeAll ? "all" : syncLimit }),
      });
      setOdooCounts(payload.counts);
      setOdooMessage({ tone: "success", text: `${locale === "es" ? "Sync completo." : "Sync complete."} ${formatCounts(payload.counts)}` });
    } catch (error) {
      setOdooMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudo sincronizar Odoo." : "Could not sync Odoo.",
      });
    }
  }

  async function analyzeOdoo() {
    try {
      const limit = analyzeAll ? "all" : String(syncLimit);
      setOdooMessage({ tone: "info", text: locale === "es" ? "Analizando productos, marcas, categorías e imágenes..." : "Analyzing products, brands, categories, and images..." });
      const payload = await adminRequest<OdooAnalysis>(`/api/odoo/analyze?limit=${limit}`);
      setAnalysis(payload);
      setOdooMessage({
        tone: "success",
        text: locale === "es"
          ? `${payload.total} productos analizados. ${payload.products.filter((product) => !product.has_image).length} quedarán como draft por falta de imagen.`
          : `${payload.total} products analyzed. ${payload.products.filter((product) => !product.has_image).length} will stay draft because they are missing images.`,
      });
    } catch (error) {
      setOdooMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudo analizar Odoo." : "Could not analyze Odoo.",
      });
    }
  }

  function renderModule() {
    if (activeModule === "overview") {
      return (
        <ModuleShell kicker="Control" title={labels.title} body={labels.subtitle}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard title={labels.modules.products} value="Pendiente" detail={locale === "es" ? "Ejecuta Odoo Sync" : "Run Odoo Sync"} />
            <StatusCard title={labels.modules.orders} value="Sin datos" detail={locale === "es" ? "Checkout aún no registra órdenes" : "Checkout has no orders yet"} />
            <StatusCard title={labels.modules.customers} value="Supabase Auth" detail={locale === "es" ? "Usuarios reales vía Auth" : "Real users via Auth"} />
            <StatusCard title={labels.modules.cms} value="Activo" detail={locale === "es" ? "Borradores locales" : "Local drafts"} />
          </div>
          <div className="mt-6 rounded-[1.75rem] bg-[var(--brand-blue)] p-6 text-white">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">Status</p>
            <h3 className="mt-3 text-2xl font-black">{locale === "es" ? "Panel limpio, sin información demo" : "Clean panel, no demo data"}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50/80">
              {locale === "es"
                ? "Las tarjetas muestran estados reales o pendientes. Cuando Supabase y Odoo devuelvan datos, estos módulos se alimentarán desde APIs reales."
                : "Cards show real or pending states. When Supabase and Odoo return data, these modules will be powered by real APIs."}
            </p>
          </div>
        </ModuleShell>
      );
    }

    if (activeModule === "products") {
      const publishedCount = adminProducts.filter((product) => product.is_active).length;
      const draftCount = adminProducts.length - publishedCount;

      return (
        <ModuleShell kicker="Catalog" title={labels.modules.products} body={locale === "es" ? "Catálogo conectado a Odoo y Supabase. No se muestran productos demo." : "Catalog connected to Odoo and Supabase. No demo products are shown."}>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusCard title={locale === "es" ? "Cargados" : "Loaded"} value={String(adminProducts.length)} detail={locale === "es" ? "Vista actual" : "Current view"} />
            <StatusCard title={locale === "es" ? "Publicados" : "Published"} value={String(publishedCount)} detail={locale === "es" ? "Visibles en web" : "Visible online"} />
            <StatusCard title="Draft" value={String(draftCount)} detail={locale === "es" ? "Ocultos" : "Hidden"} />
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "published", "draft"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setProductStatus(status);
                    void loadProducts(status);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${productStatus === status ? "bg-[var(--brand-blue)] text-white" : "bg-white text-slate-700 hover:text-[var(--brand-blue)]"}`}
                >
                  {status === "all" ? (locale === "es" ? "Todos" : "All") : status === "published" ? (locale === "es" ? "Publicados" : "Published") : "Draft"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => loadProducts(productStatus)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              {locale === "es" ? "Recargar productos" : "Reload products"}
            </button>
          </div>
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(productMessage.tone)}`}>{productMessage.text}</p>
          {adminProducts.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="grid min-w-[980px] grid-cols-[84px_88px_1.3fr_0.75fr_0.8fr_110px_96px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <span>{locale === "es" ? "Imagen" : "Image"}</span>
                <span>SKU</span>
                <span>{locale === "es" ? "Producto" : "Product"}</span>
                <span>{locale === "es" ? "Marca" : "Brand"}</span>
                <span>{locale === "es" ? "Categoría" : "Category"}</span>
                <span>Stock</span>
                <span>Status</span>
              </div>
              <div className="max-h-[620px] overflow-auto">
                {adminProducts.map((product) => (
                  <div key={product.id} className="grid min-w-[980px] grid-cols-[84px_88px_1.3fr_0.75fr_0.8fr_110px_96px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                      {product.image_url ? (
                        <div role="img" aria-label={product.name} style={{ backgroundImage: `url(${product.image_url})` }} className="h-full w-full bg-contain bg-center bg-no-repeat" />
                      ) : null}
                    </div>
                    <span className="font-bold text-slate-700">{product.sku}</span>
                    <div>
                      <p className="font-black text-slate-950">{product.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Odoo {product.odoo_id || "-"} · {product.image_count} img</p>
                    </div>
                    <span>{product.brand}</span>
                    <span className="font-semibold text-[var(--brand-blue)]">{product.category}</span>
                    <span>{product.stock_quantity}</span>
                    <span className={`h-fit rounded-full px-3 py-1 text-xs font-black ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{product.is_active ? "Live" : "Draft"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title={locale === "es" ? "No hay productos cargados" : "No products loaded"}
              body={locale === "es" ? "Presiona recargar productos para leer el catálogo real desde Supabase." : "Press reload products to read the real catalog from Supabase."}
              action={<button type="button" onClick={() => loadProducts(productStatus)} className="rounded-full bg-[var(--brand-blue)] px-5 py-3 font-black text-white">{locale === "es" ? "Cargar productos" : "Load products"}</button>}
            />
          )}
        </ModuleShell>
      );
    }

    if (activeModule === "categories") {
      return (
        <ModuleShell kicker="Taxonomy" title={labels.modules.categories} body={locale === "es" ? "Crea categorías reales y carga las existentes desde Supabase." : "Create real categories and load existing ones from Supabase."}>
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <form onSubmit={createCategory} className="rounded-[1.5rem] bg-slate-50 p-5">
              <h3 className="text-xl font-black text-slate-950">{locale === "es" ? "Crear categoría" : "Create category"}</h3>
              <div className="mt-4 grid gap-4">
                <Field label={locale === "es" ? "Nombre" : "Name"}>
                  <TextInput value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
                </Field>
                <Field label="Slug">
                  <TextInput value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} placeholder={locale === "es" ? "Opcional" : "Optional"} />
                </Field>
                <Field label={locale === "es" ? "Slug padre" : "Parent slug"}>
                  <TextInput value={categoryParentSlug} onChange={(event) => setCategoryParentSlug(event.target.value)} placeholder={locale === "es" ? "Opcional" : "Optional"} />
                </Field>
              </div>
              <button type="submit" className="mt-4 w-full rounded-full bg-[var(--brand-blue)] px-5 py-3 font-black text-white transition hover:bg-blue-950">{locale === "es" ? "Guardar categoría" : "Save category"}</button>
              <button type="button" onClick={loadCategories} className="mt-3 w-full rounded-full border border-slate-200 bg-white px-5 py-3 font-black text-slate-800 transition hover:border-[var(--brand-cyan)]">{locale === "es" ? "Cargar desde Supabase" : "Load from Supabase"}</button>
              <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(categoryMessage.tone)}`}>{categoryMessage.text}</p>
            </form>

            {remoteCategories.length > 0 ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                {remoteCategories.map((category) => (
                  <div key={category.id} className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-black text-slate-950">{category.name}</p>
                      <p className="text-sm font-semibold text-slate-500">/{category.slug}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{category.parent_id ? "Subcategoría" : "Principal"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={locale === "es" ? "Sin categorías cargadas" : "No categories loaded"} body={locale === "es" ? "Presiona cargar para leer categorías reales desde Supabase." : "Press load to read real categories from Supabase."} />
            )}
          </div>
        </ModuleShell>
      );
    }

    if (activeModule === "orders" || activeModule === "customers" || activeModule === "sales" || activeModule === "inventory") {
      const text = {
        orders: locale === "es" ? "Las órdenes aparecerán cuando checkout guarde ventas reales en Supabase." : "Orders will appear when checkout saves real sales in Supabase.",
        customers: locale === "es" ? "Los clientes se leerán desde Supabase Auth y profiles cuando la tabla esté activa." : "Customers will be read from Supabase Auth and profiles once the table is active.",
        sales: locale === "es" ? "Analítica lista para conectarse a órdenes y pagos reales." : "Analytics ready to connect to real orders and payments.",
        inventory: locale === "es" ? "Inventario listo para datos reales sincronizados desde Odoo." : "Inventory ready for real data synced from Odoo.",
      } satisfies Record<"orders" | "customers" | "sales" | "inventory", string>;

      return (
        <ModuleShell kicker="Operations" title={labels.modules[activeModule]} body={text[activeModule]}>
          <EmptyState title={locale === "es" ? "Sin datos reales todavía" : "No real data yet"} body={text[activeModule]} />
        </ModuleShell>
      );
    }

    if (activeModule === "cms") {
      return <AdminContentEditor locale={locale} />;
    }

    if (activeModule === "odoo") {
      return (
        <ModuleShell kicker="Integration" title={labels.modules.odoo} body={locale === "es" ? "Sincroniza productos, marcas, categorías e inventario desde Odoo." : "Sync products, brands, categories, and inventory from Odoo."}>
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <h3 className="text-xl font-black text-slate-950">{locale === "es" ? "Acciones" : "Actions"}</h3>
              <Field label="Limit">
                <TextInput value={syncLimit} min={1} max={1000} onChange={(event) => setSyncLimit(Number(event.target.value) || 1)} type="number" />
              </Field>
              <label className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-black text-slate-700">
                <input checked={analyzeAll} onChange={(event) => setAnalyzeAll(event.target.checked)} type="checkbox" className="h-4 w-4 accent-[var(--brand-blue)]" />
                {locale === "es" ? "Analizar/sincronizar todo el catálogo" : "Analyze/sync full catalog"}
              </label>
              <div className="mt-4 grid gap-3">
                <button type="button" onClick={analyzeOdoo} className="rounded-full bg-cyan-600 px-5 py-3 font-black text-white transition hover:bg-cyan-700">{locale === "es" ? "Analizar catálogo" : "Analyze catalog"}</button>
                <button type="button" onClick={previewOdoo} className="rounded-full bg-[var(--brand-blue)] px-5 py-3 font-black text-white transition hover:bg-blue-950">Preview</button>
                <button type="button" onClick={syncOdoo} className="rounded-full bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-slate-800">Sync</button>
                <button type="button" onClick={pullBrands} className="rounded-full border border-slate-200 bg-white px-5 py-3 font-black text-slate-800 transition hover:border-[var(--brand-cyan)]">{locale === "es" ? "Extraer marcas" : "Pull brands"}</button>
              </div>
            </div>
            <div className="grid gap-4">
              <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(odooMessage.tone)}`}>{odooMessage.text}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <StatusCard title="Resultado" value={formatCounts(odooCounts)} detail="Odoo JSON-RPC" />
                <StatusCard title={locale === "es" ? "Con imagen" : "With image"} value={String(imageReadyCount)} detail={locale === "es" ? "Se publican" : "Published"} />
                <StatusCard title="Draft" value={String(draftMissingImageCount)} detail={locale === "es" ? "Sin imagen, ocultos" : "Missing image, hidden"} />
              </div>
              {analysis ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  <div className="grid grid-cols-[92px_1.1fr_0.8fr_0.9fr_0.75fr] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <span>SKU</span>
                    <span>{locale === "es" ? "Producto" : "Product"}</span>
                    <span>{locale === "es" ? "Marca" : "Brand"}</span>
                    <span>{locale === "es" ? "Ubicación" : "Placement"}</span>
                    <span>{locale === "es" ? "Imagen" : "Image"}</span>
                  </div>
                  <div className="max-h-[520px] overflow-auto">
                    {analysis.products.slice(0, 150).map((product) => (
                      <div key={product.odoo_id} className="grid grid-cols-[92px_1.1fr_0.8fr_0.9fr_0.75fr] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0">
                        <span className="font-bold text-slate-700">{product.sku}</span>
                        <span className="font-semibold text-slate-950">{product.name}</span>
                        <span>{product.brand}</span>
                        <span className="font-semibold text-[var(--brand-blue)]">{product.category}/{product.subcategory}</span>
                        <span className={`font-black ${product.has_image ? "text-emerald-700" : "text-amber-700"}`}>{product.has_image ? "Publish" : "Draft"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950">{locale === "es" ? "Marcas desde Odoo" : "Brands from Odoo"}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{brands.length}</span>
                </div>
                <p className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(brandMessage.tone)}`}>{brandMessage.text}</p>
                {brands.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brands.slice(0, 18).map((brand) => (
                      <span key={brand.id || brand.slug} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-[var(--brand-blue)]">{brand.name}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </ModuleShell>
      );
    }

    return (
      <ModuleShell kicker="System" title={labels.modules.settings} body={locale === "es" ? "Credenciales y configuración operativa del panel." : "Credentials and operational panel settings."}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <Field label="ADMIN_API_KEY">
              <TextInput value={adminApiKey} onChange={(event) => updateAdminApiKey(event.target.value)} type="password" placeholder={locale === "es" ? "Clave para endpoints administrativos" : "Key for admin endpoints"} />
            </Field>
            <p className="mt-3 text-sm font-semibold text-slate-500">{locale === "es" ? "Se guarda solamente en este navegador." : "Stored only in this browser."}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <StatusCard title="Supabase" value="Configurado" detail={locale === "es" ? "Auth conectado, migración DB pendiente por password" : "Auth connected, DB migration pending password"} />
          </div>
        </div>
      </ModuleShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[296px_1fr]">
      <aside className="border-b border-white/10 bg-[var(--brand-blue)] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center justify-between border-b border-white/10 p-5 lg:block">
          <button type="button" onClick={() => setActiveModule("overview")} className="text-left text-2xl font-black tracking-tight">
            iros<span className="text-cyan-200">admin</span>
          </button>
          <Link href={localizedPath(locale, "home")} className="rounded-full border border-white/20 px-4 py-2 text-sm font-black transition hover:bg-white/10">
            {labels.store}
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto p-4 lg:grid lg:overflow-visible">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveModule(item.id);

                if (item.id === "products" && adminProducts.length === 0) {
                  void loadProducts(productStatus);
                }
              }}
              className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition lg:w-full ${
                activeModule === item.id
                  ? "bg-white text-[var(--brand-blue)] shadow-lg"
                  : "text-blue-50 hover:bg-white/10"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${activeModule === item.id ? "bg-blue-50" : "bg-white/10"}`}>{moduleIcon(item.id)}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">{labels.modules[activeModule]}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{labels.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">Auth admin</span>
            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">No demo data</span>
          </div>
        </div>
        {renderModule()}
      </main>
    </div>
  );
}
