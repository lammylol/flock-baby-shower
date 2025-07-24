import { readFileSync } from 'fs';
import { pathsToModuleNameMapper } from 'ts-jest';
const { compilerOptions } = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));

export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, {
            prefix: '<rootDir>/src/',
        }),
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};