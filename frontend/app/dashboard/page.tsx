"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  hasConnectedChannel: boolean;
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
          <div className="avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.name.slice(0, 1)}</div>
        </header>
        <section className="welcome-panel">
          <h2>Bienvenido, Creador!</h2>
          <p>Estas a un paso de empezar a recibir exposicion real para tus videos.</p>
          <div className="dashboard-metrics">
            <article>
              <span>Videos conectados</span>
              <strong>12</strong>
            </article>
            <article>
              <span>Visualizaciones obtenidas</span>
              <strong>2,458</strong>
            </article>
            <article>
              <span>Suscripciones obtenidas</span>
              <strong>184</strong>
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
