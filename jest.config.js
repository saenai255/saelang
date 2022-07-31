/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    }
  }
};