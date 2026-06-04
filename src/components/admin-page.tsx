import { AdminGate } from "@/components/admin-gate";
import type { Locale } from "@/lib/content";

export function AdminPage({ locale }: { locale: Locale }) {
  return <AdminGate locale={locale} />;
}
