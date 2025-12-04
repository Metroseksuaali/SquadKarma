// src/utils/errors.ts
// Custom error classes for the API

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class CooldownError extends AppError {
  constructor(public secondsRemaining: number) {
    super(
      `You can vote again in ${Math.ceil(secondsRemaining / 60)} minutes`,
      429,
      'COOLDOWN_ACTIVE'
    );
    this.name = 'CooldownError';
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many votes. Please slow down.', 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}
