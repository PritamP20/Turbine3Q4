/**
 * Transaction error handling utilities
 */

export interface TransactionError {
  message: string;
  code?: string;
  canRetry: boolean;
  userFriendlyMessage: string;
}

/**
 * Parse and categorize transaction errors
 */
export function parseTransactionError(error: any): TransactionError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // User rejected transaction
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
    return {
      message: errorMessage,
      code: 'USER_REJECTED',
      canRetry: true,
      userFriendlyMessage: 'Transaction was cancelled',
    };
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
    return {
      message: errorMessage,
      code: 'INSUFFICIENT_FUNDS',
      canRetry: false,
      userFriendlyMessage: 'Insufficient funds to complete this transaction',
    };
  }
  
  // Network/RPC errors
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return {
      message: errorMessage,
      code: 'RATE_LIMIT',
      canRetry: true,
      userFriendlyMessage: 'Network is busy. Please try again in a moment',
    };
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      message: errorMessage,
      code: 'TIMEOUT',
      canRetry: true,
      userFriendlyMessage: 'Transaction timed out. Please try again',
    };
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return {
      message: errorMessage,
      code: 'NETWORK_ERROR',
      canRetry: true,
      userFriendlyMessage: 'Network error. Please check your connection and try again',
    };
  }
  
  // Program-specific errors
  if (errorMessage.includes('AlreadyRegistered')) {
    return {
      message: errorMessage,
      code: 'ALREADY_REGISTERED',
      canRetry: false,
      userFriendlyMessage: 'You have already completed this action',
    };
  }
  
  if (errorMessage.includes('MaxAttendeesReached')) {
    return {
      message: errorMessage,
      code: 'MAX_ATTENDEES',
      canRetry: false,
      userFriendlyMessage: 'This event is full',
    };
  }
  
  if (errorMessage.includes('EventClosed') || errorMessage.includes('EventEnded')) {
    return {
      message: errorMessage,
      code: 'EVENT_CLOSED',
      canRetry: false,
      userFriendlyMessage: 'This event is no longer accepting RSVPs',
    };
  }
  
  if (errorMessage.includes('NotEligible')) {
    return {
      message: errorMessage,
      code: 'NOT_ELIGIBLE',
      canRetry: false,
      userFriendlyMessage: 'You are not eligible for this action',
    };
  }
  
  if (errorMessage.includes('InsufficientBalance')) {
    return {
      message: errorMessage,
      code: 'INSUFFICIENT_BALANCE',
      canRetry: false,
      userFriendlyMessage: 'Insufficient balance in treasury',
    };
  }
  
  if (errorMessage.includes('AlreadyClaimed')) {
    return {
      message: errorMessage,
      code: 'ALREADY_CLAIMED',
      canRetry: false,
      userFriendlyMessage: 'You have already claimed this reward',
    };
  }
  
  // Blockhash errors
  if (errorMessage.includes('Blockhash not found') || errorMessage.includes('blockhash')) {
    return {
      message: errorMessage,
      code: 'BLOCKHASH_ERROR',
      canRetry: true,
      userFriendlyMessage: 'Transaction expired. Please try again',
    };
  }
  
  // Simulation errors
  if (errorMessage.includes('simulation failed')) {
    return {
      message: errorMessage,
      code: 'SIMULATION_FAILED',
      canRetry: true,
      userFriendlyMessage: 'Transaction would fail. Please check your inputs and try again',
    };
  }
  
  // Default error
  return {
    message: errorMessage,
    code: 'UNKNOWN',
    canRetry: true,
    userFriendlyMessage: 'Transaction failed. Please try again',
  };
}

/**
 * Log transaction error for debugging
 */
export function logTransactionError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
) {
  const parsedError = parseTransactionError(error);
  
  console.error(`[Transaction Error - ${context}]`, {
    code: parsedError.code,
    message: parsedError.message,
    canRetry: parsedError.canRetry,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  });
  
  return parsedError;
}

/**
 * Retry a transaction with exponential backoff
 */
export async function retryTransaction<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const parsedError = parseTransactionError(error);
      
      // Don't retry if error is not retryable
      if (!parsedError.canRetry) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying transaction in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
