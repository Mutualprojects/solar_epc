"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ChevronRight, Sun, Loader2, Eye, EyeOff, School, Zap, Droplet, ThermometerSun, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const role = parsed.roles?.role_name || parsed.role || "";
        if (role === "Super Admin" || role === "Viewer") {
          router.replace("/dashboard/superadmin");
        } else {
          router.replace("/inventory");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setToast(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.sessionId) {
          localStorage.setItem("sessionId", data.sessionId);
        }
        
        setToast({ message: "Login successful! Redirecting...", type: "success" });

        const role = data.user.roles?.role_name || "";
        setTimeout(() => {
          if (role === "Super Admin" || role === "Viewer") {
            router.push("/dashboard/superadmin");
          } else {
            router.push("/inventory");
          }
        }, 1000);
      } else {
        const errorMsg = data.error || "Login failed";
        setError(errorMsg);
        setToast({ message: errorMsg, type: "error" });
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setToast({ message: "An unexpected error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Toast Notifications */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .toast-msg {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: #ffffff;
        }

        .toast-msg.success { color: #065f46; border-left: 4px solid #10b981; }
        .toast-msg.error { color: #991b1b; border-left: 4px solid #ef4444; }

        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .login-root {
          height: 100vh;
          width: 100%;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f8fafc;
          overflow: hidden;
        }

        /* ── LEFT PANEL (FORM) ── */
        .left-panel {
          width: 50%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: clamp(28px, 5vw, 56px) clamp(24px, 6vw, 72px);
          position: relative;
          z-index: 2;
          background: #ffffff;
          overflow: hidden;
        }

        /* Subtle dot grid */
        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #10b981 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.08;
          pointer-events: none;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: clamp(20px, 4vh, 30px);
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
          color: white;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.5px;
        }
        .logo-text span { color: #10b981; }

        .headline {
          font-size: clamp(28px, 4vw, 38px);
          font-weight: 800;
          color: #064e3b;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 10px;
        }

        .headline em {
          font-style: normal;
          color: #10b981;
        }

        .sub {
          font-size: clamp(13px, 1.4vw, 15px);
          color: #64748b;
          font-weight: 500;
          margin-bottom: clamp(20px, 4vh, 30px);
        }

        .error-box {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 0 8px 8px 0;
          padding: 12px 16px;
          color: #991b1b;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .form { display: flex; flex-direction: column; gap: 18px; }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #0f766e;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: color 0.2s;
          display: flex;
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; /* 16px prevents iOS zoom on focus */
          color: #0f172a;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }

        .input-field::placeholder { color: #94a3b8; font-size: 14px; }

        .input-field:focus {
          border-color: #10b981;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .input-wrap:focus-within .input-icon {
          color: #10b981;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          padding: 4px;
          display: flex;
        }

        .toggle-password:hover { color: #10b981; }

        .extras {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 2px;
        }

        .remember {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .remember input[type="checkbox"] {
          width: 14px;
          height: 14px;
          accent-color: #10b981;
          cursor: pointer;
        }

        .remember-label {
          font-size: 13px;
          color: #475569;
          font-weight: 600;
        }

        .forgot {
          font-size: 13px;
          font-weight: 800;
          color: #10b981;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot:hover { color: #059669; }

        .btn-submit {
          margin-top: 8px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          transition: all 0.2s ease;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(16, 185, 129, 0.4);
        }

        .btn-submit:active:not(:disabled) { transform: translateY(0); }

        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-note {
          margin-top: clamp(20px, 4vh, 30px);
          font-size: 12px;
          color: #64748b;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* ── RIGHT PANEL (VISUAL) ── */
        .right-panel {
          width: 50%;
          height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          overflow: hidden;
        }

        .robot-wrap {
          position: relative;
          width: 75%;
          height: 70%;
          max-width: 640px;
          max-height: 760px;
          margin-bottom: 48px;
        }

        .robot-img {
          object-fit: contain;
          filter: drop-shadow(0 25px 50px rgba(0,0,0,0.15));
          transition: transform 0.7s ease;
        }
        .robot-img:hover { transform: scale(1.05); }

        /* Flow network card */
        .flow-card {
          position: absolute;
          bottom: clamp(20px, 4vh, 40px);
          left: 50%;
          transform: translateX(-50%);
          background: #ffffff;
          border: 1px solid rgba(16, 185, 129, 0.1);
          padding: clamp(14px, 2vw, 18px) clamp(20px, 3vw, 32px);
          border-radius: 18px;
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.08);
          display: flex;
          align-items: center;
          z-index: 10;
          width: 90%;
          max-width: 460px;
        }

        .flow-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
        }

        .flow-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .flow-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .flow-icon:hover { transform: scale(1.1); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

        .flow-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 10px;
        }

        .flow-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #cbd5e1;
          animation: slideArrow 2s ease-in-out infinite;
        }

        @keyframes slideArrow {
          0%, 100% { transform: translateX(-4px); opacity: 0.5; }
          50% { transform: translateX(4px); opacity: 1; }
        }

        .pulse { animation: iconPulse 2s ease-in-out infinite; }
        @keyframes iconPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── RESPONSIVE ── */

        /* Tablet & below: hide visual panel, center form */
        @media (max-width: 1024px) {
          .right-panel { display: none; }
          .left-panel {
            width: 100%;
            justify-content: center;
          }
        }

        /* Phones */
        @media (max-width: 480px) {
          .left-panel {
            padding: 32px 20px;
            justify-content: flex-start;
          }
          .form-container { padding-top: 12px; }
          .logo-row { margin-bottom: 24px; }
        }

        /* Short / landscape phones: don't vertically center, allow scroll */
        @media (max-height: 720px) and (max-width: 1024px) {
          .left-panel { justify-content: flex-start; }
        }
      `}</style>

      {toast && (
        <div className="toast-container">
          <div className={`toast-msg ${toast.type}`}>
            {toast.type === "success" ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <AlertCircle size={20} className="text-red-500" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="login-root">
        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="form-container">
            {/* Logo */}
            <div className="logo-row">
              <div className="logo-icon">
                <Sun size={24} strokeWidth={2.5} />
              </div>
              <div className="logo-text" style={{ fontSize: '20px' }}>
                APMS & <span>KGBV</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="headline">
              Welcome <em>back.</em>
            </h2>
            <p className="sub">Rooftop Solar Water Heater Management for APMS & KGBV Schools.</p>

            {/* Error Message */}
            {error && <div className="error-box">{error}</div>}

            {/* Form */}
            <form className="form" onSubmit={handleLogin}>
              {/* Email */}
              <div>
                <label className="field-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="admin@schools.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Extras */}
              <div className="extras">
                <label className="remember">
                  <input type="checkbox" />
                  <span className="remember-label">Remember me</span>
                </label>
                <a href="#" className="forgot">Forgot password?</a>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <p className="footer-note">
              <Lock size={12} /> Protected by enterprise-grade SSL encryption
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          {/* Central robot image */}
          <div className="robot-wrap">
            <Image
              src="/robot-with-solar-panel.png"
              alt="AI Robot monitoring solar panels"
              fill
              sizes="(max-width: 1024px) 0px, 50vw"
              className="robot-img"
              priority
            />
          </div>

          {/* Flow network indicator */}
          <div className="flow-card" style={{ maxWidth: '520px', borderColor: 'rgba(226, 232, 240, 1)', boxShadow: '0 15px 40px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
            {/* Header */}
            <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '14px', textAlign: 'center', width: '100%' }}>
              Live Flow System
            </p>
            <div className="flow-inner">
                {/* Node 1 - Solar */}
                <div className="flow-node">
                  <div className="flow-icon border-2 border-amber-100 text-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.2)]" style={{ background: '#fffbeb' }}>
                    <Sun className="pulse" size={26} />
                  </div>
                  <span className="flow-label text-amber-600">Solar</span>
                </div>

                {/* Arrow 1 - centered vertically at icon level */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, paddingTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', animation: 'slideArrow 1.4s ease-in-out infinite', animationDelay: '0s' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', opacity: 0.8 }} />
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fb923c', opacity: 0.6 }} />
                    <ChevronRight size={18} style={{ color: '#f97316' }} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Node 2 - Heater */}
                <div className="flow-node">
                  <div className="flow-icon border-2 border-orange-100 text-orange-500 shadow-[0_4px_12px_rgba(249,115,22,0.2)]" style={{ background: '#fff7ed' }}>
                    <ThermometerSun size={26} />
                  </div>
                  <span className="flow-label text-orange-600">Heater</span>
                </div>

                {/* Arrow 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, paddingTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', animation: 'slideArrow 1.4s ease-in-out infinite', animationDelay: '0.35s' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fb923c', opacity: 0.8 }} />
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#60a5fa', opacity: 0.6 }} />
                    <ChevronRight size={18} style={{ color: '#3b82f6' }} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Node 3 - Tank */}
                <div className="flow-node">
                  <div className="flow-icon border-2 border-blue-100 text-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.2)]" style={{ background: '#eff6ff' }}>
                    <Droplet size={26} />
                  </div>
                  <span className="flow-label text-blue-600">Tank</span>
                </div>

                {/* Arrow 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, paddingTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', animation: 'slideArrow 1.4s ease-in-out infinite', animationDelay: '0.7s' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#60a5fa', opacity: 0.8 }} />
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', opacity: 0.6 }} />
                    <ChevronRight size={18} style={{ color: '#6366f1' }} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Node 4 - School */}
                <div className="flow-node">
                  <div className="flow-icon border-2 border-indigo-100 text-indigo-500 shadow-[0_4px_12px_rgba(99,102,241,0.2)]" style={{ background: '#eef2ff' }}>
                    <School size={26} />
                  </div>
                  <span className="flow-label text-indigo-600">School</span>
                </div>
            </div>

            {/* Footer status */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'iconPulse 2s ease-in-out infinite' }} />
                System Active
              </div>
              <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                KGBV &amp; APMS Schools
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}