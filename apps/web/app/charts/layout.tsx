import { requirePageAccess } from "../lib/auth";

export default async function ChartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("charts");
  return <>{children}</>;
}
