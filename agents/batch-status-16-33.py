#!/usr/bin/env python3
"""Process illustrations for a run slug when 05-illustrations-spec.md exists.
Does NOT generate images — only converts assets PNG→WebP and inserts markdown
once PNGs are present in ASSETS dir with predictable names.

Usage as monitor helper: lists pending specs without WebP.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / "content/runs"
PUBLIC = ROOT / "web/public/illustrations"

# id -> slug from meta
def load_ids(start=16, end=33):
    out = {}
    for d in RUNS.iterdir():
        if not d.is_dir():
            continue
        m = d / "meta.json"
        if not m.exists():
            continue
        try:
            meta = json.loads(m.read_text())
        except Exception:
            continue
        pid = meta.get("id")
        if isinstance(pid, int) and start <= pid <= end:
            out[pid] = d.name
    return out

def status_row(pid, slug):
    d = RUNS / slug
    spec = d / "05-illustrations-spec.md"
    cand = d / "04-publish-candidate.md"
    # illustration folder may use taxonomy slug from frontmatter
    tax_slug = slug
    if cand.exists():
        m = re.search(r'^slug:\s*["\']?([^"\'\n]+)', cand.read_text(), re.M)
        if m:
            tax_slug = m.group(1).strip()
    webp_dir = PUBLIC / tax_slug
    n_webp = len(list(webp_dir.glob("*.webp"))) if webp_dir.exists() else 0
    figs = 0
    image = ""
    if cand.exists():
        t = cand.read_text()
        figs = t.count("Figura:")
        m = re.search(r'^image:\s*["\']?([^"\'\n]+)', t, re.M)
        image = (m.group(1) if m else "").strip()
    return {
        "id": pid,
        "slug": slug,
        "tax_slug": tax_slug,
        "spec": spec.exists(),
        "cand": cand.exists(),
        "figs": figs,
        "webp": n_webp,
        "image": image,
        "serp": (d / "07-serp-review.md").exists(),
        "gate": (d / "05-gate-prep.md").exists(),
    }

def main():
    ids = load_ids()
    rows = [status_row(i, ids[i]) for i in sorted(ids)]
    print(f"{'#':>3} {'slug':40} spec figs webp image serp gate")
    for r in rows:
        has_img = "Y" if r["image"] and r["image"] not in ("", '""') else "."
        print(
            f"{r['id']:3d} {r['slug'][:40]:40} "
            f"{'Y' if r['spec'] else '.'}    {r['figs']:2d}   {r['webp']:2d}  "
            f"{has_img}     "
            f"{'Y' if r['serp'] else '.'}    {'Y' if r['gate'] else '.'}"
        )
    need_spec = [r for r in rows if not r["spec"]]
    need_img = [r for r in rows if r["spec"] and (r["webp"] < 3 or r["figs"] < 2)]
    print(f"\npending rewrite/spec: {len(need_spec)} · pending images: {len(need_img)}")
    if need_img:
        print("next images:", ", ".join(f"#{r['id']}" for r in need_img[:5]))

if __name__ == "__main__":
    main()
