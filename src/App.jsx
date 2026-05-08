import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function formatValor(valor) {
  return valor.toLocaleString("pt-BR");
}

// ─── DATA ALVO (viagem praia) ────────────────────────────────────────────────
const VIAGEM_DATE = new Date(2026, 9, 4);

// ─── COMPONENTE DE AVATAR ────────────────────────────────────────────────────
function AvatarCircle({ foto, nome, size = "md", className = "" }) {
  const dimensions = {
    sm: "w-[44px] h-[44px] sm:w-[55px] sm:h-[55px]",
    md: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
  };
  const fontSizes = {
    sm: "text-[16px] sm:text-[20px]",
    md: "text-[20px] md:text-[28px]",
  };
  const getInitial = (n) => {
    if (!n || n === "Sem nome") return "?";
    return n.trim().charAt(0).toUpperCase();
  };
  const colors = [
    "from-cyan-400 to-blue-500",
    "from-purple-400 to-pink-500",
    "from-green-400 to-emerald-500",
    "from-orange-400 to-rose-500",
    "from-rose-400 to-red-500",
    "from-sky-400 to-indigo-500",
  ];
  const colorIndex = nome ? nome.length % colors.length : 0;

  if (foto) {
    return (
      <motion.div
        className={`${dimensions[size]} rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white/40 ring-offset-2 ring-offset-zinc-900 shadow-xl shadow-cyan-500/20 ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <img src={foto} alt={nome} className="w-full h-full object-cover" draggable={false} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${dimensions[size]} rounded-full flex-shrink-0 bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-bold text-white ring-2 ring-white/40 ring-offset-2 ring-offset-zinc-900 shadow-xl ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <span className={fontSizes[size]}>{getInitial(nome)}</span>
    </motion.div>
  );
}

// ─── BACKGROUND PRAIA/SUNSET ─────────────────────────────────────────────────
function BeachBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      left: `${getRandom(0, 100)}%`,
      top: `${getRandom(0, 100)}%`,
      delay: `${getRandom(0, 6)}s`,
      size: getRandom(1, 2),
    }));
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="sunset-bg" />
      <div className="wave-bg">
        <div className="wave-1" />
        <div className="wave-2" />
        <div className="wave-3" />
      </div>
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size + "px",
            height: p.size + "px",
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── SKELETON LOADING ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-zinc-800/80 rounded-2xl p-5 border border-zinc-700/50 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-[55px] h-[55px] md:w-[70px] md:h-[70px] rounded-full bg-zinc-700/60" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-zinc-700/60 rounded-lg w-3/5" />
          <div className="h-3 bg-zinc-700/40 rounded-lg w-1/4" />
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-10 bg-zinc-700/50 rounded-2xl flex-1" />
        <div className="h-10 bg-zinc-700/50 rounded-2xl flex-1" />
      </div>
      <div className="h-3 bg-zinc-700/40 rounded-xl" />
    </div>
  );
}

function SkeletonStatusCard() {
  return (
    <div className="rounded-2xl p-5 bg-zinc-800/80 min-h-[100px] sm:min-h-[120px] animate-pulse border border-zinc-700/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 bg-zinc-700/50 rounded-full" />
        <div className="h-4 bg-zinc-700/50 rounded-lg w-2/3" />
        <div className="h-6 bg-zinc-700/50 rounded-lg w-1/2" />
      </div>
    </div>
  );
}

// ─── COUNTDOWN PREMIUM ───────────────────────────────────────────────────────
function CountdownTimer() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const days = differenceInDays(VIAGEM_DATE, now);
  const hours = differenceInHours(VIAGEM_DATE, now) % 24;
  const minutes = differenceInMinutes(VIAGEM_DATE, now) % 60;

  if (days < 0) return null;

  return (
    <motion.div
      className="relative bg-gradient-to-br from-cyan-600/20 to-blue-900/20 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 mb-6 md:mb-8 overflow-hidden shadow-lg shadow-cyan-500/5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <span className="text-white/60 text-sm font-medium">🌴 Faltam</span>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{days}</span>
            <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">dias</span>
          </div>
          <span className="text-white/20 text-xl">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{hours}</span>
            <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">horas</span>
          </div>
          <span className="text-white/20 text-xl">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{minutes}</span>
            <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">min</span>
          </div>
        </div>
        <span className="text-white/60 text-sm font-medium">para a praia 🏖️</span>
      </div>
    </motion.div>
  );
}

// ─── GRÁFICOS PREMIUM ────────────────────────────────────────────────────────
function DashboardCharts({ pessoas }) {
  const chartData = useMemo(() => {
    const avistaTotal = pessoas.filter((p) => p.tipo === "avista").length;
    const parceladoTotal = pessoas.filter((p) => p.tipo === "parcelado").length;
    const pagos = pessoas.filter((p) => p.tipo === "avista" ? p.p1 : (p.p1 && p.p2)).length;
    const pendentes = pessoas.length - pagos;

    return {
      tipoData: [
        { name: "À vista", value: avistaTotal, color: "#22d3ee" },
        { name: "Parcelado", value: parceladoTotal, color: "#f97316" },
      ],
      statusData: [
        { name: "Pagos", value: pagos, color: "#34d399" },
        { name: "Pendentes", value: pendentes, color: "#fbbf24" },
      ],
    };
  }, [pessoas]);

  if (pessoas.length === 0) return null;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 text-center">Tipo de Pagamento</h3>
        <div className="h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.tipoData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                stroke="none"
              >
                {chartData.tipoData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {chartData.tipoData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-white/50">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 text-center">Status Pagamentos</h3>
        <div className="h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.statusData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} animationBegin={0} animationDuration={1000}>
                {chartData.statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {chartData.statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-white/50">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDlKU2D66-etmOHtlefViHvx4whRVdRiEE",
  authDomain: "controle-praia-2026.firebaseapp.com",
  projectId: "controle-praia-2026",
  storageBucket: "controle-praia-2026.appspot.com",
  messagingSenderId: "744354320192",
  appId: "1:744354320192:web:da72b446d481158ce834a5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const CONFIG = {
  valorTotal: 1671,
  valorPorPessoa: 209,
  parcela: 104.5,
};

const ADM_EMAIL = "gpiloto35@gmail.com";
const enviarWhats = async () => {};

// ─── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [pessoas, setPessoas] = useState([]);
  const [nome, setNome] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [modal, setModal] = useState({ open: false, pessoaId: null });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const isAdmin = user?.email === ADM_EMAIL;
  const fileInputRef = useRef(null);

  const handleLogin = async () => {
    try {
      await toast.promise(signInWithPopup(auth, provider), {
        loading: "Entrando...",
        success: "Login realizado com sucesso!",
        error: "Erro ao fazer login",
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) toast.success("Bem-vindo, " + u.email.split("@")[0] + "! ☀️", { id: "login-toast" });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "pessoas"),
      (snapshot) => {
        const lista = snapshot.docs.map((d) => ({
          id: d.id,
          nome: d.data().nome || "Sem nome",
          tipo: d.data().tipo || "avista",
          p1: d.data().p1 ?? false,
          p2: d.data().p2 ?? false,
          comprovantes: d.data().comprovantes || [],
          historico: d.data().historico || [],
          foto: d.data().foto || null,
        }));
        setPessoas(lista);
        setLoading(false);
      },
      (err) => {
        console.log(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    let total = 0;
    pessoas.forEach((p) => {
      if (p.tipo === "avista") {
        if (p.p1) total += CONFIG.valorPorPessoa;
      } else {
        if (p.p1) total += CONFIG.parcela;
        if (p.p2) total += CONFIG.parcela;
      }
    });
    return { total, falta: CONFIG.valorTotal - total };
  }, [pessoas]);

  const addPessoa = async (e) => {
    e.preventDefault();
    if (adding) return;
    if (!user) return toast.error("Faça login primeiro!");
    if (!nome.trim()) return toast.error("Digite um nome!");
    
    setAdding(true);
    const nomeLimpo = nome.trim();
    const currentFotoFile = fotoFile;

    try {
      let fotoUrl = null;
      if (currentFotoFile) {
        const toastId = toast.loading("Enviando foto...");
        try {
          const storageRef = ref(storage, "fotos/" + Date.now() + "-" + currentFotoFile.name);
          const snapshot = await uploadBytes(storageRef, currentFotoFile);
          fotoUrl = await getDownloadURL(snapshot.ref);
          toast.dismiss(toastId);
        } catch (uploadErr) {
          toast.dismiss();
          toast.error("Erro ao enviar foto, mas a pessoa será adicionada sem foto.");
          console.log("Upload error:", uploadErr);
        }
      }

      await addDoc(collection(db, "pessoas"), {
        nome: nomeLimpo,
        foto: fotoUrl,
        tipo: "avista",
        p1: false,
        p2: false,
        comprovantes: [],
        historico: [],
        createdAt: serverTimestamp(),
      });

      toast.success(nomeLimpo + " adicionado(a) com sucesso! 🎉");
      setNome("");
      setFotoFile(null);
      setFotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.log("Error adding person:", err);
      toast.error("Erro ao adicionar pessoa");
    } finally {
      setAdding(false);
    }
  };

  const uploadComprovante = async (pessoa, file) => {
    if (!file) return;
    try {
      const storageRef = ref(storage, "comp/" + Date.now() + "-" + file.name);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "pessoas", pessoa.id), {
        comprovantes: [...(pessoa.comprovantes || []), { nome: file.name, url }],
      });
      toast.success("Comprovante enviado! 📎");
    } catch {
      toast.error("Erro ao enviar comprovante");
    }
  };

  const handleFotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearFotoPreview = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative min-h-screen bg-zinc-900 flex flex-col overflow-x-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "14px 18px",
            fontSize: "14px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          duration: 3000,
        }}
      />

      <BeachBackground />

      <header className="relative z-20 w-full py-4 sm:py-5 md:py-6 lg:py-8 bg-zinc-900/90 border-b border-white/10 shadow-lg sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-responsive-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight pr-2">
              Controle Financeiro Praia
            </h1>
            <span className="text-[10px] sm:text-xs text-cyan-400/80 font-medium tracking-widest uppercase">
              {"☀"} Verão 2026
            </span>
          </div>
          <button
            onClick={handleLogin}
            className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow transition-all duration-200 font-semibold border border-zinc-700 hover:border-cyan-500/50 text-responsive-sm sm:text-sm min-h-touch flex items-center"
          >
            {user ? user.email : "Login"}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6">
        <div className="w-full max-w-4xl mx-auto">
          <CountdownTimer />

          {/* FORM ADICIONAR - visível para admin */}
          {isAdmin && (
            <form
              onSubmit={addPessoa}
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 md:mb-8 items-stretch sm:items-center bg-zinc-800/90 p-4 sm:p-5 md:p-6 rounded-2xl shadow-lg border border-zinc-700/50"
            >
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Adicionar pessoa..."
                  className="flex-1 bg-zinc-900 text-white px-4 py-3 sm:py-3.5 rounded-2xl outline-none border border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 text-responsive-base sm:text-lg shadow min-h-touch transition-all duration-200"
                />
              </div>
              {user?.email === ADM_EMAIL && (
                <div className="flex items-center gap-2">
                  {fotoPreview ? (
                    <div className="relative flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-[48px] h-[48px] rounded-full overflow-hidden ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-zinc-800"
                      >
                        <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </motion.div>
                      <button
                        type="button"
                        onClick={clearFotoPreview}
                        className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white w-[20px] h-[20px] rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all"
                      >
                        {"×"}
                      </button>
                    </div>
                  ) : (
                    <label className="flex-shrink-0 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-semibold shadow cursor-pointer transition-all duration-200 border border-blue-800 min-h-touch flex items-center justify-center text-sm sm:text-base gap-1.5">
                      {"📸"} Foto
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFotoSelect} ref={fileInputRef} />
                    </label>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={adding}
                className={"flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:from-cyan-600 active:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg shadow-cyan-500/20 transition-all duration-200 min-h-touch min-w-touch flex items-center justify-center text-responsive-lg sm:text-xl " + (adding ? "opacity-60 cursor-not-allowed" : "")}
              >
                {adding ? "..." : "+"}
              </button>
            </form>
          )}

          {/* DASHBOARD - APENAS PARA ADM */}
          {isAdmin && (
            <>
              {/* CARDS DE STATUS */}
              <motion.div
                className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {loading ? (
                  <>
                    <SkeletonStatusCard />
                    <SkeletonStatusCard />
                    <SkeletonStatusCard />
                  </>
                ) : (
                  <>
                    <StatusCard title="Arrecadado" value={"R$ " + formatValor(stats.total)} icon="💰" gradient="from-emerald-600 to-emerald-800" />
                    <StatusCard title="Faltante" value={"R$ " + formatValor(stats.falta > 0 ? stats.falta : 0)} icon="🧾" gradient="from-amber-600 to-amber-800" />
                    <StatusCard title="Membros" value={pessoas.length} icon="👥" gradient="from-cyan-600 to-blue-800" />
                  </>
                )}
              </motion.div>

              {/* GRÁFICOS */}
              {!loading && pessoas.length > 0 && <DashboardCharts pessoas={pessoas} />}
            </>
          )}

          {/* LISTA DE PESSOAS - visível para todos */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <AnimatePresence>
                {pessoas.map((p) => (
                  <PessoaCard key={p.id} pessoa={p} db={db} uploadComprovante={uploadComprovante} user={user} onDelete={() => setModal({ open: true, pessoaId: p.id })} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DELETAR */}
      <AnimatePresence>
        {modal.open && (
          <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
            <motion.div
              className="bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-sm mx-auto text-center border border-zinc-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-responsive-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Confirmar exclusão?</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-6 py-3 sm:py-2.5 rounded-2xl font-bold shadow transition-all duration-200 min-h-touch"
                  onClick={async () => {
                    await deleteDoc(doc(db, "pessoas", modal.pessoaId));
                    toast.success("Pessoa removida!");
                    setModal({ open: false, pessoaId: null });
                  }}
                >
                  Excluir
                </button>
                <button
                  className="bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-white px-6 py-3 sm:py-2.5 rounded-2xl font-bold shadow transition-all duration-200 min-h-touch"
                  onClick={() => setModal({ open: false, pessoaId: null })}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CARD DE STATUS ─────────────────────────────────────────────────────────
function StatusCard({ title, value, icon, gradient }) {
  return (
    <motion.div
      className={"relative rounded-2xl p-4 sm:p-5 md:p-6 bg-gradient-to-br " + gradient + " text-white flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] shadow-lg overflow-hidden group cursor-default"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.02 }}
      layout
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 text-2xl sm:text-3xl mb-1.5 sm:mb-2">{icon}</div>
      <div className="relative z-10 text-responsive-sm sm:text-base font-semibold mb-0.5 sm:mb-1 text-white/80">{title}</div>
      <div className="relative z-10 text-responsive-lg sm:text-xl md:text-2xl font-bold tracking-tight">{value}</div>
    </motion.div>
  );
}

// ─── CARD DE PESSOA ─────────────────────────────────────────────────────────
function PessoaCard({ pessoa, db, uploadComprovante, user, onDelete }) {
  const id = pessoa.id;
  const nome = pessoa.nome || "Sem nome";
  const tipo = pessoa.tipo || "avista";
  const p1 = pessoa.p1 ?? false;
  const p2 = pessoa.p2 ?? false;
  const isAdmin = user?.email === ADM_EMAIL;
  const progresso = tipo === "avista" ? (p1 ? 100 : 0) : ((Number(p1) + Number(p2)) / 2) * 100;

  const handleToggleTipo = async () => {
    const novoTipo = tipo === "avista" ? "parcelado" : "avista";
    await updateDoc(doc(db, "pessoas", id), { tipo: novoTipo, p1: false, p2: false });
    toast.success("Tipo alterado para " + (novoTipo === "avista" ? "à vista" : "parcelado"));
  };

  const handleP1 = async () => {
    const novoValor = p1 === true ? false : true;
    await updateDoc(doc(db, "pessoas", id), { p1: novoValor });
    if (novoValor) {
      toast.success(nome + " - Pagamento " + (tipo === "avista" ? "confirmado!" : "1ª parcela paga!"));
      if (tipo === "avista") {
        enviarWhats("💸 *" + nome + "* quitou tudo à vista!");
      } else {
        enviarWhats("💰 *" + nome + "* pagou a *1ª parcela*!");
      }
    }
  };

  const handleP2 = async () => {
    if (!p1) {
      toast.error("Marque a 1ª parcela primeiro");
      return;
    }
    const novoValor = p2 === true ? false : true;
    await updateDoc(doc(db, "pessoas", id), { p2: novoValor });
    if (novoValor) {
      toast.success(nome + " - 2ª parcela paga! 🎉");
      enviarWhats("💰 *" + nome + "* pagou a *2ª parcela*!");
    }
  };

  const comprovantes = pessoa.comprovantes || [];
  const ultimoComprovante = comprovantes.length > 0 ? comprovantes[comprovantes.length - 1] : null;

  return (
    <motion.div
      className="relative bg-zinc-800 rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-5 border border-zinc-700 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      whileHover={{ scale: 1.005 }}
      layout
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/10 via-cyan-400/5 to-transparent pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-purple-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <AvatarCircle foto={pessoa.foto} nome={nome} size="md" />
        <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-responsive-lg sm:text-xl md:text-2xl font-bold text-white truncate">{nome}</span>
              {isAdmin && (
                <span className="flex-shrink-0 text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl font-medium border border-cyan-400/30">
                  ADM
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleTipo}
            className={"flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-2xl text-responsive-xs sm:text-sm font-semibold shadow border transition-all duration-200 active:scale-95 " + (tipo === "avista" ? "bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-600" : "bg-amber-700 text-white border-amber-600 hover:bg-amber-600")}
          >
            {tipo === "avista" ? "À vista" : "Parcelado"}
          </button>
        </div>
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex gap-2 sm:gap-3 min-w-0 sm:min-w-[160px]">
          <button
            onClick={handleP1}
            className={"flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-bold shadow border transition-all duration-200 text-responsive-sm sm:text-base min-h-touch active:scale-95 " + (p1 ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" : "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600")}
          >
            {tipo === "avista" ? (p1 ? "✓ Pago" : "Pagar") : p1 ? "✓ 1ª" : "Pagar 1ª"}
          </button>
          {tipo === "parcelado" && (
            <button
              onClick={handleP2}
              className={"flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-bold shadow border transition-all duration-200 text-responsive-sm sm:text-base min-h-touch active:scale-95 " + (p2 ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" : "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600")}
            >
              {p2 ? "✓ 2ª" : "Pagar 2ª"}
            </button>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <div className="h-3 sm:h-3.5 md:h-4 bg-zinc-700 rounded-xl overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-green-400 to-emerald-500 rounded-xl relative"
              style={{ width: progresso + "%" }}
              initial={{ width: 0 }}
              animate={{ width: progresso + "%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/20 to-transparent rounded-r-xl" />
            </motion.div>
          </div>
          <span className="text-[10px] sm:text-xs text-zinc-400 mt-1 text-right font-medium">{progresso}%</span>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-zinc-700/50">
        <div className="flex items-center gap-2">
          <label className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-semibold shadow cursor-pointer transition-all duration-200 border border-blue-800 min-h-touch flex items-center text-responsive-xs sm:text-sm gap-1.5">
            {"📎"} Comprovante
            <input type="file" className="hidden" onChange={(e) => uploadComprovante(pessoa, e.target.files[0])} />
          </label>
          {ultimoComprovante && (
            <a href={ultimoComprovante.url} target="_blank" rel="noopener noreferrer" className="text-[11px] sm:text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors">
              Ver último
            </a>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="bg-red-700 hover:bg-red-800 active:bg-red-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold shadow border border-red-800 transition-all duration-200 min-h-touch flex items-center text-responsive-xs sm:text-sm gap-1.5"
          >
            {"🗑"} Excluir
          </button>
        )}
      </div>
    </motion.div>
  );
}