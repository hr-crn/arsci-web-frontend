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
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Left side - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardBody className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <img src="/img/01.png" alt="arsci-logo" className="h-20 w-20 mx-auto mb-4 object-contain rounded" />
                <Typography variant="h3" className="font-bold mb-2 text-gray-800">
                  Welcome!
                </Typography>
                <Typography variant="paragraph" color="blue-gray" className="text-base font-normal">
                  Sign in to access your dashboard and manage your students
                </Typography>
              </div>

              {/* Google Sign-In only */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <Typography variant="small" color="red" className="font-medium">
                    {errorMsg}
                  </Typography>
                </div>
              )}

              <div className="flex justify-center">
                <div ref={googleDivRef} className="w-[320px] h-12 flex items-center justify-center" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-800/20 rounded-3xl"></div>
            <img
              src="/img/pattern.png"
              className="h-96 w-full object-cover rounded-3xl shadow-2xl"
              alt="Login illustration"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent rounded-3xl flex items-end p-8">
              <div className="text-white">
                <Typography variant="h4" className="font-bold mb-2">
                  ARSCI Education Platform
                </Typography>
                <Typography variant="paragraph" className="opacity-90">
                  Empowering teachers with modern tools for student management and progress tracking
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
