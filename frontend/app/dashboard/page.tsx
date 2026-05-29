"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const ADSTERRA_NATIVE_SCRIPT = "https://pl29570165.effectivecpmnetwork.com/4a5fc4d2e25c6aa8db9476184ab4c42b/invoke.js";
const ADSTERRA_NATIVE_CONTAINER_ID = "container-4a5fc4d2e25c6aa8db9476184ab4c42b";

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

type ChannelVideo = {
  id: string;
  youtubeVideoId: string | null;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  viewCount: string | null;
  publishedAt: string | null;
  url: string | null;
};

type ChannelVideosResponse = {
  data?: {
    videos?: ChannelVideo[];
    shorts?: ChannelVideo[];
  };
};

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
  const [channelVideos, setChannelVideos] = useState<{ videos: ChannelVideo[]; shorts: ChannelVideo[] }>({
    videos: [],
    shorts: []
  });
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        fetch(`${API_URL}/channels/me/videos`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        })
          .then(async (videosResponse) => {
            if (!videosResponse.ok) {
              throw new Error("Videos request failed");
            }

            return videosResponse.json();
          })
          .then((videosData: ChannelVideosResponse) => {
            setChannelVideos({
              videos: videosData.data?.videos ?? [],
              shorts: videosData.data?.shorts ?? []
            });
          })
          .catch(() => {
            setChannelVideos({ videos: [], shorts: [] });
          })
          .finally(() => {
            setIsLoadingVideos(false);
          });
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
            <h1>Hola, {user.name}!</h1>
            <p>Aqui tienes un resumen de tu actividad en YT XSpin.</p>
          </div>

          <div className="dashboard-actions">
            <div className="profile-menu">
              <button
                className="profile-chip"
                type="button"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                <UserAvatar user={user} />
                <strong>{user.name}</strong>
                <Icon name="chevronDown" />
              </button>
              {isUserMenuOpen && (
                <div className="profile-dropdown">
                  <span>{user.email}</span>
                  <button type="button" onClick={logout}>
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
            <a className="primary-action" href="/connect-channel">
              Conectar canal
              <img src="/logos/youtube.svg" alt="" />
            </a>
          </div>
        </header>

        <NativeAdSlot />

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
          <VideoCarousel title="Videos" items={channelVideos.videos} isLoading={isLoadingVideos} />
          <VideoCarousel title="Shorts" items={channelVideos.shorts} isLoading={isLoadingVideos} variant="shorts" />
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

function VideoCarousel({
  title,
  items,
  isLoading,
  variant = "videos"
}: {
  title: string;
  items: ChannelVideo[];
  isLoading: boolean;
  variant?: "videos" | "shorts";
}) {
  const pageSize = variant === "shorts" ? 6 : 5;
  const [startIndex, setStartIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const canSlide = items.length > pageSize;
  const maxStartIndex = Math.max(items.length - pageSize, 0);
  const visibleItems = isExpanded ? items : items.slice(startIndex, startIndex + pageSize);

  function showPrevious() {
    setStartIndex((current) => Math.max(current - pageSize, 0));
  }

  function showNext() {
    setStartIndex((current) => Math.min(current + pageSize, maxStartIndex));
  }

  function toggleExpanded() {
    setIsExpanded((current) => !current);
    setStartIndex(0);
  }

  return (
    <div className="dashboard-video-section">
      <div className="section-title-row">
        <h2>{title}</h2>
        {items.length > pageSize && (
          <button className="see-all-button" type="button" onClick={toggleExpanded}>
            {isExpanded ? "Ver menos" : "Ver todos"}
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="video-empty">Cargando videos del canal...</p>
      ) : items.length ? (
        <div className="video-carousel-wrap">
          {canSlide && !isExpanded && (
            <button className="carousel-nav previous" aria-label={`Videos anteriores de ${title}`} type="button" onClick={showPrevious} disabled={startIndex === 0}>
              <Icon name="chevronLeft" />
            </button>
          )}
          <div className={variant === "shorts" ? "video-row shorts-row" : "video-row"}>
            {visibleItems.map((video) => (
              <a className={variant === "shorts" ? "dashboard-video-card short" : "dashboard-video-card"} href={video.url ?? "#"} key={video.id} target="_blank" rel="noreferrer">
              <div className="video-thumb">
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <div className="thumb-placeholder">YT</div>}
                <span>{formatDuration(video.durationSec)}</span>
              </div>
              <h3>{video.title}</h3>
              <p>
                <Icon name="playOutline" />
                {formatCompact(video.viewCount, "0")} visualizaciones
              </p>
            </a>
            ))}
          </div>
          {canSlide && !isExpanded && (
            <button className="carousel-nav next" aria-label={`Siguientes videos de ${title}`} type="button" onClick={showNext} disabled={startIndex >= maxStartIndex}>
              <Icon name="chevronRight" />
            </button>
          )}
        </div>
      ) : (
        <p className="video-empty">Aun no encontramos {title.toLowerCase()} publicos para este canal.</p>
      )}
    </div>
  );
}

function UserAvatar({ user }: { user: CurrentUser }) {
  return (
    <div className="dashboard-avatar user">
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{user.name.slice(0, 1)}</span>}
    </div>
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

function formatDuration(durationSec?: number | null) {
  if (!durationSec) {
    return "0:00";
  }

  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = durationSec % 60;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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

function NativeAdSlot() {
  useEffect(() => {
    if (document.querySelector(`script[data-adsterra-native="${ADSTERRA_NATIVE_CONTAINER_ID}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.cfasync = "false";
    script.dataset.adsterraNative = ADSTERRA_NATIVE_CONTAINER_ID;
    script.src = ADSTERRA_NATIVE_SCRIPT;
    document.body.appendChild(script);
  }, []);

  return (
    <section className="dashboard-ad-slot" aria-label="Publicidad">
      <div id={ADSTERRA_NATIVE_CONTAINER_ID}></div>
    </section>
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
    chevronLeft: <path d="m15 18-6-6 6-6" />,
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
