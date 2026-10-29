import { jest } from '@jest/globals';

jest.setTimeout(10000);

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.VEHICLE_SERVICE_URL = 'http://localhost:8083';
  process.env.CATALOG_SERVICE_URL = 'http://localhost:8082';
  process.env.PORT = '8084';
});

afterAll(() => {
  jest.clearAllMocks();
});