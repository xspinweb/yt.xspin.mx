"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const GOOGLE_CLIENT_ID = "601233323658-iulc1bif0l33olttfth9tqod0tno4ivf.apps.googleusercontent.com";

type AuthMode = "login" | "register";

type AuthResponse = {
  accessToken: string;
  user: {
    hasConnectedChannel: boolean;
  };
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline" | "filled_blue" | "filled_black";
              size: "large" | "medium" | "small";
              width?: number;
              text?: "continue_with" | "signin_with" | "signup_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
            }
          ) => void;
        };
      };
    };
  }
}

export function AuthCard({
  initialMode = "login",
  compact = false,
  autoRedirect = true
}: {
  initialMode?: AuthMode;
  compact?: boolean;
  autoRedirect?: boolean;
}) {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!autoRedirect) {
      return;
    }

    const token = window.localStorage.getItem("ytx_access_token");

    if (!token) {
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) {
          router.replace(data.user.hasConnectedChannel ? "/dashboard" : "/connect-channel");
        }
      })
      .catch(() => undefined);
  }, [autoRedirect, router]);

  useEffect(() => {
    const scriptId = "google-identity-services";
    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: compact ? 270 : 400,
        text: "continue_with",
        shape: "rectangular"
      });
    };

    if (document.getElementById(scriptId)) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [compact]);

  async function handleGoogleCredential(response: GoogleCredentialResponse) {
    if (!response.credential) {
      setError("No recibimos credencial de Google.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const authResponse = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: response.credential })
      });
      const data = (await authResponse.json()) as AuthResponse & { message?: string };

      if (!authResponse.ok) {
        throw new Error(data.message ?? "No pudimos continuar con Google.");
      }

      completeAuth(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Ocurrio un error.");
    } finally {
      setIsLoading(false);
    }
  }

  function completeAuth(data: AuthResponse) {
    window.localStorage.setItem("ytx_access_token", data.accessToken);
    router.replace(data.user.hasConnectedChannel ? "/dashboard" : "/connect-channel");
  }

  return (
    <section className={`auth-card ${compact ? "auth-card-compact" : ""}`}>
      <a className="auth-logo" href="/">
        <img src="/logos/xspin-mark.svg" alt="" />
        <span>SPIN</span>
      </a>
      <div className="auth-heading">
        <h1>{mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h1>
        <p>
          {mode === "login"
            ? "Entra con Google para vincular el canal de YouTube de esa cuenta."
            : "Crea tu cuenta con Google y conecta el canal asociado a ese correo."}
        </p>
      </div>

      <div className="google-button-wrap" ref={googleButtonRef} />

      {isLoading && <p className="auth-status">Procesando con Google...</p>}
      {error && <p className="auth-error auth-error-centered">{error}</p>}

      <p className="auth-switch">
        {mode === "login" ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Registrate" : "Inicia sesion"}
        </button>
      </p>
    </section>
  );
}
