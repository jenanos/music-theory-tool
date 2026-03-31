import { requireAdmin } from "../lib/auth";

export default async function ProgressionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
