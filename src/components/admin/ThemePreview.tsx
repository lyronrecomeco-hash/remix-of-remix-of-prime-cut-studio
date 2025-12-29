import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemePreview({ themeId }: { themeId: string }) {
  const themeClass = themeId ? `theme-${themeId}` : "";

  return (
    <div
      className={cn(
        "h-full w-full overflow-hidden",
        themeClass,
        "bg-background text-foreground"
      )}
    >
      <header className="border-b border-border bg-card">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Preview</p>
              <p className="text-sm font-semibold leading-none">Sua Marca</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span className="inline-block h-2 w-2 rounded-full bg-muted" />
              <span className="inline-block h-2 w-2 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h1 className="text-base font-bold">Barbearia & Beleza</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Um preview rápido do tema aplicado (somente HTML).
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm">Agendar</Button>
            <Button size="sm" variant="outline">
              Ver serviços
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <article className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Serviço</p>
            <p className="text-sm font-semibold">Corte</p>
            <p className="text-xs text-muted-foreground mt-1">30 min</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Serviço</p>
            <p className="text-sm font-semibold">Escova</p>
            <p className="text-xs text-muted-foreground mt-1">45 min</p>
          </article>
        </section>

        <section className="rounded-xl border border-border bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">Depoimento</p>
          <p className="text-sm mt-1 leading-snug">
            “Atendimento excelente e ambiente impecável.”
          </p>
          <p className="text-xs text-muted-foreground mt-2">— Cliente</p>
        </section>

        <footer className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Sua Marca
          </p>
        </footer>
      </main>
    </div>
  );
}
