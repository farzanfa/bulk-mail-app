export class RazorpayError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RazorpayError';
  }
}

export function handleRazorpayError(error: any): RazorpayError {
  if (error.error) {
    // Razorpay API error format
    const { code, description, metadata } = error.error;
    return new RazorpayError(
      description || 'Razorpay API error',
      code,
      error.statusCode,
      metadata
    );
  }
  
  // Generic error
  return new RazorpayError(
    error.message || 'Unknown Razorpay error',
    'UNKNOWN_ERROR',
    500,
    error
  );
}

export const RazorpayErrorCodes = {
  BAD_REQUEST_ERROR: 'BAD_REQUEST_ERROR',
  GATEWAY_ERROR: 'GATEWAY_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export function isRazorpayError(error: any): error is RazorpayError {
  return error instanceof RazorpayError;
}