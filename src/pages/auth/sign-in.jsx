import {
  Input,
  Button,
  Typography,
  Card,
  CardBody,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState,useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/api/apiClient";

export function SignIn() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();
  const googleDivRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard/home"); // change to your dashboard route
    }
  }, [navigate]);
  //google sign in
  // Google Identity Services init (optional; only if env is set)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      /* global google */
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setErrorMsg("");
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
              login(data.token, data.teacher);
              navigate('/dashboard/home');
            } else {
              setErrorMsg(data.message || 'Google sign-in failed');
            }
          } catch (e) {
            setErrorMsg('Google sign-in failed.');
          }
        }
      });
      if (googleDivRef.current) {
        window.google.accounts.id.renderButton(googleDivRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          width: 320
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch (_) {}
    };
  }, [login, navigate]);

  return (
    <section className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #0f0f3d 30%, #1a1a5e 60%, #141450 100%)' }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse-glow" style={{ background: 'radial-gradient(circle, #e054c0 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 animate-pulse-glow" style={{ background: 'radial-gradient(circle, #4cf0d0 0%, transparent 70%)', animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 animate-pulse-glow" style={{ background: 'radial-gradient(circle, #9b8ec8 0%, transparent 70%)', animationDelay: '3s' }} />
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="animate-float">
            <img
              src="/img/circle.png"
              alt="ARSCI Logo"
              className="w-36 h-36 object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 30px rgba(155, 142, 200, 0.4))' }}
            />
          </div>
        </div>

        {/* Glass card */}
        <div className="arsci-glass rounded-2xl p-8 arsci-glow-pink" style={{ background: 'rgba(15, 15, 61, 0.6)', border: '1px solid rgba(155, 142, 200, 0.2)' }}>
          {/* Header text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome<span className="arsci-gradient-text">!</span>
            </h2>
            <p className="text-sm font-normal" style={{ color: 'rgba(184, 174, 216, 0.8)' }}>
              Sign in to access your dashboard and manage your students
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg p-3 mb-5" style={{ background: 'rgba(224, 84, 192, 0.15)', border: '1px solid rgba(224, 84, 192, 0.3)' }}>
              <p className="text-sm font-medium" style={{ color: '#f078d8' }}>
                {errorMsg}
              </p>
            </div>
          )}

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <div ref={googleDivRef} className="w-[320px] h-12 flex items-center justify-center" />
          </div>

          {/* Divider */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(155, 142, 200, 0.15)' }}>
            <p className="text-center text-xs" style={{ color: 'rgba(155, 142, 200, 0.5)' }}>
              ARSCI — Augmented Reality Learning Media for Science and Technology
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
