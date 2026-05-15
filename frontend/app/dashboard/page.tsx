"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  hasConnectedChannel: boolean;
  currentChannel: {
    title: string;
    handle: string | null;
    channelUrl: string | null;
    thumbnailUrl: string | null;
    subscriberCount: string | null;
    videoCount: string | null;
    viewCount: string | null;
    publishedAt: string | null;
    niche: string | null;
  } | null;
};

const videoCards = [
  {
    title: "5 Claves para crecer en YouTube",
    views: "1.2K",
    comments: "128",
    duration: "8:45",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=760&q=80"
  },
  {
    title: "Mi setup para crear contenido",
    views: "982",
    comments: "96",
    duration: "12:31",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=760&q=80"
  },
  {
    title: "Como edito mis videos",
    views: "1.4K",
    comments: "156",
    duration: "7:03",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=760&q=80"
  },
  {
    title: "Errores que frenan tu canal",
    views: "756",
    comments: "74",
    duration: "9:16",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=760&q=80"
  },
  {
    title: "Mi iluminacion economica",
    views: "1.1K",
    comments: "103",
    duration: "6:22",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=760&q=80"
  }
];

const recentActivity = [
  { icon: "eye", title: "Tu video fue visto completamente", time: "Hace 2 min", result: "+1 vista", tone: "purple" },
  { icon: "userPlus", title: "Nuevo suscriptor obtenido", time: "Hace 10 min", result: "+1 suscripcion", tone: "pink" },
  { icon: "eye", title: "Tu video fue visto 60%", time: "Hace 15 min", result: "+1 vista", tone: "purple" },
  { icon: "userPlus", title: "Nuevo suscriptor obtenido", time: "Hace 28 min", result: "+1 suscripcion", tone: "pink" },
  { icon: "eye", title: "Tu video fue visto completamente", time: "Hace 35 min", result: "+1 vista", tone: "purple" }
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("ytx_access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        return response.json();
      })
      .then((data) => {
        if (!data.user.hasConnectedChannel) {
          router.replace("/connect-channel");
          return;
        }

        setUser(data.user);
      })
      .catch(() => {
        window.localStorage.removeItem("ytx_access_token");
        router.replace("/login");
      });
  }, [router]);

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    window.localStorage.removeItem("ytx_access_token");
    router.replace("/login");
  }

  if (!user) {
    return <main className="app-loading">Cargando dashboard...</main>;
  }

  const channel = user.currentChannel;
  const channelTitle = channel?.title ?? user.name;
  const subscribers = formatCompact(channel?.subscriberCount, "12.4K");
  const metricCards = [
    { label: "Visualizaciones del canal", value: formatStat(channel?.viewCount, "Pendiente"), trend: "+23%", icon: "eye" },
    { label: "Suscriptores del canal", value: formatStat(channel?.subscriberCount, "Pendiente"), trend: "+18%", icon: "user" },
    { label: "Videos publicados", value: formatStat(channel?.videoCount, "Pendiente"), trend: "+15%", icon: "play" },
    { label: "Exposiciones generadas", value: "568", trend: "+10%", icon: "users" }
  ];

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="Dashboard" onLogout={logout} />

      <section className="dashboard-workspace">
        <header className="dashboard-hero-bar">
          <div>
            <h1>Hola, Creador!</h1>
            <p>Aqui tienes un resumen de tu actividad en YT XSpin.</p>
          </div>

          <div className="dashboard-actions">
            <button className="icon-only" aria-label="Notificaciones" type="button">
              <Icon name="bell" />
            </button>
            <div className="profile-chip">
              <ChannelAvatar channel={channel} fallback={user.name} />
              <strong>{channelTitle}</strong>
              <Icon name="chevronDown" />
            </div>
            <button className="secondary-action" type="button">
              Subir video
              <Icon name="upload" />
            </button>
            <a className="primary-action" href="/connect-channel">
              Conectar canal
              <img src="/logos/youtube.svg" alt="" />
            </a>
          </div>
        </header>

        <section className="dashboard-stat-grid">
          {metricCards.map((metric) => (
            <article className="dashboard-stat-card" key={metric.label}>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.trend}</small>
                <em>vs. semana pasada</em>
              </div>
              <i>
                <Icon name={metric.icon} />
              </i>
            </article>
          ))}
        </section>

        <section className="dashboard-card video-strip">
          <div className="section-title-row">
            <h2>Tus videos</h2>
            <a href="#">Ver todos</a>
          </div>
          <div className="video-row">
            {videoCards.map((video) => (
              <article className="dashboard-video-card" key={video.title}>
                <div className="video-thumb">
                  <img src={video.image} alt="" />
                  <span>{video.duration}</span>
                </div>
                <h3>{video.title}</h3>
                <p>
                  <Icon name="playOutline" />
                  {video.views}
                  <Icon name="message" />
                  {video.comments}
                </p>
              </article>
            ))}
            <button className="next-video" aria-label="Siguiente video" type="button">
              <Icon name="chevronRight" />
            </button>
          </div>
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-card recent-card">
            <h2>Actividad reciente</h2>
            <div className="recent-list">
              {recentActivity.map((item) => (
                <div className="recent-item" key={`${item.title}-${item.time}`}>
                  <span className={item.tone}>
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.time}</small>
                  </div>
                  <em>{item.result}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card progress-card">
            <h2>Tu progreso esta semana</h2>
            <div className="progress-ring">
              <strong>78%</strong>
              <span>Completado</span>
            </div>
            <p>Vas muy bien! Sigue participando para obtener mas exposicion.</p>
            <a href="#">Ver estadisticas completas</a>
          </article>

          <article className="dashboard-card channel-card">
            <h2>Tu canal</h2>
            <ChannelAvatar channel={channel} fallback={user.name} large />
            <strong>
              {channelTitle}
              <span>
                <Icon name="check" />
              </span>
            </strong>
            <p>{subscribers} suscriptores</p>
            <div className="level-block">
              <span>Nivel actual</span>
              <div>
                <strong>Creador en crecimiento</strong>
                <em>NIVEL 3</em>
              </div>
              <progress value={2450} max={5000} />
              <small>2,450 / 5,000 XP</small>
            </div>
            <a href="#">
              <Icon name="gift" />
              Ver beneficios
            </a>
          </article>
        </section>
      </section>
    </main>
  );
}

function ChannelAvatar({
  channel,
  fallback,
  large = false
}: {
  channel: CurrentUser["currentChannel"];
  fallback: string;
  large?: boolean;
}) {
  return (
    <div className={large ? "dashboard-avatar large" : "dashboard-avatar"}>
      {channel?.thumbnailUrl ? <img src={channel.thumbnailUrl} alt="" /> : <span>{(channel?.title ?? fallback).slice(0, 2)}</span>}
    </div>
  );
}

function formatStat(value?: string | null, fallback = "0") {
  if (!value) {
    return fallback;
  }

  return Number(value).toLocaleString("es-MX");
}

function formatCompact(value?: string | null, fallback = "0") {
  if (!value) {
    return fallback;
  }

  return Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value));
}

function DashboardSidebar({ active, onLogout }: { active: string; onLogout: () => void }) {
  const links = [
    { label: "Dashboard", icon: "home" },
    { label: "Descubrir", icon: "search" },
    { label: "Mis videos", icon: "video" },
    { label: "Feed", icon: "feed" },
    { label: "Estadisticas", icon: "bars" },
    { label: "Suscripciones", icon: "users" },
    { label: "Ajustes", icon: "settings" }
  ];

  return (
    <aside className="dashboard-sidebar">
      <a className="dashboard-brand" href="/">
        <img src="/logos/xspin-logo.svg" alt="YT XSpin" />
      </a>

      <nav>
        {links.map((link) => (
          <a className={active === link.label ? "active" : ""} href="#" key={link.label}>
            <Icon name={link.icon} />
            {link.label}
          </a>
        ))}
      </nav>

      <div className="invite-panel">
        <strong>Descubre. Mira. Crece.</strong>
        <p>Conecta, participa y gana exposicion real.</p>
        <button type="button">
          <Icon name="userPlus" />
          Invitar amigos
        </button>
      </div>

      <button className="logout-link" type="button" onClick={onLogout}>
        Cerrar sesion
      </button>
    </aside>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    bars: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    feed: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M12 8v13" />
        <path d="M3 12h18" />
        <path d="M7.5 8A2.5 2.5 0 1 1 12 6.5V8" />
        <path d="M16.5 8A2.5 2.5 0 1 0 12 6.5V8" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </>
    ),
    play: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="3" />
        <path d="m11 9 5 3-5 3Z" />
      </>
    ),
    playOutline: <path d="m7 4 13 8-13 8Z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    upload: (
      <>
        <path d="M12 3v12" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 15v4h14v-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    userPlus: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21a6 6 0 0 1 12 0" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </>
    ),
    users: (
      <>
        <path d="M16 21a5 5 0 0 0-10 0" />
        <circle cx="11" cy="8" r="4" />
        <path d="M22 21a4 4 0 0 0-4-4" />
        <path d="M16 4a4 4 0 0 1 0 8" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="15" height="12" rx="2" />
        <path d="m18 10 4-2v8l-4-2" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {paths[name] ?? paths.home}
    </svg>
  );
}
