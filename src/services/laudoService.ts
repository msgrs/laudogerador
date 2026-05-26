
// src/services/laudoService.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface LaudoData {
  id?: string
  cliente: string
  data?: string
  user_id?: string
  gen_l1n?: number | null
  gen_l2n?: number | null
  gen_l3n?: number | null
  frequencia?: number | null
  rpm?: number | null
  pressao_bar?: number | null
  oleo_visual?: string
  agua_visual?: string
  vent_visual?: string
  correias_visual?: string
  observacoes?: string
  created_at?: string
  pdf_url?: string
  processado_em?: string
  [key: string]: any // Para campos adicionais
}

/**
 * Fix: Added missing properties used in the implementation of salvarLaudoCompleto
 */
export interface LaudoResult {
  success: boolean
  message?: string
  laudo?: LaudoData
  pdf_url?: string
  error?: string
  warning?: string
  pdf_error?: string
  download_url?: string
  step?: string
}

export class LaudoSystem {
  private supabase: SupabaseClient
  private edgeFunctionUrl: string
  private anonKey: string

  constructor(supabaseClient: SupabaseClient, anonKey: string = '') {
    this.supabase = supabaseClient
    this.edgeFunctionUrl = 'https://ptcqgenxmbydpxxasyba.supabase.co/functions/v1/process-laudo'
    this.anonKey = anonKey
  }


async gerarPDFLocal(laudoData: LaudoData): Promise<{ blob: Blob | null; nomeArquivo: string }> {
  try {
    console.log('🖨️ Gerando PDF localmente...');
    
    // Importar jsPDF dinamicamente (evita problemas de bundle)
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    const bluePrimary: [number, number, number] = [0, 51, 153];
    
    // Cabeçalho
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
    doc.text("LAUDOGERADOR", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("RELATÓRIO TÉCNICO DE MANUTENÇÃO E PERFORMANCE", 105, 30, { align: "center" });
    
    // Dados do cliente
    autoTable(doc, {
      startY: 45,
      head: [['DADOS DO ATENDIMENTO', 'VALOR']],
      body: [
        ['ID do Laudo', laudoData.id || 'N/A'],
        ['Data', laudoData.data || new Date().toISOString().split('T')[0]],
        ['Cliente / Unidade', laudoData.cliente ? laudoData.cliente.toUpperCase() : '---'],
        ['Técnico Responsável', laudoData.user_id ? `ID: ${laudoData.user_id.substring(0, 8)}...` : '---'],
      ],
      theme: 'striped',
      headStyles: { fillColor: bluePrimary }
    });
    
    // Verificação Visual
    if (laudoData.oleo_visual || laudoData.agua_visual || laudoData.vent_visual || laudoData.correias_visual) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY || 80,
        head: [['VERIFICAÇÃO VISUAL', 'ESTADO']],
        body: [
          ['Nível de Óleo Lubrificante', laudoData.oleo_visual || 'N/A'],
          ['Nível de Água / Arrefecimento', laudoData.agua_visual || 'N/A'],
          ['Ventilação / Radiador', laudoData.vent_visual || 'N/A'],
          ['Estado das Correias', laudoData.correias_visual || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      });
    }
    
    // Parâmetros do Motor (se existirem)
    const motorData = [];
    if (laudoData.rpm) motorData.push(['Rotação (RPM)', `${laudoData.rpm} RPM`]);
    if (laudoData.pressao_bar) motorData.push(['Pressão de Óleo', `${laudoData.pressao_bar} Bar`]);
    if (laudoData.vbat) motorData.push(['Tensão Bateria', `${laudoData.vbat}V`]);
    if (laudoData.comb_percent) motorData.push(['Combustível (%)', `${laudoData.comb_percent}%`]);
    if (laudoData.comb_litros) motorData.push(['Combustível (Litros)', `${laudoData.comb_litros}L`]);
    
    if (motorData.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY || 120,
        head: [['PARÂMETROS DO MOTOR', 'MEDIDO']],
        body: motorData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    // Medições Elétricas (se existirem)
    const medidasEletricas = [];
    if (laudoData.gen_l1n) medidasEletricas.push(['Gerador L1-N', laudoData.gen_l1n.toString()]);
    if (laudoData.gen_l2n) medidasEletricas.push(['Gerador L2-N', laudoData.gen_l2n.toString()]);
    if (laudoData.gen_l3n) medidasEletricas.push(['Gerador L3-N', laudoData.gen_l3n.toString()]);
    if (laudoData.frequencia) medidasEletricas.push(['Frequência (Hz)', laudoData.frequencia.toString()]);
    
    if (medidasEletricas.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY || 160,
        head: [['MEDIÇÃO ELÉTRICA', 'VALOR (V)']],
        body: medidasEletricas,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] }
      });
    }
    
    // Observações (se existirem)
    if (laudoData.observacoes) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY || 200,
        head: [['OBSERVAÇÕES TÉCNICAS']],
        body: [[laudoData.observacoes]],
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139] }
      });
    }
    
    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado por LAUDOGERADOR v2.0 - ${new Date().toLocaleString('pt-BR')}`, 105, 285, { align: "center" });
    
    // Converter para Blob
    const pdfBlob = doc.output('blob');
    
    // Gerar nome de arquivo organizado
    const dataFormatada = laudoData.data 
      ? laudoData.data.replace(/-/g, '') 
      : new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const nomeCliente = laudoData.cliente
      ? laudoData.cliente
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w_]/g, '')
          .substring(0, 20)
      : 'laudo';
    
    const idReduzido = laudoData.id 
      ? laudoData.id.split('_').pop()?.substring(0, 6) 
      : Date.now().toString().slice(-6);
    
    const nomeArquivo = `laudo_${nomeCliente}_${dataFormatada}_${idReduzido}.pdf`;
    
    console.log(`📄 PDF local gerado: ${nomeArquivo} (${pdfBlob.size} bytes)`);
    
    return {
      blob: pdfBlob,
      nomeArquivo: nomeArquivo
    };
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF local:', error);
    return {
      blob: null,
      nomeArquivo: ''
    };
  }
}

/**
 * SALVAR LAUDO COM PDF LOCAL (nome organizado)
 */
async salvarLaudoComPDFOrganizado(laudoData: LaudoData): Promise<LaudoResult> {
  console.group('🚀 SALVANDO LAUDO COM PDF ORGANIZADO');
  
  try {
    // 1. Gerar PDF localmente
    const pdfResult = await this.gerarPDFLocal(laudoData);
    
    if (!pdfResult.blob) {
      throw new Error('Não foi possível gerar o PDF');
    }
    
    // 2. Upload para Storage
    console.log(`📤 Salvando PDF no Storage: ${pdfResult.nomeArquivo}`);
    
    const { data: storageData, error: storageError } = await this.supabase.storage
      .from('laudos-pdf')
      .upload(pdfResult.nomeArquivo, pdfResult.blob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (storageError) {
      throw new Error(`Erro Storage: ${storageError.message}`);
    }
    
    // 3. Obter URL pública
    const { data: urlData } = this.supabase.storage
      .from('laudos-pdf')
      .getPublicUrl(pdfResult.nomeArquivo);
    
    const pdfUrl = urlData.publicUrl;
    console.log('🔗 URL do PDF:', pdfUrl);
    
    // 4. Adicionar URL ao laudo
    laudoData.pdf_url = pdfUrl;
    
    // 5. Salvar/Atualizar no banco via upsert
    let savedLaudo = null;
    let saveError = null;
    
    const resDb = await this.supabase
      .from('laudos')
      .upsert([laudoData])
      .select()
      .single();
      
    if (resDb.error && (resDb.error.message?.includes('imagens') || resDb.error.message?.includes('schema cache'))) {
      console.warn('⚠️ Coluna "imagens" ausente no cache do Supabase. Tentando salvar laudo sem "imagens"...');
      const fallbackData = { ...laudoData };
      delete fallbackData.imagens;
      
      const resFallback = await this.supabase
        .from('laudos')
        .upsert([fallbackData])
        .select()
        .single();
        
      savedLaudo = resFallback.data;
      saveError = resFallback.error;
    } else {
      savedLaudo = resDb.data;
      saveError = resDb.error;
    }
    
    if (saveError) {
      throw new Error(`Erro banco: ${saveError.message}`);
    }
    
    console.log('✅✅ Laudo salvo com PDF organizado!');
    console.groupEnd();
    
    return {
      success: true,
      message: 'Laudo salvo com PDF organizado!',
      laudo: savedLaudo,
      pdf_url: pdfUrl,
      download_url: pdfUrl
    };
    
  } catch (error: any) {
    console.error('💥 Erro:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error.message
    };
  }
}

async salvarLaudoComPDFnoStorage(
  laudoData: LaudoData, 
  pdfBlob: Blob, 
  nomeArquivo?: string
): Promise<LaudoResult> {
  console.group('🚀 SALVANDO LAUDO COM PDF NO STORAGE')
  
  try {
    // 1. Validações
    if (!laudoData.cliente) {
      throw new Error('Cliente é obrigatório')
    }
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('PDF não pode estar vazio')
    }

    // 2. Gerar ID único
    if (!laudoData.id) {
      laudoData.id = `laudo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 3. Adicionar user_id
    const { data: userData } = await this.supabase.auth.getUser()
    if (userData?.user?.id) {
      laudoData.user_id = userData.user.id
    }

    // 4. Adicionar timestamp
    if (!laudoData.created_at) {
      laudoData.created_at = new Date().toISOString()
    }

    // 5. Nome do arquivo PDF
    const nomeDoArquivo = nomeArquivo || `laudo_${laudoData.id}.pdf`
    
    console.log(`📤 Upload para bucket 'laudos-pdf': ${nomeDoArquivo} (${pdfBlob.size} bytes)`)
    
    // 6. UPLOAD DIRETO PARA O STORAGE (BUCKET CORRETO SIMULTÂNEO)
    const { data: storageData, error: storageError } = await this.supabase.storage
      .from('laudos-pdf') // ← SEU BUCKET
      .upload(nomeDoArquivo, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (storageError) {
      console.error('❌ Erro no Storage:', storageError)
      throw new Error(`Falha no upload para Storage: ${storageError.message}`)
    }
    
    console.log('✅ PDF salvo no Storage com upsert=true:', storageData?.path)
    
    // 7. Obter URL pública
    const { data: urlData } = this.supabase.storage
      .from('laudos-pdf')
      .getPublicUrl(nomeDoArquivo)
    
    const pdfUrl = urlData.publicUrl
    console.log('🔗 URL do PDF:', pdfUrl)
    
    // 8. Adicionar URL ao laudo
    laudoData.pdf_url = pdfUrl
    
    // 9. Salvar no banco via upsert
    console.log('💾 Salvando/Atualizando no banco de dados via upsert...')
    let savedLaudo = null;
    let saveError = null;
    
    const resDb = await this.supabase
      .from('laudos')
      .upsert([laudoData])
      .select()
      .single();
      
    if (resDb.error && (resDb.error.message?.includes('imagens') || resDb.error.message?.includes('schema cache'))) {
      console.warn('⚠️ Coluna "imagens" ausente no cache do Supabase. Tentando salvar sem "imagens"...');
      const fallbackData = { ...laudoData };
      delete fallbackData.imagens;
      
      const resFallback = await this.supabase
        .from('laudos')
        .upsert([fallbackData])
        .select()
        .single();
        
      savedLaudo = resFallback.data;
      saveError = resFallback.error;
    } else {
      savedLaudo = resDb.data;
      saveError = resDb.error;
    }

    if (saveError) {
      console.error('❌ Erro ao salvar no banco:', saveError)
      
      // Tentar remover o arquivo do storage se falhou no banco
      await this.supabase.storage
        .from('laudos-pdf')
        .remove([nomeDoArquivo])
        .catch(e => console.warn('Não consegui remover arquivo:', e))
      
      throw new Error(`Erro no banco: ${saveError.message}`)
    }

    console.log('✅✅ Laudo salvo COMPLETO! ID:', savedLaudo.id)
    console.groupEnd()
    
    return {
      success: true,
      message: 'Laudo salvo e PDF enviado para nuvem!',
      laudo: savedLaudo,
      pdf_url: pdfUrl,
      download_url: pdfUrl
    }

  } catch (error: any) {
    console.error('💥💥 ERRO ao salvar laudo com PDF:', error)
    console.groupEnd()
    
    return {
      success: false,
      error: error.message,
      step: 'salvarLaudoComPDFnoStorage'
    }
  }
}

/**
 * TESTAR CONEXÃO COM STORAGE
 */
async testarConexaoStorage(): Promise<LaudoResult> {
  try {
    console.log('🧪 Testando conexão com Storage...')
    
    // 1. Listar buckets
    const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Erro listBuckets: ${bucketsError.message}`)
    }
    
    console.log('📦 Buckets:', buckets?.map(b => `${b.name} (${b.public ? 'public' : 'private'})`))
    
    // 2. Verificar bucket 'laudos-pdf'
    const bucketLaudos = buckets?.find(b => b.name === 'laudos-pdf')
    if (!bucketLaudos) {
      throw new Error('Bucket "laudos-pdf" não encontrado')
    }
    
    // 3. Testar upload simples
    const testBlob = new Blob(['Teste de conexão'], { type: 'text/plain' })
    const { error: testError } = await this.supabase.storage
      .from('laudos-pdf')
      .upload(`teste_${Date.now()}.txt`, testBlob)
    
    if (testError) {
      throw new Error(`Teste upload falhou: ${testError.message}`)
    }
    
    return {
      success: true,
      message: 'Storage funcionando perfeitamente!'
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}


  // 1. SALVAR LAUDO E GERAR PDF
  async salvarLaudoCompleto(laudoData: LaudoData): Promise<LaudoResult> {
    console.group('🚀 SALVANDO LAUDO COMPLETO')
    
    try {
      // A. Validar dados mínimos
      if (!laudoData.cliente) {
        throw new Error('Cliente é obrigatório')
      }
      
      // B. Gerar ID único se não fornecido
      if (!laudoData.id) {
        laudoData.id = `laudo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      // C. Adicionar user_id do usuário logado
      const { data: userData } = await this.supabase.auth.getUser()
      if (userData?.user?.id) {
        laudoData.user_id = userData.user.id
      }
      
      // D. Adicionar timestamp
      if (!laudoData.created_at) {
        laudoData.created_at = new Date().toISOString()
      }
      
      console.log('📝 Dados do laudo:', laudoData)
      
      // E. SALVAR NO BANCO DE DADOS
      console.log('💾 Salvando no Supabase...')
      let savedLaudo = null;
      let saveError = null;
      
      const resDb = await this.supabase
        .from('laudos')
        .insert([laudoData])
        .select()
        .single();
        
      if (resDb.error && (resDb.error.message?.includes('imagens') || resDb.error.message?.includes('schema cache'))) {
        console.warn('⚠️ Coluna "imagens" ausente no cache do Supabase. Tentando salvar no banco sem "imagens"...');
        const fallbackData = { ...laudoData };
        delete fallbackData.imagens;
        
        const resFallback = await this.supabase
          .from('laudos')
          .insert([fallbackData])
          .select()
          .single();
          
        savedLaudo = resFallback.data;
        saveError = resFallback.error;
      } else {
        savedLaudo = resDb.data;
        saveError = resDb.error;
      }
      
      if (saveError) {
        throw new Error(`Erro ao salvar: ${saveError.message}`)
      }
      
      console.log('✅ Laudo salvo no banco:', savedLaudo.id)
      
      // F. GERAR PDF VIA EDGE FUNCTION
      console.log('🔄 Chamando Edge Function para gerar PDF...')
      const pdfResult = await this.gerarPDFparaLaudo(savedLaudo)
      
      if (!pdfResult.success) {
        console.warn('⚠️ PDF não gerado, mas laudo foi salvo:', pdfResult.error)
        return {
          success: true,
          warning: 'Laudo salvo, mas PDF não gerado',
          laudo: savedLaudo,
          pdf_error: pdfResult.error
        }
      }
      
      console.log('✅ PDF gerado com sucesso:', pdfResult.pdf_url)
      
      // G. ATUALIZAR LAUDO COM URL DO PDF
      console.log('📤 Atualizando laudo com URL do PDF...')
      const { error: updateError } = await this.supabase
        .from('laudos')
        .update({ 
          pdf_url: pdfResult.pdf_url,
          processado_em: new Date().toISOString()
        })
        .eq('id', savedLaudo.id)
      
      if (updateError) {
        console.warn('⚠️ Não foi possível atualizar URL:', updateError.message)
      }
      
      console.groupEnd()
      
      return {
        success: true,
        message: 'Laudo salvo e PDF gerado com sucesso!',
        laudo: { ...savedLaudo, pdf_url: pdfResult.pdf_url },
        pdf_url: pdfResult.pdf_url,
        download_url: pdfResult.pdf_url
      }
      
    } catch (error: any) {
      console.error('💥 ERRO NO PROCESSO:', error)
      console.groupEnd()
      
      return {
        success: false,
        error: error.message,
        step: 'salvarLaudoCompleto'
      }
    }
  }

  // 2. GERAR PDF PARA UM LAUDO EXISTENTE
  async gerarPDFparaLaudo(laudoRecord: LaudoData) {
    try {
      // Obter email do usuário
      const { data: userData } = await this.supabase.auth.getUser()
      const userEmail = userData?.user?.email || 'notificacoes@laudogerador.com'
      
      console.log('📧 Email para envio:', userEmail)
      
      // Chamar Edge Function
      const session = await this.supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': this.anonKey || token // Fallback para token se anonKey não fornecida
        },
        body: JSON.stringify({
          record: laudoRecord,
          user_email: userEmail
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido na Edge Function')
      }
      
      return {
        success: true,
        pdf_url: result.pdf_url,
        file_name: result.file_name,
        raw_response: result
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 3. LISTAR LAUDOS DO USUÁRIO
  async listarMeusLaudos() {
    try {
      const { data: userData } = await this.supabase.auth.getUser()
      const userId = userData?.user?.id
      
      if (!userId) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        }
      }
      
      const { data, error } = await this.supabase
        .from('laudos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        success: true,
        laudos: data,
        count: data.length
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 4. GERAR PDF PARA LAUDO EXISTENTE (por ID)
  async gerarPDFparaLaudoID(laudoId: string) {
    try {
      // Buscar laudo
      const { data: laudo, error } = await this.supabase
        .from('laudos')
        .select('*')
        .eq('id', laudoId)
        .single()
      
      if (error) throw error
      
      // Gerar PDF
      return await this.gerarPDFparaLaudo(laudo)
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 5. FUNÇÃO DE TESTE
  async testeSistemaCompleto() {
    console.log('🧪 TESTE DO SISTEMA COMPLETO')
    
    // Dados de teste
    const laudoTeste: LaudoData = {
      cliente: 'Empresa de Teste Ltda',
      data: new Date().toISOString().split('T')[0],
      gen_l1n: 220.5,
      gen_l2n: 219.8,
      gen_l3n: 221.2,
      frequencia: 60.1,
      rpm: 1800,
      pressao_bar: 2.5,
      oleo_visual: 'Nível normal, cor adequada',
      agua_visual: 'Nível normal',
      vent_visual: 'Funcionamento adequado',
      correias_visual: 'Bom estado, sem trincas',
      observacoes: 'Teste do sistema completo de laudos.\nGerador em perfeitas condições de uso.\nPróxima manutenção em 250 horas.',
      vbat: 12.6,
      comb_percent: 85,
      comb_litros: 42.5
    }
    
    // Executar teste
    const resultado = await this.salvarLaudoCompleto(laudoTeste)
    
    console.log('📊 RESULTADO DO TESTE:', resultado)
    
    if (resultado.success) {
      console.log('🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!')
      console.log('🔗 PDF:', resultado.pdf_url)
      
      // Listar todos os laudos
      const lista = await this.listarMeusLaudos()
      console.log('📋 Meus laudos:', lista)
      
    } else {
      console.error('💥 TESTE FALHOU:', resultado.error)
    }
    
    return resultado
  }
}

// Instância global (opcional)
let laudoSystemInstance: LaudoSystem | null = null

export function inicializarLaudoSystem(supabaseClient: SupabaseClient, anonKey: string = ''): LaudoSystem {
  laudoSystemInstance = new LaudoSystem(supabaseClient, anonKey)
  console.log('✅ Sistema de Laudos inicializado')
  return laudoSystemInstance
}

export function getLaudoSystem(): LaudoSystem | null {
  return laudoSystemInstance
}
