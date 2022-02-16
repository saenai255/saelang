/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc-node/jest',
  },
  testEnvironment: 'node',

  globals: {
    '@swc-node': {
      isolatedModules: true,
    }
  }
};