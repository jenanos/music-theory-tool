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
        <header className="mb-4 pb-4 md:mb-12 border-b border-neutral-800 md:pb-6 hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Fretboard <span className="text-indigo-500">Mastery</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Select strings, find the notes, and build your muscle memory.
          </p>
        </header>

        <GameController />
      </div>
    </main>
  );
}
