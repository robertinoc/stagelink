import type { Config } from 'jest';

const reporters: Config['reporters'] = process.env.CI
  ? [
      'default',
      [
        'jest-junit',
        {
          outputDirectory: './test-results',
          outputName: 'integration-junit.xml',
        },
      ],
    ]
  : ['default'];

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.integration-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  reporters,
  moduleNameMapper: {
    '^@stagelink/types$': '<rootDir>/../../../packages/types/src',
  },
  testTimeout: 30_000,
};

export default config;
