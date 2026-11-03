import { useState, useEffect } from "react";
import { BeginnerLab } from "./components/beginner/BeginnerLab";
import { Styleguide } from "./components/styleguide/Styleguide";

function App() {
  const [currentView, setCurrentView] = useState<"lab" | "styleguide">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/styleguide" || hash === "#styleguide") {
        return "styleguide";
      }
    }
    return "styleguide"; // Default to styleguide for this review slice
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/styleguide" || hash === "#styleguide") {
        setCurrentView("styleguide");
      } else {
        setCurrentView("lab");
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const navigateTo = (view: "lab" | "styleguide") => {
    setCurrentView(view);
    if (view === "styleguide") {
      window.history.pushState(null, "", "/styleguide");
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas text-text-main">
      {/* Floating View Switcher for Developer / Reviewer Convenience */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border-subtle bg-surface-raised/90 p-1 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigateTo("styleguide")}
          className={`rounded-full px-3 py-1 text-xs font-mono font-medium transition-colors ${
            currentView === "styleguide"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Styleguide
        </button>
        <button
          type="button"
          onClick={() => navigateTo("lab")}
          className={`rounded-full px-3 py-1 text-xs font-mono font-medium transition-colors ${
            currentView === "lab"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Beginner Lab
        </button>
      </div>

      {currentView === "styleguide" ? <Styleguide /> : <BeginnerLab />}
    </div>
  );
}

export default App;
