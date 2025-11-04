/**
 * 基础测试环境验证
 * 确保测试工具链正常工作 (KISS 原则：简单验证)
 */

describe('Testing Environment', () => {
  it('should have Jest configured correctly', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should have jsdom environment available', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
  
  it('should have mocked Electron IPC available', () => {
    expect(window.ipc).toBeDefined();
    expect(typeof window.ipc.invoke).toBe('function');
  });
  
  it('should have localStorage mocked', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});