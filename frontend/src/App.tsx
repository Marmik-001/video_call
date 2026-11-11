import { useState, useEffect } from "react";
import { BeginnerLab } from "./components/beginner/BeginnerLab";
import { ProSimulatorLab } from "./components/pro/ProSimulatorLab";
import { Styleguide } from "./components/styleguide/Styleguide";

function App() {
  const [currentView, setCurrentView] = useState<"lab" | "pro" | "styleguide">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/styleguide" || hash === "#styleguide") {
        return "styleguide";
      }
      if (path === "/pro" || hash === "#pro") {
        return "pro";
      }
    }
    return "lab";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/styleguide" || hash === "#styleguide") {
        setCurrentView("styleguide");
      } else if (path === "/pro" || hash === "#pro") {
        setCurrentView("pro");
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

  const navigateTo = (view: "lab" | "pro" | "styleguide") => {
    setCurrentView(view);
    if (view === "styleguide") {
      window.history.pushState(null, "", "/styleguide");
    } else if (view === "pro") {
      window.history.pushState(null, "", "/pro");
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
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
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
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Beginner Lab
        </button>
        <button
          type="button"
          data-testid="nav-pro-simulator"
          onClick={() => navigateTo("pro")}
          className={`rounded-full px-3 py-1 text-xs font-mono font-medium transition-colors ${
            currentView === "pro"
              ? "bg-purple-500/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          ⚡ Pro Simulator
        </button>
      </div>

      {currentView === "styleguide" ? (
        <Styleguide />
      ) : currentView === "pro" ? (
        <ProSimulatorLab onBackToBeginner={() => navigateTo("lab")} />
      ) : (
        <BeginnerLab />
      )}
    </div>
  );
}

export default App;
