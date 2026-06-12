"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Orbit, 
  LineChart, 
  Settings as SettingsIcon, 
  Search, 
  ChevronDown, 
  Activity, 
  Sliders, 
  Database,
  Cpu,
  Globe2,
  Terminal,
  Play
} from "lucide-react";
import toast from "react-hot-toast";

// Giả lập dữ liệu hệ thống cập nhật liên tục
const INITIAL_LOGS = [
  "✓ Khởi động lõi xử lý AI Cosmos v3.5...",
  "📡 Đang đồng bộ hóa dữ liệu từ viễn kính không gian James Webb...",
  "🧮 Đang tối ưu hóa mạng nơ-ron đa chiều...",
  "🟢 Hệ thống phòng vệ lượng tử: Hoạt động ổn định",
  "⚡ Phân tích bức xạ nền vũ trụ hoàn tất: 2.725K",
  "🛡️ Tường lửa hạt nhân: Đã kích hoạt chế độ tự học",
];

export default function CosmosAIPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [quantumLoad, setQuantumLoad] = useState(70);
  const [neuralSync, setNeuralSync] = useState(69);
  const [nebulaDensity, setNebulaDensity] = useState(25);
  const [darkEnergy, setDarkEnergy] = useState(26);
  const [brainPulse, setBrainPulse] = useState(true);

  // Sinh log chạy thời gian thực
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const randomLogs = [
        "📡 Đang phát hiện tín hiệu vô tuyến lạ từ chòm sao Orion...",
        "⚡ Lượng tử hóa ma trận entropy hoàn thành ở mức 99.8%",
        "🌀 Điều chỉnh mật độ vật chất tối trong mô hình mô phỏng...",
        "🧮 Mô hình dự đoán lỗ đen siêu khối lượng được cập nhật",
        "🔮 Quét cấu trúc siêu sợi vũ trụ (Cosmic Web Filament)...",
        "💾 Đang lưu bản sao bộ nhớ ý thức tập thể (Cosmic Mind Backup)...",
      ];
      const newLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs((prev) => [newLog, ...prev.slice(0, 5)]);

      // Cập nhật ngẫu nhiên nhẹ các thông số
      setQuantumLoad((v) => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 5) - 2)));
      setNeuralSync((v) => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 7) - 3)));
      setNebulaDensity((v) => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 3) - 1)));
      setDarkEnergy((v) => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 4) - 2)));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = (msg: string) => {
    toast(`💫 Đang khởi chạy: ${msg}`, {
      style: {
        background: "rgba(15, 23, 42, 0.8)",
        border: "1px solid rgba(6, 182, 212, 0.5)",
        color: "#22d3ee",
      }
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050515] text-slate-100 flex flex-col p-4 md:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ── BACKGROUND NEBULAE & STARS ────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* Deep space stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_#03020c_100%)]" />
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.15%22%3E%3Ccircle cx=%2210%22 cy=%2210%22 r=%221%22/%3E%3Ccircle cx=%2250%22 cy=%2220%22 r=%221.5%22/%3E%3Ccircle cx=%2230%22 cy=%2260%22 r=%220.8%22/%3E%3Ccircle cx=%2270%22 cy=%2250%22 r=%221.2%22/%3E%3C/g%3E%3C/svg%3E')]" />
        
        {/* Cyan nebula glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 animate-blob"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />
        
        {/* Magenta nebula glow */}
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 animate-blob animation-delay-2000"
          style={{ background: "radial-gradient(circle, #d946ef, transparent 70%)" }} />
        
        {/* Purple center nebula */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[180px] opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
      </div>

      {/* ── CORE DASHBOARD CONTAINER ──────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col rounded-3xl p-6 md:p-8 space-y-6"
        style={{
          background: "rgba(10, 10, 30, 0.45)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
        }}>
        
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(217,70,239,0.2) 100%)",
                border: "1.5px solid rgba(255,255,255,0.15)"
              }}>
              <Orbit className="text-cyan-400 group-hover:rotate-180 transition-transform duration-1000" size={20} />
              <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                COSMOS AI
              </h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Autonomous Space OS v3.5</p>
            </div>
          </div>

          {/* Top navigation */}
          <div className="flex items-center gap-1 md:gap-2">
            {["SERVICES", "RESEARCH", "COMMUNITY", "PORTAL"].map((nav) => (
              <button key={nav} onClick={() => handleAction(nav)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all">
                {nav}
              </button>
            ))}
          </div>

          {/* User profile dropdown */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              AT
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white">Dr. Aris Thorne</p>
              <p className="text-[9px] text-slate-400">Chief AI Director</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </header>

        {/* ── MAIN WORKSPACE ──────────────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ── LEFT SIDEBAR TABS ─────────────────────────────────────────── */}
          <aside className="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {[
              { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, glow: "cyan" },
              { id: "neural", label: "NEURAL NETS", icon: BrainCircuit, glow: "magenta" },
              { id: "galaxy", label: "GALAXY MAP", icon: Orbit, glow: "cyan" },
              { id: "analytics", label: "AI ANALYTICS", icon: LineChart, glow: "indigo" },
              { id: "settings", label: "SETTINGS", icon: SettingsIcon, glow: "slate" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              
              // Shadow/border styling based on hover/active
              const activeStyle = isSelected 
                ? {
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(6, 182, 212, 0.5)",
                    boxShadow: "0 0 15px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                    color: "#22d3ee"
                  }
                : {
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    color: "#94a3b8"
                  };

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    toast.success(`Đã chuyển đổi phân vùng: ${tab.label}`);
                  }}
                  style={activeStyle}
                  className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  <Icon size={16} className={isSelected ? "text-cyan-400" : "text-slate-400"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* ── DASHBOARD GRID CONTENT ────────────────────────────────────── */}
          <div className="lg:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* ── CARD 1: ACTIVE PROJECT ANALYSIS (Left) ──────────────────── */}
            <div className="card flex flex-col p-5 space-y-4"
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-cyan-400 font-mono tracking-widest">ACTIVE PROJECT:</p>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Andromeda Nebula</h3>
                </div>
                <Activity size={18} className="text-cyan-400 animate-pulse" />
              </div>

              {/* Progress bars with glow */}
              <div className="space-y-3 flex-1 justify-center flex flex-col">
                <ProgressRow label="Quantum Core Load" val={quantumLoad} color="from-cyan-500 to-blue-500" />
                <ProgressRow label="Neural Matrix Sync" val={neuralSync} color="from-purple-500 to-magenta-500" />
                <ProgressRow label="Nebula Density Scan" val={nebulaDensity} color="from-cyan-400 to-indigo-500" />
                <ProgressRow label="Dark Energy Ratio" val={darkEnergy} color="from-pink-500 to-purple-600" />
              </div>

              {/* Mock Chart representation */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-slate-500 font-mono mb-2">SPECTRUM ANALYSIS</p>
                <div className="h-16 flex items-end justify-between gap-1">
                  {[40, 65, 35, 80, 50, 95, 75, 45, 60, 85, 30, 90].map((h, i) => (
                    <div key={i} className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500/20 to-cyan-400/80"
                      style={{ 
                        height: `${h}%`,
                        boxShadow: "0 0 8px rgba(6, 182, 212, 0.3)"
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── CARD 2: BRAIN OPERATING SYSTEM (Center Glow) ─────────────── */}
            <div className="card flex flex-col items-center justify-between p-6 relative overflow-hidden"
              style={{
                background: "rgba(10, 10, 35, 0.5)",
                border: "1.5px solid rgba(217, 70, 239, 0.25)",
                boxShadow: "0 0 40px rgba(217, 70, 239, 0.15), inset 0 0 20px rgba(217, 70, 239, 0.05)"
              }}>
              <div className="text-center z-10">
                <h3 className="text-base font-black tracking-wider text-white">COSMOS AI</h3>
                <p className="text-[9px] text-magenta-400 font-mono tracking-widest">COGNITIVE SYNERGY OS</p>
              </div>

              {/* Main Holographic Neural Brain Component */}
              <div className="relative my-6 w-44 h-44 flex items-center justify-center z-10 cursor-pointer"
                onClick={() => setBrainPulse(!brainPulse)}>
                
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full border border-dashed border-magenta-500/40 ${
                  brainPulse ? "animate-spin" : ""
                }`} style={{ animationDuration: "12s" }} />
                
                {/* Secondary cyan ring */}
                <div className={`absolute inset-3 rounded-full border border-cyan-500/30 ${
                  brainPulse ? "animate-spin" : ""
                }`} style={{ animationDuration: "8s", animationDirection: "reverse" }} />

                {/* Pulsing Neural Heart */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 via-purple-950/60 to-slate-900/50 border border-white/10 ${
                  brainPulse ? "animate-pulse" : ""
                }`} style={{
                  boxShadow: "0 0 30px rgba(217, 70, 239, 0.3), inset 0 0 15px rgba(6, 182, 212, 0.2)"
                }}>
                  <BrainCircuit className="text-cyan-400 animate-float" size={44}
                    style={{ 
                      filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 15px rgba(217, 70, 239, 0.6))" 
                    }} />
                </div>
              </div>

              <button
                onClick={() => handleAction("Brain Simulation Core Sync")}
                className="w-full py-2.5 z-10 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #d946ef)",
                  boxShadow: "0 0 20px rgba(217, 70, 239, 0.4)"
                }}
              >
                <Play size={12} className="fill-white" />
                <span>INITIATE COGNITION</span>
              </button>
            </div>

            {/* ── CARD 3: SYSTEM STATUS & REALTIME CONTROLS (Right) ────────── */}
            <div className="card flex flex-col p-5 space-y-4"
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
              }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">SYSTEM STATUS</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              </div>

              {/* Scrolling Realtime Logs */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-[10px] font-mono leading-relaxed"
                    style={{ color: idx === 0 ? "#22d3ee" : "rgba(255,255,255,0.6)" }}>
                    <span className="text-slate-600">[{new Date().toLocaleTimeString("en-US", { hour12: false })}]</span>
                    <span className="truncate">{log}</span>
                  </div>
                ))}
              </div>

              {/* Interactive Controls Sliders */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sliders size={10} className="text-cyan-400" /> Flux Regulator
                  </span>
                  <span className="text-cyan-400 font-mono">1.25 TeV</span>
                </div>
                <input type="range" min="1" max="100" defaultValue="75"
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  onChange={(e) => toast(`Tần số Flux được điều chỉnh: ${e.target.value}%`)}
                />
              </div>

              {/* Search log bar */}
              <div className="relative">
                <input type="text" placeholder="Tra cứu bản ghi dữ liệu..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all" />
                <Search className="absolute left-2.5 top-2 text-slate-500" size={12} />
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER DOCK ─────────────────────────────────────────────────── */}
        <footer className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu size={14} className="text-indigo-400" />
              <span>Core Temp:</span>
              <strong className="text-white font-mono">32.4 °C</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database size={14} className="text-cyan-400" />
              <span>Quantum Node:</span>
              <strong className="text-white font-mono">NODE_9</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Globe2 size={14} className="text-magenta-400" />
              <span>Sync Status:</span>
              <strong className="text-green-400 font-semibold">ONLINE</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleAction("Open Quantum Terminal")}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center gap-1.5 text-[11px] font-bold">
              <Terminal size={12} /> TERMINAL
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function ProgressRow({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-mono font-bold text-white">{val}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ 
            width: `${val}%`,
            boxShadow: `0 0 6px rgba(6, 182, 212, 0.4)`
          }} />
      </div>
    </div>
  );
}
