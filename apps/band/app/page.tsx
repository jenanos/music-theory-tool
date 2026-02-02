export default function Page() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-4">Velkommen til Band Appen</h1>
            <p className="text-xl mb-8">Her finner du akkorder og setlister.</p>
            <a
                href="/songs"
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
                Gå til sanger
            </a>
        </main>
    );
}
