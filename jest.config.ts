import type {Config} from 'jest';

const config: Config = {

    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
      },
    setupFiles: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/evm-data/'],
    maxWorkers: 1
};

export default config;
