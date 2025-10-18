import '@testing-library/jest-dom'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock TransformStream
global.TransformStream = jest.fn().mockImplementation(() => ({}))

// Mock fetch
global.fetch = jest.fn()