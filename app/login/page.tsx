"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Sun, Loader2, Eye, EyeOff, School, Zap, Droplet, ThermometerSun, Workflow, Activity, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (token && storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                const role = parsed.roles?.role_name || parsed.role || "";
                if (role === "Super Admin") {
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

                const role = data.user.roles?.role_name || "";
                if (role === "Super Admin") {
                    router.push("/dashboard/superadmin");
                } else {
                    router.push("/dashboard");
                }
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
 
        * { box-sizing: border-box; margin: 0; padding: 0; }
 
        .login-root {
          height: 100vh;
          width: 100vw;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f8fafc;
          overflow: hidden;
        }
 
        /* ── LEFT PANEL ── */
        .left-panel {
          width: 50%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 72px;
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
 
        .logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
        }
       
        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
          color: white;
        }
       
        .logo-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.5px;
        }
        .logo-text span { color: #10b981; }
 
        .headline {
          font-family: 'DM Sans', sans-serif;
          font-size: 38px;
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
          font-size: 15px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 30px;
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
        }
 
        .input-field {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0f172a;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
       
        .input-field::placeholder { color: #94a3b8; }
       
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
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          padding: 0;
          display: flex;
        }
        
        .toggle-password:hover {
          color: #10b981;
        }
 
        .extras {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
       
        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }
       
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
 
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
 
        .footer-note {
          margin-top: 30px;
          font-size: 12px;
          color: #64748b;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
 
        /* ── RIGHT PANEL ── */
        .right-panel {
          width: 50%;
          height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 40px;
          overflow: hidden;
        }
 
        .stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }
       
        .stat-card {
          flex: 1;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          padding: 16px;
          transition: transform 0.3s;
        }
       
        .stat-card:hover {
          transform: translateY(-4px);
        }
       
        .stat-value {
          font-family: 'DM Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          line-height: 1;
        }
       
        .stat-label {
          font-size: 11px;
          color: #ffffff;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
        }
 
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
          position: relative;
          z-index: 2;
        }
       
        .badge-dot {
          width: 8px; height: 8px;
          background: #ffffff;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 10px #ffffff;
        }
       
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
 
        .panel-heading {
          font-family: 'DM Sans', sans-serif;
          font-size: 40px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
        }
       
        .panel-heading span { color: #10b981; }
       
        .panel-sub {
          font-size: 16px;
          color: #ffffff;
          line-height: 1.6;
          max-width: 500px;
          font-weight: 500;
          position: relative;
          z-index: 2;
        }
 
         @keyframes flowDash {
           to {
             stroke-dashoffset: -100;
           }
         }
         .animate-flow-dash-fast {
           animation: flowDash 2.5s linear infinite;
         }
         .animate-flow-dash-medium {
           animation: flowDash 5s linear infinite;
         }
         .animate-flow-dash-slow {
           animation: flowDash 8.5s linear infinite;
         }
 
        /* Responsive Design */
        @media (max-width: 1024px) {
          .right-panel { display: none; }
          .left-panel { width: 100%; padding: 48px 32px; align-items: center; }
          .left-panel > div { max-width: 450px; width: 100%; }
          .headline { font-size: 36px; }
        }
      `}</style>
 
            <div className="login-root">
                {/* ── LEFT PANEL ── */}
                <div className="left-panel">
                    <div>
                        {/* Logo */}
                        <div className="logo-row">
                            <div className="logo-icon">
                                <Sun size={24} strokeWidth={2.5} />
                            </div>
                            <div className="logo-text">
                                Solar<span>EPC</span>
                            </div>
                        </div>

                        {/* Headline */}
                        <h2 className="headline">
                            Welcome <em>back.</em>
                        </h2>
                        <p className="sub">Secure access to your intelligent solar management portal.</p>

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
                                        placeholder="admin@solarepc.com"
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
                                    />
                                    <button 
                                        type="button" 
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-between p-12 overflow-hidden select-none">
                        
                        {/* Ambient decorative grid and glowing light */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
                        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse"></div>
                        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>

                        {/* Top Badge */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                Active Flow Network
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                Interactive View
                            </div>
                        </div>

                        {/* Flow Network Canvas */}
                        <div className="relative w-full flex-1 flex items-center justify-center min-h-[400px] z-10">
                            
                            {/* Animated Connection Edges (SVG paths) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '100%' }}>
                                <defs>
                                    <linearGradient id="electricity-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                                    </linearGradient>
                                    <linearGradient id="heat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
                                    </linearGradient>
                                    <linearGradient id="water-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                                    </linearGradient>
                                </defs>

                                {/* 1. Solar Panels (Top-Left) -> School Site (Bottom-Right) */}
                                <path
                                    d="M 180, 160 C 180, 280 340, 200 340, 280"
                                    fill="none"
                                    stroke="url(#electricity-grad)"
                                    strokeWidth="3"
                                    strokeDasharray="8, 6"
                                    className="animate-flow-dash-fast"
                                />

                                {/* 2. Solar Collector (Top-Right) -> Water Tank (Bottom-Left) */}
                                <path
                                    d="M 340, 160 C 340, 240 180, 200 180, 280"
                                    fill="none"
                                    stroke="url(#heat-grad)"
                                    strokeWidth="3"
                                    strokeDasharray="8, 6"
                                    className="animate-flow-dash-medium"
                                />

                                {/* 3. Water Tank (Bottom-Left) -> School Site (Bottom-Right) */}
                                <path
                                    d="M 180, 280 L 340, 280"
                                    fill="none"
                                    stroke="url(#water-grad)"
                                    strokeWidth="3"
                                    strokeDasharray="8, 6"
                                    className="animate-flow-dash-slow"
                                />
                            </svg>

                            {/* Node 1: Solar Panels (Top-Left) */}
                            <div className="absolute top-[12%] left-[10%] group cursor-pointer">
                                <div className="px-4 py-3 bg-slate-900/90 backdrop-blur border border-emerald-500/20 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg">
                                        <Zap className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">Generation</div>
                                        <div className="text-xs font-black text-white mt-1 uppercase tracking-wider">Solar Panels</div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-emerald-500/20 rotate-45 group-hover:border-emerald-400"></div>
                            </div>

                            {/* Node 2: Solar Hot Water Heater / Collector (Top-Right) */}
                            <div className="absolute top-[12%] right-[10%] group cursor-pointer">
                                <div className="px-4 py-3 bg-slate-900/90 backdrop-blur border border-emerald-500/20 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                                        <ThermometerSun className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Thermal Loop</div>
                                        <div className="text-xs font-black text-white mt-1 uppercase tracking-wider">Solar Heater</div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-emerald-500/20 rotate-45 group-hover:border-emerald-400"></div>
                            </div>

                            {/* Node 3: Water Tank Storage (Bottom-Left) */}
                            <div className="absolute bottom-[22%] left-[10%] group cursor-pointer">
                                <div className="px-4 py-3 bg-slate-900/90 backdrop-blur border border-emerald-500/20 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg">
                                        <Droplet className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Storage</div>
                                        <div className="text-xs font-black text-white mt-1 uppercase tracking-wider">Water Tank</div>
                                    </div>
                                </div>
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-emerald-500/20 rotate-45 group-hover:border-emerald-400"></div>
                            </div>

                            {/* Node 4: School Site Load (Bottom-Right) */}
                            <div className="absolute bottom-[22%] right-[10%] group cursor-pointer">
                                <div className="px-4 py-3 bg-slate-900/90 backdrop-blur border border-emerald-500/20 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg">
                                        <School className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">End Consumer</div>
                                        <div className="text-xs font-black text-white mt-1 uppercase tracking-wider">KGBV School</div>
                                    </div>
                                </div>
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-emerald-500/20 rotate-45 group-hover:border-emerald-400"></div>
                            </div>
                        </div>

                        {/* Bottom Description */}
                        <div className="relative z-10 text-left">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight mb-2">
                                SMART <span className="text-emerald-400">SOLAR NETWORK</span>
                            </h3>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest max-w-lg leading-relaxed">
                                Real-time synchronization of grid telemetry, material flow dispatches, and installation execution status at rural schools.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}