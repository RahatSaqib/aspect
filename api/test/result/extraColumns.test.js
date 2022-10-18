const { assert } = require('chai')
const { applyExtraColumns, sanitizeExtraColumns } = require('../../src/result/extraColumns')

const cloneResults = results =>
  results.map(r => {
    return { ...r }
  })

const baseResult = {
  id: 1,
  resultData_aDbValue: 'Haha, what a value, right?',
}

const baseResults = [baseResult]

describe('Result Schema', () => {
  describe('applyExtraColumns', () => {
    it('no extra columns defined (null), results should not be changed', async () => {
      const extraColumns = null

      const newResults = cloneResults(baseResults)
      applyExtraColumns(newResults, extraColumns)

      assert.deepEqual(newResults, baseResults)
    })

    it('no extra columns defined (empty), results should not be changed', async () => {
      const extraColumns = []

      const newResults = cloneResults(baseResults)
      applyExtraColumns(newResults, extraColumns)

      assert.deepEqual(newResults, baseResults)
    })

    it('results are undefined, should not crash', async () => {
      const extraColumns = []

      applyExtraColumns(undefined, extraColumns)

      assert.isTrue(true)
    })

    it('results are null, should not crash', async () => {
      const extraColumns = []

      applyExtraColumns(null, extraColumns)

      assert.isTrue(true)
    })

    it('one extra column defined including only a db path, results should not be changed, extra columns fieldName should be set', async () => {
      const extraColumn = {
        db: 'resultData_aDbValue',
      }
      const extraColumns = [extraColumn]

      const newResults = cloneResults(baseResults)
      applyExtraColumns(newResults, extraColumns)
      assert.deepEqual(newResults, baseResults)
      assert.deepEqual([extraColumn], [{ ...extraColumn, fieldName: extraColumn.db }])
    })

    it('one extra column defined using a new fieldName, a new field should be created', async () => {
      const extraColumns = [
        {
          db: 'resultData_aDbValue',
          fieldName: 'aDbValue',
        },
      ]

      const newResults = cloneResults(baseResults)
      applyExtraColumns(newResults, extraColumns)
      assert.deepEqual(newResults, [{ ...baseResult, aDbValue: 'Haha, what a value, right?' }])
    })

    it('one extra column defined using a postProcess function, a new field should be created and the post processed value should be set', async () => {
      const extraColumns = [
        {
          db: 'resultData_aDbValue',
          fieldName: 'aDbValue',
          postProcess: dbValue => `${dbValue} ...Right?`,
        },
      ]

      const newResults = cloneResults(baseResults)
      applyExtraColumns(newResults, extraColumns)
      assert.deepEqual(newResults, [{ ...baseResult, aDbValue: 'Haha, what a value, right? ...Right?' }])
    })
  })

  describe('sanitizeExtraColumns', () => {
    it("should remove fields 'postProcess' and 'db' from object", async () => {
      const extraColumns = [
        {
          db: 'resultData_aDbValue',
          fieldName: 'aDbValue',
          postProcess: dbValue => `${dbValue} ...Right?`,
        },
      ]
      sanitizeExtraColumns(extraColumns)
      assert.deepEqual(extraColumns, [{ fieldName: 'aDbValue' }])
    })
  })
})
