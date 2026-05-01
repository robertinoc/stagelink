import type { Config } from 'jest';

const reporters: Config['reporters'] = process.env.CI
  ? [
      'default',
      [
        'jest-junit',
        {
          outputDirectory: './test-results',
          outputName: 'junit.xml',
        },
      ],
    ]
  : ['default'];

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  testEnvironment: 'node',
  reporters,
  moduleNameMapper: {
    '^@stagelink/types$': '<rootDir>/../../../packages/types/src',
  },
};

export default config;
