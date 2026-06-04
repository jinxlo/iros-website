import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

type OdooJsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: {
      name?: string;
      debug?: string;
      message?: string;
    };
  };
};

export type OdooProductTemplate = {
  id: number;
  name: string;
  default_code?: string | false;
  barcode?: string | false;
  list_price?: number;
  standard_price?: number;
  qty_available?: number;
  virtual_available?: number;
  active?: boolean;
  sale_ok?: boolean;
  description_sale?: string | false;
  description?: string | false;
  categ_id?: [number, string] | false;
  image_1920?: string | false;
  image_1024?: string | false;
  product_variant_ids?: number[];
  write_date?: string;
};

export type OdooCategory = {
  id: number;
  name: string;
  complete_name?: string;
  parent_id?: [number, string] | false;
};

type OdooCredentials = {
  baseUrl: string;
  database: string;
  /** Odoo login (usually the user email), as in the web UI. */
  login: string;
  /**
   * User password or an API key. Odoo's JSON-RPC API accepts either in the same
   * parameter (Community: password; optional API key from user preferences if set).
   */
  passwordOrKey: string;
};

function odooAuthFromEnv(): OdooCredentials {
  const baseUrl = getRequiredEnv("ODOO_BASE_URL").replace(/\/$/, "");
  const database = getRequiredEnv("ODOO_DATABASE");
  const login = (
    getOptionalEnv("ODOO_LOGIN") || getRequiredEnv("ODOO_USERNAME")
  ).trim();
  const passwordOrKey = (
    getOptionalEnv("ODOO_API_KEY") || getOptionalEnv("ODOO_PASSWORD")
  )?.trim();

  if (!passwordOrKey) {
    throw new Error(
      "Set ODOO_PASSWORD (Community) or ODOO_API_KEY for Odoo JSON-RPC access.",
    );
  }

  return { baseUrl, database, login, passwordOrKey };
}

export class OdooClient {
  private uid?: number;

  constructor(private readonly credentials: OdooCredentials) {}

  static fromEnv() {
    return new OdooClient(odooAuthFromEnv());
  }

  private async jsonRpc<T>(service: string, method: string, args: unknown[]) {
    const response = await fetch(`${this.credentials.baseUrl}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: { service, method, args },
        id: Date.now(),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Odoo JSON-RPC HTTP error: ${response.status}`);
    }

    const payload = (await response.json()) as OdooJsonRpcResponse<T>;

    if (payload.error) {
      throw new Error(
        payload.error.data?.message || payload.error.message || "Odoo JSON-RPC error",
      );
    }

    return payload.result as T;
  }

  async authenticate() {
    if (this.uid) {
      return this.uid;
    }

    const uid = await this.jsonRpc<number>("common", "authenticate", [
      this.credentials.database,
      this.credentials.login,
      this.credentials.passwordOrKey,
      {},
    ]);

    if (!uid) {
      throw new Error(
        "Odoo authentication failed. Check ODOO_DATABASE, ODOO_LOGIN (or ODOO_USERNAME), and ODOO_PASSWORD or ODOO_API_KEY.",
      );
    }

    this.uid = uid;
    return uid;
  }

  async executeKw<T>(model: string, method: string, args: unknown[] = [], kwargs: Record<string, unknown> = {}) {
    const uid = await this.authenticate();

    return this.jsonRpc<T>("object", "execute_kw", [
      this.credentials.database,
      uid,
      this.credentials.passwordOrKey,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  async getProductTemplates(limit = Number(getOptionalEnv("ODOO_SYNC_LIMIT") || 200), offset = 0, order = "write_date desc") {
    const fields = [
      "id",
      "name",
      "default_code",
      "barcode",
      "list_price",
      "standard_price",
      "qty_available",
      "virtual_available",
      "active",
      "sale_ok",
      "description_sale",
      "description",
      "image_1920",
      "image_1024",
      "product_variant_ids",
      "write_date",
    ];

    return this.executeKw<OdooProductTemplate[]>(
      "product.template",
      "search_read",
      [[]],
      {
        fields,
        limit,
        offset,
        order,
      },
    );
  }

  async countProductTemplates() {
    return this.executeKw<number>(
      "product.template",
      "search_count",
      [[]],
    );
  }

  async getAllProductTemplates(batchSize = 200) {
    const total = await this.countProductTemplates();
    const products: OdooProductTemplate[] = [];

    for (let offset = 0; offset < total; offset += batchSize) {
      products.push(...await this.getProductTemplates(batchSize, offset, "id asc"));
    }

    return products;
  }

  async getCategories() {
    return this.executeKw<OdooCategory[]>(
      "product.category",
      "search_read",
      [[]],
      {
        fields: ["id", "name", "complete_name", "parent_id"],
        limit: 1000,
        order: "complete_name asc",
      },
    );
  }
}
