import { requireAdmin } from "../lib/auth";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
