import { requireAdmin } from "./lib/auth";
import { DiatonicChordsPage } from "./components/DiatonicChordsPage";

export default async function Page() {
  await requireAdmin();
  return <DiatonicChordsPage />;
}
