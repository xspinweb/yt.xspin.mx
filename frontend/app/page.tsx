"use client";

import { useMemo, useState } from "react";
import { AuthCard } from "./components/AuthCard";

const steps = [
  {
    icon: "youtube-purple",
    title: "1. Conecta tu canal",
    text: "Agrega la URL de tu canal de YouTube y sincronizamos tus videos automaticamente."
  },
  {
    icon: "search",
    title: "2. Escaneamos tu contenido",
    text: "Detectamos tus videos mas recientes y los anadimos al sistema de descubrimiento."
  },
  {
    icon: "playbox",
    title: "3. Aparece en el feed",
    text: "Tus videos se muestran a otros creadores dentro de la plataforma de forma inteligente."
  },
  {
    icon: "trend",
    title: "4. Gana exposicion",
    text: "Participa en la comunidad y aumenta la visibilidad de tus propios videos."
  }
];

const stepIcons: Record<string, string> = {
  search: "Q",
  playbox: "▣",
  trend: "↗"
};

const feedByCategory = {
  Todos: [
    ["Setup Gamer 2024", "@TechGamer", "2.3K", "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80"],
    ["Mi primer Podcast", "@HablandoIdeas", "1.6K", "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80"],
    ["Viaje a Tailandia", "@MundoViajero", "2.8K", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
    ["Fotografia Urbana", "@EnfoqueCreativo", "1.2K", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80"]
  ],
  Gaming: [
    ["Setup RGB nocturno", "@PixelMaster", "3.1K", "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80"],
    ["Ranked sin tilt", "@ArenaPlay", "1.9K", "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80"],
    ["Indie de la semana", "@CheckpointMini", "980", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80"],
    ["Stream highlights", "@ComboFinal", "2.4K", "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"]
  ],
  Tecnologia: [
    ["Mi escritorio productivo", "@TecnoLab", "2.7K", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"],
    ["Apps para creadores", "@StackCreativo", "1.4K", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"],
    ["Unboxing minimal", "@GadgetFlow", "2.1K", "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80"],
    ["IA para editar shorts", "@CreatorTools", "4.8K", "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80"]
  ],
  Musica: [
    ["Beat en 10 minutos", "@LoopRoom", "3.6K", "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80"],
    ["Voz casera limpia", "@VocalStudio", "1.8K", "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80"],
    ["Guitarra lo-fi", "@CuerdaNube", "1.1K", "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80"],
    ["Mi primer single", "@NuevoSonido", "2.2K", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80"]
  ],
  Educacion: [
    ["Aprende mejor con mapas", "@AulaClara", "2.9K", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80"],
    ["Fisica sin miedo", "@ProfeFlash", "1.5K", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80"],
    ["Notas que si sirven", "@StudyFlow", "2.4K", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80"],
    ["Historia en corto", "@MinutoHistoria", "1.7K", "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"]
  ],
  Vlogs: [
    ["Un dia creando", "@DiarioCreator", "2.0K", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
    ["Cafe y edicion", "@RutinaVisual", "1.3K", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"],
    ["Ciudad de noche", "@VlogUrbano", "2.6K", "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"],
    ["Primer viaje solo", "@BitacoraMini", "3.4K", "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80"]
  ],
  Podcast: [
    ["Mesa de creadores", "@HablandoIdeas", "1.6K", "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80"],
    ["Microfono abierto", "@VocesNuevas", "2.3K", "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80"],
    ["Charlas de negocio", "@CreatorTalks", "1.2K", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"],
    ["Historias reales", "@AudioDiario", "980", "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=900&q=80"]
  ]
} as const;

const tabs = Object.keys(feedByCategory) as Array<keyof typeof feedByCategory>;

const faqs = [
  {
    question: "Como funciona YT Xspin?",
    answer: "YT Xspin conecta creadores reales en una red interna de descubrimiento. Cuando ves correctamente contenido de otro creador, el sistema genera una exposicion pendiente para uno de tus propios videos."
  },
  {
    question: "Que pasa cuando veo un video?",
    answer: "Si la vista es valida, se crea una tarea de exposicion para ti. Luego YT Xspin selecciona uno de tus videos activos y lo muestra a otro usuario dentro del feed."
  },
  {
    question: "Como funcionan las suscripciones?",
    answer: "Si te suscribes correctamente al canal de otro creador, se genera una suscripcion pendiente a favor de tu canal. Tu canal se muestra a otros usuarios hasta que alguien complete esa accion."
  },
  {
    question: "Puedo ver mis propios videos para ganar exposicion?",
    answer: "No. El sistema no permite generar recompensas viendo contenido propio ni suscribiendote a tu propio canal. Las acciones deben ocurrir entre usuarios distintos."
  },
  {
    question: "Como evita YT Xspin repeticiones o abuso?",
    answer: "El feed evita mostrar contenido propio, repetir el mismo video o canal al mismo usuario en ventanas cortas y asignar demasiadas tareas a una sola persona."
  },
  {
    question: "Que pasa si alguien no completa una accion?",
    answer: "Cuando una tarea se asigna y el usuario no la completa a tiempo, la tarea expira y vuelve a estar pendiente para que pueda asignarse a otro usuario."
  }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<(typeof tabs)[number]>("Todos");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const feedVideos = useMemo(() => {
    const videos = feedByCategory[activeCategory];
    return videos.map((_, index) => videos[(carouselIndex + index) % videos.length]);
  }, [activeCategory, carouselIndex]);

  function selectCategory(tab: (typeof tabs)[number]) {
    setActiveCategory(tab);
    setCarouselIndex(0);
  }

  function showNextVideos() {
    setCarouselIndex((current) => (current + 1) % feedByCategory[activeCategory].length);
  }

  function openAuth(mode: "login" | "register") {
    setIsMenuOpen(false);
    setAuthMode(mode);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <main>
      <header className={isMenuOpen ? "site-header menu-open" : "site-header"}>
        <a className="logo" href="#inicio" aria-label="YT Xspin inicio">
          <img src="/logos/xspin-mark.svg" alt="" />
          <span>SPIN</span>
        </a>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className="main-nav" aria-label="Navegacion principal">
          <a className="active" href="#inicio" onClick={closeMenu}>Inicio</a>
          <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
          <a href="#beneficios" onClick={closeMenu}>Beneficios</a>
          <a href="#funciones" onClick={closeMenu}>Funciones</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a href="#precios" onClick={closeMenu}>Precios</a>
        </nav>
        <div className="header-actions">
          <button className="header-login" type="button" onClick={() => openAuth("login")}>Iniciar sesion</button>
          <button className="button button-solid" type="button" onClick={() => openAuth("register")}>Comenzar gratis</button>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="pill">Plataforma de descubrimiento para creadores</span>
          <h1>Haz que tus videos sean <em>descubiertos.</em></h1>
          <p>
            YT Xspin muestra tu contenido a una comunidad real de creadores. Conecta tu canal, participa y obten mas exposicion para tus videos.
          </p>
          <div className="hero-buttons">
            <button className="button button-solid" type="button" onClick={() => openAuth("register")}>
              Conectar mi canal <img className="youtube-icon" src="/logos/youtube.svg" alt="" />
            </button>
            <a className="button button-ghost" href="#como-funciona">
              <span className="circle-play">▶</span> Como funciona
            </a>
          </div>
          <div className="hero-stats" aria-label="Metricas de plataforma">
            <div>
              <strong>+12K</strong>
              <span>Creadores activos</span>
            </div>
            <div>
              <strong>+2.5M</strong>
              <span>Visualizaciones internas</span>
            </div>
            <div>
              <strong>+98%</strong>
              <span>Crecimiento de exposicion</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Vista previa del feed movil">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />

          <article className="tilt-card tilt-left">
            <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80" alt="" />
            <div>
              <strong>Aventura sin limites</strong>
              <span>@viajandoconmigo</span>
            </div>
          </article>
          <article className="tilt-card tilt-right">
            <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80" alt="" />
            <div>
              <strong>Receta facil y rapida</strong>
              <span>@cocinayhogar</span>
            </div>
          </article>

          <article className="phone">
            <div className="phone-notch" />
            <div className="phone-screen">
              <img src="https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80" alt="" />
              <div className="phone-top">
                <strong>Para ti</strong>
                <span>120</span>
              </div>
              <div className="phone-actions">
                <span>♥<small>2.3K</small></span>
                <span>▣<small>156</small></span>
                <span>↗<small>312</small></span>
              </div>
              <div className="phone-caption">
                <strong>@PixelMaster</strong>
                <p>Mi nueva configuracion gamer</p>
                <span>#setup #gaming</span>
              </div>
              <div className="phone-tabs">
                <span>⌂<small>Inicio</small></span>
                <span>Q<small>Descubrir</small></span>
                <span className="bolt">X</span>
                <span>◎<small>Senales</small></span>
                <span>♟<small>Perfil</small></span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {authMode && (
        <div className="auth-overlay-panel" role="dialog" aria-modal="true">
          <div className="hero-auth-panel">
            <button className="auth-close" type="button" aria-label="Cerrar" onClick={() => setAuthMode(null)}>×</button>
            <AuthCard initialMode={authMode} compact autoRedirect={false} />
          </div>
        </div>
      )}

      <section className="how" id="como-funciona">
        <div className="section-heading">
          <h2>Como funciona</h2>
          <p>4 pasos sencillos para aumentar tu visibilidad</p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <div className="step-icon">
                {step.icon === "youtube-purple" ? (
                  <img src="/logos/youtube-purple.svg" alt="" />
                ) : (
                  stepIcons[step.icon]
                )}
              </div>
              {index < steps.length - 1 && <span className="step-line" />}
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="discover" id="beneficios">
        <div className="discover-copy">
          <span className="pill">Feed de descubrimiento</span>
          <h2>Descubre. Mira. <em>Crece.</em></h2>
          <p>Un feed infinito de contenido de creadores como tu. Cada vista te acerca a mas exposicion para tu canal.</p>
          <ul>
            <li>Videos de todos los nichos</li>
            <li>Sistema justo y transparente</li>
            <li>Sin bots, solo creadores reales</li>
            <li>Algoritmo basado en senales reales</li>
          </ul>
          <a className="button button-ghost" href="#demo">
            <span className="circle-play">▶</span> Ver demostracion
          </a>
        </div>

        <div className="feed-area" id="funciones">
          <div className="tabs" aria-label="Categorias">
            {tabs.map((tab) => (
              <button
                className={tab === activeCategory ? "selected" : ""}
                key={tab}
                type="button"
                onClick={() => selectCategory(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="feed-cards" aria-live="polite">
            {feedVideos.map(([title, author, views, image]) => (
              <article className="feed-card" key={`${activeCategory}-${title}`}>
                <img src={image} alt="" />
                <span className="views">▶ {views}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{author}</p>
                </div>
              </article>
            ))}
            <button className="next-card" type="button" aria-label="Siguiente" onClick={showNextVideos}>›</button>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading">
          <span className="pill">FAQ</span>
          <h2>Preguntas frecuentes</h2>
          <p>Lo esencial para entender como YT Xspin impulsa descubrimiento real.</p>
        </div>
        <div className="faq-list">
          {faqs.map((item, index) => (
            <article className={`faq-item ${openFaq === index ? "open" : ""}`} key={item.question}>
              <button
                type="button"
                aria-expanded={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <span>{item.question}</span>
                <strong>{openFaq === index ? "-" : "+"}</strong>
              </button>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" id="conectar">
        <div className="rocket">↗</div>
        <div>
          <h2>Unete a miles de creadores que ya estan creciendo en YT Xspin</h2>
          <p>Conecta tu canal ahora y comienza a obtener mas visibilidad.</p>
        </div>
        <button className="button button-solid" type="button" onClick={() => openAuth("register")}>
          Conectar mi canal <img className="youtube-icon" src="/logos/youtube.svg" alt="" />
        </button>
      </section>
    </main>
  );
}
