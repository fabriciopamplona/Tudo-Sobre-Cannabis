import { ABOUT_BLOG, EDITOR, LINKS } from "@/lib/authors";

export function AboutBlogCopy() {
  return (
    <>
      {ABOUT_BLOG.leadBeforeHandle}
      <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
        {EDITOR.handle}
      </a>
      {ABOUT_BLOG.leadAfterHandle}
      <a href={LINKS.substack} target="_blank" rel="noopener noreferrer">
        {ABOUT_BLOG.newsletterAnchor}
      </a>
      {ABOUT_BLOG.leadAfterNewsletter}
    </>
  );
}

/** Fecho padrão do post: Sobre o blog + nota informativa. */
export function AuthorExpediente() {
  return (
    <aside className="author-expediente" aria-label="Sobre o blog">
      <div className="author-expediente-block">
        <h2 className="author-expediente-kicker">Sobre o blog</h2>
        <p className="author-expediente-bio">
          <AboutBlogCopy />
        </p>
        <hr className="author-expediente-rule" />
        <p className="author-expediente-note">{ABOUT_BLOG.note}</p>
      </div>
    </aside>
  );
}
