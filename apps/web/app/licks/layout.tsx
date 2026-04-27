import { requirePageAccess } from "../lib/auth";

export default async function LicksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("licks");
  return <>{children}</>;
}
