const _ = require('lodash')
const proxyquire = require('proxyquire')
const { assert } = require('chai')
const Promise = require('bluebird')
const { subHours } = require('date-fns')
const { runTest } = require('../utils/generatorFunctionUtils')

describe('issue evaluation', () => {
  function getConditionsMet(sqlScriptContents = null) {
    const { conditionsMet } = proxyquire('../../src/issue/evaluation', {
      '../shared/io': {
        readTextFile() {
          return Promise.resolve(sqlScriptContents)
        },
      },
    })
    return conditionsMet
  }

  let knex
  function initKnex(
    queryReturns = [
      {
        result: { colHeader: 1 },
      },
    ]
  ) {
    knex = {
      raw(query) {
        let returnResults = _.filter(
          queryReturns,
          queryReturn => queryReturn.formattedEvaluationParameter === query
        )
        if (_.isEmpty(returnResults)) {
          returnResults = _.filter(
            queryReturns,
            queryReturn => !queryReturn.formattedEvaluationParameter
          )
        }
        if (_.isEmpty(returnResults)) {
          returnResults = queryReturns
        }
        return Promise.resolve(_.get(_.head(returnResults), 'result'))
      },
    }
  }

  beforeEach(() => initKnex())

  it('should evaluate to true for empty conditions', async () => {
    const issue = {}
    let conditions = {}
    const conditionsMet = getConditionsMet()
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
    conditions = []
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
    conditions = null
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
    conditions = undefined
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
  })

  it('should not allow unrecognised evaluation methods', async () => {
    const issue = {}
    const conditionsMet = getConditionsMet()
    let conditions = {
      evaluationMethod: 'unrecognised-method',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an unrecognised evaluation method is passed'
      )
    } catch (error) {
      assert.equal(
        error.message,
        'Unrecognised evaluation method in condition unrecognised-method'
      )
    }
    conditions = {
      evaluationParameter: 'SELECT thing FROM stuff',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an unrecognised evaluation method is passed'
      )
    } catch (error) {
      assert.equal(
        error.message,
        'Unrecognised evaluation method in condition null'
      )
    }
    conditions = [
      {
        evaluationMethod: 'unrecognised-method',
      },
    ]
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an unrecognised evaluation method is passed'
      )
    } catch (error) {
      assert.equal(
        error.message,
        'Unrecognised evaluation method(s) in condition unrecognised-method'
      )
    }
    conditions = [{}]
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an unrecognised evaluation method is passed'
      )
    } catch (error) {
      assert.equal(
        error.message,
        'Unrecognised evaluation method(s) in condition'
      )
    }
    conditions = [
      {
        evaluationMethod: 'unrecognised-method',
      },
      {
        evaluationMethod: 'unrecognised-method',
      },
      {
        evaluationMethod: 'another-unrecognised-method',
      },
      {
        evaluationParameter: 'SELECT thing FROM stuff',
      },
    ]
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an unrecognised evaluation method is passed'
      )
    } catch (error) {
      assert.equal(
        error.message,
        'Unrecognised evaluation method(s) in condition another-unrecognised-method,unrecognised-method'
      )
    }
  })

  it('should ensure all AND conditions evaluate to truthy', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    let conditions = [
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT someField FROM SOME_TABLE',
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'CALL getResultFromSomeQuery(?,?)',
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })

    conditions = {
      evaluationMethod: 'child-condition',
      evaluationParameter: [
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'sql-script',
          evaluationParameter: '/a/path/to/a-script.sql',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })

    conditions = {
      evaluationMethod: 'child-conditions',
      evaluationParameter: [
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
  })

  it('should return false if any AND conditions do not evaluate to truthy', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter:
          'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        result: { colHeader: false },
      },
    ])
    let conditions = [
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT someField FROM SOME_TABLE',
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter:
          'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })

    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: '',
        result: { colHeader: null },
      },
    ])
    conditions = {
      evaluationMethod: 'child-condition',
      evaluationParameter: [
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'sql-script',
          evaluationParameter: '/a/path/to/a-script.sql',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })

    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: 'CALL getResultFromSomeQuery(?,?)',
        result: { colHeader: null },
      },
    ])
    conditions = {
      evaluationMethod: 'child-conditions',
      evaluationParameter: [
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        },
        {
          operator: 'AND',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })
  })

  it('should return true if some OR conditions evaluate to truthy', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter:
          'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        result: { colHeader: false },
      },
    ])
    let conditions = [
      {
        operator: 'OR',
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT someField FROM SOME_TABLE',
      },
      {
        operator: 'OR',
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter:
          'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })

    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: '',
        result: { colHeader: null },
      },
    ])
    conditions = {
      evaluationMethod: 'child-condition',
      evaluationParameter: [
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'OR',
          evaluationMethod: 'sql-script',
          evaluationParameter: '/a/path/to/a-script.sql',
        },
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })

    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: 'CALL getResultFromSomeQuery(?,?)',
        result: { colHeader: null },
      },
    ])
    conditions = {
      evaluationMethod: 'child-conditions',
      evaluationParameter: [
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        },
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
  })

  it('should return false if all OR conditions evaluate to falsey', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: 'SELECT someField FROM SOME_TABLE',
        result: { colHeader: false },
      },
      {
        formattedEvaluationParameter:
          'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        result: { colHeader: 0 },
      },
      {
        formattedEvaluationParameter: 'CALL getResultFromSomeQuery(?,?)',
        result: { colHeader: null },
      },
    ])
    const conditions = {
      evaluationMethod: 'child-conditions',
      evaluationParameter: [
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT someField FROM SOME_TABLE',
        },
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        },
        {
          operator: 'OR',
          evaluationMethod: 'inline-sql',
          evaluationParameter:
            'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
        },
      ],
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })
  })

  it('should be able to evaluate nested conditions', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet()
    const conditions = [
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter: 'SELECT someField FROM SOME_TABLE',
      },
      {
        evaluationMethod: 'child-conditions',
        evaluationParameter: [
          {
            evaluationMethod: 'inline-sql',
            evaluationParameter: 'SELECT someField FROM SOME_TABLE',
          },
          {
            evaluationMethod: 'child-condition',
            evaluationParameter: {
              evaluationMethod: 'inline-sql',
              evaluationParameter: 'SELECT anotherColumn FROM SOME_OTHER_TABLE',
            },
          },
          {
            evaluationMethod: 'inline-sql',
            evaluationParameter:
              'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
          },
        ],
      },
      {
        evaluationMethod: 'inline-sql',
        evaluationParameter:
          'CALL getResultFromSomeQuery({{id}},{{geographyId}})',
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter:
          'SELECT anotherColumn FROM SOME_OTHER_TABLE',
        result: { colHeader: false },
      },
    ])
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })
  })

  it('should return falsey if younger than issue age', async () => {
    const issue = {
      triggeredOn: new Date(),
    }
    const conditionsMet = getConditionsMet()
    const conditions = [
      {
        evaluationMethod: 'issue-age',
        evaluationParameter: {
          hours: 1,
        },
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })
  })

  it('should return truthy if older than issue age', async () => {
    const issue = {
      triggeredOn: subHours(new Date(), 2),
    }
    const conditionsMet = getConditionsMet()
    const conditions = [
      {
        evaluationMethod: 'issue-age',
        evaluationParameter: {
          hours: 1,
        },
      },
    ]
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
  })

  it('should throw an error if a SQL condition returns blank result', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: 'SELECT someField FROM SOME_TABLE',
      },
      {
        formattedEvaluationParameter:
          'SELECT otherField FROM OTHER_TABLE WHERE issueId = ?',
        result: [],
      },
      {
        formattedEvaluationParameter: 'SELECT yetAnotherField FROM OTHER_TABLE',
        result: {},
      },
    ])
    let conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter: 'SELECT someField FROM SOME_TABLE',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an SQL condition returns blank result'
      )
    } catch (error) {
      assert.equal(
        error.message,
        "Inline SQL 'SELECT someField FROM SOME_TABLE' produced no result"
      )
    }
    conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter:
        'SELECT otherField FROM OTHER_TABLE WHERE issueId = {{id}}',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an SQL condition returns blank result'
      )
    } catch (error) {
      assert.equal(
        error.message,
        "Inline SQL 'SELECT otherField FROM OTHER_TABLE WHERE issueId = ?' with 3 produced no result"
      )
    }
    conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter: 'SELECT yetAnotherField FROM OTHER_TABLE',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(() => {})
      assert.fail(
        'An error should be thrown when an SQL condition returns blank result'
      )
    } catch (error) {
      assert.equal(
        error.message,
        "Inline SQL 'SELECT yetAnotherField FROM OTHER_TABLE' produced no result"
      )
    }
  })

  it('should evaluate the value in the first row and column of a table result', async () => {
    const issue = {
      id: 3,
      geographyId: 13,
    }
    const conditionsMet = getConditionsMet('')
    initKnex([
      {
        result: { colHeader: 1 },
      },
      {
        formattedEvaluationParameter: 'SELECT otherField FROM OTHER_TABLE',
        result: [
          { colHeader1: 0, colHeader2: 1 },
          { colHeader1: 1 },
          { colHeader1: 2 },
        ],
      },
      {
        formattedEvaluationParameter:
          'SELECT otherField FROM OTHER_TABLE WHERE issueId = ?',
        result: [{ colHeader: 5 }, { colHeader: 2 }],
      },
      {
        formattedEvaluationParameter:
          'SELECT yetAnotherField FROM OTHER_TABLE WHERE issueId = ?',
        result: [{}, { colHeader: 2 }],
      },
    ])
    let conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter: 'SELECT otherField FROM OTHER_TABLE',
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isNotOk(result)
    })
    conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter:
        'SELECT otherField FROM OTHER_TABLE WHERE issueId = {{id}}',
    }
    await runTest(conditionsMet, [knex, issue, conditions])(result => {
      assert.isOk(result)
    })
    conditions = {
      evaluationMethod: 'inline-sql',
      evaluationParameter:
        'SELECT yetAnotherField FROM OTHER_TABLE WHERE issueId = {{id}}',
    }
    try {
      await runTest(conditionsMet, [knex, issue, conditions])(result => {
        assert.isNotOk(result)
      })
      assert.fail(
        'An error should be thrown when an SQL condition returns blank result'
      )
    } catch (error) {
      assert.equal(
        error.message,
        "Inline SQL 'SELECT yetAnotherField FROM OTHER_TABLE WHERE issueId = ?' with 3 produced no result"
      )
    }
  })
})
