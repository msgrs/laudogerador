
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  Zap, 
  Plus, 
  History, 
  Trash2, 
  PenTool, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  Activity, 
  Gauge, 
  ZapOff, 
  Fuel, 
  HelpCircle, 
  Terminal, 
  Copy, 
  X, 
  Phone, 
  Settings,
  Mail,
  FileText,
  AlertCircle,
  Droplets,
  Clock,
  Target,
  MessageSquare,
  Lock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  User as UserIcon,
  UserCheck,
  Wifi,
  WifiOff,
  Database,
  RefreshCcw,
  Code,
  Bug,
  ChevronRight,
  KeyRound,
  Info,
  AlertTriangle,
  Download,
  Server,
  Send,
  AtSign,
  FileDown,
  Check,
  Edit
} from 'lucide-react';
import { createClient, User } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// LISTA DE ADMINISTRADORES (emails que podem ver debug)===============================
const ADMIN_USERS = [
  'mgoulart@eccosalva-rs.com.br',
  // Adicione outros emails depois: 'outro@email.com'
];

// Função para verificar se usuário é admin
const isAdminUser = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_USERS.includes(email.toLowerCase());
};

// Configurações do Supabase
const SUPABASE_URL = 'https://ptcqgenxmbydpxxasyba.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YSDHf2LguEOWtbYxI02B0g_CqAqa6tT';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Interface LaudoData
interface LaudoData {
  id?: string;
  cliente?: string;
  data?: string;
  oleo_visual?: string;
  agua_visual?: string;
  vent_visual?: string;
  correias_visual?: string;
  rpm?: number;
  pressao_bar?: number;
  temp_antes?: number;
  temp_depois?: number;
  vbat?: number;
  comb_percent?: number;
  comb_litros?: number;
  gen_l1n?: number;
  gen_l2n?: number;
  gen_l3n?: number;
  gen_l1l2?: number;
  gen_l2l3?: number;
  gen_l3l1?: number;
  red_l1n?: number;
  red_l2n?: number;
  red_l3n?: number;
  red_l1l2?: number;
  red_l2l3?: number;
  red_l3l1?: number;
  frequencia?: number;
  assinatura?: string;
  observacoes?: string;
  created_at?: string;
  user_id?: string;
  pdf_url?: string;
  processado_em?: string;
}

// Interface para as características
interface CaracteristicasGerador {
  tipo: string;
  inicio_operacao: string;
  motor: string;
  serie_motor: string;
  gerador: string;
  controlador: string;
  oleo_motor: string;
  oleo_diesel: string;
  stemac: string;
  telefone_suporte: string;
  codigo_cliente: string;
}

// SQL Script Atualizado para o Usuário (Reparo de Banco Completo)
const SQL_SETUP = `-- 1. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.perfis (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email_destino text,
  phone text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela de Configuração SMTP
CREATE TABLE IF NOT EXISTS public.config_smtp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  host text,
  port integer,
  username text,
  password text,
  from_email text,
  use_ssl boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela de Laudos (Base) - COM CAMPO pdf_url
CREATE TABLE IF NOT EXISTS public.laudos (
  id text PRIMARY KEY,
  cliente text,
  data text,
  oleo_visual text DEFAULT 'Bom'::text,
  agua_visual text DEFAULT 'Bom'::text,
  vent_visual text DEFAULT 'Bom'::text,
  correias_visual text DEFAULT 'Bom'::text,
  rpm numeric,
  pressao_bar numeric,
  temp_antes numeric,
  temp_depois numeric,
  vbat numeric,
  comb_percent numeric,
  comb_litros numeric,
  gen_l1n numeric, gen_l2n numeric, gen_l3n numeric,
  gen_l1l2 numeric, gen_l2l3 numeric, gen_l3l1 numeric,
  red_l1n numeric, red_l2n numeric, red_l3n numeric,
  red_l1l2 numeric, red_l2l3 numeric, red_l3l1 numeric,
  frequencia numeric,
  assinatura text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pdf_url text,
  processado_em timestamp with time zone
);

-- 4. Políticas de Segurança (RLS)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_smtp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso Total Perfil') THEN
    CREATE POLICY "Acesso Total Perfil" ON public.perfis FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso Total SMTP') THEN
    CREATE POLICY "Acesso Total SMTP" ON public.config_smtp FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso Total Laudos') THEN
    CREATE POLICY "Acesso Total Laudos" ON public.laudos FOR ALL USING (auth.uid() = user_id);
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- 5. Tabela de Características Técnicas dos Geradores
CREATE TABLE IF NOT EXISTS public.caracteristicas_gerador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text,
  inicio_operacao text,
  motor text,
  serie_motor text,
  gerador text,
  controlador text,
  oleo_motor text,
  oleo_diesel text,
  stemac text,
  telefone_suporte text,
  codigo_cliente text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Política de segurança
ALTER TABLE public.caracteristicas_gerador ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acesso Total Caracteristicas') THEN
    CREATE POLICY "Acesso Total Caracteristicas" ON public.caracteristicas_gerador 
    FOR ALL USING (auth.uid() = user_id);
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;`;

// ==================================================================================
// --- PDF GENERATION ENGINE (LOCAL) - VERSÃO OTIMIZADA ---
const generatePDF = (data: LaudoData & { hora?: string }, nomeTecnico?: string) => {
  try {
    const doc = new jsPDF();
    const bluePrimary: [number, number, number] = [0, 51, 153];
    
    doc.setProperties({
      title: `Laudo - ${data.cliente || 'Técnico'}`,
      subject: 'Relatório Técnico de Manutenção',
      author: nomeTecnico || 'Sistema',
      creator: 'LAUDOGERADOR v2.0'
    });
    
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
    doc.text("LAUDOGERADOR", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("RELATÓRIO TÉCNICO DE MANUTENÇÃO E PERFORMANCE", 105, 23, { align: "center" });
    
    autoTable(doc, {
      startY: 35,
      head: [['DADOS DO ATENDIMENTO', 'VALOR']],
      body: [
        ['ID do Laudo', data.id || 'N/A'],
        ['Data / Hora', `${data.data || ''} ${data.hora || ''}`],
        ['Cliente / Unidade', data.cliente ? data.cliente.toUpperCase() : '---'],
        ['Técnico Responsável', nomeTecnico || 'NÃO INFORMADO'],
      ],
      theme: 'striped',
      headStyles: { fillColor: bluePrimary },
      margin: { left: 15, right: 15 },
      tableWidth: 180
    });
    
    let currentY = (doc as any).lastAutoTable?.finalY || 60;
    
    autoTable(doc, {
      startY: currentY,
      head: [['VERIFICAÇÃO VISUAL', 'ESTADO']],
      body: [
        ['Nível de Óleo Lubrificante', data.oleo_visual || 'N/A'],
        ['Nível de Água / Arrefecimento', data.agua_visual || 'N/A'],
        ['Ventilação / Radiador', data.vent_visual || 'N/A'],
        ['Estado das Correias', data.correias_visual || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 15 },
      tableWidth: 85,
      styles: { fontSize: 9 }
    });
    
    autoTable(doc, {
      startY: currentY,
      head: [['PARÂMETROS DO MOTOR', 'MEDIDO']],
      body: [
        ['Rotação (RPM)', `${data.rpm || 'N/A'} RPM`],
        ['Pressão de Óleo', `${data.pressao_bar || 'N/A'} Bar`],
        ['Temperatura Antes/Depois', `${data.temp_antes || 'N/A'}ºC / ${data.temp_depois || 'N/A'}ºC`],
        ['Tensão Bateria (VDC)', `${data.vbat || 'N/A'}V`],
        ['Nível Combustível (%)', `${data.comb_percent || 'N/A'}%`],
        ['Nível Combustível (Litros)', `${data.comb_litros || 'N/A'}L`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 110 },
      tableWidth: 85,
      styles: { fontSize: 9 }
    });
    
    const finalYLeft = (doc as any).lastAutoTable?.finalY || currentY;
    
    autoTable(doc, {
      startY: currentY,
      head: [['PARÂMETROS DO MOTOR', 'MEDIDO']],
      body: [
        ['Rotação (RPM)', `${data.rpm || 'N/A'} RPM`],
        ['Pressão de Óleo', `${data.pressao_bar || 'N/A'} Bar`],
        ['Temperatura Antes/Depois', `${data.temp_antes || 'N/A'}ºC / ${data.temp_depois || 'N/A'}ºC`],
        ['Tensão Bateria (VDC)', `${data.vbat || 'N/A'}V`],
        ['Nível Combustível (%)', `${data.comb_percent || 'N/A'}%`],
        ['Nível Combustível (Litros)', `${data.comb_litros || 'N/A'}L`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 110 },
      tableWidth: 85,
      styles: { fontSize: 9 }
    });
    
    const finalYRight = (doc as any).lastAutoTable?.finalY || currentY;
    const nextY = Math.max(finalYLeft, finalYRight) + 10;
    
    autoTable(doc, {
      startY: nextY,
      head: [['MEDIÇÃO ELÉTRICA', 'GERADOR (V)', 'REDE (V)']],
      body: [
        ['L1 - Neutro', data.gen_l1n || 'N/A', data.red_l1n || 'N/A'],
        ['L2 - Neutro', data.gen_l2n || 'N/A', data.red_l2n || 'N/A'],
        ['L3 - Neutro', data.gen_l3n || 'N/A', data.red_l3n || 'N/A'],
        ['L1 - L2', data.gen_l1l2 || 'N/A', data.red_l1l2 || 'N/A'],
        ['L2 - L3', data.gen_l2l3 || 'N/A', data.red_l2l3 || 'N/A'],
        ['L3 - L1', data.gen_l3l1 || 'N/A', data.red_l3l1 || 'N/A'],
        ['Frequência (Hz)', `${data.frequencia || 'N/A'} Hz`, '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
      margin: { left: 15, right: 15 },
      tableWidth: 180,
      styles: { fontSize: 9 }
    });
    
    if (data.observacoes && data.observacoes.trim()) {
      const pageHeight = 297;
      const obsY = (doc as any).lastAutoTable?.finalY || 160;
      const spaceNeeded = 40;
      const minFooterSpace = 60;
      
      if (obsY + spaceNeeded > pageHeight - minFooterSpace) {
        doc.addPage();
        (doc as any).lastAutoTable = { finalY: 20 };
      }
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY || 160,
        head: [['OBSERVAÇÕES TÉCNICAS']],
        body: [[data.observacoes]],
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139] },
        margin: { left: 15, right: 15 },
        tableWidth: 180,
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          minCellHeight: 8
        },
        columnStyles: {
          0: { cellWidth: 180 }
        }
      });
    }
    
    const pageHeight = 297;
    currentY = (doc as any).lastAutoTable?.finalY || 160;
    const signatureSpaceNeeded = 50;
    
    if (currentY + signatureSpaceNeeded > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY += 5;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("ASSINATURA DO RESPONSÁVEL:", 105, currentY, { align: "center" });
    
    if (data.assinatura) {
      try {
        const imgHeight = 18;
        const imgWidth = 80;
        const yPos = currentY + 4;
        const xPos = (210 - imgWidth) / 2;
        
        doc.addImage(data.assinatura, 'PNG', xPos, yPos, imgWidth, imgHeight);
        doc.line(xPos, yPos + imgHeight + 1, xPos + imgWidth, yPos + imgHeight + 1);
        currentY = yPos + imgHeight + 5;
      } catch (err) {
        doc.text("[Assinatura Digital]", 105, currentY + 10, { align: "center" });
        currentY += 15;
      }
    } else {
      doc.text("[Assinatura não disponível]", 105, currentY + 10, { align: "center" });
      currentY += 15;
    }
    
    let footerY = pageHeight - 15;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    if (nomeTecnico) {
      doc.text(nomeTecnico.toUpperCase(), 105, footerY, { align: "center" });
      footerY += 5;
    }
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Gerado por LAUDOGERADOR v2.0 • ${new Date().toLocaleString('pt-BR')}`, 
              105, footerY + 4, { align: "center" });
    
    return doc;
  } catch (err) {
    console.error("PDF Engine Error:", err);
    return null;
  }
};

// --- Authentication Screen ---

interface AuthScreenProps {
  onDemoMode: () => void;
}

function AuthScreen({ onDemoMode }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMsg('E-mail ou senha incorretos. Caso ainda não tenha uma conta, clique em "Registrar".');
          } else if (error.message.toLowerCase().includes('email not confirmed')) {
            setErrorMsg('E-mail não confirmado. Verifique sua caixa de entrada.');
          } else if (error.message.toLowerCase().includes('failed to fetch')) {
            setErrorMsg('Erro de conexão. Verifique sua internet ou se o serviço está disponível.');
          } else {
            setErrorMsg(error.message);
          }
          throw error;
        }
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              nome: email.split('@')[0],
              full_name: email.split('@')[0]
            }
          }
        });
        if (error) {
          setErrorMsg(error.message);
          throw error;
        }
        setSuccessMsg("Conta registrada! Se o e-mail de confirmação estiver ativo, verifique sua caixa de entrada antes de entrar.");
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) {
          setErrorMsg(error.message);
          throw error;
        }
        setSuccessMsg("Link de recuperação enviado para seu e-mail.");
        setMode('login');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message === 'Failed to fetch') {
        setErrorMsg("Não foi possível conectar ao servidor. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="text-slate-900" size={32} />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">LAUDO<span className="text-yellow-500">GERADOR</span></h1>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">Portal do Técnico</p>
          </div>
          <Zap className="absolute -bottom-6 -right-6 text-white/5 w-40 h-40 rotate-12" />
        </div>

        <div className="p-8">
          {mode !== 'forgot' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button 
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Registrar
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
              <div className="flex-1">
                <p className="text-[11px] font-black text-red-700 uppercase leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={18} />
              <div className="flex-1">
                <p className="text-[11px] font-black text-green-700 uppercase leading-tight">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail</label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="email" 
                  placeholder="tecnico@empresa.com.br" 
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? <LogIn size={18} /> : (mode === 'register' ? <UserPlus size={18} /> : <RefreshCw size={18} />))}
              {mode === 'login' ? "Acessar Menu" : (mode === 'register' ? "Criar Acesso" : "Resetar Senha")}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            {mode === 'login' ? (
              <button 
                onClick={() => setMode('forgot')}
                className="text-[10px] font-black uppercase text-blue-600 hover:underline mx-auto"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button 
                onClick={() => setMode('login')}
                className="text-[10px] font-black uppercase text-slate-400 hover:underline mx-auto"
              >
                Voltar para Login
              </button>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Ou</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button 
              onClick={onDemoMode}
              className="w-full py-3 border-2 border-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Activity size={14} className="text-yellow-500" />
              Entrar em Modo Demonstração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Perfil Tab ---
function PerfilTab({ user, onComplete }: { user: User, onComplete: () => Promise<void> }) {
  const [nome, setNome] = useState('');
  const [phone, setPhone] = useState('');
  const [emailDestino, setEmailDestino] = useState('');
  const [changePasswordEnabled, setChangePasswordEnabled] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (user.id === 'demo-user-id') {
        setNome('Técnico Demo');
        setEmailDestino('demo@exemplo.com');
        setPhone('51999999999');
        setFetching(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('perfis')
          .select('nome, email_destino, phone')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setNome(data.nome || '');
          setEmailDestino(data.email_destino || '');
          setPhone(data.phone || '');
        } else {
          const meta = user.user_metadata;
          if (meta) {
            setNome(meta.nome || meta.full_name || '');
            setEmailDestino(meta.email_destino || '');
            setPhone(meta.phone || '');
          }
        }
      } catch (err) {
        console.warn("Perfil não carregado, usando metadados.");
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [user.id, user.user_metadata]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (user.id === 'demo-user-id') {
      alert("✅ Perfil de demonstração simulado!");
      await onComplete();
      return;
    }
    setFormError(null);
    
    if (!nome.trim()) {
      setFormError("O campo NOME DO TÉCNICO é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const { error: authMetaError } = await supabase.auth.updateUser({
        data: { 
          nome: nome.trim(), 
          email_destino: emailDestino.trim(), 
          phone: phone.trim() 
        }
      });
      if (authMetaError) throw authMetaError;

      const { error: dbError } = await supabase
        .from('perfis')
        .upsert({ 
          user_id: user.id, 
          nome: nome.trim(), 
          email_destino: emailDestino.trim(), 
          phone: phone.trim()
        }, { 
          onConflict: 'user_id' 
        });
      
      if (dbError) throw dbError;

      if (changePasswordEnabled) {
        if (!oldPassword.trim()) throw new Error("A senha anterior é obrigatória.");
        if (newPassword.trim().length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
        if (newPassword !== confirmPassword) throw new Error("As novas senhas não coincidem.");

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: oldPassword,
        });

        if (verifyError) throw new Error("A senha anterior está incorreta.");

        const { error: authPassError } = await supabase.auth.updateUser({ password: newPassword });
        if (authPassError) throw authPassError;

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordEnabled(false);
      }

      alert("✅ Perfil atualizado com sucesso!");
      await onComplete(); 
    } catch (err: any) {
      console.error("Erro no perfil:", err);
      setFormError(err.message || "Erro ao processar alterações.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <SectionDivider text="Meu Perfil" colorClass="bg-slate-800" icon={UserIcon} />
      
      <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        {formError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <div className="flex-1">
               <p className="text-[11px] font-black text-red-700 uppercase leading-tight">{formError}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome do Técnico</label>
          <div className="relative mt-1">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Ex: Marcelo Goulart" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone / WhatsApp</label>
          <div className="relative mt-1">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="51981070850" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mails de Envio (Separe por vírgula para múltiplos)</label>
          <div className="relative mt-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="cliente1@exemplo.com, cliente2@exemplo.com" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
            />
          </div>
        </div>

        {user.id !== 'demo-user-id' && (
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <input 
                type="checkbox" 
                id="enablePasswordChange"
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={changePasswordEnabled}
                onChange={(e) => setChangePasswordEnabled(e.target.checked)}
              />
              <label htmlFor="enablePasswordChange" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer select-none">
                Alterar minha senha de acesso
              </label>
            </div>

            {changePasswordEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha Anterior</label>
                  <div className="relative mt-1">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                     <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-red-400 transition-all font-bold text-slate-800 text-sm"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nova Senha</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input 
                      type="password" 
                      placeholder="Mín. 6" 
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirmar</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          Salvar Alterações e Voltar
        </button>
      </form>
    </div>
  );
}

// --- SMTP Config Tab ---
function SmtpTab({ user, onComplete, onTest }: { user: User, onComplete: () => Promise<void>, onTest: (config: any) => Promise<void> }) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [useSsl, setUseSsl] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSmtp() {
      if (user.id === 'demo-user-id') {
        setHost('smtp.exemplo.com');
        setPort(587);
        setUsername('tecnico@exemplo.com');
        setFromEmail('laudos@laudogerador.com');
        setFetching(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('config_smtp')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setHost(data.host || '');
          setPort(data.port || '');
          setUsername(data.username || '');
          setPassword(data.password || '');
          setFromEmail(data.from_email || '');
          setUseSsl(data.use_ssl ?? true);
        }
      } catch (err) {
        console.warn("Configurações SMTP não carregadas.");
      } finally {
        setFetching(false);
      }
    }
    fetchSmtp();
  }, [user.id]);

  const handleUpdateSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (user.id === 'demo-user-id') {
      alert("✅ Configurações SMTP de demonstração simuladas!");
      await onComplete();
      return;
    }
    setFormError(null);
    setLoading(true);

    try {
      const { error: dbError } = await supabase
        .from('config_smtp')
        .upsert({ 
          user_id: user.id, 
          host,
          port: port === '' ? null : Number(port),
          username,
          password,
          from_email: fromEmail,
          use_ssl: useSsl,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });
      
      if (dbError) throw dbError;

      alert("✅ SMTP atualizado com sucesso!");
      await onComplete(); 
    } catch (err: any) {
      console.error("Erro no SMTP:", err);
      setFormError(err.message || "Erro ao salvar configurações SMTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await onTest({ host, port, username, password, fromEmail, useSsl });
    setTesting(false);
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <SectionDivider text="Config. SMTP" colorClass="bg-cyan-800" icon={Server} />
      
      <form onSubmit={handleUpdateSmtp} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        {formError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <div className="flex-1">
               <p className="text-[11px] font-black text-red-700 uppercase leading-tight">{formError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Servidor SMTP (Host)</label>
            <div className="relative mt-1">
              <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="smtp.gmail.com" 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Porta</label>
            <div className="relative mt-1">
              <input 
                type="number" 
                placeholder="587" 
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800 text-center"
                value={port}
                onChange={(e) => setPort(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Usuário SMTP</label>
          <div className="relative mt-1">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="exemplo@gmail.com" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha SMTP</label>
          <div className="relative mt-1">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail do Remetente (From)</label>
          <div className="relative mt-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="email" 
              placeholder="no-reply@empresa.com.br" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input 
            type="checkbox" 
            id="useSsl"
            className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            checked={useSsl}
            onChange={(e) => setUseSsl(e.target.checked)}
          />
          <label htmlFor="useSsl" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer select-none">
            Utilizar Conexão Segura (SSL/TLS)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={handleTest}
            disabled={testing || loading}
            className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="text-blue-500" />}
            Testar Envio
          </button>
          <button 
            type="submit" 
            disabled={loading || testing}
            className="w-full py-4 bg-cyan-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Salvar SMTP
          </button>
        </div>
      </form>
      
      <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={16} className="text-yellow-600" />
          <p className="text-[10px] font-black uppercase text-yellow-700">PRECISA DE AJUDA COM SMTP?</p>
        </div>
        <ul className="text-[9px] text-yellow-600 font-bold space-y-2 ml-2">
          <li className="flex items-start gap-2">
            <span className="text-yellow-700">•</span>
            <span><strong>Gmail:</strong> Ative "Verificação em 2 etapas" e crie uma "Senha de App" (16 caracteres)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-700">•</span>
            <span><strong>Outlook/Hotmail:</strong> Permita "Apps menos seguros" nas configurações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-700">•</span>
            <span><strong>Empresas:</strong> Use SMTP corporativo (ex: smtp.empresa.com.br)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-700">•</span>
            <span>Consulte as <button onClick={() => {/* Abrir FAQ */}} className="underline font-black">FAQs</button> para tutoriais completos</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active, onClick, isAction }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? (isAction ? 'bg-green-600 text-white font-bold' : 'bg-yellow-500 text-slate-900 font-bold') 
          : 'hover:bg-slate-800 text-slate-400'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SectionDivider({ text, colorClass, icon: Icon }: any) {
  return (
    <div className={`w-full py-5 ${colorClass} text-white rounded-2xl mb-8 shadow-lg flex items-center justify-center gap-4 border-b-4 border-black/10 px-6 text-center animate-in fade-in slide-in-from-bottom-2`}>
      {Icon && <Icon size={24} className="flex-shrink-0" />}
      <span className="font-black uppercase text-base sm:text-lg tracking-widest leading-tight">{text}</span>
    </div>
  );
}

function FieldGroup({ title, colorClass, children, icon: Icon, id, bodyBg }: any) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 scroll-mt-24">
      <div className={`${colorClass} p-3 flex items-center justify-center gap-3 text-white font-black uppercase text-[11px] tracking-widest`}>
        {Icon && <Icon size={14}/>}
        {title}
      </div>
      <div className={`p-5 space-y-4 ${bodyBg || 'bg-slate-50/30'}`}>
        {children}
      </div>
    </div>
  );
}

function VoltageInput({ label, value, onChange, placeholder, required, showErrors, fieldId }: any) {
  const isInvalid = showErrors && required && (value === undefined || value === null || value === '' || isNaN(value));
  return (
    <div id={fieldId} className="flex flex-col gap-1 scroll-mt-24">
      <div className="flex justify-between items-center px-1">
        <label className={`text-[10px] font-black uppercase ${isInvalid ? 'text-red-500' : 'text-slate-500'}`}>
          {label} {required && '*'}
        </label>
      </div>
      <input 
        type="number" 
        placeholder={placeholder || '---'}
        className={`w-full p-2.5 border-2 rounded-xl bg-white text-center font-bold text-slate-800 outline-none transition-all shadow-sm ${isInvalid ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  );
}

function ToggleState({ label, value, onChange, color }: any) {
  const isGood = value === 'Bom';
  const activeColor = color || 'bg-slate-400';
  
  return (
    <div 
      onClick={() => onChange(isGood ? 'Ruim' : 'Bom')}
      className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all shadow-sm cursor-pointer select-none space-y-3 ${isGood ? 'bg-white border-slate-200' : 'bg-red-600 border-red-700'}`}
    >
      <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg uppercase transition-colors tracking-widest ${isGood ? `${activeColor} text-white` : 'bg-white text-red-600'}`}>
        {label}
      </span>
      
      <button 
        type="button"
        className={`w-12 h-7 rounded-full relative transition-all shadow-inner ${isGood ? 'bg-green-500' : 'bg-red-400'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isGood ? 'left-6' : 'left-1'}`}></div>
      </button>

      <div className={`mt-1 px-3 py-1 rounded-md border-2 ${isGood ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-400 bg-red-100 text-red-800'}`}>
        <span className="text-[10px] font-black uppercase tracking-tighter">
          {isGood ? 'BOM' : 'RUIM'}
        </span>
      </div>
    </div>
  );
}

// --- Modais (Modals) ---

// Interface para especificações técnicas
interface TechSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: CaracteristicasGerador | null; 
  onEdit: () => void; 
  isDemoMode: boolean;
}

function TechSpecsModal({ isOpen, onClose, specs, onEdit, isDemoMode }: TechSpecsModalProps) {
  if (!isOpen) return null;
  
  const displaySpecs = isDemoMode ? {
    tipo: 'Gerador de Eletricidade Standby',
    inicio_operacao: '15/03/2022',
    motor: 'Cummins QSK60',
    serie_motor: 'CMM-2022-7890',
    gerador: 'STANDBY-300KVA',
    controlador: 'DSE 8610 MKII',
    oleo_motor: '15W40 API CI-4 Sintético',
    oleo_diesel: 'S10 Premium',
    stemac: 'ST0220034567',
    telefone_suporte: '0800-123-4567',
    codigo_cliente: 'DEMO-001'
  } : (specs || {
    tipo: 'Gerador de eletricidade',
    inicio_operacao: '23/11/2013',
    motor: 'MWM',
    serie_motor: 'E1S184738',
    gerador: '1020352224',
    controlador: 'DEEP SEA DS7320',
    oleo_motor: '15W40 APi-Ci4 Mineral',
    oleo_diesel: 'S10 ou S500',
    stemac: 'ST0110026913',
    telefone_suporte: '0300-789-3800',
    codigo_cliente: '54651164'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-yellow-500" />
            <h3 className="font-black uppercase tracking-widest text-sm">
              {isDemoMode ? '📱 Demonstração - ' : ''}
              Características Técnicas
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
              {isDemoMode ? '📋 Dados de Demonstração' : 'Informações do Equipamento'}
            </p>
            <ul className="space-y-3 text-[11px] font-bold text-slate-700">
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Tipo:</span> 
                <span className="text-blue-600">{displaySpecs.tipo}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Início de Operação:</span> 
                <span className="text-blue-600">{displaySpecs.inicio_operacao}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Motor:</span> 
                <span className="text-blue-600">{displaySpecs.motor}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Nº Série Motor:</span> 
                <span className="text-blue-600">{displaySpecs.serie_motor}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Nº Gerador:</span> 
                <span className="text-blue-600">{displaySpecs.gerador}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Controlador:</span> 
                <span className="text-blue-600">{displaySpecs.controlador}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Óleo Motor:</span> 
                <span className="text-blue-600">{displaySpecs.oleo_motor}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Óleo Diesel:</span> 
                <span className="text-blue-600">{displaySpecs.oleo_diesel}</span>
              </li>
              <li className="flex justify-between">
                <span>Nº Stemac:</span> 
                <span className="text-blue-600">{displaySpecs.stemac}</span>
              </li>
            </ul>

            {isDemoMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-[9px] text-yellow-700 font-bold text-center">
                  ⚠️ Dados fictícios para demonstração
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
            <p className="text-[10px] font-black uppercase text-yellow-700 mb-4 tracking-widest flex items-center gap-2">
              <Phone size={12}/> Suporte Técnico
            </p>
            <ul className="space-y-3 text-[11px] font-bold text-slate-700">
              <li className="flex justify-between border-b border-yellow-200 pb-2">
                <span>Telefone:</span> 
                <span className="text-slate-900 font-black">{displaySpecs.telefone_suporte}</span>
              </li>
              <li className="flex justify-between">
                <span>{isDemoMode ? 'Código Demo:' : 'Código Cliente:'}</span> 
                <span className="text-slate-900 font-black">{displaySpecs.codigo_cliente}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  const faqs = [
    { 
      q: "Como configurar SMTP do Gmail?", 
      a: "1. Ative 'Verificação em 2 etapas' no Google\n2. Crie uma 'Senha de App'\n3. Use: Host: smtp.gmail.com, Porta: 587, SSL: Sim\n4. Cole a senha de 16 caracteres" 
    },
    { 
      q: "Posso usar Outlook/Hotmail?", 
      a: "Sim, mas precisa ativar 'Aplicativos menos seguros' nas configurações da conta Microsoft ou usar autenticação OAuth2." 
    },
    { 
      q: "Meu email vai para spam, o que fazer?", 
      a: "Use um domínio verificado da sua empresa, configure SPF/DKIM no DNS e evite palavras como 'oferta', 'grátis' no assunto." 
    },
    { q: "Como medir a pressão de óleo?", a: "A leitura deve ser feita no painel digital ou manômetro analógico com o motor em temperatura de trabalho." },
    { q: "Qual a diferença entre L-N e L-L?", a: "L-N é a tensão entre fase e neutro (ex: 127V). L-L é a tensão entre duas fases (ex: 220V)." },
    { q: "O que observar nas correias?", a: "Verificar tensão, presença de rachaduras ou desgaste excessivo nos canais." }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-cyan-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-cyan-400" />
            <h3 className="font-black uppercase tracking-widest text-sm">Dúvidas Frequentes (FAQ)</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {faqs.map((f, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-black uppercase text-cyan-700 mb-1">{f.q}</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal de Configuração de Características
function CaracteristicasModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialData,
  isDemoMode
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave: (data: CaracteristicasGerador) => Promise<void>;
  initialData?: CaracteristicasGerador;
  isDemoMode: boolean;
}) {
  const [form, setForm] = useState<CaracteristicasGerador>(initialData || {
    tipo: 'Gerador de eletricidade',
    inicio_operacao: '23/11/2013',
    motor: 'MWM',
    serie_motor: 'E1S184738',
    gerador: '1020352224',
    controlador: 'DEEP SEA DS7320',
    oleo_motor: '15W40 APi-Ci4 Mineral',
    oleo_diesel: 'S10 ou S500',
    stemac: 'ST0110026913',
    telefone_suporte: '0300-789-3800',
    codigo_cliente: '54651164'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when initialData changes (e.g. after loading from DB)
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!form.tipo.trim() || !form.motor.trim() || !form.gerador.trim()) {
      setError('Os campos Tipo, Motor e Gerador são obrigatórios');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar características');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-yellow-500" />
            <h3 className="font-black uppercase tracking-widest text-sm">
              {isDemoMode ? '📱 Demo - ' : ''}Características do Gerador
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-[10px] font-black text-red-700">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo *</label>
              <input 
                type="text" 
                placeholder="Ex: Gerador de eletricidade"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.tipo}
                onChange={e => setForm({...form, tipo: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Início Operação</label>
              <input 
                type="text" 
                placeholder="DD/MM/AAAA"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.inicio_operacao}
                onChange={e => setForm({...form, inicio_operacao: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motor *</label>
              <input 
                type="text" 
                placeholder="Ex: MWM, Cummins"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.motor}
                onChange={e => setForm({...form, motor: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nº Série Motor</label>
              <input 
                type="text" 
                placeholder="Ex: E1S184738"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.serie_motor}
                onChange={e => setForm({...form, serie_motor: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nº Gerador *</label>
              <input 
                type="text" 
                placeholder="Ex: 1020352224"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.gerador}
                onChange={e => setForm({...form, gerador: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Controlador</label>
              <input 
                type="text" 
                placeholder="Ex: DEEP SEA DS7320"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.controlador}
                onChange={e => setForm({...form, controlador: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Óleo Motor</label>
              <input 
                type="text" 
                placeholder="Ex: 15W40 API CI-4"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.oleo_motor}
                onChange={e => setForm({...form, oleo_motor: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Óleo Diesel</label>
              <input 
                type="text" 
                placeholder="Ex: S10 ou S500"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.oleo_diesel}
                onChange={e => setForm({...form, oleo_diesel: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nº Stemac</label>
              <input 
                type="text" 
                placeholder="Ex: ST0110026913"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.stemac}
                onChange={e => setForm({...form, stemac: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone Suporte</label>
              <input 
                type="text" 
                placeholder="Ex: 0300-789-3800"
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
                value={form.telefone_suporte}
                onChange={e => setForm({...form, telefone_suporte: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Código Cliente</label>
            <input 
              type="text" 
              placeholder="Ex: 54651164"
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mt-1 outline-none focus:border-blue-400 transition-all font-bold text-slate-800"
              value={form.codigo_cliente}
              onChange={e => setForm({...form, codigo_cliente: e.target.value})}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Salvar Características
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Form com Sistema de Laudos Integrado ---

interface PrototypeFormProps {
  onSave: (data: any) => Promise<any>;
  isSaving: boolean;
  isDemoMode: boolean;
  verificarECarregarCaracteristicas: (userId: string) => Promise<any>;
  caracteristicas: CaracteristicasGerador | null;
}

function PrototypeForm({ onSave, isSaving, isDemoMode, caracteristicas }: PrototypeFormProps) {
  const [form, setForm] = useState<Partial<LaudoData & { hora: string, signatureTimestamp?: number }>>({
    id: `laudo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR'),
    oleo_visual: 'Bom',
    agua_visual: 'Bom',
    vent_visual: 'Bom',
    correias_visual: 'Bom',
    observacoes: '',
    rpm: 1800,
    pressao_bar: 4.5,
    temp_antes: 26,
    temp_depois: 56,
    vbat: 13.8,
    comb_percent: 100,
    comb_litros: 150,
    gen_l1n: 127,
    gen_l2n: 127,
    gen_l3n: 127,
    gen_l1l2: 220,
    gen_l2l3: 220,
    gen_l3l1: 220,
    red_l1n: 127,
    red_l2n: 127,
    red_l3n: 127,
    red_l1l2: 220,
    red_l2l3: 220,
    red_l3l1: 220,    
    frequencia: 60
  });

  const [nomeTecnico, setNomeTecnico] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCaracteristicasEditModal, setShowCaracteristicasEditModal] = useState(false);

  const checkValidation = () => {
    const requiredFields = [
      { key: 'cliente', label: 'Cliente / Local' },
      { key: 'rpm', label: 'RPM' },
      { key: 'pressao_bar', label: 'Bar Óleo' },
      { key: 'temp_antes', label: 'ºC Antes' },
      { key: 'temp_depois', label: 'ºC Depois' },
      { key: 'vbat', label: 'V. Bateria' },
      { key: 'comb_percent', label: '% Comb.' },
      { key: 'comb_litros', label: 'Lts Comb.' },
      { key: 'gen_l1n', label: 'Gerador L1-N' },
      { key: 'frequencia', label: 'Freq. Hz' }
    ];

    const missing = requiredFields.filter(f => {
      const val = (form as any)[f.key];
      return val === undefined || val === null || val === '';
    });

    const hasSignature = !!form.assinatura;
    return { 
      isValid: missing.length === 0 && hasSignature, 
      missing: missing.map(m => m.key), 
      hasSignature 
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    const pos = getPos(e);
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setForm(prev => ({ 
        ...prev, 
        signatureTimestamp: Date.now(), 
        assinatura: canvasRef.current!.toDataURL() 
      }));
    }
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current!.height / rect.height)
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, missing, hasSignature } = checkValidation();
    
    if (!isValid) {
      setShowErrors(true);
      const firstInvalidId = missing.length > 0 ? `field-${missing[0]}` : (!hasSignature ? 'field-signature' : '');
      const element = document.getElementById(firstInvalidId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert(missing.length > 0 ? `⚠️ CAMPOS PENDENTES:\nVerifique os destaques em vermelho.` : `⚠️ ASSINATURA PENDENTE.`);
      return;
    }
    
    const pdfDoc = generatePDF(form as LaudoData & { hora: string }, nomeTecnico);
    if (pdfDoc) {
      pdfDoc.save(`laudo_${form.cliente?.replace(/\s+/g, '_')}_${form.id}.pdf`);
    }
    
    await onSave(form);
  };

  return (
    <>
      <TechSpecsModal 
        isOpen={isSpecsOpen} 
        onClose={() => setIsSpecsOpen(false)} 
        specs={caracteristicas}
        onEdit={() => {
          setIsSpecsOpen(false);
          setShowCaracteristicasEditModal(true);
        }}
        isDemoMode={isDemoMode} 
      />
      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />

      {/* Embedded edit modal triggers from within form */}
      {showCaracteristicasEditModal && (
        <CaracteristicasModal 
          isOpen={showCaracteristicasEditModal}
          onClose={() => setShowCaracteristicasEditModal(false)}
          onSave={async (data) => {
             // In App.tsx, this is handled by parent, but we might need local access
             // Actually App handles it through the salvarCaracteristicas pass-through
          }}
          initialData={caracteristicas || undefined}
          isDemoMode={isDemoMode}
        />
      )}
      
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto pb-12">
        <div className="bg-white border-b border-slate-200 p-6 mb-6 sticky top-0 z-20 shadow-sm flex flex-col gap-4 rounded-t-2xl">
          <div className="flex justify-center w-full">
             <h2 className="text-blue-900 font-black text-2xl tracking-tighter uppercase italic">
               {isDemoMode ? '🔧 Modo Demonstração - ' : ''}
               Check-in Gerador v2.0
             </h2>
          </div>
          <div className="flex items-center justify-between w-full">
            <button 
              type="button" 
              onClick={() => setIsSpecsOpen(true)} 
              className="text-[10px] font-black text-blue-700 border-2 border-blue-700 px-4 py-2 rounded-xl w-32 flex flex-col items-center"
            >
              <span>Características Técnicas</span>
              {isDemoMode && <span className="text-[8px] text-yellow-600 mt-1">(Fictício)</span>}
            </button>
            <button type="button" onClick={() => setIsFAQOpen(true)} className="text-[11px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1.5">
               <HelpCircle size={14}/> FAQs
            </button>
          </div>
        </div>

        <div className="bg-green-500 p-4 rounded-2xl flex items-center justify-center mb-8 shadow-lg w-full border border-green-600">
          <div className="flex flex-1 items-center justify-around text-black overflow-hidden px-4">
             <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-[11px] uppercase font-black tracking-widest text-black">Data :</span>
                <span className="text-[15px] font-black text-black">{form.data}</span>
             </div>
             <div className="h-8 w-[2px] bg-black/20 hidden sm:block"></div>
             <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-[11px] uppercase font-black tracking-widest text-black">Hora :</span>
                <span className="text-[15px] font-black text-black">{form.hora}</span>
             </div>
          </div>
        </div>

        <div id="field-cliente" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 scroll-mt-24">
            <label className={`text-[10px] font-black uppercase ${(showErrors && !form.cliente) ? 'text-red-500' : 'text-slate-400'}`}>Cliente / Local *</label>
            <input 
              type="text" 
              placeholder={isDemoMode ? "Cliente Demonstração" : "Nome do Cliente"}
              className={`w-full p-3 bg-slate-50 border-2 rounded-xl font-bold mt-1 outline-none transition-all ${(showErrors && !form.cliente) ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-blue-400'}`}
              value={form.cliente || ''}
              onChange={e => setForm({...form, cliente: e.target.value})}
            />
        </div>

        <SectionDivider text="Check-in Visual" colorClass="bg-blue-600" icon={Activity} />

        <FieldGroup title="Antes de Ligar" colorClass="bg-green-500" icon={Activity} id="field-visual">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ToggleState label="Óleo" color="bg-slate-500" value={form.oleo_visual} onChange={v => setForm({...form, oleo_visual: v})} />
            <ToggleState label="Água" color="bg-cyan-500" value={form.agua_visual} onChange={v => setForm({...form, agua_visual: v})} />
            <ToggleState label="Vent." color="bg-green-400" value={form.vent_visual} onChange={v => setForm({...form, vent_visual: v})} />
            <ToggleState label="Correias" color="bg-orange-500" value={form.correias_visual} onChange={v => setForm({...form, correias_visual: v})} />
          </div>
        </FieldGroup>

        <SectionDivider text="LIGAR O MOTOR" colorClass="bg-orange-500" icon={Zap} />

        <FieldGroup title="Motor" colorClass="bg-blue-600" icon={Gauge} id="field-motor-group" bodyBg="bg-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <VoltageInput fieldId="field-rpm" label="RPM" value={form.rpm} placeholder="1800" required showErrors={showErrors} onChange={(v:any) => setForm({...form, rpm: v})} />
            <VoltageInput fieldId="field-pressao_bar" label="Bar Óleo" value={form.pressao_bar} placeholder="4.5" required showErrors={showErrors} onChange={(v:any) => setForm({...form, pressao_bar: v})} />
            <VoltageInput fieldId="field-temp_antes" label="ºC Antes" value={form.temp_antes} placeholder="25" required showErrors={showErrors} onChange={(v:any) => setForm({...form, temp_antes: v})} />
            <VoltageInput fieldId="field-temp_depois" label="ºC Depois" value={form.temp_depois} placeholder="60" required showErrors={showErrors} onChange={(v:any) => setForm({...form, temp_depois: v})} />
            <VoltageInput fieldId="field-vbat" label="V. Bateria" value={form.vbat} placeholder="13.8" required showErrors={showErrors} onChange={(v:any) => setForm({...form, vbat: v})} />
            <div className="grid grid-cols-2 gap-2">
              <VoltageInput fieldId="field-comb_percent" label="% Comb." value={form.comb_percent} placeholder="100" required showErrors={showErrors} onChange={(v:any) => setForm({...form, comb_percent: v})} />
              <VoltageInput fieldId="field-comb_litros" label="Lts Comb." value={form.comb_litros} placeholder="200" required showErrors={showErrors} onChange={(v:any) => setForm({...form, comb_litros: v})} />
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Gerador (Tensões)" colorClass="bg-cyan-400" icon={Zap} id="field-gen-group" bodyBg="bg-blue-50">
          <div className="grid grid-cols-2 gap-4">
            <VoltageInput fieldId="field-gen_l1n" label="L1-N" value={form.gen_l1n} placeholder="127" required showErrors={showErrors} onChange={(v:any) => setForm({...form, gen_l1n: v})} />
            <VoltageInput fieldId="field-gen_l1l2" label="L1-L2" value={form.gen_l1l2} placeholder="220" required showErrors={showErrors} onChange={(v:any) => setForm({...form, gen_l1l2: v})} />
            <VoltageInput fieldId="field-gen_l2n" label="L2-N" value={form.gen_l2n} placeholder="127" onChange={(v:any) => setForm({...form, gen_l2n: v})} />
            <VoltageInput fieldId="field-gen_l2l3" label="L2-L3" value={form.gen_l2l3} placeholder="220" onChange={(v:any) => setForm({...form, gen_l2l3: v})} />
            <VoltageInput fieldId="field-gen_l3n" label="L3-N" value={form.gen_l3n} placeholder="127" onChange={(v:any) => setForm({...form, gen_l3n: v})} />
            <VoltageInput fieldId="field-gen_l3l1" label="L3-L1" value={form.gen_l3l1} placeholder="220" onChange={(v:any) => setForm({...form, gen_l3l1: v})} />
          </div>
        </FieldGroup>

        <FieldGroup title="Rede (Tensões)" colorClass="bg-orange-400" icon={ZapOff} id="field-red-group" bodyBg="bg-orange-50">
          <div className="grid grid-cols-2 gap-4">
            <VoltageInput fieldId="field-red_l1n" label="L1-N" value={form.red_l1n} placeholder="127" onChange={(v:any) => setForm({...form, red_l1n: v})} />
            <VoltageInput fieldId="field-red_l1l2" label="L1-L2" value={form.red_l1l2} placeholder="220" onChange={(v:any) => setForm({...form, red_l1l2: v})} />
            <VoltageInput fieldId="field-red_l2n" label="L2-N" value={form.red_l2n} placeholder="127" onChange={(v:any) => setForm({...form, red_l2n: v})} />
            <VoltageInput fieldId="field-red_l2l3" label="L2-L3" value={form.red_l2l3} placeholder="220" onChange={(v:any) => setForm({...form, red_l2l3: v})} />
            <VoltageInput fieldId="field-red_l3n" label="L3-N" value={form.red_l3n} placeholder="127" onChange={(v:any) => setForm({...form, red_l3n: v})} />
            <VoltageInput fieldId="field-red_l3l1" label="L3-L1" value={form.red_l3l1} placeholder="220" onChange={(v:any) => setForm({...form, red_l3l1: v})} />
          </div>
        </FieldGroup>

        <FieldGroup title="Frequência" colorClass="bg-yellow-400" icon={Activity} id="field-freq-group" bodyBg="bg-yellow-50">
          <VoltageInput fieldId="field-frequencia" label="Freq. Hz" value={form.frequencia} placeholder="60" required showErrors={showErrors} onChange={(v:any) => setForm({...form, frequencia: v})} />
        </FieldGroup>

        <div id="field-observacoes" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 scroll-mt-24">
            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
              <MessageSquare size={14}/> Observações Técnicas (Opcional)
            </label>
            <textarea 
              placeholder={isDemoMode ? "Observações para demonstração..." : "Relate aqui qualquer anomalia..."}
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium mt-1 outline-none focus:border-blue-400 transition-all min-h-[100px] resize-none text-sm"
              value={form.observacoes || ''}
              onChange={e => setForm({...form, observacoes: e.target.value})}
            />
        </div>

        <div id="field-signature" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 scroll-mt-24">
          <label className={`text-[10px] font-black uppercase flex items-center gap-2 ${(showErrors && !form.assinatura) ? 'text-red-500' : 'text-slate-400'}`}>
            <PenTool size={14}/> Assinatura do Cliente *
          </label>
          <div className={`relative h-40 border-2 border-dashed rounded-2xl overflow-hidden cursor-crosshair ${(showErrors && !form.assinatura) ? 'border-red-200 bg-red-50' : 'border-slate-300 bg-slate-100'}`}>
            <canvas ref={canvasRef} width={600} height={160} className="w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            <button type="button" onClick={() => {
              const ctx = canvasRef.current?.getContext('2d');
              ctx?.clearRect(0,0,600,160);
              setForm({...form, assinatura: undefined, signatureTimestamp: undefined});
            }} className="absolute bottom-2 right-2 p-2 bg-white rounded-lg text-red-500 shadow-sm"><Trash2 size={16}/></button>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Check className="text-green-600" size={20} />
              <h3 className="font-black text-blue-900 uppercase text-sm">
                {isDemoMode ? 'Sistema de Demonstração v2.0' : 'Sistema Automatizado v2.0'}
              </h3>
            </div>
            <p className="text-[11px] text-blue-700">
              {isDemoMode ? (
                <>
                  🔧 <strong>MODO DEMONSTRAÇÃO:</strong> <br/>
                  1️⃣ <strong>PDF gerado localmente</strong> <br/>
                  2️⃣ <strong>Dados fictícios simulados</strong> <br/>
                  3️⃣ <strong>Sem conexão com nuvem</strong>
                </>
              ) : (
                <>
                  Este laudo será: <br/>
                  1️⃣ <strong>Salvo no banco de dados</strong> (Supabase) <br/>
                  2️⃣ <strong>PDF gerado automaticamente</strong> e armazenado na nuvem <br/>
                  3️⃣ <strong>Link do PDF disponível</strong> no histórico
                </>
              )}
            </p>
          </div>
          
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <FileDown size={20}/>}
            {isSaving ? "PROCESSANDO..." : (isDemoMode ? "SALVAR EM MODO DEMONSTRAÇÃO" : "SALVAR NO SISTEMA (NUVEM + PDF)")}
          </button>
        </div>
      </form>
    </>
  );
}

// --- Debug View ---

interface DebugEntry {
  timestamp: string;
  msg: string;
  type: 'error' | 'info' | 'success';
}

interface EmailLogEntry {
  timestamp: string;
  event: string;
  data?: any;
}

function DebugConsole({ logs, emailLogs, onClear, onRepair }: { logs: DebugEntry[], emailLogs: EmailLogEntry[], onClear: () => void, onRepair: () => void }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
           <Bug size={24} className="text-red-500"/> Console Debug
         </h3>
         <div className="flex gap-2">
           <button 
            onClick={onRepair}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 shadow-sm"
           >
             <Code size={12}/> Abrir Reparo
           </button>
           <button 
            onClick={onClear}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
           >
             <Trash2 size={12}/> Limpar Console
           </button>
         </div>
      </div>

      {/* Monitor de E-mail Refinado */}
      <div className="bg-cyan-950 rounded-[2rem] overflow-hidden shadow-2xl border border-cyan-800">
        <div className="bg-cyan-900 px-6 py-3 flex items-center justify-between border-b border-cyan-800">
          <div className="flex items-center gap-3">
            <Mail className="text-cyan-400" size={18} />
            <span className="text-[10px] font-mono text-cyan-200 font-bold uppercase tracking-widest">Protocolo de Saída SMTP</span>
          </div>
          {emailLogs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-cyan-800/50 px-3 py-1 rounded-full border border-cyan-700">
               <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
               <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-tighter">Última Atividade: {emailLogs[0].timestamp}</span>
            </div>
          )}
        </div>
        <div className="p-6 font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto space-y-2 bg-black/40">
          {emailLogs.length === 0 ? (
            <div className="text-cyan-800 italic opacity-50 flex items-center gap-3 py-8 justify-center flex-col">
              <AtSign size={32}/>
              <p>Nenhum tráfego de e-mail registrado.</p>
            </div>
          ) : (
            emailLogs.map((log, i) => (
              <div key={i} className="flex gap-3 border-l-2 border-cyan-800 pl-3 py-0.5 group">
                <span className="text-cyan-700 flex-shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold uppercase flex-shrink-0 ${log.event.startsWith('C:') ? 'text-blue-400' : (log.event.startsWith('S:') ? 'text-yellow-400' : 'text-cyan-400')}`}>
                   {log.event.includes('>>') ? 'SMTP >>' : ''}
                </span>
                <span className="text-cyan-100 group-hover:text-white transition-colors">{log.event}</span>
                {log.data && <span className="text-cyan-600 text-[9px] truncate">({JSON.stringify(log.data)})</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
        <div className="bg-slate-800 px-6 py-3 flex items-center gap-2 border-b border-slate-700">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-mono text-slate-400 ml-4 font-bold uppercase tracking-widest">Logs de Sistema v2.0</span>
        </div>
        <div className="p-6 font-mono text-[11px] leading-relaxed max-h-[40vh] overflow-y-auto space-y-3">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic opacity-50 flex items-center gap-3 py-12 justify-center flex-col">
              <Terminal size={48}/>
              <p>Nenhum evento registrado no console.</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`flex gap-3 animate-in slide-in-from-left-2 duration-300`}>
                <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                <span className={`font-black uppercase flex-shrink-0 ${log.type === 'error' ? 'text-red-500' : (log.type === 'success' ? 'text-green-400' : 'text-blue-400')}`}>
                  {log.type === 'error' ? '[ERROR]' : (log.type === 'success' ? '[SUCCESS]' : '[INFO]')}
                </span>
                <span className={`break-all ${log.type === 'error' ? 'text-red-200' : 'text-slate-300'}`}>{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- App Principal ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('new');
  const [laudos, setLaudos] = useState<LaudoData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [profile, setProfile] = useState<{nome: string, email_destino: string, phone: string} | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  
  const [debugLogs, setDebugLogs] = useState<DebugEntry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [showCaracteristicasModal, setShowCaracteristicasModal] = useState(false);
  const [showCaracteristicasEditModal, setShowCaracteristicasEditModal] = useState(false);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicasGerador | null>(null);
  const [laudoSystem, setLaudoSystem] = useState<any>(null);

  const addLog = (msg: string, type: 'error' | 'info' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setDebugLogs(prev => [{ timestamp, msg, type }, ...prev].slice(0, 100));
  };

  const addEmailLog = (event: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setEmailLogs(prev => [{ timestamp, event, data }, ...prev].slice(0, 50));
  };

  const verificarECarregarCaracteristicas = async (userId: string) => {
    if (userId === 'demo-user-id') {
      const demoCaracteristicas: CaracteristicasGerador = {
        tipo: 'Gerador de Eletricidade Standby',
        inicio_operacao: '15/03/2022',
        motor: 'Cummins QSK60',
        serie_motor: 'CMM-2022-7890',
        gerador: 'STANDBY-300KVA',
        controlador: 'DSE 8610 MKII',
        oleo_motor: '15W40 API CI-4 Sintético',
        oleo_diesel: 'S10 Premium',
        stemac: 'ST0220034567',
        telefone_suporte: '0800-123-4567',
        codigo_cliente: 'DEMO-001'
      };
      setCaracteristicas(demoCaracteristicas);
      return demoCaracteristicas;
    }
    
    try {
      const { data, error } = await supabase
        .from('caracteristicas_gerador')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Erro ao buscar características:", error);
      }
      
      if (data) {
        const carac: CaracteristicasGerador = {
          tipo: data.tipo || '',
          inicio_operacao: data.inicio_operacao || '',
          motor: data.motor || '',
          serie_motor: data.serie_motor || '',
          gerador: data.gerador || '',
          controlador: data.controlador || '',
          oleo_motor: data.oleo_motor || '',
          oleo_diesel: data.oleo_diesel || '',
          stemac: data.stemac || '',
          telefone_suporte: data.telefone_suporte || '',
          codigo_cliente: data.codigo_cliente || ''
        };
        setCaracteristicas(carac);
        return carac;
      }
      
      setCaracteristicas(null);
      return null;
      
    } catch (err) {
      console.error("Erro ao carregar características:", err);
      setCaracteristicas(null);
      return null;
    }
  };

  const salvarCaracteristicas = async (data: CaracteristicasGerador) => {
    if (user?.id === 'demo-user-id') {
      setCaracteristicas(data);
      alert("✅ Características de demonstração salvas!");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('caracteristicas_gerador')
        .upsert({
          user_id: user!.id,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      setCaracteristicas(data);
      addLog("Características técnicas salvas com sucesso!", "success");
      alert("✅ Características salvas com sucesso!");
      
    } catch (err: any) {
      addLog(`Erro ao salvar características: ${err.message}`, "error");
      alert(`❌ Erro ao salvar características:\n${err.message}`);
      throw err;
    }
  };

  const verificarConfiguracaoCaracteristicas = async () => {
    if (!user || isDemoMode) return;
    
    const carac = await verificarECarregarCaracteristicas(user.id);
    
    if (!carac || !carac.tipo || !carac.motor) {
      setTimeout(() => {
        const confirmar = window.confirm(
          "⚠️ CONFIGURAÇÃO NECESSÁRIA ⚠️\n\n" +
          "Você ainda não configurou as características técnicas do seu gerador.\n\n" +
          "É importante configurar essas informações para gerar laudos completos.\n\n" +
          "Deseja configurar agora?"
        );
        
        if (confirmar) {
          setShowCaracteristicasEditModal(true);
        }
      }, 1000);
    }
  };

  const testSmtpConfig = async (config: any) => {
    const destino = profile?.email_destino;
    
    if (!destino) {
      alert('❌ Configure primeiro o "E-mail de Envio" no menu "Meu Perfil"!');
      return;
    }
    
    console.log('🔧 Testando SMTP com função unificada...');
    
    const resultado = await enviarEmailUnificado(
      { cliente: 'TESTE SMTP', id: 'teste_smtp_' + Date.now() },
      'https://exemplo.com/teste.pdf',
      'teste'
    );
    
    if (resultado.success) {
      alert(`✅ TESTE SMTP CONCLUÍDO!\n\nEmail enviado para: ${destino}\nID: ${resultado.data?.data?.messageId || 'N/A'}`);
    } else {
      alert(`❌ TESTE SMTP FALHOU:\n\n${resultado.error}`);
    }
  };

  const testarConexaoBasica = async () => {
    try {
      console.log("=== 🔌 TESTE DE CONEXÃO BÁSICA ===");
      addLog("Testando conexão básica com Supabase...", "info");
      
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Sessão:", sessionData?.session ? "Ativa" : "Inativa");
      
      const { data: userData } = await supabase.auth.getUser();
      console.log("Usuário:", userData?.user?.email || "Não autenticado");
      
      console.log("3. Testando banco de dados...");
      const startTime = Date.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('laudos')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      console.log(`Tempo resposta DB: ${responseTime}ms`);
      console.log("Resultado DB:", dbError ? `Erro: ${dbError.message}` : "OK");
      
      console.log("4. Testando Storage...");
      addLog("Tentando listar buckets...", "info");
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT: Storage não respondeu em 8 segundos")), 8000)
      );
      
      const storagePromise = supabase.storage.listBuckets();
      
      try {
        const result: any = await Promise.race([storagePromise, timeoutPromise]);
        console.log("✅ Storage respondeu:", result);
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        addLog(`✅ Storage OK! Buckets: ${result.data?.length || 0}`, "success");
        
        if (result.data && result.data.length > 0) {
          const bucketNames = result.data.map((b: any) => b.name).join(', ');
          console.log("Buckets:", bucketNames);
          alert(`✅ CONEXÃO COMPLETA OK!\n\n` +
            `👤 Usuário: ${userData?.user?.email}\n` +
            `📊 Banco: ${dbError ? 'ERRO' : 'OK'} (${responseTime}ms)\n` +
            `📦 Storage: ${result.data.length} buckets\n` +
            `📁 Buckets: ${bucketNames}`);
        } else {
          alert(`✅ CONEXÃO OK MAS SEM BUCKETS!\n\n` +
            `Storage respondeu mas não tem buckets.\n` +
            `Crie um bucket 'laudos-pdf' no Supabase.`);
        }
        
      } catch (storageError: any) {
        console.error("❌ Storage falhou:", storageError);
        addLog(`Storage falhou: ${storageError.message}`, "error");
        
        alert(`⚠️ PROBLEMA NO STORAGE!\n\n` +
          `👤 Usuário: ${userData?.user?.email || 'N/A'}\n` +
          `📊 Banco: ${dbError ? 'ERRO' : 'OK'}\n` +
          `📦 Storage: ${storageError.message}\n\n` +
          `Provável causa: CORS não configurado ou Storage desabilitado.`);
      }
      
    } catch (error: any) {
      console.error("💥 Erro no teste básico:", error);
      addLog(`Erro teste conexão: ${error.message}`, "error");
      alert(`💥 ERRO NO TESTE:\n${error.message}`);
    }
  };

  const testarStorage = async () => {
    try {
      console.log("=== 📦 TESTE DE STORAGE SIMPLIFICADO ===");
      addLog("Teste de Storage simplificado...", "info");
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("❌ Storage não respondeu:", bucketsError);
        throw new Error(`Storage error: ${bucketsError.message}`);
      }
      
      console.log("✅ Storage respondeu! Buckets:", buckets);
      
      const bucketLaudos = buckets?.find(b => b.name === 'laudos-pdf');
      if (!bucketLaudos) {
        alert("❌ BUCKET 'laudos-pdf' NÃO ENCONTRADO!\n\n" +
          "Buckets disponíveis: " + (buckets?.map(b => b.name).join(', ') || 'nenhum') + "\n\n" +
          "Crie um bucket chamado 'laudos-pdf' no Supabase Storage.");
        return;
      }
      
      console.log("✅ Bucket 'laudos-pdf' encontrado");
      
      console.log("Testando upload simples...");
      const testFile = new Blob(["TESTE"], { type: 'text/plain' });
      const fileName = `test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('laudos-pdf')
        .upload(fileName, testFile);
      
      if (uploadError) {
        console.error("❌ Upload falhou:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log("✅ Upload bem-sucedido!", uploadData);
      
      const { data: urlData } = supabase.storage
        .from('laudos-pdf')
        .getPublicUrl(fileName);
      
      alert(`✅ STORAGE FUNCIONANDO!\n\n` +
        `📁 Bucket: laudos-pdf\n` +
        `📄 Arquivo: ${fileName}\n` +
        `🔗 URL: ${urlData.publicUrl}\n\n` +
        `Clique OK para abrir.`);
      
      window.open(urlData.publicUrl, '_blank');
      
    } catch (error: any) {
      console.error("💥 Erro no teste Storage:", error);
      addLog(`Erro teste Storage: ${error.message}`, "error");
      alert(`❌ TESTE STORAGE FALHOU:\n\n${error.message}\n\nVerifique:\n1. CORS configurado?\n2. Bucket existe?\n3. Políticas de acesso?`);
    }
  };

  const testarPDFOrganizadoDireto = async () => {
    try {
      console.log("🧪 Testando PDF Organizado DIRETO...");
      
      const dadosTeste: LaudoData = {
        cliente: 'TESTE DIRETO ORGANIZADO',
        data: new Date().toISOString().split('T')[0],
        observacoes: 'Teste direto sem laudoSystem'
      };
      
      const pdfDoc = generatePDF(dadosTeste as any);
      if (!pdfDoc) throw new Error("Falha ao gerar PDF");

      const pdfBlob = pdfDoc.output('blob');
      
      const nomeArquivo = `laudo_teste_direto_${Date.now()}.pdf`;
      console.log(`📤 Upload direto: ${nomeArquivo}`);
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('laudos-pdf')
        .upload(nomeArquivo, pdfBlob, {
          contentType: 'application/pdf'
        });
      
      if (storageError) throw new Error(`Storage: ${storageError.message}`);
      
      const { data: urlData } = supabase.storage
        .from('laudos-pdf')
        .getPublicUrl(nomeArquivo);
      
      dadosTeste.pdf_url = urlData.publicUrl;
      dadosTeste.created_at = new Date().toISOString();
      
      const { data: savedLaudo, error: dbError } = await supabase
        .from('laudos')
        .insert([dadosTeste])
        .select()
        .single();
      
      if (dbError) throw new Error(`Banco: ${dbError.message}`);
      
      alert(`✅ TESTE DIRETO FUNCIONOU!\n\nArquivo: ${nomeArquivo}\nURL: ${urlData.publicUrl}`);
      window.open(urlData.publicUrl, '_blank');
      
    } catch (error: any) {
      console.error("❌ Erro no teste direto:", error);
      alert(`❌ ERRO DIRETO:\n${error.message}`);
    }
  };

  const enviarEmailUnificado = async (laudoData: any, pdfUrl?: string, tipo = 'laudo') => {
    try {
      console.log(`📧 Enviando ${tipo} via SMTP...`);
      
      let emailDestino = profile?.email_destino;
      
      if (!emailDestino && user?.email) {
        emailDestino = user.email;
      }
      
      if (!emailDestino) {
        const erroMsg = '❌ Email de destino não configurado!\nConfigure seu email no menu "Meu Perfil" → "E-mails de Envio"';
        console.error(erroMsg);
        addEmailLog(`❌ ERRO: ${erroMsg}`);
        throw new Error(erroMsg);
      }

      // Limpar espaços extras se houver múltiplos emails
      const emailsLimpos = emailDestino.split(',').map(e => e.trim()).join(', ');
      
      addEmailLog(`>> INICIANDO: ${tipo} para ${emailsLimpos}`);
      
      const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Y3FnZW54bWJ5ZHB4eGFzeWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxODQyMywiZXhwIjoyMDgyNTk0NDIzfQ.s02foQRwwudTq7c2Tqg4kZaRQpr-zwUkYvVCv3MP3gI'; 
      
      const tecnicoNome = profile?.nome || 
                          user?.user_metadata?.nome || 
                          user?.email?.split('@')[0] || 
                          'Técnico Responsável';
      
      const emailData = {
        to: emailsLimpos,
        subject: tipo === 'teste' 
          ? '✅ TESTE SMTP - LAUDOGERADOR' 
          : `Laudo Técnico - ${laudoData.cliente}`,
        html: tipo === 'teste'
          ? `
            <h1>Teste de Configuração SMTP</h1>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Técnico:</strong> ${tecnicoNome}</p>
            <p><strong>Emails configurados:</strong> ${emailsLimpos}</p>
            <p><strong>Status:</strong> ✅ Sistema operacional</p>
            <p>Se recebeu este email, o botão de teste está funcionando!</p>
          `
          : `
            <h1>Laudo Técnico Gerado</h1>
            <p><strong>Cliente:</strong> ${laudoData.cliente}</p>
            <p><strong>Data:</strong> ${laudoData.data}</p>
            <p><strong>Técnico:</strong> ${tecnicoNome}</p>
            ${pdfUrl ? `<p><strong>Download do PDF:</strong> <a href="${pdfUrl}">CLIQUE AQUI</a></p>` : ''}
            <p><strong>ID do Laudo:</strong> ${laudoData.id}</p>
          `,
        laudo_id: tipo === 'teste' ? 'teste_smtp_' + Date.now() : laudoData.id,
        tipo: tipo,
        user_id: user?.id,
        pdfUrl: pdfUrl || null,
        
        laudo_info: {
          cliente: laudoData.cliente || 'Não informado',
          data: laudoData.data || new Date().toISOString().split('T')[0],
          tecnico: tecnicoNome,
          oleo_visual: laudoData.oleo_visual || 'N/A',
          agua_visual: laudoData.agua_visual || 'N/A',
          vent_visual: laudoData.vent_visual || 'N/A',
          correias_visual: laudoData.correias_visual || 'N/A',
          rpm: laudoData.rpm || 'N/A',
          pressao_bar: laudoData.pressao_bar || 'N/A',
          temp_antes: laudoData.temp_antes || 'N/A',
          temp_depois: laudoData.temp_depois || 'N/A',
          vbat: laudoData.vbat || 'N/A',
          comb_percent: laudoData.comb_percent || 'N/A',
          comb_litros: laudoData.comb_litros || 'N/A',
          gen_l1n: laudoData.gen_l1n || 'N/A',
          gen_l2n: laudoData.gen_l2n || 'N/A',
          gen_l3n: laudoData.gen_l3n || 'N/A',
          gen_l1l2: laudoData.gen_l1l2 || 'N/A',
          gen_l2l3: laudoData.gen_l2l3 || 'N/A',
          gen_l3l1: laudoData.gen_l3l1 || 'N/A',
          red_l1n: laudoData.red_l1n || 'N/A',
          red_l2n: laudoData.red_l2n || 'N/A',
          red_l3n: laudoData.red_l3n || 'N/A',
          red_l1l2: laudoData.red_l1l2 || 'N/A',
          red_l2l3: laudoData.red_l2l3 || 'N/A',
          red_l3l1: laudoData.red_l3l1 || 'N/A',
          frequencia: laudoData.frequencia || 'N/A',
          observacoes: laudoData.observacoes || '',
          hora: laudoData.hora || new Date().toLocaleTimeString('pt-BR'),
          status_geral: 'CONCLUÍDO',
          data_formatada: new Date().toLocaleDateString('pt-BR')
        }
      };
      
      addEmailLog(`📤 Preparando ${tipo}: ${emailDestino}`);
      addEmailLog(`📊 Dados do laudo incluídos: ${laudoData.cliente || 'Teste'}`);
      
      const response = await fetch(
        'https://ptcqgenxmbydpxxasyba.supabase.co/functions/v1/send-laudo-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY // Header obrigatório para Edge Functions no Supabase Gateway
          },
          body: JSON.stringify(emailData)
        }
      );
      
      const result = await response.json();
      console.log(`📊 Resultado ${tipo}:`, result);
      addEmailLog(`📊 Resultado: ${JSON.stringify(result)}`);
      
      if (!response.ok) {
        addEmailLog(`❌ ERRO ${tipo}: ${result.error || 'Desconhecido'}`);
        throw new Error(result.error || `Erro no envio de ${tipo}`);
      }
      
      addEmailLog(`✅ ${tipo.toUpperCase()} SUCESSO! ID: ${result.data?.messageId || 'N/A'}`);
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error(`❌ Erro ${tipo}:`, error);
      addEmailLog(`💥 ERRO FINAL ${tipo}: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const enterDemoMode = () => {
    addLog("Entrando em Modo Demonstração...", "info");
    const mockUser = {
      id: 'demo-user-id',
      email: 'demo@laudogerador.com.br',
      user_metadata: { nome: 'Técnico Demo' }
    } as any;
    setUser(mockUser);
    setIsDemoMode(true);
    setProfile({
      nome: 'Técnico Demo',
      email_destino: 'demo@laudogerador.com.br',
      phone: '51999999999'
    });
    setDbStatus('offline');
    addLog("Modo Demonstração Ativo.", "success");
    
    verificarECarregarCaracteristicas('demo-user-id');
    fetchLaudos('demo-user-id');
  };

  const fetchLaudos = async (userId: string) => {
    if (userId === 'demo-user-id') {
      const demoLaudos: LaudoData[] = [
        {
          id: 'demo_001',
          cliente: 'Cliente Exemplo 1',
          data: '2026-01-05',
          pdf_url: 'https://exemplo.com/demo1.pdf',
          created_at: '2026-01-05T10:30:00Z',
          oleo_visual: 'Bom',
          agua_visual: 'Bom',
          vent_visual: 'Ruim',
          correias_visual: 'Bom'
        },
        {
          id: 'demo_002',
          cliente: 'Cliente Exemplo 2',
          data: '2026-01-04',
          pdf_url: 'https://exemplo.com/demo2.pdf',
          created_at: '2026-01-04T14:20:00Z',
          oleo_visual: 'Bom',
          agua_visual: 'Ruim',
          vent_visual: 'Bom',
          correias_visual: 'Bom'
        },
        {
          id: 'demo_003',
          cliente: 'Cliente Exemplo 3',
          data: '2026-01-03',
          pdf_url: 'https://exemplo.com/demo3.pdf',
          created_at: '2026-01-03T09:15:00Z',
          oleo_visual: 'Ruim',
          agua_visual: 'Bom',
          vent_visual: 'Bom',
          correias_visual: 'Ruim'
        }
      ];
      
      setLaudos(demoLaudos);
      addLog(`${demoLaudos.length} laudos de demonstração carregados.`, "info");
      return;
    }
    
    setIsFetchingHistory(true);
    addLog("Sincronizando histórico com a base de dados...", "info");
    try {
      const { data, error } = await supabase
        .from('laudos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setLaudos(data);
        addLog(`${data.length} laudos recuperados da nuvem.`, "success");
      }
    } catch (err: any) {
      addLog(`Erro ao carregar histórico: ${err.message}`, "error");
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const checkConnection = async () => {
    if (user?.id === 'demo-user-id') return;
    addLog("Iniciando verificação de conectividade Supabase...", "info");
    setDbStatus('checking');
    try {
      const { error: perfilError } = await supabase.from('perfis').select('count', { count: 'exact', head: true }).limit(1);
      
      if (perfilError) {
         if (perfilError.code === '42P01') {
           setDbStatus('error');
           const err = "ERRO CRÍTICO: Tabela 'perfis' não encontrada. Clique em Reparar Banco.";
           setLastError(err);
           addLog(err, "error");
           return;
         } else {
           addLog(`Aviso na tabela Perfis: ${perfilError.message}`, "info");
         }
      }

      const { error: laudoError } = await supabase.from('laudos').select('correias_visual, user_id').limit(1);
      
      if (laudoError) {
         if (laudoError.code === '42703' || laudoError.code === '42P01' || laudoError.code === 'PGRST204') {
            setDbStatus('error');
            const errMsg = laudoError.code === '42P01' 
              ? "ERRO: Tabela 'laudos' ausente. Clique em Reparar Banco." 
              : `ESQUEMA DESATUALIZADO (Coluna ausente: ${laudoError.message}). Clique em Reparar Banco.`;
            setLastError(errMsg);
            addLog(errMsg, "error");
         } else {
            setDbStatus('offline');
            setLastError(laudoError.message);
            addLog(`Conexão instável ou erro RLS: ${laudoError.message}`, "info");
         }
      } else {
         setDbStatus('online');
         setLastError(null);
         addLog("Conexão Supabase e esquema de tabelas OK.", "success");
         if (user?.id) fetchLaudos(user.id);
      }
    } catch (err: any) {
      setDbStatus('offline');
      addLog(`Falha de rede (Exception): ${err.message}`, "error");
    }
  };

  const fetchProfile = async (userId: string) => {
    if (userId === 'demo-user-id') return;
    addLog(`Buscando perfil para UID: ${userId.substring(0, 8)}...`, "info");
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('nome, email_destino, phone')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setProfile(data);
        addLog(`Perfil de '${data.nome}' carregado.`, "success");
        return data;
      }
      return null;
    } catch (err: any) {
      addLog(`Aviso: Perfil não encontrado no banco (usando fallback de metadados).`, "info");
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata) {
        const meta = currentUser.user_metadata;
        const fallbackProfile = {
          nome: meta.nome || meta.full_name || '',
          email_destino: meta.email_destino || '',
          phone: meta.phone || ''
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      return null;
    }
  };

  useEffect(() => {
    addLog("Inicializando LAUDOGERADOR App v2.0...", "info");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        addLog(`Usuário autenticado: ${u.email}`, "success");
        fetchProfile(u.id);
        checkConnection();
        verificarECarregarCaracteristicas(u.id).then(() => {
          verificarConfiguracaoCaracteristicas();
        });
      }
      setInitializing(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (u) {
        setUser(u);
        fetchProfile(u.id);
        checkConnection();
        verificarECarregarCaracteristicas(u.id).then(() => {
          verificarConfiguracaoCaracteristicas();
        });
      }
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      addLog("Encerrando sessão...", "info");
      if (user?.id !== 'demo-user-id') {
        await supabase.auth.signOut();
      }
      setUser(null);
      setProfile(null);
      setLaudos([]);
      setIsDemoMode(false);
      setActiveTab('new');
      addLog("Sessão encerrada.", "success");
    } catch (err: any) {
      addLog(`Erro ao deslogar: ${err.message}`, "error");
      setUser(null);
    }
  };

  const saveLaudo = async (laudoData: any) => {
    setIsSaving(true);
    setLastError(null);
    addLog(`Processando laudo para: ${laudoData.cliente}...`, "info");
    
    try {
        if (user?.id === 'demo-user-id' || isDemoMode) {
          addLog("Sincronização em nuvem simulada (Modo Demo).", "info");
          addEmailLog("SIMULATION: E-mail enviado com sucesso (Demo).");
          
          const demoLaudo: LaudoData = {
            id: laudoData.id || `demo_${Date.now()}`,
            cliente: laudoData.cliente || 'Cliente Demonstração',
            data: laudoData.data || new Date().toISOString().split('T')[0],
            oleo_visual: laudoData.oleo_visual || 'Bom',
            agua_visual: laudoData.agua_visual || 'Bom',
            vent_visual: laudoData.vent_visual || 'Bom',
            correias_visual: laudoData.correias_visual || 'Bom',
            rpm: laudoData.rpm || 1800,
            pressao_bar: laudoData.pressao_bar || 4.5,
            temp_antes: laudoData.temp_antes || 25,
            temp_depois: laudoData.temp_depois || 68,
            vbat: laudoData.vbat || 13.8,
            comb_percent: laudoData.comb_percent || 75,
            comb_litros: laudoData.comb_litros || 150,
            gen_l1n: laudoData.gen_l1n || 127.5,
            gen_l2n: laudoData.gen_l2n || 127.3,
            gen_l3n: laudoData.gen_l3n || 127.8,
            gen_l1l2: laudoData.gen_l1l2 || 220.1,
            gen_l2l3: laudoData.gen_l2l3 || 219.8,
            gen_l3l1: laudoData.gen_l3l1 || 220.3,
            red_l1n: laudoData.red_l1n || 127.0,
            red_l2n: laudoData.red_l2n || 126.8,
            red_l3n: laudoData.red_l3n || 127.2,
            red_l1l2: laudoData.red_l1l2 || 219.5,
            red_l2l3: laudoData.red_l2l3 || 219.3,
            red_l3l1: laudoData.red_l3l1 || 219.7,
            frequencia: laudoData.frequencia || 60.1,
            assinatura: laudoData.assinatura || 'data:image/png;base64,demo...',
            observacoes: laudoData.observacoes || 'Laudo gerado em modo demonstração.',
            pdf_url: 'https://storage.googleapis.com/demo-bucket/laudo_demo.pdf',
            created_at: new Date().toISOString(),
            user_id: 'demo-user-id',
            processado_em: new Date().toISOString()
          };
          
          const pdfDoc = generatePDF(laudoData, profile?.nome);
          if (pdfDoc) {
            pdfDoc.save(`demo_laudo_${laudoData.cliente?.replace(/\s+/g, '_') || 'demo'}.pdf`);
          }
          
          setTimeout(() => {
            setLaudos(prev => [demoLaudo, ...prev]);
            
            alert(`🎯 DEMONSTRAÇÃO CONCLUÍDA!\n\n` +
                  `📋 Laudo: "${laudoData.cliente || 'Demo'}"\n` +
                  `📧 Email simulado: cliente.demo@exemplo.com.br\n` +
                  `📄 PDF: Gerado e baixado localmente\n` +
                  `💾 Histórico: Adicionado à lista local\n\n` +
                  `✅ Modo demonstração funcionando perfeitamente!`);
            
            setActiveTab('history');
            setIsSaving(false);
            
            addLog(`✅ Demo: Laudo fictício criado para ${laudoData.cliente}`, "success");
            addEmailLog(`📧 Demo: Email simulado enviado para cliente.demo@exemplo.com.br`);
            
          }, 800);
          return;
        }

      const pdfDoc = generatePDF(laudoData, profile?.nome);
      if (!pdfDoc) throw new Error("Falha ao gerar PDF");

      const laudoParaSalvar: LaudoData = {
        id: laudoData.id,
        cliente: laudoData.cliente,
        data: laudoData.data,
        oleo_visual: laudoData.oleo_visual,
        agua_visual: laudoData.agua_visual,
        vent_visual: laudoData.vent_visual,
        correias_visual: laudoData.correias_visual,
        rpm: laudoData.rpm,
        pressao_bar: laudoData.pressao_bar,
        temp_antes: laudoData.temp_antes,
        temp_depois: laudoData.temp_depois,
        vbat: laudoData.vbat,
        comb_percent: laudoData.comb_percent,
        comb_litros: laudoData.comb_litros,
        gen_l1n: laudoData.gen_l1n,
        gen_l2n: laudoData.gen_l2n,
        gen_l3n: laudoData.gen_l3n,
        gen_l1l2: laudoData.gen_l1l2,
        gen_l2l3: laudoData.gen_l2l3,
        gen_l3l1: laudoData.gen_l3l1,
        red_l1n: laudoData.red_l1n,
        red_l2n: laudoData.red_l2n,
        red_l3n: laudoData.red_l3n,
        red_l1l2: laudoData.red_l1l2,
        red_l2l3: laudoData.red_l2l3,
        red_l3l1: laudoData.red_l3l1,
        frequencia: laudoData.frequencia,
        assinatura: laudoData.assinatura,
        observacoes: laudoData.observacoes,
        created_at: new Date().toISOString()
      };

      addLog("Enviando laudo para o sistema integrado...", "info");
      addEmailLog("SISTEMA INTEGRADO: Processando laudo via Edge Function");
      
      let resultado;
      if (pdfDoc) {
        const pdfBlob = pdfDoc.output('blob');
        
        const nomeCliente = laudoData.cliente
          ? laudoData.cliente
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^\w_]/g, '')
              .substring(0, 20)
          : 'laudo';
        
        const dataFormatada = laudoData.data 
          ? laudoData.data.replace(/-/g, '') 
          : new Date().toISOString().split('T')[0].replace(/-/g, '');
        
        const idReduzido = laudoData.id 
          ? laudoData.id.split('_').pop()?.substring(0, 6) || '000000'
          : Date.now().toString().slice(-6);
        
        const nomeArquivo = `laudo_${nomeCliente}_${dataFormatada}_${idReduzido}.pdf`;
        
        console.log(`📤 Salvando PDF organizado: ${nomeArquivo}`);
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('laudos-pdf')
          .upload(nomeArquivo, pdfBlob, {
            contentType: 'application/pdf',
            upsert: false
          });
        
        if (storageError) {
          throw new Error(`Storage: ${storageError.message}`);
        }
        
        const { data: urlData } = supabase.storage
          .from('laudos-pdf')
          .getPublicUrl(nomeArquivo);
        
        laudoParaSalvar.pdf_url = urlData.publicUrl;
        laudoParaSalvar.created_at = new Date().toISOString();
        
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          laudoParaSalvar.user_id = userData.user.id;
        } else {
          throw new Error("Usuário não autenticado");
        }
        
        console.log('💾 Salvando no banco...');
        const { data: savedLaudo, error: saveError } = await supabase
          .from('laudos')
          .insert([laudoParaSalvar])
          .select()
          .single();
        
        if (saveError) {
          throw new Error(`Banco: ${saveError.message}`);
        }
        
        resultado = {
          success: true,
          message: 'Laudo salvo com PDF organizado!',
          laudo: savedLaudo,
          pdf_url: urlData.publicUrl,
          download_url: urlData.publicUrl
        };

      } else {
        resultado = { success: false, error: "Não foi possível gerar o PDF" };
      }
      
      if (resultado.success) {
        addLog(`✅ Laudo processado com sucesso! PDF: ${resultado.pdf_url}`, "success");
        
        console.log('🔍 DEBUG saveLaudo: Antes de chamar enviarEmailSimples');
        console.log('🔍 PDF URL:', resultado.pdf_url);
        console.log('🔍 Perfil email:', profile?.email_destino);
        console.log('🔍 Laudo Data:', laudoData.cliente);
        
        const envioEmail = await enviarEmailUnificado(laudoData, resultado.pdf_url, 'laudo');
        
        console.log('🔍 DEBUG saveLaudo: Depois de enviarEmailSimples');
        console.log('🔍 Resultado envioEmail:', envioEmail);
        
        if (envioEmail.success) {
          addEmailLog(`✅ Email enviado para: ${profile?.email_destino}`);
          alert(`✅ SUCESSO TOTAL!\nLaudo salvo no banco.\nPDF: ${resultado.pdf_url}\n📧 Email enviado para ${profile?.email_destino}`);
        } else {
          addEmailLog(`⚠️ Email não enviado: ${envioEmail.error}`);
          alert(`⚠️ Laudo salvo mas email falhou:\n${envioEmail.error}`);
        }
        
        await fetchLaudos(user!.id);
        setActiveTab('history');
      }
      } catch (err: any) { 
        const msg = err?.message || String(err);
        addLog(`Erro Fatal: ${msg}`, "error");
        setLastError(msg);
        alert(`❌ ERRO AO SALVAR:\n${msg}`); 
      } finally { 
        setIsSaving(false); 
      }
  };

  if (initializing) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={48} /></div>;
  if (!user) return <AuthScreen onDemoMode={enterDemoMode} />;

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col md:flex-row overflow-hidden md:overflow-visible">
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 text-white p-3 rounded-xl shadow-lg"
        onClick={() => setMenuMobileOpen(true)}
      >
        ☰
      </button>
      {menuMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuMobileOpen(false)}
        />
      )}
      <nav
        className={`
          fixed inset-y-0 left-0 z-40
          w-72 bg-slate-900 text-white p-6
          transform transition-transform duration-300
          ${menuMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
          md:w-72 md:h-screen
          border-r border-slate-800
          flex flex-col
        `}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="text-slate-900" size={28}/>
          </div>
          <div>
            <h1 className="text-lg font-black italic uppercase">LAUDO<span className="text-yellow-500">GERADOR</span></h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Unidade Técnica</p>
          </div>
        </div>

        <div className="mb-6 px-4 py-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 border-2 border-blue-400/30">
            <UserIcon size={20} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black uppercase text-white truncate leading-tight">
              {profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
              {user?.email}
              {isDemoMode && ' 🎯 DEMO'}
            </p>
          </div>
        </div>

        {isDemoMode ? (
          <div className="mb-4 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-400">
              <Activity size={12} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-tighter">
                MODO DEMONSTRAÇÃO
              </span>
            </div>
            <p className="text-[8px] text-purple-300 font-bold leading-tight mt-1">
              Dados fictícios • Sem conexão real
            </p>
          </div>
        ) : (
          <div className={`mb-6 px-4 py-3 rounded-2xl border flex flex-col gap-2 transition-all ${dbStatus === 'error' ? 'bg-red-500/20 border-red-500' : 'bg-slate-800/50 border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={14} className={dbStatus === 'online' ? 'text-green-400' : (dbStatus === 'error' ? 'text-red-500' : 'text-slate-500')} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Conexão Nuvem</span>
              </div>
              <button onClick={checkConnection} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400">
                <RefreshCcw size={12} className={dbStatus === 'checking' ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : (dbStatus === 'error' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-slate-600')}`}></div>
              <span className={`text-[9px] font-bold uppercase ${dbStatus === 'online' ? 'text-green-400' : (dbStatus === 'error' ? 'text-red-500' : 'text-slate-500')}`}>
                {dbStatus === 'online' ? 'Pronto' : (dbStatus === 'error' ? 'ERRO DE ESQUEMA' : 'Desconectado')}
              </span>
            </div>
            {dbStatus === 'error' && (
              <button onClick={() => setShowSqlModal(true)} className="mt-2 w-full py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-900/40 animate-bounce duration-700">
                <AlertTriangle size={12}/> Reparar Banco
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          <NavItem icon={<Plus size={18}/>} label="Novo Registro" active={activeTab === 'new'} onClick={() => setActiveTab('new')} isAction />
          <NavItem icon={<History size={18}/>} label="Histórico Local" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); fetchLaudos(user.id); }} isAction />
          <NavItem icon={<UserIcon size={18}/>} label="Meu Perfil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} isAction />
          <NavItem icon={<Server size={18}/>} label="Config. smtp" active={activeTab === 'smtp'} onClick={() => setActiveTab('smtp')} isAction />
          
          {/* Main menu item for Characteristics now triggers the edit modal directly for better UX */}
          <NavItem 
            icon={<Settings size={18}/>} 
            label="Características" 
            active={false} 
            onClick={() => {
               setMenuMobileOpen(false);
               setShowCaracteristicasEditModal(true);
            }} 
          />

          {isAdminUser(user.email) && !isDemoMode && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-800/50 border-b border-slate-700">
                  <p className="text-[9px] text-slate-300 font-bold uppercase text-center">
                    🔧 Diagnóstico (Admin)
                  </p>
                </div>
                
                <div className="p-3 space-y-3">
                  <NavItem 
                    icon={<Bug size={18}/>} 
                    label="Debug Console" 
                    active={activeTab === 'debug'} 
                    onClick={() => setActiveTab('debug')} 
                    isAction 
                  />
                  
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-[9px] text-slate-400 font-bold uppercase text-center mb-3">Diagnóstico</p>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={testarConexaoBasica}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-green-600 text-white bg-green-500 transition-all font-black text-[10px] uppercase border border-green-600 active:scale-95"
                      >
                        <Wifi size={12} /> Testar Conexão
                      </button>
                      
                      <button 
                        onClick={testarStorage}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-blue-600 text-white bg-blue-500 transition-all font-black text-[10px] uppercase border border-blue-600 active:scale-95"
                      >
                        <Database size={12} /> Testar PDFOrganiz
                      </button>
                      
                      <button 
                        onClick={testarPDFOrganizadoDireto} 
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-600 text-white bg-gray-500 transition-all font-black text-[10px] uppercase border border-gray-600 active:scale-95"
                      >
                        🔧 Teste Storage (S/Sistema)
                      </button>

                      <button 
                        onClick={async () => {
                          if (!laudoSystem) {
                            alert('Sistema não inicializado');
                            return;
                          }
                          
                          const dadosTeste: LaudoData = {
                            cliente: 'TESTE ADMIN',
                            data: new Date().toISOString().split('T')[0],
                            observacoes: 'Teste administrativo'
                          };
                          
                          try {
                            const resultado = await laudoSystem.salvarLaudoCompleto(dadosTeste);
                            alert(resultado.success ? '✅ Teste admin OK' : `❌ ${resultado.error}`);
                          } catch (error: any) {
                            alert(`💥 Erro: ${error.message}`);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all font-black text-[10px] uppercase border border-amber-600 active:scale-95"
                      >
                        🧪 Teste Admin (salva pdf na tab)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-all font-black text-[10px] uppercase border border-transparent hover:border-red-500/30">
            <LogIn size={14} className="rotate-180" /> Sair do App
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-slate-200 p-4 md:px-12 md:py-8">
        <div className="bg-white rounded-[2rem] shadow-sm p-4 md:p-6 min-h-full">

          {activeTab === 'new' && (
            <div className="animate-in fade-in duration-500">
              {dbStatus === 'error' && !isDemoMode && (
                <div className="max-w-xl mx-auto mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-[2rem] flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle size={24} />
                    <h4 className="font-black uppercase text-sm">
                      Atenção Técnico: Erro no Banco
                    </h4>
                  </div>
                  <p className="text-xs text-red-600 font-bold leading-relaxed">
                    Detectamos que seu banco de dados no Supabase não possui todas as colunas necessárias.
                    <br /><br />
                    Para corrigir, clique no botão abaixo.
                  </p>
                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-red-700 transition-all"
                  >
                    <Code size={14} /> Abrir Tela de Reparo de Banco
                  </button>
                </div>
              )}
                  <PrototypeForm 
                onSave={saveLaudo} 
                isSaving={isSaving} 
                isDemoMode={isDemoMode}
                verificarECarregarCaracteristicas={verificarECarregarCaracteristicas}
                caracteristicas={caracteristicas}
                />
              </div>
          )}
          {activeTab === 'profile' && (
            <PerfilTab user={user} onComplete={async () => { await fetchProfile(user.id); setActiveTab('new'); }} />
          )}
          {activeTab === 'smtp' && (
            <SmtpTab user={user} onComplete={async () => { setActiveTab('new'); }} onTest={testSmtpConfig} />
          )}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                     {isDemoMode ? '📋 Histórico de Demonstração' : 'Histórico de Relatórios'}
                   </h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">
                     {isDemoMode ? 'Dados fictícios para demonstração' : `Consulta à base de dados para o perfil: ${profile?.nome || user.email}`}
                   </p>
                 </div>
                 <button 
                   onClick={() => fetchLaudos(user.id)}
                   disabled={isFetchingHistory}
                   className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all flex items-center gap-2 shadow-sm"
                 >
                   <RefreshCw size={18} className={isFetchingHistory ? 'animate-spin' : ''} />
                   <span className="text-[10px] font-black uppercase">
                     {isDemoMode ? 'Recarregar Demo' : 'Sincronizar'}
                   </span>
                 </button>
               </div>

               {isFetchingHistory ? (
                 <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-200 gap-4 shadow-sm">
                   <Loader2 className="animate-spin text-blue-600" size={40} />
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     {isDemoMode ? 'Carregando dados fictícios...' : 'Acessando Nuvem...'}
                   </p>
                 </div>
               ) : laudos.length === 0 ? (
                 <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                   <History className="mx-auto text-slate-200 mb-4" size={64} />
                   <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                     {isDemoMode ? 'Nenhum laudo fictício carregado' : 'Nenhum laudo encontrado na base'}
                   </p>
                 </div>
               ) : (
                 <div className="grid gap-3">
                   {laudos.map(l => (
                     <div key={l.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex justify-between items-center shadow-sm hover:border-blue-300 transition-all group animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <FileText size={20}/>
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase text-sm group-hover:text-blue-700 transition-colors">{l.cliente}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Clock size={10}/> {l.data}
                              </p>
                              {l.pdf_url && (
                                <>
                                  <p className="text-[10px] text-slate-300 font-bold">|</p>
                                  <p className="text-[9px] text-green-600 font-bold flex items-center gap-1">
                                    <Check size={10}/> PDF Disponível
                                  </p>
                                </>
                              )}
                              {isDemoMode && (
                                <p className="text-[8px] text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded-full">
                                  🎯 DEMO
                                </p>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter mt-1">ID: {l.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {l.pdf_url && (
                            <a 
                              href={l.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Abrir PDF na nuvem"
                              className="p-3 text-green-600 bg-green-50 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            >
                              <ExternalLink size={18}/>
                            </a>
                          )}
                          <button 
                            onClick={() => generatePDF(l as any)?.save(`laudo_${l.cliente?.replace(/\s+/g, '_')}_${l.id}.pdf`)} 
                            title="Baixar PDF Local"
                            className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <Download size={18}/>
                          </button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
          {activeTab === 'debug' && <DebugConsole logs={debugLogs} emailLogs={emailLogs} onClear={() => { setDebugLogs([]); setEmailLogs([]); }} onRepair={() => setShowSqlModal(true)} />}
          </div>
        </main>

        {showSqlModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 text-white w-full max-w-xl rounded-[2rem] p-8 border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Code size={20} className="text-yellow-500" />
                  <h3 className="font-black uppercase tracking-widest text-sm">Scripts de Reparo</h3>
                </div>
                <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
              </div>
              <p className="text-xs text-slate-400 mb-4 font-bold text-yellow-500 flex items-center gap-2">
                <AlertCircle size={14}/> Siga estas instruções rigorosamente:
              </p>
              <ol className="text-[10px] text-slate-400 space-y-2 mb-6 ml-4 list-decimal">
                <li>Clique no botão abaixo para copiar o script.</li>
                <li>Acesse o painel do Supabase.</li>
                <li>Vá em <strong>SQL Editor</strong> {"->"} <strong>New Query</strong>.</li>
                <li>Cole o script e clique em <strong>Run</strong>.</li>
              </ol>
              <ol className="text-[10px] text-yellow-500 space-y-2 mb-6 ml-4 font-bold italic">
                 * O script inclui todas as tabelas necessárias (laudos, perfis, config_smtp).
              </ol>
              <pre className="bg-black p-4 rounded-xl text-[10px] font-mono text-green-400 overflow-x-auto max-h-48 mb-6 border border-white/5">{SQL_SETUP}</pre>
              <button onClick={() => { navigator.clipboard.writeText(SQL_SETUP); addLog("Script de reparo copiado.", "success"); alert("✅ Script copiado para a área de transferência!"); }} className="w-full py-4 bg-yellow-500 text-slate-900 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                <Copy size={16}/> Copiar Script de Reparo
              </button>
            </div>
          </div>
        )}
        
        {/* Render both modals as they serve different purposes (summary vs edit) */}
        <TechSpecsModal 
          isOpen={showCaracteristicasModal} 
          onClose={() => setShowCaracteristicasModal(false)}
          specs={caracteristicas}
          onEdit={() => {
            setShowCaracteristicasModal(false);
            setShowCaracteristicasEditModal(true);
          }}
          isDemoMode={isDemoMode}
        />

        <CaracteristicasModal 
          isOpen={showCaracteristicasEditModal}
          onClose={() => setShowCaracteristicasEditModal(false)}
          onSave={salvarCaracteristicas}
          initialData={caracteristicas || undefined}
          isDemoMode={isDemoMode}
        />
    </div>
  );
};

export default App;
