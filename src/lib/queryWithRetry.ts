/**
 * PACK ENTERPRISE: Retry Logic com Exponential Backoff
 * Garante resiliência em falhas de rede e timeouts
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  shouldRetry: (error: unknown) => {
    // Retry em erros de rede e timeouts, não em erros de autenticação
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('unauthorized') || message.includes('forbidden')) {
        return false;
      }
      if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
        return true;
      }
    }
    return true;
  },
};

/**
 * Executa uma função com retry e backoff exponencial
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // Não fazer retry se não deve
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // Não fazer retry na última tentativa
      if (attempt === opts.maxRetries - 1) {
        break;
      }

      // Calcular delay com exponential backoff + jitter
      const exponentialDelay = opts.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelay);

      console.warn(
        `[queryWithRetry] Tentativa ${attempt + 1} falhou. Retry em ${Math.round(delay)}ms`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrapper para queries do Supabase com retry
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>
): Promise<{ data: T | null; error: Error | null }> {
  return queryWithRetry(async () => {
    const result = await queryFn();
    if (result.error) {
      throw result.error;
    }
    return result;
  }).catch((error) => ({
    data: null,
    error: error instanceof Error ? error : new Error(String(error)),
  }));
}
