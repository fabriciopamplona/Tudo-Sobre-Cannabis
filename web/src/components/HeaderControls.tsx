"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MenuIcon, SearchIcon } from "./Icons";

type NavItem = { id: string; href: string; label: string };

export function HeaderControls({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="header-actions">
        <Link href="/#arquivo" className="icon-btn" aria-label="Buscar artigos">
          <SearchIcon />
        </Link>
        <button
          type="button"
          className="icon-btn icon-btn-solid"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open ? (
        <div className="mobile-nav">
          {items.map((item) => (
            <Link key={item.id} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
