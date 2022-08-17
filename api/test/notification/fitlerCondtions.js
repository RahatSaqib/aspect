const filterConditionWithAssay = {
  result: [
    {
      assayId: 'DaktariHivVL',
      resultCategoryId: [
        {
          label: 'Detected',
          scope: 'ResultCategories',
          value: 'Detected',
        },
      ],
    },
  ],
  areaItems: [
    {
      label: 'Wayne',
      value: '12',
    },
  ],
  deviceLevelId: 'lga',
}
const filterConditionWithJfForDevice = {
  areaItems: [
    {
      label: 'Wayne',
      value: '12',
    },
  ],
  jobFunctions: [
    {
      tags: [],
      jobFunctionId: '1',
    },
    {
      tags: [],
      jobFunctionId: '2',
    },
  ],
  deviceLevelId: 'lga',
}
const filterConditionWithJfForDeviceNotWayneCounty = {
  areaItems: [
    {
      label: 'Kale',
      value: '59',
    },
  ],
  jobFunctions: [
    {
      tags: [],
      jobFunctionId: '1',
    },
    {
      tags: [],
      jobFunctionId: '2',
    },
  ],
  deviceLevelId: 'lga',
}
const filterConditionWithJf = {
  result: [
    {
      assayId: 'DaktariHivVL',
      resultCategoryId: [
        {
          label: 'Detected',
          scope: 'ResultCategories',
          value: 'Detected',
        },
      ],
    },
  ],
  areaItems: [
    {
      label: 'Wayne',
      value: '12',
    },
  ],
  jobFunctions: [
    {
      tags: [],
      jobFunctionId: '1',
    },
    {
      tags: [],
      jobFunctionId: '2',
    },
  ],
  deviceLevelId: 'lga',
}
const baseFilterCondition = {
  result: [
    {
      assayId: 'DaktariHivVL',
      resultCategoryId: [
        {
          label: 'Detected',
          scope: 'ResultCategories',
          value: 'Detected',
        },
      ],
    },
  ],
  sendEmail: true,
  sendSms: true,
  sendWeb: false,
  areaItems: [
    {
      label: 'Wayne',
      value: '12',
    },
  ],
  jobFunctions: [
    {
      tags: [],
      jobFunctionId: '1',
    },
    {
      tags: [],
      jobFunctionId: '2',
    },
  ],
  deviceLevelId: 'lga',
}
module.exports = {
  filterConditionWithAssay,
  filterConditionWithJf,
  baseFilterCondition,
  filterConditionWithJfForDevice,
  filterConditionWithJfForDeviceNotWayneCounty,
}
