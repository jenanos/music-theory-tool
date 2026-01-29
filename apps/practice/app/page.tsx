import type { Metadata } from 'next';
import { GameController } from './components/GameController';

export const metadata: Metadata = {
  title: 'Fretboard Practice - Music Theory Tool',
  description: 'Master your instrument with interactive fretboard exercises.',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Fretboard <span className="text-indigo-500">Mastery</span>
          </h1>
          <p className="text-neutral-400">
            Select strings, find the notes, and build your muscle memory.
          </p>
        </header>

        <GameController />
      </div>
    </main>
  );
}
