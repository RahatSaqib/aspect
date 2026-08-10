const plugins = [
  '@babel/plugin-transform-runtime',

  ['babel-plugin-lodash', {}],
  // Stage 3
  '@babel/plugin-syntax-dynamic-import',
  '@babel/plugin-syntax-import-meta',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-json-strings',
  // Stage 2
  [
    '@babel/plugin-proposal-decorators',
    {
      legacy: true,
    },
  ],
  '@babel/plugin-proposal-function-sent',
  '@babel/plugin-proposal-numeric-separator',
  '@babel/plugin-proposal-export-namespace-from',
  '@babel/plugin-proposal-throw-expressions',
  // Stage 1
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-logical-assignment-operators',
  '@babel/plugin-proposal-optional-chaining',
  [
    '@babel/plugin-proposal-pipeline-operator',
    {
      proposal: 'minimal',
    },
  ],
  '@babel/plugin-proposal-nullish-coalescing-operator',
  '@babel/plugin-proposal-do-expressions',
]

module.exports = {
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            // Only ESM->CJS is needed for jest; downlevelling to ES5 would hide
            // TDZ/scoping bugs that vite ships to the browser untranspiled.
            targets: { node: 'current' },
            modules: 'commonjs',
            debug: false,
          },
        ],
        '@babel/preset-react',
      ],
      plugins: [...plugins, 'babel-plugin-dynamic-import-node'],
    },
  },
}
