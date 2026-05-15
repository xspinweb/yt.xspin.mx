"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ConnectChannelResponse = {
  data?: {
    handle?: string;
  };
  message?: string;
};

export default function ConnectChannelPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [niche, setNiche] = useState("Tecnologia");
  const [connectError, setConnectError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedHandle, setConnectedHandle] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("ytx_access_token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        return response.json();
      })
      .then(() => {
        setIsAllowed(true);
      })
      .catch(() => {
        window.localStorage.removeItem("ytx_access_token");
        setAuthError("Tu sesion expiro o no se pudo validar.");
        window.setTimeout(() => window.location.replace("/login"), 500);
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
  }, []);

  async function connectChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectError("");

    const token = window.localStorage.getItem("ytx_access_token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch(`${API_URL}/channels/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          channelUrl,
          niche
        })
      });
      const data = (await response.json()) as ConnectChannelResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos conectar tu canal.");
      }

      setConnectedHandle(data.data?.handle ?? channelUrl);
      setIsSuccess(true);
    } catch (caughtError) {
      setConnectError(caughtError instanceof Error ? caughtError.message : "Ocurrio un error.");
    } finally {
      setIsConnecting(false);
    }
  }

  if (!isAllowed) {
    return (
      <main className="app-loading">
        <section className="loading-card">
          <strong>{authError || "Validando sesion..."}</strong>
          <p>Si esto tarda demasiado, vuelve a iniciar sesion para refrescar tu acceso.</p>
          <a className="button button-solid" href="/login">Ir a iniciar sesion</a>
        </section>
      </main>
    );
  }

  return (
    <main className="app-frame connect-shell">
      <aside className="app-sidebar">
        <a className="app-logo" href="/">
          <img className="app-logo-full" src="/logos/xspin-logo.svg" alt="YT Xspin" />
        </a>
        <nav>
          <a href="#"><span className="nav-icon">D</span>Dashboard</a>
          <a href="#"><span className="nav-icon">O</span>Descubrir</a>
          <a href="#"><span className="nav-icon">V</span>Mis videos</a>
          <a href="#"><span className="nav-icon">S</span>Suscripciones</a>
          <a href="#"><span className="nav-icon">E</span>Estadisticas</a>
          <a href="#"><span className="nav-icon">M</span>Mi canal</a>
          <a className="active" href="#"><span className="nav-icon">I</span>Integracion</a>
          <a href="#"><span className="nav-icon">C</span>Configuracion</a>
        </nav>
      </aside>

      {isSuccess ? (
        <section className="connect-success">
          <div className="success-check">&#10003;</div>
          <h1>Canal conectado con exito!</h1>
          <p>
            Conectamos <strong>{connectedHandle}</strong>. Ya puedes empezar a descubrir contenido y recibir exposicion
            para ese canal.
          </p>
          <button className="button button-solid" type="button" onClick={() => router.push("/dashboard")}>
            Ir al Dashboard
          </button>
        </section>
      ) : (
        <section className="connect-main connect-panel">
          <div className="connect-copy">
            <h1>Conecta tu canal de YouTube</h1>
            <p>Agrega la URL publica de tu canal para empezar a participar en la plataforma.</p>
          </div>
          <div className="youtube-orbit">
            <span className="orbit-line orbit-line-one" />
            <span className="orbit-line orbit-line-two" />
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
            <span className="orbit-dot dot-three" />
            <img src="/logos/youtube.svg" alt="" />
          </div>
          <ul className="connect-list">
            <li>Google se usa solo para iniciar sesion en YT Xspin</li>
            <li>No pedimos permisos privados de YouTube</li>
            <li>Importaremos contenido publico del canal conectado</li>
          </ul>
          <form className="connect-form connect-channel-form" onSubmit={connectChannel}>
            <label>
              URL publica de tu canal
              <input
                value={channelUrl}
                onChange={(event) => setChannelUrl(event.target.value)}
                placeholder="https://www.youtube.com/@TuCanal"
                required
              />
            </label>
            <label>
              Nicho principal
              <select value={niche} onChange={(event) => setNiche(event.target.value)} required>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Gaming">Gaming</option>
                <option value="Educacion">Educacion</option>
                <option value="Musica">Musica</option>
                <option value="Lifestyle">Lifestyle</option>
              </select>
            </label>
            {connectError && <p className="connect-error">{connectError}</p>}
            <button className="button button-solid connect-youtube-button" type="submit" disabled={isConnecting}>
              {isConnecting ? "Conectando..." : "Conectar canal de YouTube"}
            </button>
          </form>
          <small>Solo usamos informacion publica del canal. No accedemos a tu cuenta de YouTube.</small>
        </section>
      )}
    </main>
  );
}
