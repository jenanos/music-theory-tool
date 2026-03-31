import { requirePageAccess } from "../lib/auth";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("practice");
  return <>{children}</>;
}
