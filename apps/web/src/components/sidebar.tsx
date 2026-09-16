"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FLOORS } from "@orion/core";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="px-4 py-5">
        <span className="text-sm font-semibold tracking-widest text-zinc-100 uppercase">
          Orion
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {FLOORS.map((floor) => {
          const active = pathname === floor.rota;
          return (
            <Link
              key={floor.id}
              href={floor.rota}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {floor.nome}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
