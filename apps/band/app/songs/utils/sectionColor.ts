export function getSectionColorClass(label: string): string {
    const l = label.toLowerCase();

    if (l.includes("intro")) {
        return "border-l-4 border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10";
    }
    if (l.includes("vers")) {
        return "border-l-4 border-l-green-500 bg-green-500/5 dark:bg-green-500/10";
    }
    if (l.includes("pre-chorus") || l.includes("pre chorus") || l.includes("bro")) {
        return "border-l-4 border-l-yellow-500 bg-yellow-500/5 dark:bg-yellow-500/10";
    }
    if (l.includes("refreng") || l.includes("chorus")) {
        return "border-l-4 border-l-red-500 bg-red-500/5 dark:bg-red-500/10";
    }
    if (l.includes("bridge") || l.includes("stikk")) {
        return "border-l-4 border-l-purple-500 bg-purple-500/5 dark:bg-purple-500/10";
    }
    if (l.includes("mellomspill") || l.includes("instrumental") || l.includes("solo")) {
        return "border-l-4 border-l-orange-500 bg-orange-500/5 dark:bg-orange-500/10";
    }
    if (l.includes("outro") || l.includes("ending")) {
        return "border-l-4 border-l-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10";
    }

    // Default fallback
    return "border-l-4 border-l-border bg-card";
}
