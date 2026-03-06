const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: true });

module.exports = [
    ...compat.extends('eslint:recommended'),
    ...compat.extends('plugin:@typescript-eslint/recommended'),
    ...compat.extends('plugin:react/recommended'),
    ...compat.extends('plugin:react-hooks/recommended'),
    ...compat.extends('prettier'),
    {
        ignores: ['node_modules/**', 'dist/**', 'frontend/dist/**', 'backend/dist/**'],
        plugins: {
            prettier: require('eslint-plugin-prettier'),
            react: require('eslint-plugin-react'),
            'react-hooks': require('eslint-plugin-react-hooks'),
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
        },
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                project: ['./frontend/tsconfig.json', './backend/tsconfig.json'],
                tsconfigRootDir: __dirname
            }
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            'prettier/prettier': 'error',
            'react/react-in-jsx-scope': 'off'
        }
    }
];
