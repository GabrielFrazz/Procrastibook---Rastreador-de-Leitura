import Link from "next/link";

import { BrandLockup } from "@/components/ui";
import { getButtonClassName } from "@/components/ui/button";

const chapters = [
  {
    number: "01",
    title: "Monte uma biblioteca com contexto",
    description:
      "Reúna livros, e-books e artigos com capas, autores e status que ajudam você a decidir o que vem depois.",
  },
  {
    number: "02",
    title: "Retome sem perder o fio",
    description:
      "Registre progresso e sessões para voltar à leitura sabendo exatamente onde parou e como avançou.",
  },
  {
    number: "03",
    title: "Enxergue seu ritmo sem cobrança",
    description:
      "Acompanhe metas e estatísticas como um convite à constância, nunca como mais uma obrigação.",
  },
];

export default function Home() {
  return (
    <div className="landing-page">
      <a className="landing-page__skip-link" href="#landing-main">
        Ir para o conteúdo
      </a>

      <header className="landing-page__header">
        <Link
          aria-label="Procrastibook — página inicial"
          className="landing-page__brand"
          href="/"
        >
          <BrandLockup size="md" />
        </Link>

        <nav aria-label="Navegação principal" className="landing-page__nav">
          <a className="landing-page__nav-link" href="#como-funciona">
            Como funciona
          </a>
          <Link className={getButtonClassName("ghost", "md")} href="/login">
            Entrar
          </Link>
        </nav>
      </header>

      <main className="landing-page__main" id="landing-main" tabIndex={-1}>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-page__eyebrow">Sua estante, no seu ritmo</p>
            <h1 id="landing-title">
              Um lugar tranquilo para acompanhar cada página.
            </h1>
            <p className="landing-hero__description">
              Organize o que quer ler, retome de onde parou e guarde a história
              do seu ritmo — sem transformar a leitura em obrigação.
            </p>

            <div className="landing-hero__actions">
              <Link
                className={getButtonClassName("primary", "lg")}
                href="/signup"
              >
                Criar minha biblioteca
              </Link>
              <Link
                className={getButtonClassName("secondary", "lg")}
                href="/login"
              >
                Já tenho uma conta
              </Link>
            </div>

            <p className="landing-hero__note">
              <span aria-hidden="true">✦</span>
              Feito para livros, e-books e artigos.
            </p>
          </div>

          <div aria-hidden="true" className="landing-visual">
            <div className="landing-visual__field" />
            <div className="landing-visual__page">
              <span className="landing-visual__chapter">Capítulo atual</span>
              <div className="landing-visual__reading">
                <div className="landing-visual__cover">
                  <span className="landing-visual__cover-spine" />
                  <strong>O</strong>
                  <small>design do dia a dia</small>
                </div>
                <div className="landing-visual__progress-copy">
                  <span>Em leitura</span>
                  <strong>184 de 320 páginas</strong>
                  <div className="landing-visual__progress-track">
                    <span />
                  </div>
                  <small>Um pouco por vez também conta.</small>
                </div>
              </div>
              <div className="landing-visual__rule" />
              <div className="landing-visual__rhythm">
                <span>Ritmo deste mês</span>
                <strong>12 sessões</strong>
              </div>
            </div>

            <div className="landing-visual__bookmark">
              <span>Próxima página</span>
              <strong>185</strong>
            </div>

            <div className="landing-visual__shelf">
              <span className="landing-visual__book landing-visual__book--one" />
              <span className="landing-visual__book landing-visual__book--two" />
              <span className="landing-visual__book landing-visual__book--three" />
              <span className="landing-visual__book landing-visual__book--four" />
              <span className="landing-visual__book landing-visual__book--five" />
            </div>
          </div>
        </section>

        <section
          className="landing-chapters"
          id="como-funciona"
          aria-labelledby="chapters-title"
        >
          <div className="landing-chapters__intro">
            <p className="landing-page__eyebrow">Tudo no lugar</p>
            <h2 id="chapters-title">Da vontade de ler à última página.</h2>
            <p>
              O Procrastibook organiza o caminho sem ocupar o lugar da leitura.
            </p>
          </div>

          <ol className="landing-chapters__list">
            {chapters.map((chapter) => (
              <li key={chapter.number}>
                <span className="landing-chapters__number">
                  {chapter.number}
                </span>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-closing" aria-labelledby="closing-title">
          <div>
            <p className="landing-page__eyebrow">A próxima da estante</p>
            <h2 id="closing-title">
              Sua próxima leitura merece um lugar só dela.
            </h2>
          </div>
          <div className="landing-closing__action">
            <p>Comece com a obra que já está esperando por você.</p>
            <Link
              className={getButtonClassName("primary", "lg")}
              href="/signup"
            >
              Começar agora
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-page__footer">
        <BrandLockup size="sm" />
        <p>Feito para quem sempre tem uma próxima leitura.</p>
      </footer>
    </div>
  );
}
