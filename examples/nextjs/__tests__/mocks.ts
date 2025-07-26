// Mock implementation for Bun test environment
export const jest = {
  fn: () => {
    const mockFn = (...args: any[]) => {
      mockFn.calls.push(args);
      if (mockFn.implementation) {
        return mockFn.implementation(...args);
      }
      return mockFn.returnValue;
    } as any;

    mockFn.calls = [];
    mockFn.mockResolvedValue = (value: any) => {
      mockFn.implementation = () => Promise.resolve(value);
      return mockFn;
    };
    mockFn.mockRejectedValue = (error: any) => {
      mockFn.implementation = () => Promise.reject(error);
      return mockFn;
    };
    mockFn.mockReturnValue = (value: any) => {
      mockFn.returnValue = value;
      return mockFn;
    };
    mockFn.toHaveBeenCalled = () => mockFn.calls.length > 0;
    mockFn.toHaveBeenCalledWith = (...args: any[]) => 
      mockFn.calls.some(call => call.every((arg, i) => arg === args[i]));

    return mockFn;
  },
  mock: (moduleName: string, factory: () => any) => {
    // Store mock for later use
    (globalThis as any).__mocks = (globalThis as any).__mocks || {};
    (globalThis as any).__mocks[moduleName] = factory();
  },
  clearAllMocks: () => {
    // Reset all mock functions
  }
};

// Make jest available globally for tests
(globalThis as any).jest = jest;