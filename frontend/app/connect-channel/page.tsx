"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const GOOGLE_CLIENT_ID = "601233323658-iulc1bif0l33olttfth9tqod0tno4ivf.apps.googleusercontent.com";
const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

type ConnectChannelResponse = {
  data?: {
    handle?: string;
  };
  message?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleOauth = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
};

export default function ConnectChannelPage() {
  const router = useRouter();
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState("");
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
      .then((data) => {
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
  }, [router]);

  useEffect(() => {
    const scriptId = "google-identity-services";
    const initializeTokenClient = () => {
      const google = window.google as unknown as GoogleOauth | undefined;
      const oauth2 = google?.accounts?.oauth2;

      if (!oauth2) {
        return;
      }

      tokenClientRef.current = oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: YOUTUBE_READONLY_SCOPE,
        callback: connectYoutubeChannel
      });
    };

    if (document.getElementById(scriptId)) {
      initializeTokenClient();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeTokenClient;
    document.head.appendChild(script);
  }, []);

  function requestYoutubeAccess() {
    setConnectError("");

    if (!tokenClientRef.current) {
      setConnectError("Google OAuth aun no esta listo. Intenta de nuevo en unos segundos.");
      return;
    }

    setIsConnecting(true);
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }

  async function connectYoutubeChannel(googleResponse: GoogleTokenResponse) {
    if (googleResponse.error || !googleResponse.access_token) {
      setIsConnecting(false);
      setConnectError("No recibimos permiso para leer tu canal de YouTube.");
      return;
    }

    const token = window.localStorage.getItem("ytx_access_token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/channels/connect-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          accessToken: googleResponse.access_token
        })
      });
      const data = (await response.json()) as ConnectChannelResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos conectar tu canal.");
      }

      setConnectedHandle(data.data?.handle ?? "tu canal de YouTube");
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
            <p>Conecta tu canal para empezar a participar en la plataforma y recibir exposicion real.</p>
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
            <li>Usamos la cuenta de Google con la que iniciaste sesion</li>
            <li>Solicitamos permiso para detectar su canal de YouTube</li>
            <li>Despues importaremos sus videos publicos automaticamente</li>
          </ul>
          <div className="connect-channel-form">
            {connectError && <p className="connect-error">{connectError}</p>}
            <button className="button button-solid connect-youtube-button" type="button" disabled={isConnecting} onClick={requestYoutubeAccess}>
              {isConnecting ? "Conectando..." : "Autorizar y conectar YouTube"}
            </button>
          </div>
          <small>El canal conectado sera el canal de YouTube de la misma cuenta de Google autorizada.</small>
        </section>
      )}
    </main>
  );
}
