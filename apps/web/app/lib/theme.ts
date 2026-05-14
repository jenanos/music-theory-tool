export const USER_THEMES = ["thin-ice", "light", "dark"] as const;

export type UserTheme = (typeof USER_THEMES)[number];

export const DEFAULT_USER_THEME: UserTheme = "thin-ice";

export const USER_THEME_OPTIONS: Array<{
  id: UserTheme;
  label: string;
  description: string;
}> = [
  {
    id: "thin-ice",
    label: "Tynn Is",
    description:
      "Dagens glassaktige tema med frostede flater og bakgrunnsbilde.",
  },
  {
    id: "light",
    label: "Light Mode",
    description: "Et lyst og tradisjonelt tema med rene flater.",
  },
  {
    id: "dark",
    label: "Dark Mode",
    description: "Et mørkt og tradisjonelt tema med god kontrast.",
  },
];

export function isUserTheme(value: unknown): value is UserTheme {
  return typeof value === "string" && USER_THEMES.includes(value as UserTheme);
}

export function getThemeRootClass(theme: UserTheme): string {
  return theme === "light" ? "" : "dark";
}

export function applyThemeToDocument(theme: UserTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", getThemeRootClass(theme) === "dark");
}
