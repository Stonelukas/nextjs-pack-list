/**
 * Error handling utilities for consistent error management
 * Provides standardized error types, handling, and logging
 */

/**
 * Standard application error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR', 
  PERMISSION = 'PERMISSION_ERROR',
  NETWORK = 'NETWORK_ERROR',
  STORAGE = 'STORAGE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Custom application error class with additional context
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error handler for async operations with proper typing
 */
export type AsyncResult<T, E = AppError> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>;

/**
 * Safe async wrapper that catches and standardizes errors
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorType?: ErrorType
): AsyncResult<T> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          errorType || ErrorType.UNKNOWN,
          { originalError: error }
        );
        
    return { success: false, error: appError };
  }
}

/**
 * Safe sync wrapper for operations that might throw
 */
export function safeSync<T>(
  operation: () => T,
  errorType?: ErrorType
): { success: true; data: T } | { success: false; error: AppError } {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          errorType || ErrorType.UNKNOWN,
          { originalError: error }
        );
        
    return { success: false, error: appError };
  }
}

/**
 * Validation helper that throws AppError for invalid data
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string,
  context?: Record<string, unknown>
): T {
  if (value === null || value === undefined) {
    throw new AppError(
      `${fieldName} is required`,
      ErrorType.VALIDATION,
      { field: fieldName, ...context }
    );
  }
  return value;
}

/**
 * Entity existence validator
 */
export function validateEntityExists<T>(
  entity: T | null | undefined,
  entityName: string,
  id: string
): T {
  if (!entity) {
    throw new AppError(
      `${entityName} with ID "${id}" not found`,
      ErrorType.NOT_FOUND,
      { entityName, id }
    );
  }
  return entity;
}

/**
 * Error logger with different levels based on error type
 */
export function logError(error: Error | AppError, context?: Record<string, unknown>): void {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };

  if (error instanceof AppError) {
    errorInfo.type = error.type;
    errorInfo.context = error.context;
    
    // Log at different levels based on error type
    switch (error.type) {
      case ErrorType.VALIDATION:
        console.warn('Validation Error:', errorInfo);
        break;
      case ErrorType.NOT_FOUND:
        console.warn('Not Found Error:', errorInfo);
        break;
      case ErrorType.PERMISSION:
        console.error('Permission Error:', errorInfo);
        break;
      case ErrorType.NETWORK:
        console.error('Network Error:', errorInfo);
        break;
      case ErrorType.STORAGE:
        console.error('Storage Error:', errorInfo);
        break;
      default:
        console.error('Application Error:', errorInfo);
    }
  } else {
    console.error('Unexpected Error:', errorInfo);
  }

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    // errorReportingService.captureException(error, errorInfo);
  }
}

/**
 * Error boundary helper for React components
 */
export function createErrorHandler(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    logError(error, {
      component: componentName,
      errorInfo: errorInfo.componentStack
    });
  };
}

/**
 * Storage error handling helper
 */
export function handleStorageError(operation: string, error: unknown): never {
  const message = `Storage operation "${operation}" failed`;
  const context = { operation };
  
  if (error instanceof Error) {
    context.originalError = error.message;
  }
  
  logError(new AppError(message, ErrorType.STORAGE, context));
  throw new AppError(message, ErrorType.STORAGE, context);
}

/**
 * Network error handling helper
 */
export function handleNetworkError(
  url: string, 
  method: string = 'GET', 
  error: unknown
): never {
  const message = `Network request failed: ${method} ${url}`;
  const context = { url, method };
  
  if (error instanceof Error) {
    context.originalError = error.message;
  }
  
  const networkError = new AppError(message, ErrorType.NETWORK, context);
  logError(networkError);
  throw networkError;
}

/**
 * Form validation error aggregator
 */
export class ValidationErrors {
  private errors: Record<string, string[]> = {};

  addError(field: string, message: string): this {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
    return this;
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  getErrors(): Record<string, string[]> {
    return { ...this.errors };
  }

  getFirstError(field: string): string | null {
    return this.errors[field]?.[0] || null;
  }

  getAllErrors(): string[] {
    return Object.values(this.errors).flat();
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const message = this.getAllErrors().join(', ');
      throw new AppError(message, ErrorType.VALIDATION, { fields: this.errors });
    }
  }
}

/**
 * Retry utility for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        logError(lastError, { 
          attempts: maxAttempts, 
          finalAttempt: true 
        });
        throw lastError;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}