// src/utils/paymentRetry.ts
import { PaymentError, RetryOptions, PaymentResult } from '../interfaces/payment.interface';
import { PaymentErrorHandler } from './paymentErrorHandler';

/**
 * Ejecuta una función asíncrona con reintentos exponenciales
 * @param fn Función a ejecutar
 * @param options Opciones de reintentos
 * @returns PaymentResult con el resultado de la operación
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<PaymentResult<T>> {
  const { maxRetries, baseDelay, timeout, onRetry } = options;
  let lastError: PaymentError | null = null;

  for (let attemptNumber = 1; attemptNumber <= maxRetries; attemptNumber++) {
    try {
      console.log(`[PaymentRetry] Intento ${attemptNumber} de ${maxRetries}`);

      // Ejecutar la función con timeout
      const result = await executeWithTimeout(fn, timeout, attemptNumber);

      // Si la ejecución fue exitosa, retornar el resultado
      console.log(`[PaymentRetry] ✓ Intento ${attemptNumber} exitoso`);
      return {
        success: true,
        data: result,
        attempts: attemptNumber,
      };

    } catch (error: any) {
      console.log(`[PaymentRetry] ✗ Intento ${attemptNumber} falló:`, error.message);

      // Categorizar el error
      const paymentError = PaymentErrorHandler.categorizeError(error, attemptNumber);
      lastError = paymentError;

      console.log(`[PaymentRetry] Código de error: ${paymentError.code}, Recuperable: ${paymentError.isRetryable}`);

      // Si el error NO es recuperable, fallar inmediatamente sin reintentar
      if (!paymentError.isRetryable) {
        console.log(`[PaymentRetry] Error no recuperable, abortando reintentos`);
        return {
          success: false,
          error: paymentError,
          attempts: attemptNumber,
        };
      }

      // Si es el último intento, retornar error
      if (attemptNumber === maxRetries) {
        console.log(`[PaymentRetry] Último intento alcanzado, operación fallida`);
        return {
          success: false,
          error: paymentError,
          attempts: attemptNumber,
        };
      }

      // Calcular delay con backoff exponencial: baseDelay * 3^(attemptNumber - 1)
      // Intento 1 → 1s, Intento 2 → 3s, Intento 3 → 9s
      const delay = baseDelay * Math.pow(3, attemptNumber - 1);
      console.log(`[PaymentRetry] Esperando ${delay}ms antes del siguiente intento`);

      // Ejecutar callback onRetry si existe
      if (onRetry) {
        try {
          onRetry(paymentError, attemptNumber);
        } catch (callbackError) {
          console.error(`[PaymentRetry] Error en callback onRetry:`, callbackError);
        }
      }

      // Esperar antes del siguiente intento
      await sleep(delay);
    }
  }

  // No debería llegar aquí, pero por seguridad retornar el último error
  return {
    success: false,
    error: lastError!,
    attempts: maxRetries,
  };
}

/**
 * Ejecuta una función con timeout
 * Si la función tarda más que el timeout, lanza un error de timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  attemptNumber: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject({
          message: `Timeout: La operación tardó más de ${timeoutMs}ms`,
          code: 'ETIMEDOUT',
          attemptNumber,
        });
      }, timeoutMs);
    }),
  ]);
}

/**
 * Función helper para esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
