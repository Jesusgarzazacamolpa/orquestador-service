import { Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate';
import { AppError } from '../../utils/app-error';
import { validationResult, ValidationError } from 'express-validator';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Validate Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next when validation passes', () => {
    (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    } as any);

    validate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw AppError when validation fails', () => {
    (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: 'email', msg: 'Invalid email', value: 'invalid-email' },
        { path: 'password', msg: 'Password too short', value: '123' },
      ] as ValidationError[],
    } as any);

    expect(() => validate(mockReq as Request, mockRes as Response, mockNext)).toThrow(AppError);
    
    try {
      validate(mockReq as Request, mockRes as Response, mockNext);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
      expect((error as AppError).statusCode).toBe(400);
      expect((error as AppError).details?.errors).toHaveLength(2);
    }
  });
});