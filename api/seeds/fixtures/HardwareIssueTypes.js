module.exports = [
  {
    errorCode: 1001,
    externalId: 'HardwareTemperatureDriftedFromSetPoint',
    mergeGroup: [1001, 1002, 1004],
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 1002,
    externalId: 'HardwareHeaterTemperatureDifferentialError',
    mergeGroup: [1001, 1002, 1004],
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 2014,
    externalId: 'HardwareThermistorTemperatureOutOfRange2014',
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 4008,
    externalId: 'HardwarePowerSupplyVoltageOutOfRange',
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 4009,
    externalId: 'HardwareHeaterATemperatureUnstable',
    mergeGroup: [4009, 4012],
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 4012,
    externalId: 'HardwareHeaterBTemperatureUnstable',
    mergeGroup: [4009, 4012],
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
  {
    errorCode: 4017,
    externalId: 'HardwareThermistorTemperatureOutOfRange4017',
    resolutionCondition: {
      minResults: 1,
      withinDays: 5,
    },
  },
]
