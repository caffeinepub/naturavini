import { Toaster } from "@/components/ui/sonner";
import React from "react";
import PageHeader from "./components/PageHeader";
import WineList from "./pages/WineList";

export default function App() {
  const currentYear = new Date().getFullYear();
  const appId = encodeURIComponent(
    window.location.hostname || "naturavini-wine-list",
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader />

      <div className="flex-1">
        <WineList />
      </div>

      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-xs">
          <p className="font-serif italic text-foreground/60">
            © {currentYear} Naturavini — Natural Wine Price List
          </p>
          <p className="flex items-center gap-1">
            Built with{" "}
            <span className="text-accent" aria-label="love">
              ♥
            </span>{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
