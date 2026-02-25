
// useLaudos.ts
import { useState, useEffect } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { 
  LaudoSystem, 
  inicializarLaudoSystem, 
  getLaudoSystem,
  LaudoData,
  LaudoResult 
} from './src/services/laudoService'

const SUPABASE_ANON_KEY = 'sb_publishable_YSDHf2LguEOWtbYxI02B0g_CqAqa6tT';

export function useLaudos(supabase: SupabaseClient | null) {
  const [laudoSystem, setLaudoSystem] = useState<LaudoSystem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inicializar sistema quando supabase estiver disponível
  useEffect(() => {
    if (supabase && !laudoSystem) {
      const system = inicializarLaudoSystem(supabase, SUPABASE_ANON_KEY)
      setLaudoSystem(system)
    }
  }, [supabase, laudoSystem])

  const salvarLaudo = async (laudoData: LaudoData): Promise<LaudoResult> => {
    if (!laudoSystem) {
      return {
        success: false,
        error: 'Sistema não inicializado'
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      const resultado = await laudoSystem.salvarLaudoCompleto(laudoData)
      
      if (!resultado.success) {
        setError(resultado.error || 'Erro desconhecido')
      }
      
      return resultado
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao salvar laudo'
      setError(errorMsg)
      return {
        success: false,
        error: errorMsg
      }
    } finally {
      setLoading(false)
    }
  }

  const listarLaudos = async () => {
    if (!laudoSystem) {
      return { success: false, error: 'Sistema não inicializado' }
    }
    
    setLoading(true)
    try {
      return await laudoSystem.listarMeusLaudos()
    } finally {
      setLoading(false)
    }
  }

  const testeSistema = async () => {
    if (!laudoSystem) {
      return { success: false, error: 'Sistema não inicializado' }
    }
    
    return await laudoSystem.testeSistemaCompleto()
  }

  return {
    laudoSystem,
    salvarLaudo,
    listarLaudos,
    testeSistema,
    loading,
    error,
    clearError: () => setError(null)
  }
}
