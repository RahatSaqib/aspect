const plugins = [
  ['babel-plugin-lodash', {}],
  ['react-hot-loader/babel', {}],
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

// if (process.env.BABEL_ENV === 'test') {
//   plugins.push('dynamic-import-node')
// } else if (process.env.BABEL_ENV === 'message') {
//   plugins.push([
//     'babel-plugin-react-intl',
//     {
//       messagesDir: './i18n',
//     },
//   ])
// }

module.exports = {
  env: {
    webpack: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            useBuiltIns: 'usage',
            targets: {
              browsers: ['last 2 versions'],
            },
          },
        ],
        '@babel/preset-react',
      ],
      plugins,
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
          },
        ],
        '@babel/preset-react',
      ],
      plugins,
    },
    message: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            useBuiltIns: 'usage',
            targets: {
              browsers: ['last 2 versions'],
            },
          },
        ],
        '@babel/preset-react',
      ],
      plugins,
    },
  },
}
