#!/usr/bin/env python3
"""KB privada: ingestão dos dumps, classificação TSC, fila 200+800, piloto.

Uso:
  python3 kb/run.py build
  python3 kb/run.py ingest
  python3 kb/run.py ingest-midia
  python3 kb/run.py score
  python3 kb/run.py queue
  python3 kb/run.py pilot
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import sys
import unicodedata
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "kb"
DATA = KB / "data"
DB = DATA / "kb.sqlite"
DUMP_CES = Path(os.environ.get("KB_CES_DIR", "/tmp/tsc-dumps/ces/data"))
DUMP_SECHAT = Path(os.environ.get("KB_SECHAT_DIR", "/tmp/tsc-dumps/sechat/data"))
DUMP_MIDIA = Path(os.environ.get("KB_MIDIA_DIR", "/tmp/tsc-dumps/midia/content"))

STOP = {
    "a", "o", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", "e", "em",
    "no", "na", "nos", "nas", "para", "com", "por", "que", "se", "ao", "à", "às",
    "the", "and", "of", "in", "on", "to", "for", "sobre", "como", "mais", "nao",
    "não", "ou", "entre", "apos", "após", "sem", "sua", "seu", "foi", "ser",
    "esta", "está", "novo", "nova", "cannabis", "medicinal", "cbd", "thc",
}

CONDITIONS = [
    ("epilepsia", "epilepsia", r"epilep|dravet|lennox"),
    ("dor-cronica", "dor crônica", r"dor cr[oô]nic|fibromial"),
    ("esclerose", "esclerose múltipla", r"esclerose|espastic"),
    ("autismo", "autismo", r"\btea\b|autismo"),
    ("parkinson", "parkinson", r"parkinson"),
    ("alzheimer", "alzheimer", r"alzheimer|dem[eê]ncia"),
    ("ansiedade", "ansiedade", r"ansiedade"),
    ("insonia", "insônia", r"ins[oô]nia"),
    ("cancer", "câncer paliativo", r"c[aâ]ncer|paliativ|oncolog|quimio"),
    ("fibromialgia", "fibromialgia", r"fibromial"),
    ("enxaqueca", "enxaqueca", r"enxaqueca|migraine"),
    ("ptsd", "ptsd", r"\bptsd\b|estresse p[oó]s"),
    ("crohn", "crohn / DII", r"crohn|retocolite|intestinal"),
    ("tourette", "tourette", r"tourette"),
]

MOLECULES = [
    ("cbd", r"\bcbd\b|canabidiol"),
    ("thc", r"\bthc\b|tetrahidro"),
    ("cbg", r"\bcbg\b"),
    ("cbn", r"\bcbn\b"),
    ("thcv", r"\bthcv\b"),
]

import html as htmlmod

SKIP_RE = re.compile(
    r"\b(live sechat|super live|webinar|demo day|pizza|jay-?z|"
    r"psilocib|ayahuasca|\blsd\b|\bmdma\b|psicod[eé]lic|"
    r"vagas disponíveis|procurando emprego|curriculo|currículo)\b",
    re.I,
)
ON_TOPIC_RE = re.compile(
    r"cannabis|canabi|maconha|canhamo|c[aâ]nhamo|\bcbd\b|\bthc\b|"
    r"anvisa|\brdc\b|\bstj\b|\bcfm\b|endocanabin",
    re.I,
)
ENTITY_TO_MUST = {
    "cond:cond-epilepsia": "cannabis-medicinal-epilepsia",
    "cond:cond-dor-cronica": "cannabis-medicinal-dor-cronica",
    "cond:cond-esclerose": "cannabis-medicinal-esclerose-multipla",
    "cond:cond-autismo": "cannabis-medicinal-autismo",
    "cond:cond-parkinson": "cannabis-medicinal-parkinson",
    "cond:cond-alzheimer": "cannabis-medicinal-alzheimer",
    "cond:cond-ansiedade": "cannabis-medicinal-ansiedade",
    "cond:cond-insonia": "cannabis-medicinal-insonia",
    "cond:cond-cancer": "cannabis-medicinal-cancer-paliativo",
    "cond:cond-fibromialgia": "cannabis-medicinal-fibromialgia",
    "cond:cond-enxaqueca": "cannabis-medicinal-enxaqueca",
    "cond:cond-ptsd": "cannabis-medicinal-ptsd",
    "mol:cbd": "o-que-e-cbd",
}
EVENT_RE = re.compile(
    r"\b(evento|feira|expo|congresso|cbcm|cannabis thinking|cannabis connection)\b",
    re.I,
)
HIST_RE = re.compile(
    r"\b(rdc|anvisa|stj|stf|cfm|habeas|descriminal|projeto de lei|"
    r"publicou|aprovou|rejeitou|vetou|promulgad)\b",
    re.I,
)
MIDIA_INDEX_PATH = re.compile(
    r"/tudo-sobre/|/noticias-sobre/|/keywords/|/tag/|/tags/|/pagina/|"
    r"/poder-cannabis-hoje/?$|/video/",
    re.I,
)
MIDIA_INDEX_TITLE = re.compile(
    r"^(cannabis|canabidiol|maconha( medicinal)?|cannabis medicinal)\s*(\||$)|"
    r"tudo sobre |not[ií]cias sobre |palavra-chave:|portal drauzio",
    re.I,
)
MIDIA_TITLE_TAIL = re.compile(
    r"\s*\|\s*(G1|CNN Brasil|Poder360|Folha de S\.Paulo|Folha|Estadão|Estadao|"
    r"UOL|Metrópoles|Metropoles|Forbes Brasil|InfoMoney|Gazeta do Povo|"
    r"Jornal da USP|VEJA|Veja Saúde|Exame|O Tempo|O Antagonista|IstoÉ|"
    r"Pesquisa FAPESP|Superinteressante|Money Times).*$",
    re.I,
)
OUTLET_WEIGHT = {
    "jornal da usp": 16,
    "pesquisa fapesp": 16,
    "folha de s.paulo": 14,
    "estadão": 14,
    "estadao": 14,
    "g1": 12,
    "cnn brasil": 10,
    "poder360": 9,
    "uol": 9,
    "veja": 8,
    "veja saúde": 8,
    "exame": 8,
    "infomoney": 7,
    "forbes brasil": 7,
    "metrôpoles": 6,
    "metrópoles": 6,
    "gazeta do povo": 6,
    "o tempo": 5,
    "money times": 5,
    "o antagonista": 4,
    "istoé": 4,
    "fast company brasil": 4,
    "superinteressante": 3,
    "infoescola": 1,
}


def slugify(text: str, n: int = 72) -> str:
    t = unicodedata.normalize("NFD", text or "")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:n] or "tema"


def fold(text: str) -> str:
    t = unicodedata.normalize("NFD", text or "")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return t.lower()


def connect() -> sqlite3.Connection:
    DATA.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS kb_documents (
          id TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          source_url TEXT NOT NULL,
          slug TEXT,
          title TEXT NOT NULL,
          excerpt TEXT,
          content TEXT,
          author TEXT,
          lang TEXT,
          published_at TEXT,
          content_chars INTEGER,
          truncated INTEGER DEFAULT 0,
          checksum TEXT NOT NULL,
          type_source TEXT,
          category_source TEXT,
          pillar TEXT,
          type_guess TEXT,
          kind TEXT,
          cluster_id TEXT,
          entities_json TEXT DEFAULT '[]',
          impact_score REAL DEFAULT 0,
          skip_reason TEXT
        );
        CREATE TABLE IF NOT EXISTS kb_clusters (
          id TEXT PRIMARY KEY,
          pillar TEXT,
          kind TEXT,
          label TEXT,
          keyword TEXT,
          slug TEXT,
          doc_count INTEGER DEFAULT 0,
          latest_at TEXT,
          impact_score REAL DEFAULT 0,
          tsc_role TEXT,
          guide_doc_id TEXT
        );
        CREATE TABLE IF NOT EXISTS kb_serp (
          query TEXT NOT NULL,
          position INTEGER NOT NULL,
          url TEXT,
          title TEXT,
          domain TEXT,
          PRIMARY KEY (query, position)
        );
        """
    )
    return con


def doc_id(source: str, url: str) -> str:
    return hashlib.sha256(f"{source}|{url}".encode()).hexdigest()[:20]


def checksum(blob: str) -> str:
    return hashlib.sha256((blob or "").encode("utf-8", "ignore")).hexdigest()


def extract_entities(blob: str) -> list[str]:
    b = fold(blob)
    out = []
    for m in re.finditer(r"rdc\s*n?o?\.?\s*(\d{2,4})", b):
        out.append(f"rdc-{m.group(1)}")
    if re.search(r"\banvisa\b", b):
        out.append("anvisa")
    if re.search(r"\bstj\b", b):
        out.append("stj")
    if re.search(r"\bcfm\b", b):
        out.append("cfm")
    for slug, _label, pat in CONDITIONS:
        if re.search(pat, b):
            out.append(f"cond-{slug}")
    for slug, pat in MOLECULES:
        if re.search(pat, b):
            out.append(f"mol-{slug}")
    if re.search(r"associa", b):
        out.append("associacao")
    if re.search(r"veterin", b):
        out.append("veterinaria")
    # unique preserve order
    seen = set()
    uniq = []
    for e in out:
        if e not in seen:
            seen.add(e)
            uniq.append(e)
    return uniq


def classify(title: str, excerpt: str, url: str, source: str, type_source: str) -> dict:
    from urllib.parse import urlparse
    title = htmlmod.unescape(title or "")
    path = urlparse(url or "").path
    blob = fold(" ".join([title, excerpt or "", path]))
    ents = extract_entities(blob)
    skip_reason = None
    kind = "historical"
    pillar = "regulacao"
    type_guess = "noticia"

    if not ON_TOPIC_RE.search(blob) and not any(e.startswith("cond-") or e.startswith("rdc-") or e.startswith("mol-") for e in ents):
        return {
            "pillar": "skip",
            "type_guess": "skip",
            "kind": "skip",
            "skip_reason": "fora-de-recorte",
            "entities": ents,
        }

    if re.search(r"psilocib|ayahuasca|\blsd\b|psicod", blob):
        return {
            "pillar": "skip",
            "type_guess": "skip",
            "kind": "skip",
            "skip_reason": "psicodelicos",
            "entities": ents,
        }
    if SKIP_RE.search(blob):
        skip_reason = "ruido"
        kind = "skip"
        pillar = "skip"
        type_guess = "skip"
    elif EVENT_RE.search(blob) and not HIST_RE.search(blob):
        skip_reason = "evento"
        kind = "skip"
        pillar = "skip"
        type_guess = "skip"

    conds = [e for e in ents if e.startswith("cond-")]
    mols = [e for e in ents if e.startswith("mol-")]
    rdcs = [e for e in ents if e.startswith("rdc-")]

    if conds:
        pillar = "condicoes"
        type_guess = "ciencia"
        kind = "evergreen"
    elif any(e == "veterinaria" for e in ents) and not conds:
        pillar = "condicoes"
        type_guess = "ciencia"
        kind = "evergreen"
    elif re.search(r"como come[cç]|autoriza|receita|importa|manipula|golpe|quanto custa|\bsus\b|plano de saude", blob):
        pillar = "acesso"
        type_guess = "informe"
        kind = "evergreen"
    elif re.search(r"fam[ií]lia|crian[cç]a|adolescente|estigma|escola", blob):
        pillar = "familia"
        type_guess = "informe"
        kind = "evergreen"
    elif mols and re.search(r"o que e|o que é|o que eh|sistema endocan|entourage|full.?spectrum|isolado|interacao|interação|coa|certificado", blob):
        pillar = "canabinoides"
        type_guess = "informe"
        kind = "evergreen"
    elif rdcs or re.search(r"\banvisa\b|\bstj\b|\bcfm\b|habeas|descriminal", blob):
        pillar = "regulacao"
        type_guess = "regulacao"
        kind = "historical" if HIST_RE.search(blob) else "evergreen"
    elif re.search(r"estudo|ensaio|pesquisa|universidade|paper", blob):
        pillar = "ciencia"
        type_guess = "ciencia"
        kind = "historical"
    elif re.search(r"mercado|empresa|faturamento|investimento|startup|kaya", blob):
        pillar = "mercado"
        type_guess = "mercado"
        kind = "historical"
    elif mols:
        pillar = "canabinoides"
        type_guess = "ciencia"
        kind = "evergreen"

    if kind != "skip" and re.search(r"relato|historia de|história de", blob) and conds:
        kind = "historical"
        type_guess = "noticia"

    return {
        "pillar": pillar,
        "type_guess": type_guess,
        "kind": kind,
        "skip_reason": skip_reason,
        "entities": ents,
    }


def cluster_id_for(cls: dict, title: str) -> str:
    ents = cls["entities"]
    rdcs = [e for e in ents if e.startswith("rdc-")]
    conds = [e for e in ents if e.startswith("cond-")]
    if rdcs:
        return f"rdc:{rdcs[0]}"
    if conds and cls["kind"] == "evergreen":
        return f"cond:{conds[0]}"
    if "mol-cbd" in ents and cls["pillar"] == "canabinoides" and cls["kind"] == "evergreen":
        if re.search(r"o que", fold(title)):
            return "mol:cbd"
    if cls["kind"] == "skip":
        return f"skip:{slugify(title, 40)}"
    tokens = [w for w in re.findall(r"[a-z0-9]{4,}", fold(title)) if w not in STOP]
    key = "-".join(sorted(tokens)[:6]) or slugify(title, 40)
    return f"{cls['pillar']}:{key}"


def iter_json(folder: Path):
    for p in sorted(folder.glob("*.json")):
        try:
            yield p, json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print("skip", p.name, e, file=sys.stderr)


def ingest(con: sqlite3.Connection) -> int:
    rows = []
    for source, folder in (("ces", DUMP_CES), ("sechat", DUMP_SECHAT)):
        if not folder.exists():
            raise SystemExit(f"Dump não encontrado: {folder}")
        for _p, d in iter_json(folder):
            url = d.get("url") or d.get("canonical") or ""
            title = (d.get("title") or "").strip()
            if not url or not title:
                continue
            content = d.get("content") or ""
            chars = int(d.get("content_chars") or len(content))
            truncated = 1 if chars >= 4990 and source == "sechat" else 0
            cats = d.get("categories") or d.get("category") or ""
            if isinstance(cats, list):
                cats = ",".join(
                    (x.get("name") if isinstance(x, dict) else str(x)) for x in cats
                )
            pub = (d.get("date") or "")[:10]
            lang = d.get("language") or "pt-BR"
            if source == "sechat" and lang in ("en", "es"):
                continue
            cls = classify(title, d.get("excerpt") or "", url, source, d.get("type") or "")
            cid = cluster_id_for(cls, title)
            rows.append(
                (
                    doc_id(source, url),
                    source,
                    url,
                    d.get("slug") or slugify(title),
                    title,
                    (d.get("excerpt") or "")[:800],
                    content,
                    d.get("author") or "",
                    lang,
                    pub or None,
                    chars,
                    truncated,
                    checksum(content),
                    d.get("type") or "post",
                    str(cats)[:200],
                    cls["pillar"],
                    cls["type_guess"],
                    cls["kind"],
                    cid,
                    json.dumps(cls["entities"], ensure_ascii=False),
                    0,
                    cls["skip_reason"],
                )
            )
    con.execute("DELETE FROM kb_documents WHERE source IN ('ces','sechat')")
    con.executemany(
        """INSERT INTO kb_documents (
            id, source, source_url, slug, title, excerpt, content, author, lang,
            published_at, content_chars, truncated, checksum, type_source,
            category_source, pillar, type_guess, kind, cluster_id, entities_json,
            impact_score, skip_reason
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        rows,
    )
    con.commit()
    return len(rows)


def clean_midia_title(title: str) -> str:
    t = htmlmod.unescape(title or "").strip()
    t = MIDIA_TITLE_TAIL.sub("", t).strip()
    return t or htmlmod.unescape(title or "").strip()


def clean_midia_body(text: str) -> str:
    t = text or ""
    t = re.sub(r"^Gerando resumo\s*", "", t)
    return t.strip()


def is_midia_index(url: str, title: str, chars: int) -> bool:
    from urllib.parse import urlparse
    path = urlparse(url or "").path.lower()
    if MIDIA_INDEX_PATH.search(path):
        return True
    if MIDIA_INDEX_TITLE.search(title or "") and chars < 4000:
        return True
    if chars < 700:
        return True
    return False


def outlet_weight(veiculo: str) -> int:
    return OUTLET_WEIGHT.get(fold(veiculo or "").strip(), 5)


def midia_score(cls: dict, veiculo: str, chars: int, published_at: str) -> float:
    year = int((published_at or "2019")[:4]) if published_at else 2019
    recency = max(0, year - 2018)
    w = outlet_weight(veiculo)
    score = (
        w
        + recency * 2.2
        + min((chars or 0) / 1800, 12)
        + (8 if cls.get("kind") == "evergreen" else 0)
        + (6 if cls.get("pillar") in ("regulacao", "ciencia", "condicoes", "acesso") else 0)
        - (40 if cls.get("kind") == "skip" else 0)
    )
    return round(score, 2)


def ingest_midia(con: sqlite3.Connection, n_target: int = 250) -> tuple[int, int]:
    """Ingere o dump de imprensa nacional sem apagar C&S/Sechat. Seleciona 250 para a fila."""
    if not DUMP_MIDIA.exists():
        raise SystemExit(f"Dump não encontrado: {DUMP_MIDIA}")

    rows = []
    seen_url: set[str] = set()
    skipped = {"index": 0, "dup": 0, "empty": 0}
    for _p, d in iter_json(DUMP_MIDIA):
        url = (d.get("url") or "").strip()
        title_raw = (d.get("titulo") or d.get("title") or "").strip()
        if not url or not title_raw:
            skipped["empty"] += 1
            continue
        if url in seen_url:
            skipped["dup"] += 1
            continue
        seen_url.add(url)
        content = clean_midia_body(d.get("conteudo") or d.get("content") or "")
        chars = int(d.get("chars") or len(content))
        if is_midia_index(url, title_raw, chars):
            skipped["index"] += 1
            continue
        dominio = fold(d.get("dominio") or url)
        if "infoescola" in dominio or "infoescola" in fold(d.get("veiculo") or ""):
            skipped["index"] += 1
            continue
        title = clean_midia_title(title_raw)
        pub = (d.get("data_publicacao") or d.get("date") or "")[:10]
        veiculo = (d.get("veiculo") or d.get("site") or "").strip()
        excerpt = content[:800]
        cls = classify(title, excerpt, url, "midia", "press")
        veiculo_f = fold(veiculo)
        if cls["kind"] != "skip":
            cls["kind"] = "historical"
            if "usp" in veiculo_f or "fapesp" in veiculo_f:
                if cls["pillar"] == "ciencia" or re.search(r"estudo|pesquisa|ensaio", fold(title)):
                    cls["type_guess"] = "ciencia"
                elif cls["type_guess"] == "informe":
                    cls["type_guess"] = "noticia"
            elif cls["type_guess"] == "informe":
                cls["type_guess"] = "noticia"
        cid = f"midia:{slugify(title)}"
        score = midia_score(cls, veiculo, chars, pub)
        rows.append(
            (
                doc_id("midia", url),
                "midia",
                url,
                slugify(title),
                title,
                excerpt,
                content,
                d.get("autor") or d.get("author") or "",
                "pt-BR",
                pub or None,
                chars,
                0,
                checksum(content),
                "press",
                veiculo[:200],
                cls["pillar"],
                cls["type_guess"],
                cls["kind"],
                cid,
                json.dumps(cls["entities"], ensure_ascii=False),
                score,
                cls["skip_reason"],
            )
        )

    con.execute("DELETE FROM kb_clusters WHERE id LIKE 'midia:%' OR tsc_role='midia'")
    con.execute("DELETE FROM kb_documents WHERE source='midia'")
    con.executemany(
        """INSERT INTO kb_documents (
            id, source, source_url, slug, title, excerpt, content, author, lang,
            published_at, content_chars, truncated, checksum, type_source,
            category_source, pillar, type_guess, kind, cluster_id, entities_json,
            impact_score, skip_reason
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        rows,
    )

    # 250: recência + autoridade + diversidade de veículo; skip só se ruído duro
    ranked = sorted(
        [r for r in rows if r[17] != "skip"],
        key=lambda r: r[20],
        reverse=True,
    )
    chosen = []
    per_outlet: dict[str, int] = defaultdict(int)
    seen_slug: set[str] = set()
    cap = 20
    for r in ranked:
        slug = r[3]
        outlet = fold(r[14] or "")
        if slug in seen_slug:
            continue
        if per_outlet[outlet] >= cap:
            continue
        seen_slug.add(slug)
        per_outlet[outlet] += 1
        chosen.append(r)
        if len(chosen) >= n_target:
            break
    if len(chosen) < n_target:
        for r in ranked:
            slug = r[3]
            if slug in seen_slug:
                continue
            seen_slug.add(slug)
            chosen.append(r)
            if len(chosen) >= n_target:
                break

    for r in chosen:
        doc_pk, _src, url, slug, title, _ex, _c, _au, _lang, pub, _ch, _tr, _ck, _ts, veiculo, pillar, type_guess, kind, cid, _ents, score, _skip = r
        kw = fold(title)[:80]
        con.execute(
            """INSERT INTO kb_clusters (
                id, pillar, kind, label, keyword, slug, doc_count, latest_at,
                impact_score, tsc_role, guide_doc_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                cid,
                pillar,
                kind,
                title,
                kw,
                slug,
                1,
                pub,
                score,
                "midia",
                doc_pk,
            ),
        )
    con.commit()
    print(
        f"midia docs: {len(rows)}  fila: {len(chosen)}  "
        f"skip index/dup/empty: {skipped['index']}/{skipped['dup']}/{skipped['empty']}"
    )
    return len(rows), len(chosen)


def rebuild_clusters(con: sqlite3.Connection) -> int:
    con.execute("DELETE FROM kb_clusters WHERE id NOT LIKE 'midia:%' AND IFNULL(tsc_role,'') != 'midia'")
    docs = list(
        con.execute(
            """SELECT id, title, pillar, kind, cluster_id, content_chars, truncated, published_at
               FROM kb_documents WHERE source IN ('ces','sechat')"""
        )
    )
    buckets: dict[str, list] = defaultdict(list)
    for d in docs:
        buckets[d["cluster_id"]].append(d)

    must = json.loads((KB / "must_hubs.json").read_text(encoding="utf-8"))
    must_by_slug = {m["slug"]: m for m in must}

    n = 0
    for cid, items in buckets.items():
        items_sorted = sorted(items, key=lambda r: r["content_chars"] or 0, reverse=True)
        guide = items_sorted[0]
        kinds = [i["kind"] for i in items]
        kind = "skip" if all(k == "skip" for k in kinds) else (
            "evergreen" if kinds.count("evergreen") >= kinds.count("historical") else "historical"
        )
        pillar = guide["pillar"]
        label = htmlmod.unescape(guide["title"] or "")
        kw = label.lower()
        slug = slugify(label)
        if cid in ENTITY_TO_MUST and ENTITY_TO_MUST[cid] in must_by_slug:
            m = must_by_slug[ENTITY_TO_MUST[cid]]
            label, kw, slug, pillar = m["label"], m["keyword"], m["slug"], m["pillar"]
        latest = max((i["published_at"] or "" for i in items), default="")
        # score: docs + length + recency + not skip
        year = int((latest or "2019")[:4]) if latest else 2019
        recency = max(0, year - 2018)
        score = (
            len(items) * 3
            + min(sum(i["content_chars"] or 0 for i in items) / 8000, 20)
            + recency
            + (8 if kind == "evergreen" else 0)
            + (12 if cid.startswith("cond:") or cid.startswith("rdc:") else 0)
            + (40 if cid in ENTITY_TO_MUST else 0)
            - (30 if kind == "skip" else 0)
            - (5 * sum(1 for i in items if i["truncated"]))
        )
        role = "skip" if kind == "skip" else "candidate"
        con.execute(
            """INSERT INTO kb_clusters (
                id, pillar, kind, label, keyword, slug, doc_count, latest_at,
                impact_score, tsc_role, guide_doc_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                cid,
                pillar,
                kind,
                label,
                kw[:80],
                slug,
                len(items),
                latest or None,
                score,
                role,
                guide["id"],
            ),
        )
        n += 1
        con.execute(
            "UPDATE kb_documents SET impact_score=? WHERE cluster_id=?",
            (score, cid),
        )

    # inject must hubs as clusters if missing
    for m in must:
        cid = f"must:{m['slug']}"
        exists = con.execute(
            "SELECT 1 FROM kb_clusters WHERE slug=? OR id=?",
            (m["slug"], cid),
        ).fetchone()
        if exists:
            con.execute(
                "UPDATE kb_clusters SET tsc_role='hub', impact_score=impact_score+50, keyword=?, pillar=? WHERE slug=? OR id=?",
                (m["keyword"], m["pillar"], m["slug"], cid),
            )
            continue
        con.execute(
            """INSERT INTO kb_clusters (
                id, pillar, kind, label, keyword, slug, doc_count, latest_at,
                impact_score, tsc_role, guide_doc_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                cid,
                m["pillar"],
                "evergreen",
                m["label"],
                m["keyword"],
                m["slug"],
                0,
                None,
                80,
                "hub",
                None,
            ),
        )
        n += 1
    con.commit()
    return n


NOISE_LABEL = re.compile(
    r"emprego|vagas dispon|baby blues|ovarios policistic|alergia emocional|"
    r"desintoxica[cç][aã]o de canabin|impot[eê]ncia|melhor rem[eé]dio",
    re.I,
)


def assign_library(con: sqlite3.Connection) -> tuple[int, int]:
    # reset candidates — não toca na fila de imprensa nacional
    con.execute("UPDATE kb_clusters SET tsc_role='skip' WHERE kind='skip' AND tsc_role!='midia'")
    con.execute(
        "UPDATE kb_clusters SET tsc_role='candidate' WHERE kind!='skip' AND tsc_role NOT IN ('hub','midia')"
    )
    # keep must hubs
    con.execute("UPDATE kb_clusters SET tsc_role='hub' WHERE id LIKE 'must:%'")

    hubs = list(
        con.execute(
            """SELECT * FROM kb_clusters
               WHERE kind='evergreen' AND tsc_role IN ('hub','candidate')
               ORDER BY CASE WHEN tsc_role='hub' THEN 0 ELSE 1 END, impact_score DESC"""
        )
    )
    chosen_hubs = []
    seen_slug = set()
    for h in hubs:
        if h["slug"] in seen_slug:
            continue
        if NOISE_LABEL.search(h["label"] or ""):
            continue
        seen_slug.add(h["slug"])
        chosen_hubs.append(h)
        if len(chosen_hubs) >= 200:
            break
    hub_ids = [h["id"] for h in chosen_hubs]
    con.execute("UPDATE kb_clusters SET tsc_role='candidate' WHERE tsc_role='hub' AND id NOT LIKE 'must:%'")
    for hid in hub_ids:
        con.execute("UPDATE kb_clusters SET tsc_role='hub' WHERE id=?", (hid,))

    nodes = list(
        con.execute(
            """SELECT * FROM kb_clusters
               WHERE tsc_role NOT IN ('hub','midia') AND kind='historical'
               ORDER BY impact_score DESC"""
        )
    )
    n_ids = []
    for row in nodes:
        if row["slug"] in seen_slug:
            continue
        if NOISE_LABEL.search(row["label"] or ""):
            continue
        seen_slug.add(row["slug"])
        n_ids.append(row["id"])
        if len(n_ids) >= 800:
            break
    con.execute("UPDATE kb_clusters SET tsc_role='candidate' WHERE tsc_role='node'")
    for nid in n_ids:
        con.execute("UPDATE kb_clusters SET tsc_role='node' WHERE id=?", (nid,))

    hub_n = con.execute("SELECT COUNT(*) c FROM kb_clusters WHERE tsc_role='hub'").fetchone()["c"]
    if hub_n < 200:
        extra = list(
            con.execute(
                """SELECT id FROM kb_clusters
                   WHERE tsc_role='candidate' AND kind!='skip' AND id NOT LIKE 'midia:%'
                   ORDER BY impact_score DESC LIMIT ?""",
                (200 - hub_n,),
            )
        )
        for row in extra:
            con.execute("UPDATE kb_clusters SET tsc_role='hub' WHERE id=?", (row["id"],))
    node_n = con.execute("SELECT COUNT(*) c FROM kb_clusters WHERE tsc_role='node'").fetchone()["c"]
    if node_n < 800:
        extra = list(
            con.execute(
                """SELECT id FROM kb_clusters
                   WHERE tsc_role='candidate' AND kind!='skip' AND id NOT LIKE 'midia:%'
                   ORDER BY impact_score DESC LIMIT ?""",
                (800 - node_n,),
            )
        )
        for row in extra:
            con.execute("UPDATE kb_clusters SET tsc_role='node' WHERE id=?", (row["id"],))
    con.commit()
    hub_n = con.execute("SELECT COUNT(*) c FROM kb_clusters WHERE tsc_role='hub'").fetchone()["c"]
    node_n = con.execute("SELECT COUNT(*) c FROM kb_clusters WHERE tsc_role='node'").fetchone()["c"]
    return hub_n, node_n


def yaml_item(row, origin: str, extra: dict | None = None) -> str:
    d = extra or {}
    lines = (
        f"- id: {row['slug']}\n"
        f"  priority: {d.get('priority', 'P2')}\n"
        f"  action: criar\n"
        f"  origin: {origin}\n"
        f"  seo_timing: after\n"
        f"  topic: {json.dumps(row['label'], ensure_ascii=False)}\n"
        f"  keyword: {json.dumps(row['keyword'] or '', ensure_ascii=False)}\n"
        f"  type: {d.get('type', 'noticia' if row['kind']=='historical' else 'informe')}\n"
        f"  channel: blog\n"
        f"  author: Redação Tudo Sobre Cannabis\n"
        f"  pillar: {row['pillar']}\n"
        f"  kind: {row['kind']}\n"
        f"  role: {row['tsc_role']}\n"
        f"  cluster_id: {row['id']}\n"
        f"  impact_score: {round(row['impact_score'] or 0, 1)}\n"
        f"  guide_docs: {row['doc_count']}\n"
        f"  event_at: {row['latest_at'] or ''}\n"
        f"  datePublished: (dia real no ar)\n"
        f"  why: {d.get('why', 'radar-dump + score interno; SERP pago ainda não aplicado')}\n"
    )
    if d.get("cite"):
        lines += (
            f"  cite: true\n"
            f"  source_url: {json.dumps(d.get('source_url') or '', ensure_ascii=False)}\n"
            f"  source_outlet: {json.dumps(d.get('source_outlet') or '', ensure_ascii=False)}\n"
            f"  source_author: {json.dumps(d.get('source_author') or '', ensure_ascii=False)}\n"
        )
    return lines


def write_midia_queue(con: sqlite3.Connection) -> int:
    out = ROOT / "content" / "opportunities"
    items = list(
        con.execute(
            """SELECT c.*, d.source_url, d.author AS source_author, d.category_source AS source_outlet,
                      d.type_guess, d.published_at
               FROM kb_clusters c
               JOIN kb_documents d ON d.id = c.guide_doc_id
               WHERE c.tsc_role='midia'
               ORDER BY c.impact_score DESC"""
        )
    )
    yaml_blocks = []
    for row in items:
        typ = row["type_guess"] or "noticia"
        if typ not in ("noticia", "informe", "ciencia", "regulacao", "mercado"):
            typ = "noticia"
        yaml_blocks.append(
            yaml_item(
                row,
                "radar",
                {
                    "priority": "P2",
                    "type": typ,
                    "cite": True,
                    "source_url": row["source_url"],
                    "source_outlet": row["source_outlet"],
                    "source_author": row["source_author"],
                    "why": "imprensa nacional; citar a URL original; claim clínico/norma ainda vai à primária",
                },
            )
        )
    (out / "library-midia.yaml").write_text(
        "# 250 peças a partir de imprensa nacional — CITE a URL original.\n"
        "# C&S e Sechat continuam sem link no HTML público.\n"
        f"# gerado: {datetime.now().isoformat(timespec='seconds')}\n\n"
        + "\n".join(yaml_blocks),
        encoding="utf-8",
    )

    by_outlet: dict[str, int] = defaultdict(int)
    by_year: dict[str, int] = defaultdict(int)
    by_pillar: dict[str, int] = defaultdict(int)
    for row in items:
        by_outlet[row["source_outlet"] or "?"] += 1
        by_year[(row["latest_at"] or "?")[:4]] += 1
        by_pillar[row["pillar"] or "?"] += 1

    midia_all = list(
        con.execute(
            """SELECT category_source, published_at, pillar, skip_reason, kind
               FROM kb_documents WHERE source='midia'"""
        )
    )
    dump_outlet: dict[str, int] = defaultdict(int)
    dump_year: dict[str, int] = defaultdict(int)
    for d in midia_all:
        dump_outlet[d["category_source"] or "?"] += 1
        dump_year[(d["published_at"] or "?")[:4]] += 1

    lines = [
        "# Biblioteca TSC — imprensa nacional",
        "",
        f"Atualizado: {date.today().isoformat()}",
        "",
        "## Leitura do dump",
        "",
        "Arquivo: `midia_nacional_dump_20260820.tar.gz` (519 JSON: G1, Folha, Estadão, CNN, Poder360, Forbes, UOL, Metrópoles, USP, FAPESP, InfoMoney, Gazeta, Veja, Exame…).",
        "",
        f"- Ingeridos (após filtrar índice/tag/`tudo-sobre`): **{len(midia_all)}**",
        f"- Fila editorial: **{len(items)}** (`library-midia.yaml`)",
        "- Recorte: pico em 2025–2026; há cobertura desde ~2019. Páginas-hub e tags saíram.",
        "- Uso: cada peça TSC **linka a matéria original**. Não é republicação. Não é clipping de newsletter.",
        "- Claim terapêutico e norma: ainda DOI / DOU / Anvisa. Jornal é secundário.",
        "- C&S e Sechat: guia interno, sem URL no HTML.",
        "- Autor TSC: Redação Tudo Sobre Cannabis",
        "",
        "### Dump ingerido por veículo",
        "",
        "| Veículo | N |",
        "|---|---|",
    ]
    for k, v in sorted(dump_outlet.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines += ["", "### Dump ingerido por ano", "", "| Ano | N |", "|---|---|"]
    for k in sorted(dump_year):
        lines.append(f"| {k} | {dump_year[k]} |")
    lines += [
        "",
        "## Fila de 250",
        "",
        f"- Peças: **{len(items)}**",
        "- Critério: on-topic, não-índice, score (autoridade + recência + tamanho + pilar), teto de 20 por veículo.",
        "",
        "### Veículos na fila",
        "",
        "| Veículo | N |",
        "|---|---|",
    ]
    for k, v in sorted(by_outlet.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines += ["", "## Ano do fato (`event_at`)", "", "| Ano | N |", "|---|---|"]
    for k in sorted(by_year):
        lines.append(f"| {k} | {by_year[k]} |")
    lines += ["", "## Pilar", "", "| Pilar | N |", "|---|---|"]
    for k, v in sorted(by_pillar.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines += [
        "",
        "## Top 20 (score)",
        "",
        "| Score | Veículo | Tópico | event_at |",
        "|---|---|---|---|",
    ]
    for row in items[:20]:
        lines.append(
            f"| {row['impact_score']:.0f} | {row['source_outlet']} | {row['label'][:90]} | {row['latest_at'] or ''} |"
        )
    (out / "library-midia.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    lib = out / "library.md"
    if lib.exists():
        text = lib.read_text(encoding="utf-8")
        line = f"- Imprensa nacional: **{len(items)}** (`library-midia.yaml`) — **citar URL original**"
        if "library-midia.yaml" in text:
            text = re.sub(
                r"- Imprensa nacional:.*",
                line,
                text,
                count=1,
            )
        else:
            text = text.replace(
                "- Autor: Redação Tudo Sobre Cannabis",
                line + "\n- Autor: Redação Tudo Sobre Cannabis",
                1,
            )
        lib.write_text(text, encoding="utf-8")
    return len(items)


def write_queues(con: sqlite3.Connection) -> None:
    out = ROOT / "content" / "opportunities"
    hubs = list(con.execute("SELECT * FROM kb_clusters WHERE tsc_role='hub' ORDER BY impact_score DESC"))
    nodes = list(con.execute("SELECT * FROM kb_clusters WHERE tsc_role='node' ORDER BY impact_score DESC"))
    (out / "library-hubs.yaml").write_text(
        "# 200 hubs evergreen — gerado por kb/run.py. Não é publicado.\n"
        f"# gerado: {datetime.now().isoformat(timespec='seconds')}\n\n"
        + "\n".join(yaml_item(h, "radar", {"priority": "P1", "type": "informe"}) for h in hubs),
        encoding="utf-8",
    )
    (out / "library-nodes.yaml").write_text(
        "# 800 nós históricos — event_at do fato; datePublished = dia real.\n"
        f"# gerado: {datetime.now().isoformat(timespec='seconds')}\n\n"
        + "\n".join(yaml_item(n, "radar") for n in nodes),
        encoding="utf-8",
    )
    midia_n = write_midia_queue(con)
    # human queue snippet
    lines = [
        "# Biblioteca TSC (fila gerada da KB)",
        "",
        f"Atualizado: {date.today().isoformat()}",
        "",
        f"- Hubs evergreen: **{len(hubs)}** (`library-hubs.yaml`)",
        f"- Nós históricos: **{len(nodes)}** (`library-nodes.yaml`)",
        f"- Imprensa nacional: **{midia_n}** (`library-midia.yaml`) — **citar URL original**",
        "- Autor: Redação Tudo Sobre Cannabis",
        "- origin: radar (C&S/Sechat = guia; mídia nacional = fonte jornalística secundária)",
        "",
        "## Top 15 hubs",
        "",
        "| Score | Pilar | Keyword | Tópico |",
        "|---|---|---|---|",
    ]
    for h in hubs[:15]:
        lines.append(
            f"| {h['impact_score']:.0f} | {h['pillar']} | {h['keyword']} | {h['label'][:80]} |"
        )
    lines += ["", "## Top 15 nós históricos", "", "| Score | Pilar | Tópico | event_at |", "|---|---|---|---|"]
    for n in nodes[:15]:
        lines.append(
            f"| {n['impact_score']:.0f} | {n['pillar']} | {n['label'][:80]} | {n['latest_at'] or ''} |"
        )
    (out / "library.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def guide_checklist(con: sqlite3.Connection, cluster_id: str) -> list[str]:
    docs = list(
        con.execute(
            "SELECT title, excerpt, entities_json, source FROM kb_documents WHERE cluster_id=? LIMIT 5",
            (cluster_id,),
        )
    )
    points = []
    ents = []
    for d in docs:
        points.append(d["title"])
        try:
            ents.extend(json.loads(d["entities_json"] or "[]"))
        except json.JSONDecodeError:
            pass
    uniq_ents = []
    seen = set()
    for e in ents:
        if e not in seen:
            seen.add(e)
            uniq_ents.append(e)
    bullets = [f"Concorrentes cobriram ângulos próximos a: {t}" for t in points[:4]]
    if uniq_ents:
        bullets.append("Entidades a conferir na fonte primária: " + ", ".join(uniq_ents[:12]))
    bullets.append("Não copiar prosa. Verificar DOI/DOU. Release não é matéria.")
    return bullets


def write_pilot(con: sqlite3.Connection) -> list[dict]:
    hubs = list(
        con.execute(
            "SELECT * FROM kb_clusters WHERE tsc_role='hub' ORDER BY impact_score DESC LIMIT 10"
        )
    )
    nodes = list(
        con.execute(
            "SELECT * FROM kb_clusters WHERE tsc_role='node' ORDER BY impact_score DESC LIMIT 10"
        )
    )
    items = [("hub", h) for h in hubs] + [("node", n) for n in nodes]
    out_dir = ROOT / "content" / "opportunities"
    blocks = ["# Piloto 20 — esteira reprodutiva (DeepSeek → demais agentes → gate)\n"]
    meta = []
    runs = ROOT / "content" / "runs"
    runs.mkdir(parents=True, exist_ok=True)
    for role, row in items:
        slug = row["slug"]
        typ = "informe" if role == "hub" else "noticia"
        origin = "radar"
        checklist = guide_checklist(con, row["id"]) if not str(row["id"]).startswith("must:") else [
            "Hub canônico TSC. Usar allowlist. Sem prosa de concorrente."
        ]
        brief = f"""---
action: criar
origin: {origin}
seo_timing: after
takeaway: "{row['label']}"
type: {typ}
channel: blog
author: Redação Tudo Sobre Cannabis
audience: geral
objective: {"explicar" if role == "hub" else "informar"}
evidence_level: moderado
opinion_level: baixo
keyword: {json.dumps(row["keyword"] or "", ensure_ascii=False)}
keyword_status: candidate
intent: {"informacional" if role == "hub" else "noticia"}
slug: {slug}
cannibal: none
seo: full
event_at: {row["latest_at"] or ""}
datePublished: (dia real no ar)
---

# Brief (piloto KB)

Por que agora: cobertura concorrente mapeada na KB (`cluster_id: {row["id"]}`); peça original TSC.

## Guia (não é fonte)

{chr(10).join("- " + c for c in checklist)}

## O que este registro não deve fazer

- Copiar C&S ou Sechat
- Aplicar fórmula de opinião
- Antedatar datePublished
- Prescrever

## Perguntas para o pesquisador

- Quais queries este texto já responde?
- Fonte primária (DOI / DOU / Anvisa) para cada claim
"""
        dest = runs / slug
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "00-brief.md").write_text(brief, encoding="utf-8")
        (dest / "guide.md").write_text("# Guia de cobertura\n\n" + "\n".join(f"- {c}" for c in checklist) + "\n", encoding="utf-8")
        blocks.append(
            f"- [{role}] `{slug}` — {row['label']} ({row['pillar']}, score {row['impact_score']:.0f})"
        )
        meta.append({"slug": slug, "role": role, "type": typ, "topic": row["label"], "keyword": row["keyword"]})
    (out_dir / "pilot-20.md").write_text("\n".join(blocks) + "\n", encoding="utf-8")
    (DATA / "pilot-20.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


def stats(con: sqlite3.Connection) -> None:
    n = con.execute("SELECT COUNT(*) c FROM kb_documents").fetchone()["c"]
    t = con.execute("SELECT COUNT(*) c FROM kb_documents WHERE truncated=1").fetchone()["c"]
    print(f"documentos: {n}  truncated: {t}  db: {DB}")
    for row in con.execute("SELECT source, COUNT(*) c FROM kb_documents GROUP BY source ORDER BY c DESC"):
        print(f"  source {row['source']}: {row['c']}")
    for row in con.execute("SELECT kind, COUNT(*) c FROM kb_documents GROUP BY kind ORDER BY c DESC"):
        print(f"  kind {row['kind']}: {row['c']}")
    for row in con.execute("SELECT tsc_role, COUNT(*) c FROM kb_clusters GROUP BY tsc_role"):
        print(f"  cluster {row['tsc_role']}: {row['c']}")


def queries_seed() -> list[str]:
    q = [
        "cannabis medicinal como começar",
        "autorização anvisa cannabis",
        "receita cannabis medicinal",
        "rdc 327",
        "rdc 1015 cannabis",
        "o que é cbd",
        "o que é thc",
        "cbd ansiedade",
        "cannabis medicinal epilepsia",
        "cannabis medicinal autismo",
        "stj habeas corpus cannabis",
        "associação canábica",
        "importação cannabis medicinal",
        "cannabis medicinal sus",
        "interação cbd medicamentos",
        "cbd full spectrum ou isolado",
        "sistema endocanabinoide",
        "cannabis medicinal dor crônica",
        "anvisa cannabis medicinal",
        "quem pode prescrever cannabis",
    ]
    for _slug, label, _pat in CONDITIONS:
        q.append(f"cannabis medicinal {label.split('/')[0].strip()}")
        q.append(f"cbd {label.split('/')[0].strip()}")
    return list(dict.fromkeys(q))


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    con = connect()
    if cmd == "ingest-midia":
        docs_n, fila_n = ingest_midia(con)
        write_midia_queue(con)
        print(f"ingest-midia ok: {docs_n} docs, {fila_n} na fila (cite URL)")
        stats(con)
        return
    if cmd in ("ingest", "build"):
        n = ingest(con)
        print(f"ingest ok: {n}")
    if cmd in ("reclassify", "score", "build"):
        if cmd in ("reclassify", "score"):
            n = 0
            for d in con.execute(
                "SELECT id, title, excerpt, source_url, source, type_source FROM kb_documents"
            ):
                cls = classify(d["title"], d["excerpt"] or "", d["source_url"], d["source"], d["type_source"] or "")
                cid = cluster_id_for(cls, d["title"])
                con.execute(
                    """UPDATE kb_documents SET pillar=?, type_guess=?, kind=?, cluster_id=?,
                       entities_json=?, skip_reason=?, title=? WHERE id=?""",
                    (
                        cls["pillar"],
                        cls["type_guess"],
                        cls["kind"],
                        cid,
                        json.dumps(cls["entities"], ensure_ascii=False),
                        cls["skip_reason"],
                        htmlmod.unescape(d["title"] or ""),
                        d["id"],
                    ),
                )
                n += 1
            con.commit()
            print(f"reclassify ok: {n}")
    if cmd in ("score", "build"):
        c = rebuild_clusters(con)
        h, nd = assign_library(con)
        print(f"clusters: {c}  hubs: {h}  nodes: {nd}")
    if cmd in ("queue", "build", "library"):
        if cmd == "library":
            h, nd = assign_library(con)
            print(f"hubs: {h}  nodes: {nd}")
        write_queues(con)
        print("wrote content/opportunities/library-*.yaml")
    if cmd in ("pilot", "build", "library"):
        meta = write_pilot(con)
        print(f"piloto {len(meta)} briefs em content/runs/<slug>/")
    if cmd == "queries":
        print("\n".join(queries_seed()))
        return
    stats(con)
    (DATA / "queries.txt").write_text("\n".join(queries_seed()) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
