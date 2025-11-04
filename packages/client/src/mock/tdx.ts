/**
 * Mock TDX environment for development without actual security VM
 */

// Type definitions for TDX mock environment
interface TDXVmCallRequest {
  // Define the vmcall request interface based on usage
  type: string;
  [key: string]: unknown;
}

interface TDXVmCallResponse {
  success: boolean;
  data: unknown;
}

// Mock implementation for TDX environment
export class MockTDX {
  static system = {
    isAvailable: () => false,
    getVmmVersion: () => 'mock-0.1.0'
  };

  static vmcall = (request: TDXVmCallRequest): TDXVmCallResponse => ({
    success: true,
    data: request as unknown
  });

  static security = {
    enableSecurity: () => {},
    getDeviceIdentity: () => ({ id: 'mock-device-123', type: 'mock' }),
    getPlatformInfo: () => ({ platform: 'mock-platform', version: 'mock' }),
    loadConfig: () => ({ debug: true }),
    reportAnomaly: () => {}
  };

  static protectedStorage: Record<string, unknown> = {};
  static contract: Record<string, unknown> = {};
  static logging: Record<string, unknown> = {};

  static encrypt = (data: unknown) => data;
  static decrypt = (data: unknown) => data;
  static sha256 = (str: string) => str;
  static getHostProvisioningInfo = () => ({ provisioned: true });
  static getSwSvn = () => 0;
  static getTdReport = () => ({ valid: true, data: 'mock-report' });
  static createTdReport = () => ({ hash: 'mock-hash', valid: true });
  static getTdInfo = () => ({ size: 0, attrs: 'mock' });
  static selfReport = () => ({ report: 'mock', valid: true });
  static negotiateRuntimePolicy = () => 0xff;
  static createSession = () => ({ id: 'mock-session', valid: true });
  static getQuote = () => ({ quote: 'mock-quote-data', valid: true });
  static obtainLease = () => ({ lease: 'mock-lease', valid: true });
  static getUniqueHardwareId = () => 'mock-hw-id';
  static getHostData = () => ({ host: 'mock-host', data: {} });
  static attestTd = () => ({ attestation: 'mock-attestation', valid: true });
  static verifyTdAttestation = () => true;
  static verifyHostAttestation = () => ({ verified: true, trust: 100 });
  static verifyPeerAttestation = () => ({ verified: true, trust: 100 });
  static verifyTdReport = () => true;
  static getDataCenterRiskScore = () => 0;
}

// For compatibility, make it available as the TDX global
export const TDX = MockTDX;

// Also attach it to globalThis for global access
if (typeof globalThis !== 'undefined') {
  (globalThis as { TDX?: typeof MockTDX }).TDX = MockTDX;
}

// Mock the TDX namespace-like behavior
export default {
  system: {
    isAvailable: () => false,
    getVmmVersion: () => 'mock-0.1.0',
  },
  vmcall: (request: TDXVmCallRequest) => ({ success: true, data: request as unknown }),
  security: {
    enableSecurity: () => {},
    getDeviceIdentity: () => ({ id: 'mock-device-123', type: 'mock' }),
    getPlatformInfo: () => ({ platform: 'mock-platform', version: 'mock' }),
    loadConfig: () => ({ debug: true }),
    reportAnomaly: () => {},
  },
  protectedStorage: {},
  contract: {},
  logging: {},
  encryption: {
    encrypt: (data: unknown) => data,
    decrypt: (data: unknown) => data,
    hash: {
      sha256: (str: string) => str,
    },
  },
  attestation: {
    getHostProvisioningInfo: () => ({ provisioned: true }),
    getSwSvn: () => 0,
    getTdReport: () => ({ valid: true, data: 'mock-report' }),
    createTdReport: () => ({ hash: 'mock-hash', valid: true }),
    getTdInfo: () => ({ size: 0, attrs: 'mock' }),
    selfReport: () => ({ report: 'mock', valid: true }),
    negotiateRuntimePolicy: () => 0xff,
    createSession: () => ({ id: 'mock-session', valid: true }),
    getQuote: () => ({ quote: 'mock-quote-data', valid: true }),
    obtainLease: () => ({ lease: 'mock-lease', valid: true }),
    getUniqueHardwareId: () => 'mock-hw-id',
    getHostData: () => ({ host: 'mock-host', data: {} }),
    attestTd: () => ({ attestation: 'mock-attestation', valid: true }),
    verifyTdAttestation: () => true,
    verifyHostAttestation: () => ({ verified: true, trust: 100 }),
    verifyPeerAttestation: () => ({ verified: true, trust: 100 }),
    verifyTdReport: () => true,
  },
  risk: {
    getDataCenterRiskScore: () => 0,
  },
};