import type { Metadata } from 'next';
import { GameController } from './components/GameController';

export const metadata: Metadata = {
  title: 'Øvelse | Fretboard Mastery',
  description: 'Mestre gripebrettet med interaktive øvelser.',
};

export default function PracticePage() {
  return (
    <main className="flex h-full flex-col bg-background text-foreground">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-4 pb-4 md:mb-8 border-b border-border md:pb-6 hidden md:block">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
              Fretboard <span className="text-primary">Mastery</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Velg strenger, finn notene, og bygg muskelminne.
            </p>
          </header>

          <GameController />
        </div>
      </div>
    </main>
  );
}
