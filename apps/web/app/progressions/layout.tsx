import { requirePageAccess } from "../lib/auth";

export default async function ProgressionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("progressions");
  return <>{children}</>;
}
