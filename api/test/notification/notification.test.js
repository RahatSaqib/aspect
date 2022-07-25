const chai = require('chai')
const { knex } = require('../../src/db')
const { resultConditionsMet } = require('../../src/notification/service')

const { assert } = chai

describe('Query generator for filtering conditions', () => {
  const filterConditionExample = {
    result: [
      {
        assayId: 'abbottM2000DBSHivVL',
        resultCategoryId: [
          {
            label: 'Indeterminate',
            scope: 'ResultCategories',
            value: 'Indeterminate',
          },
          {
            label: 'Error',
            scope: 'ResultCategories',
            value: 'Error',
          },
        ],
      },
      {
        assayId: 'GxMtbRif',
        resultCategoryId: [
          {
            label: 'MTB Detected RIF Not Detected',
            scope: 'ResultCategoryGroups',
            value: 'GxMtbRifMtbDetectedRifNotDetected',
          },
          {
            label: 'MTB Invalid',
            scope: 'ResultCategoryGroups',
            value: 'GxMtbRifMtbInvalid',
          },
        ],
      },
    ],
    areaItems: '',
    jobFunctions: [
      {
        tags: [],
        checked: true,
        jobFunctionId: '1',
      },
    ],
    deviceLevelId: 'national',
  }
  const filterConditionExample2 = {
    result: [
      {
        assayId: 'assayBdMgitGnd',
        resultCategoryId: [
          {
            label: 'Success',
            scope: 'ResultCategories',
            value: 'Success',
          },
          {
            label: 'Unknown',
            scope: 'ResultCategories',
            value: 'Unknown',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Idaho',
        value: '46',
      },
      {
        label: 'Nebraska',
        value: '62',
      },
    ],
    jobFunctions: [
      {
        tags: [],
        checked: true,
        jobFunctionId: '1',
      },
    ],
    deviceLevelId: 'state',
  }

  const filterConditionExample3 = {
    ...filterConditionExample2,
    deviceLevelId: 'lga',
  }

  const filterConditionExample4 = {
    ...filterConditionExample2,
    deviceLevelId: 'lab',
  }
  it('Should generate a proper query filter for ResultCategoryGroup', async () => {
    const query = knex('Result as r').modify(resultConditionsMet, filterConditionExample, { result: 'r' })
    assert.include(
      query.toString(),
      "where ((`a`.`externalId` = 'abbottM2000DBSHivVL' and (`rc1`.`externalId` in ('Indeterminate', 'Error') or `rc2`.`externalId` in ('Indeterminate', 'Error'))) or (`a`.`externalId` = 'GxMtbRif' and `rcg`.`externalId` in ('GxMtbRifMtbDetectedRifNotDetected', 'GxMtbRifMtbInvalid'))"
    )
  })
  it('Should generate a proper query filter for ResultCategory', async () => {
    const query = knex('Result as r').modify(resultConditionsMet, filterConditionExample2, { result: 'r' })
    assert.include(
      query.toString(),
      "(`a`.`externalId` = 'assayBdMgitGnd' and (`rc1`.`externalId` in ('Success', 'Unknown') or `rc2`.`externalId` in ('Success', 'Unknown')))"
    )
  })

  it('Should generate a proper query filter for state', async () => {
    const query = knex('Result as r')
      .join('Device as d', 'r.deviceid', 'd.id')
      .join('Geography as g', 'd.geographyId', 'g.id')
      .modify(resultConditionsMet, filterConditionExample2, {
        result: 'r',
        geography: 'g',
        device: 'd',
      })
    assert.include(query.toString(), 'and `g`.`stateId` in (46, 62)')
  })
  it('Should generate a proper query filter for lgas', async () => {
    const query = knex('Result as r')
      .join('Device as d', 'r.deviceid', 'd.id')
      .join('Geography as g', 'd.geographyId', 'g.id')
      .modify(resultConditionsMet, filterConditionExample3, {
        result: 'r',
        geography: 'g',
        device: 'd',
      })
    assert.include(query.toString(), 'and `g`.`lgaId` in (46, 62)')
  })

  it('Should generate a proper query filter for labs', async () => {
    const query = knex('Result as r')
      .join('Device as d', 'r.deviceid', 'd.id')
      .join('Geography as g', 'd.geographyId', 'g.id')
      .modify(resultConditionsMet, filterConditionExample4, {
        result: 'r',
        geography: 'g',
        device: 'd',
      })
    assert.include(query.toString(), 'and `d`.`siteId` in (46, 62)')
  })
})
