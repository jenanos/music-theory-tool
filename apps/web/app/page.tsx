import { requirePageAccess } from "./lib/auth";
import { DiatonicChordsPage } from "./components/DiatonicChordsPage";

export default async function Page() {
  await requirePageAccess("chords");
  return <DiatonicChordsPage />;
}
