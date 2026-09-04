"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { BookmarkIcon, CheckIcon, CopyIcon, ShareIcon } from "./Icons";

function savedKey(slug: string) {
  return `tsc-saved:${slug}`;
}

function subscribeSaved(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("tsc-saved", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("tsc-saved", onStoreChange);
  };
}

function useSaved(slug: string) {
  const key = savedKey(slug);
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) === "1", [key]);
  return useSyncExternalStore(subscribeSaved, getSnapshot, () => false);
}

export function ArticleActions({ slug, title }: { slug: string; title: string }) {
  const saved = useSaved(slug);
  const [shared, setShared] = useState(false);

  const toggleSave = () => {
    window.localStorage.setItem(savedKey(slug), saved ? "0" : "1");
    window.dispatchEvent(new Event("tsc-saved"));
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled */
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  };

  return (
    <div className="exploded-actions">
      <button
        type="button"
        className={`exploded-icon-btn${saved ? " is-active" : ""}`}
        aria-label={saved ? "Artigo salvo" : "Salvar artigo"}
        aria-pressed={saved}
        onClick={toggleSave}
      >
        {saved ? <CheckIcon /> : <BookmarkIcon />}
      </button>
      <button type="button" className="exploded-icon-btn" aria-label="Compartilhar artigo" onClick={share}>
        {shared ? <CopyIcon /> : <ShareIcon />}
      </button>
    </div>
  );
}

export function ArticleSavedHint({ slug }: { slug: string }) {
  const saved = useSaved(slug);
  return <span className="exploded-hint">{saved ? "salvo no seu arquivo" : "leitura independente"}</span>;
}
