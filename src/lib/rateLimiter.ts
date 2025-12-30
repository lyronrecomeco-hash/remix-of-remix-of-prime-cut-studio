/**
 * PACK ENTERPRISE: Rate Limiting Middleware para Edge Functions
 * Protege contra DDoS e brute force
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface RateLimitConfig {
  /** Limite de requisições por janela */
  limit: number;
  /** Janela de tempo em minutos */
  windowMinutes: number;
  /** Nome do endpoint para tracking */
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
}

// Configurações padrão por tipo de endpoint
export const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMinutes: 1 },
  email: { limit: 10, windowMinutes: 1 },
  api: { limit: 100, windowMinutes: 1 },
  marketing: { limit: 50, windowMinutes: 60 },
  admin: { limit: 30, windowMinutes: 1 },
} as const;

/**
 * Verifica e atualiza rate limit para um identificador
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  
  try {
    // Buscar ou criar registro de rate limit
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('[RateLimit] Erro ao buscar:', fetchError);
      // Em caso de erro, permitir a requisição
      return {
        allowed: true,
        remaining: config.limit,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }

    if (existing) {
      // Registro existe na janela atual
      const newCount = existing.request_count + 1;
      const resetAt = new Date(
        new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000
      );

      if (newCount > config.limit) {
        const retryAfterSeconds = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfterSeconds,
        };
      }

      // Atualizar contador
      await supabase
        .from('rate_limits')
        .update({ request_count: newCount })
        .eq('id', existing.id);

      return {
        allowed: true,
        remaining: config.limit - newCount,
        resetAt,
      };
    }

    // Criar novo registro
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint: config.endpoint,
      request_count: 1,
      window_start: now.toISOString(),
    });

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
    };
  } catch (error) {
    console.error('[RateLimit] Erro inesperado:', error);
    // Em caso de erro, permitir a requisição
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
    };
  }
}

/**
 * Gera resposta HTTP para rate limit excedido
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Muitas requisições. Por favor, aguarde antes de tentar novamente.',
      retryAfter: result.retryAfterSeconds,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        ...corsHeaders,
      },
    }
  );
}

/**
 * Extrai identificador de requisição (IP ou user-agent)
 */
export function getRequestIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip');
  
  return cfConnecting || realIp || forwarded?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Limpa registros de rate limit antigos (para manutenção)
 */
export async function cleanupOldRateLimits(supabase: SupabaseClient): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
  
  const { data, error } = await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', cutoff.toISOString())
    .select('id');

  if (error) {
    console.error('[RateLimit] Erro ao limpar:', error);
    return 0;
  }

  return data?.length || 0;
}
