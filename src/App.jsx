
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
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

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}


// Utilitário para formatar valores com ponto nos milhares
function formatValor(valor) {
  return valor.toLocaleString('pt-BR');
}

// 🔥 CONFIG FIREBASE
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

// 🔥 CONFIG
const CONFIG = {
  valorTotal: 1671,
  valorPorPessoa: 209,
  parcela: 104.5,
};

// 🔥 ADMIN
const ADM_EMAIL = "gpiloto35@gmail.com";

// 🔥 WHATS (desativado pra não bugar)
const enviarWhats = async () => {};


export default function App() {
    console.log('App renderizou!');
  const [pessoas, setPessoas] = useState([]);
  const [nome, setNome] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [modal, setModal] = useState({ open: false, pessoaId: null });
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pessoas"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || "Sem nome",
        tipo: doc.data().tipo || "avista",
        p1: doc.data().p1 ?? false,
        p2: doc.data().p2 ?? false,
        comprovantes: doc.data().comprovantes || [],
        historico: doc.data().historico || [],
        foto: doc.data().foto || null
      }));
      setPessoas(lista);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    let total = 0;
    pessoas.forEach(p => {
      if (p.tipo === "avista") {
        if (p.p1) total += CONFIG.valorPorPessoa;
      } else {
        if (p.p1) total += CONFIG.parcela;
        if (p.p2) total += CONFIG.parcela;
      }
    });
    return {
      total,
      falta: CONFIG.valorTotal - total
    };
  }, [pessoas]);

  const addPessoa = async (e) => {
    e.preventDefault();
    if (!user) return alert("Faça login");
    if (!nome.trim()) return;
    let fotoUrl = null;
    if (fotoFile) {
      try {
        const storageRef = ref(storage, `fotos/${Date.now()}-${fotoFile.name}`);
        await uploadBytes(storageRef, fotoFile);
        fotoUrl = await getDownloadURL(storageRef);
      } catch (err) {
        alert("Erro ao fazer upload da foto");
      }
    }
    await addDoc(collection(db, "pessoas"), {
      nome,
      foto: fotoUrl,
      tipo: "avista",
      p1: false,
      p2: false,
      comprovantes: [],
      historico: [],
      createdAt: serverTimestamp()
    });
    setNome("");
    setFotoFile(null);
  };

  const uploadComprovante = async (pessoa, file) => {
    if (!file) return;
    try {
      const storageRef = ref(storage, `comp/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "pessoas", pessoa.id), {
        comprovantes: [
          ...(pessoa.comprovantes || []),
          { nome: file.name, url }
        ]
      });
    } catch (err) {
      console.log("Erro upload:", err);
    }
  };

  // Layout principal
  return (
    <div className="relative min-h-screen bg-zinc-900 flex flex-col overflow-hidden">
      {/* Fallback visual para debug */}
      <div className="fixed top-2 left-2 z-50 bg-red-600 text-white px-3 py-1 rounded-xl text-xs shadow-lg">App carregado</div>
      {/* ANIMAÇÃO DEGRADÊ PRAIANO + bolhas das pessoas */}
      <AnimatedBeachBackground pessoas={pessoas} />
      {/* HEADER */}
      <header className="w-full py-8 bg-black shadow-lg shadow-zinc-900/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Controle Financeiro Praia</h1>
          <button
            onClick={handleLogin}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-2xl shadow transition font-semibold border border-zinc-700"
          >
            {user ? user.email : "Login"}
          </button>
        </div>
      </header>

      {/* CONTEÚDO CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-2">
        <div className="w-full max-w-4xl mx-auto">
          {/* FORM ADICIONAR */}
          <form
            onSubmit={addPessoa}
            className="flex flex-wrap gap-3 mb-8 items-center bg-zinc-800 p-4 rounded-2xl shadow-lg shadow-zinc-950/30"
          >
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Adicionar pessoa..."
              className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl outline-none border border-zinc-700 focus:border-blue-500 text-lg shadow"
            />
            {/* Upload de foto só para ADM */}
            {user?.email === ADM_EMAIL && (
              <label className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-2xl font-semibold shadow cursor-pointer transition border border-blue-800">
                Foto PNG
                <input
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={e => setFotoFile(e.target.files[0])}
                />
              </label>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow transition"
            >
              +
            </button>
          </form>

          {/* CARDS DE STATUS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatusCard
              title="Arrecadado"
              value={`R$ ${formatValor(stats.total)}`}
              icon="💰"
              color="from-green-500 to-green-700"
            />
            <StatusCard
              title="Faltante"
              value={`R$ ${formatValor(stats.falta > 0 ? stats.falta : 0)}`}
              icon="🧾"
              color="from-yellow-500 to-yellow-700"
            />
            <StatusCard
              title="Membros"
              value={pessoas.length}
              icon="👥"
              color="from-blue-500 to-blue-700"
            />
          </div>

          {/* LISTA DE PESSOAS */}
          <div className="space-y-6">
            <AnimatePresence>
              {pessoas.map(p => (
                <PessoaCard
                  key={p.id}
                  pessoa={p}
                  db={db}
                  uploadComprovante={uploadComprovante}
                  user={user}
                  onDelete={() => setModal({ open: true, pessoaId: p.id })}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* MODAL DELETAR */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center border border-zinc-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-white">Confirmar exclusão?</h2>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-2xl font-bold shadow mr-2"
                onClick={async () => {
                  await deleteDoc(doc(db, "pessoas", modal.pessoaId));
                  setModal({ open: false, pessoaId: null });
                }}
              >
                Excluir
              </button>
              <button
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-2xl font-bold shadow"
                onClick={() => setModal({ open: false, pessoaId: null })}
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// CARD DE STATUS
function StatusCard({ title, value, icon, color }) {
  return (
    <motion.div
      className={`rounded-2xl shadow-lg p-6 bg-gradient-to-br ${color} text-white flex flex-col items-center justify-center min-h-[120px]`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </motion.div>
  );
}

// CARD DE PESSOA
function PessoaCard({ pessoa, db, uploadComprovante, user, onDelete }) {
  // Segurança contra undefined
  const id = pessoa.id;
  const nome = pessoa.nome || "Sem nome";
  const tipo = pessoa.tipo || "avista";
  const p1 = pessoa.p1 ?? false;
  const p2 = pessoa.p2 ?? false;
  const isAdmin = user?.email === ADM_EMAIL;

  // Progresso
  const progresso =
  tipo === "avista"
    ? (p1 ? 100 : 0)
    : ((Number(p1) + Number(p2)) / 2) * 100;

  // Toggle tipo
  const handleToggleTipo = async () => {
  const novoTipo = tipo === "avista" ? "parcelado" : "avista";

  await updateDoc(doc(db, "pessoas", id), {
    tipo: novoTipo,
    p1: false,
    p2: false
  });
};

  // Pagar 1
  const handleP1 = async () => {
    const novoValor = p1 === true ? false : true;
    await updateDoc(doc(db, "pessoas", id), { p1: novoValor });
    if (novoValor) {
      if (tipo === "avista") {
        enviarWhats(`💸 *${nome}* quitou tudo à vista!`);
      } else {
        enviarWhats(`💰 *${nome}* pagou a *1ª parcela*!`);
      }
    }
  };

  // Pagar 2
  const handleP2 = async () => {
    if (!p1) {
      alert("Marque a 1ª parcela primeiro");
      return;
    }
    const novoValor = p2 === true ? false : true;
    await updateDoc(doc(db, "pessoas", id), { p2: novoValor });
    if (novoValor) {
      enviarWhats(`💰 *${nome}* pagou a *2ª parcela*!`);
    }
  };

  // Animação framer-motion
  return (
    <motion.div
      className="bg-zinc-800 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center gap-6 border border-zinc-700"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
    >
      {/* Nome e tipo */}
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-bold text-white truncate">{nome}</span>
          {isAdmin && <span className="ml-2 text-xs bg-blue-700 text-white px-2 py-1 rounded-xl">ADM</span>}
        </div>
        <button
          onClick={handleToggleTipo}
          className={`px-4 py-1 rounded-2xl text-sm font-semibold shadow border transition
            ${tipo === "avista"
              ? "bg-green-700 text-white border-green-800 hover:bg-green-800"
              : "bg-yellow-700 text-white border-yellow-800 hover:bg-yellow-800"}
          `}
        >
          {tipo === "avista" ? "À vista" : "Parcelado"}
        </button>
      </div>

      {/* Botões de pagamento */}
      <div className="flex flex-col gap-2 min-w-[120px]">
        <button
          onClick={handleP1}
          className={`px-4 py-2 rounded-2xl font-bold shadow border transition text-lg
            ${p1
              ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
              : "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"}
          `}
        >
          {tipo === "avista" ? (p1 ? "Pago" : "Pagar") : (p1 ? "Pago 1ª" : "Pagar 1ª")}
        </button>
        {tipo === "parcelado" && (
          <button
            onClick={handleP2}
            className={`px-4 py-2 rounded-2xl font-bold shadow border transition text-lg
              ${p2
                ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                : "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"}
            `}
          >
            {p2 ? "Pago 2" : "Pagar 2ª"}
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="flex flex-col justify-center min-w-[120px] w-full max-w-[200px]">
        <div className="h-4 bg-zinc-700 rounded-xl overflow-hidden shadow-inner">
          <div
            className="h-4 bg-gradient-to-r from-green-400 to-green-700 rounded-xl transition-all duration-500"
            style={{ width: progresso + "%" }}
          />
        </div>
        <div className="text-xs text-zinc-300 mt-1 text-center">{progresso}%</div>
      </div>

      {/* Upload comprovante */}
      <div className="flex flex-col items-center gap-2 min-w-[120px]">
        <label className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-2xl font-semibold shadow cursor-pointer transition border border-blue-800">
          Upload
          <input
            type="file"
            className="hidden"
            onChange={e => uploadComprovante(pessoa, e.target.files[0])}
          />
        </label>
        {pessoa.comprovantes && pessoa.comprovantes.length > 0 && (
          <a
            href={pessoa.comprovantes[pessoa.comprovantes.length - 1].url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 underline mt-1"
          >
            Ver último
          </a>
        )}
      </div>

      {/* Excluir (admin) */}
      {isAdmin && (
        <button
          onClick={onDelete}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-2xl font-bold shadow border border-red-800 transition min-w-[100px]"
        >
          Excluir
        </button>
      )}
    </motion.div>
  );
}