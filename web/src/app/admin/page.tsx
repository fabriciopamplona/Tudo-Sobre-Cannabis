import type { Metadata } from "next";
import {
  adminPasswordConfigured,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import { buildAdminDashboard } from "@/lib/admin-data";
import { AdminDashboard, AdminLoginForm } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = adminPasswordConfigured();
  const authed = configured ? await isAdminAuthenticated() : true;

  if (configured && !authed) {
    return (
      <div className="admin-page">
        <AdminLoginForm configured />
      </div>
    );
  }

  const data = await buildAdminDashboard();
  return (
    <div className="admin-page">
      <AdminDashboard data={data} />
    </div>
  );
}
