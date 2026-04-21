import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  ExternalLink,
  TrendingUp,
  Wallet,
  Umbrella,
  UserPlus,
  Trash2,
  CheckCircle2,
  Receipt,
  Plus,
} from "lucide-react";

// 🔥 CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDlKU2D66-etmOHtlefViHvx4whRVdRiEE",
  authDomain: "controle-praia-2026.firebaseapp.com",
  projectId: "controle-praia-2026",
  storageBucket: "controle-praia-2026.appspot.com",
  messagingSenderId: "744354320192",
  appId: "1:744354320192:web:da72b446d481158ce834a5"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// 💰 CONFIGURAÇÃO FINANCEIRA
const CONFIG = {
  valorTotal: 1671,
  valorPorPessoa: 209,
  parcela: 104.5,
  participantes: 8,
  parcelas: 2,
};

export default function App() {
    // Função isolada para login Google
    const handleLogin = useCallback(async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        alert('Erro ao fazer login: ' + (e?.message || e));
      }
    }, []);
  const [pessoas, setPessoas] = useState([]);
  const [nome, setNome] = useState("");
  const [isUploading, setIsUploading] = useState(null);
  const [modal, setModal] = useState({ open: false, pessoaId: null });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pessoas"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Fallback: se createdAt não existir, mantém ordem de chegada
      setPessoas(
        lista.sort((a, b) => {
          if (a.createdAt?.seconds && b.createdAt?.seconds) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          if (a.createdAt?.seconds) return -1;
          if (b.createdAt?.seconds) return 1;
          return 0;
        })
      );
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    let pagas = 0;
    let totalEsperado = 0;
    let totalRecebido = 0;

    pessoas.forEach((p) => {
      if (p.tipo === "avista") {
        totalEsperado += 1;
        if (p.p1) { pagas++; totalRecebido += CONFIG.valorPorPessoa; }
      } else {
        totalEsperado += CONFIG.parcelas;
        if (p.p1) { pagas++; totalRecebido += CONFIG.parcela; }
        if (p.p2) { pagas++; totalRecebido += CONFIG.parcela; }
      }
    });

    return {
      totalRecebido,
      falta: CONFIG.valorTotal - totalRecebido,
      progresso: totalEsperado ? (pagas / totalEsperado) * 100 : 0,
      totalPessoas: pessoas.length
    };
  }, [pessoas]);

  const addPessoa = async (e) => {
    e.preventDefault();
    if (!user) return alert('Faça login para adicionar.');
    if (!nome.trim()) return;
    await addDoc(collection(db, "pessoas"), {
      nome,
      tipo: "avista",
      p1: false,
      p2: false,
      comprovantes: [],
      createdAt: serverTimestamp(),
    });
    setNome("");
  };

  const uploadComprovante = async (pessoa, file) => {
    if (!user) return alert('Faça login para modificar.');
    if (!file) return;
    // Validação: tipos permitidos e tamanho (até 5MB)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Envie PDF, JPG ou PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. O limite é 5MB.");
      return;
    }
    setIsUploading(pessoa.id);
    try {
      const storageRef = ref(storage, `comprovantes/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const novos = [...(pessoa.comprovantes || []), { nome: file.name, url }];
      await updateDoc(doc(db, "pessoas", pessoa.id), { comprovantes: novos });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20 font-sans selection:bg-indigo-500/30">
      {/* BOTÃO DE LOGIN DISCRETO */}
      <div className="fixed top-2 right-4 z-50">
        {!user ? (
          <button
            onClick={handleLogin}
            title="Área restrita"
            className="opacity-30 hover:opacity-80 text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300"
          >
            Entrar
          </button>
        ) : (
          <button
            onClick={() => signOut(auth)}
            title={user.email}
            className="opacity-30 hover:opacity-80 text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-emerald-400"
          >
            Sair
          </button>
        )}
      </div>
      {/* GLOW DE FUNDO */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>
      <div className="relative max-w-4xl mx-auto px-6 pt-12">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-widest text-[10px] uppercase mb-2">
              <Umbrella size={14} />
              <span>Verão 2026</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight italic">Controle Financeiro Praia</h1>
          </motion.div>
          <form onSubmit={addPessoa} className="w-full md:w-auto flex bg-zinc-900/50 p-1.5 border border-zinc-800 rounded-2xl backdrop-blur-md">
            <input
              className="bg-transparent border-none focus:ring-0 px-4 py-2 w-full md:w-56 text-sm"
              placeholder="Adicionar nome..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <button className="bg-white text-black hover:bg-zinc-200 p-2.5 rounded-xl transition-all active:scale-95 shadow-lg">
              <Plus size={18} strokeWidth={3} />
            </button>
          </form>
        </header>
        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatCard label="Arrecadado" value={`R$ ${stats.totalRecebido.toFixed(0)}`} icon={<Wallet className="text-emerald-400" size={18} />} progress={stats.progresso} />
          <StatCard label="Faltante" value={`R$ ${stats.falta.toFixed(0)}`} icon={<Receipt className="text-rose-400" size={18} />} progress={100 - stats.progresso} />
          <StatCard label="Membros" value={stats.totalPessoas} icon={<UserPlus className="text-indigo-400" size={18} />} />
        </div>
        {/* LISTA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">Lista de Integrantes</h2>
            <div className="h-px flex-1 bg-zinc-800/50 mx-4" />
          </div>
          <AnimatePresence mode="popLayout">
            {pessoas.map((p) => (
              <MemoPessoaCard
                key={p.id}
                pessoa={p}
                isUploading={isUploading}
                uploadComprovante={uploadComprovante}
                db={db}
                setIsUploading={setIsUploading}
                onRequestDelete={() => setModal({ open: true, pessoaId: p.id })}
              />
            ))}
          </AnimatePresence>
          {/* MODAL DE CONFIRMAÇÃO */}
          {modal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-700 flex flex-col items-center gap-6 min-w-[300px]">
                <div className="text-lg font-bold text-zinc-100">Tem certeza que deseja remover este participante?</div>
                <div className="flex gap-4 mt-2">
                  <button
                    className="px-6 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                    onClick={async () => {
                      await deleteDoc(doc(db, "pessoas", modal.pessoaId));
                      setModal({ open: false, pessoaId: null });
                    }}
                  >Remover</button>
                  <button
                    className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-200 font-bold hover:bg-zinc-600 transition"
                    onClick={() => setModal({ open: false, pessoaId: null })}
                  >Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// --- COMPONENTE PESSOA CARD ---
function PessoaCard({ pessoa, isUploading, uploadComprovante, db, onRequestDelete }) {
  const { id, nome, tipo, p1, p2, comprovantes } = pessoa;
  // Debounce para edição de nome
  const debounceRef = useRef();
  const handleNomeChange = useCallback((e) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateDoc(doc(db, "pessoas", id), { nome: value });
    }, 500);
  }, [db, id]);
  const handleTipo = useCallback((novoTipo) => {
    updateDoc(doc(db, "pessoas", id), { tipo: novoTipo });
  }, [db, id]);
  const handleP1 = useCallback(() => {
    updateDoc(doc(db, "pessoas", id), { p1: !p1 });
  }, [db, id, p1]);
  const handleP2 = useCallback(() => {
    if (!p1) {
      alert('Marque a 1ª parcela antes de marcar a 2ª.');
      return;
    }
    updateDoc(doc(db, "pessoas", id), { p2: !p2 });
  }, [db, id, p2, p1]);
  // Chama o modal de confirmação do App
  const handleDelete = useCallback(() => {
    if (onRequestDelete) onRequestDelete();
  }, [onRequestDelete]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-[24px] hover:border-zinc-700 transition-all shadow-xl"
    >
      <div className="flex flex-col gap-6">
        {/* LINHA 1: NOME E TIPO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <input
            value={nome}
            onChange={handleNomeChange}
            className="bg-transparent text-xl font-bold text-zinc-100 outline-none focus:text-indigo-400 transition-colors"
          />
          <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800 w-fit">
            <TabBtn active={tipo === "avista"} onClick={() => handleTipo("avista")}>À Vista</TabBtn>
            <TabBtn active={tipo === "parcelado"} onClick={() => handleTipo("parcelado")}>Parcelado</TabBtn>
          </div>
        </div>
        {/* LINHA 2: PAGAMENTOS E ANEXOS */}
        <div className="flex flex-wrap items-center gap-3">
          <PaymentBtn 
            active={p1} 
            onClick={handleP1} 
            label={tipo === "avista" ? "Quitar Cota" : "1ª Parcela"}
          />
          {tipo === "parcelado" && (
            <PaymentBtn 
              active={p2} 
              onClick={handleP2}
              label="2ª Parcela"
            />
          )}
          <div className="h-8 w-px bg-zinc-800 mx-2 hidden md:block" />
          {/* BOTÃO UPLOAD CUSTOM */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-all active:scale-95 text-xs font-bold border border-zinc-700/50">
            {isUploading === id ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
            <span>Comprovante</span>
            <input type="file" className="hidden" onChange={(e) => uploadComprovante(pessoa, e.target.files[0])} />
          </label>
          <button 
            onClick={handleDelete}
            className="p-2.5 rounded-xl text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all ml-auto"
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
        {/* COMPROVANTES LISTA */}
        {comprovantes?.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-black/20 rounded-2xl border border-zinc-800/30">
            {comprovantes.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors">
                <FileText size={12} className="text-indigo-400" />
                <span className="max-w-[120px] truncate">{c.nome}</span>
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
const MemoPessoaCard = memo(PessoaCard);

// --- COMPONENTES AUXILIARES ---

function StatCard({ label, value, icon, progress }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[24px] backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
        <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">{icon}</div>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      {progress !== undefined && (
        <div className="mt-4 w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="bg-indigo-500 h-full" />
        </div>
      )}
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
        active ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function PaymentBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
        active 
        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
        : "bg-zinc-800/30 border-zinc-800/80 text-zinc-500 hover:border-zinc-700"
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        active ? "bg-emerald-500 border-emerald-500" : "border-zinc-700"
      }`}>
        {active && <Check size={12} className="text-zinc-900" strokeWidth={4} />}
      </div>
      <span className="text-xs font-black uppercase tracking-tight">{label}</span>
    </button>
  );
}