import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../middleware/error-handler';
import { AppError } from '../../utils/app-error';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      headers: { 'x-request-id': 'test-request-id' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 400, { detail: 'test' });
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError and return correct response', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', 400, { field: 'email' });
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          statusCode: 400,
        }),
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          path: '/test',
        }),
      }));
    });

    it('should handle generic Error and return 500', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        }),
      }));
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unknown routes', () => {
      notFoundHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Route GET /test not found',
          statusCode: 404,
        }),
      }));
    });
  });
});