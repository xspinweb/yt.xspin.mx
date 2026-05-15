"use client";

import { useEffect, useState } from "react";
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

  return (
    <main className="app-frame">
      <AppSidebar active="Dashboard" onLogout={logout} />
      <section className="dashboard-main">
        <header className="dashboard-top">
          <h1>Dashboard</h1>
          <div className="avatar">
            {user.currentChannel?.thumbnailUrl ? (
              <img src={user.currentChannel.thumbnailUrl} alt="" />
            ) : (
              user.currentChannel?.title.slice(0, 1) ?? user.name.slice(0, 1)
            )}
          </div>
        </header>
        <section className="welcome-panel">
          <h2>{user.currentChannel?.title ?? "Canal conectado"}</h2>
          <p>
            {user.currentChannel?.channelUrl ? (
              <a href={user.currentChannel.channelUrl} rel="noreferrer" target="_blank">
                {user.currentChannel.channelUrl}
              </a>
            ) : (
              "Canal pendiente de escaneo publico."
            )}
          </p>
          <div className="channel-summary">
            <span>{user.currentChannel?.handle ?? "Handle pendiente"}</span>
            <span>{formatJoinDate(user.currentChannel?.publishedAt)}</span>
            <span>{user.currentChannel?.niche ?? "Nicho pendiente"}</span>
          </div>
          <div className="dashboard-metrics">
            <article>
              <span>Videos conectados</span>
              <strong>{formatStat(user.currentChannel?.videoCount)}</strong>
            </article>
            <article>
              <span>Visualizaciones del canal</span>
              <strong>{formatStat(user.currentChannel?.viewCount)}</strong>
            </article>
            <article>
              <span>Suscriptores</span>
              <strong>{formatStat(user.currentChannel?.subscriberCount)}</strong>
            </article>
          </div>
        </section>
        <section className="activity-panel">
          <h2>Actividad reciente</h2>
          <div className="activity-list">
            <p><span /> Tu video fue visto <strong>+1 vista</strong></p>
            <p><span /> Nuevo suscriptor obtenido <strong>+1 suscripcion</strong></p>
            <p><span /> Tu video fue visto <strong>+1 vista</strong></p>
          </div>
        </section>
      </section>
    </main>
  );
}

function formatStat(value?: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return Number(value).toLocaleString("es-MX");
}

function formatJoinDate(value?: string | null) {
  if (!value) {
    return "Fecha pendiente";
  }

  return `Se unio el ${new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value))}`;
}

function AppSidebar({ active, onLogout }: { active: string; onLogout: () => void }) {
  const links = ["Dashboard", "Descubrir", "Mis videos", "Suscripciones", "Estadisticas", "Mi canal", "Configuracion"];

  return (
    <aside className="app-sidebar">
      <a className="app-logo" href="/">
        <img src="/logos/xspin-mark.svg" alt="" />
        <span>SPIN</span>
      </a>
      <nav>
        {links.map((link) => (
          <a className={active === link ? "active" : ""} href="#" key={link}>{link}</a>
        ))}
      </nav>
      <button type="button" onClick={onLogout}>Cerrar sesion</button>
    </aside>
  );
}
