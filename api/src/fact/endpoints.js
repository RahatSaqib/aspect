const { onFactGenerate } = require('./service')

const subscriptions = [
  {
    name: 'fact',
    durable: false,
    actions: {
      FACT_GENERATE: onFactGenerate,
    },
  },
]

module.exports = { subscriptions }
