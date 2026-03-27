interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const getDelay = (attempt: number, initialDelay: number, maxDelay: number, multiplier: number): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const jitterDelay = exponentialDelay + Math.random() * exponentialDelay * 0.1;
  return Math.min(jitterDelay, maxDelay);
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        const delay = getDelay(attempt, opts.initialDelayMs, opts.maxDelayMs, opts.backoffMultiplier);
        console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, lastError.message);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

export const isRetryableError = (error: any): boolean => {
  if (!(error instanceof Error)) return false;

  const retryableMessages = [
    'timeout',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ERR_NETWORK',
    'ERR_SOCKET_HANG_UP',
  ];

  return retryableMessages.some(msg => error.message.includes(msg));
};
