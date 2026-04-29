import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

/** Applies or removes the `dark` class on the <html> element. */
function applyThemeClass(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          applyThemeClass(newTheme);
          return { theme: newTheme };
        });
      },
    }),
    {
      name: "greenleaf-theme",
      /**
       * Fires after Zustand rehydrates the persisted state from localStorage.
       * This ensures the correct dark/light class is applied on every page load,
       * even without calling toggleTheme().
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeClass(state.theme);
        }
      },
    }
  )
);
