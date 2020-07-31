const _ = require('lodash')
const { knex, filterParams, filterDateRangeParams } = require('../db')
const { addConstraints } = require('../auth/constraints')

function getTableAlias(sql) {
  const tableAliasRegExp = new RegExp(
    `
      \\b
      (?:
        FROM|JOIN
      )
\\s+
      (
        [a-zA-Z0-9_$\\-\`]*
      )
\\s+
      AS
\\s+
      (
        [a-zA-Z0-9_$\\-\`]*
      )
      \\b
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim'
  )
  let match
  const tableAlias = {}
  // eslint-disable-next-line no-cond-assign
  while ((match = tableAliasRegExp.exec(sql)) !== null) {
    if (match.length === 3) {
      const [, tableName, alias] = match
      tableAlias[tableName.toLowerCase()] = alias
    }
  }
  return tableAlias
}

function isSelectQuery(text) {
  const regex = /^\s*SELECT\s+/gi
  const match = regex.exec(text.trim())
  return (match && match.index === 0) || false
}

// Simplified algorithm of finding balanced groups `()`
function getBalancedParentheses(sql) {
  let currentIndex = 0
  let waitForChar = false
  const stack = []
  const matches = []

  while (currentIndex <= sql.length) {
    const currentChar = sql.charAt(currentIndex)
    if (!waitForChar) {
      switch (currentChar) {
        case '(': {
          const item = {
            globalIndexStart: currentIndex,
            globalIndexEnd: -1,
            chunk: '',
            parent: null,
            children: [],
          }
          stack.push(item)
          matches.push(item)
          break
        }
        case ')': {
          // pop item from stack and complete it's few props
          const item = stack.pop()
          item.globalIndexEnd = currentIndex
          item.chunk = sql.substring(
            item.globalIndexStart + 1,
            item.globalIndexEnd
          )

          // if stack is not empty - add this item to 'children' array of it's parent
          // notice that 'children' contains only full matches, with found start and end chars
          if (stack.length > 0) {
            const parentItem = stack[stack.length - 1]
            parentItem.children.push(item)
            item.parent = parentItem
          }
          break
        }
        case '"':
        case "'":
          waitForChar = currentChar
          break
        default:
          break
      }
    } else if (currentChar === waitForChar) {
      waitForChar = false
    }
    currentIndex += 1
  }
  // return only matches with end-char found, i.e. do not return incomplete chunks
  return matches.filter(({ globalIndexEnd }) => globalIndexEnd !== -1)
}

function getNestedQueries(sql) {
  const balancedParentheses = getBalancedParentheses(sql)

  // --------------------------------------------------
  // loop 'balancedParentheses' and if item
  // is sql query then define additional props for it
  // and recurse into it's children
  // --------------------------------------------------
  const initAllQueries = items => {
    items.forEach(item => {
      item.isQuery = isSelectQuery(item.chunk)
      if (item.isQuery) {
        item.subQueries = []
        item.isProcessed = false
        item.localIndexStart = item.globalIndexStart
        item.localIndexEnd = item.globalIndexEnd

        if (item.parent) {
          if (!item.parent.subQueries) {
            item.parent.subQueries = []
          }
          item.parent.subQueries.push(item)
          // relative position in parent body
          item.localIndexStart =
            item.globalIndexStart - item.parent.globalIndexStart
          item.localIndexEnd =
            item.globalIndexEnd - item.parent.globalIndexStart
        }

        initAllQueries(item.children)
      }
    })
  }
  initAllQueries(balancedParentheses)

  // --------------------------------------------------
  // Find starting points of nested queries and define in
  // what clause they start.
  // Sub-queries may be in 'FROM (SELECT', 'JOIN (SELECT' or 'WHERE ... (SELECT'
  // --------------------------------------------------
  const regex = new RegExp(
    `
      (?:
        (
          (?<=FROM\\s*)
          \\(
                  \\s*
          SELECT
                  \\s+
        )
      )
      |
      (?:
        (
          (?<=JOIN\\s*)
          \\(
                  \\s*
          SELECT
                  \\s+
        )
      )
      |
      (?:
        (
          (?<=WHERE(?:.*?))
          \\(
                  \\s*
          SELECT
                  \\s+
        )
      )
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim'
  )
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(sql))) {
    const [, afterFrom, afterJoin, afterWhere] = match
    const { index } = match
    // captured group starts with '(' - so 'match.index'
    // should be in balancedParentheses
    const item = balancedParentheses.find(
      ({ globalIndexStart }) => globalIndexStart === index
    )
    if (item) {
      if (afterFrom) {
        item.parentClause = 'FROM'
      } else if (afterJoin) {
        item.parentClause = 'JOIN'
      } else if (afterWhere) {
        item.parentClause = 'WHERE'
      }
    }
  }

  return balancedParentheses.filter(item => item.isQuery)
}

function processNestedQueries(originalSql, queryItems) {
  const sql = originalSql
  let counter = 0
  const processItems = items => {
    items.forEach(item => {
      // if (item.isProcessed) {
      //   return
      // }

      // First process all sub-queries
      if (item.subQueries.length > 0) {
        processItems(item.subQueries)

        // replace each sub-query with table-like placeholder to pass regex
        item.subQueries.forEach(() => {
          //
        })
      }

      counter += 1
      item.placeholderToken = `$$$_${counter}`

      // remove all line breaks because main regex is tuned for single-line query
      item.sqlText = item.chunk.replace(/\n/g, ' ').trim()

      // // prepare base knex query - without constraints and filters
      // item.sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(item.sqlText)

      // // mark item that 'knex' is ready for last step of applying constrains and filters
      // item.isProcessed = true
    })
  }
  processItems(queryItems)

  return {
    modifiedSql: sql,
    queryItems,
  }
}

function getSqlQueryRegexMatch(sql) {
  const sqlSimpleQueryRegExp = new RegExp(
    `
    \\b
    SELECT
    \\s+
      (.*?)
    \\s?
      (?:
    \\s+
        FROM
    \\s+
          (.*?)
    \\s*
          (
            (?:
              (?:
                LEFT  \\s+
                |
                RIGHT \\s+
              )?
              (?:
                INNER \\s+
                |
                OUTER \\s+
              )?
              JOIN    \\s+
            )
            (?:.*?)
          )?

    \\s*
          (?:
            (?:
    \\s+
              WHERE
            )
    \\s+
            (.*?)
          )?

    \\s*
          (?:
            (?:
    \\s+
              GROUP\\s+BY
            )
    \\s+
            (.*?)
          )?

    \\s*
          (?:
            (?:
    \\s+
              HAVING
            )
    \\s+
            (.*?)
          )?

      )?
      $
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim'
  )
  return sqlSimpleQueryRegExp.exec(sql)
}

function tryConvertSqlStringToKnexQueryBuilder(
  originalSql,
  dataConstraints,
  query
) {
  const nestedQueries = getNestedQueries(originalSql)
  let sql = originalSql
  if (nestedQueries.length > 0) {
    // replace all sub-queries with table-like placeholder to pass regex
    // like '$$$_N' (N is number) or '$$$ as $$$_N' which map to object with prepared knex
    // All such 'tables' will be handled below where sqlBuilder is assembled
    const { modifiedSql } = processNestedQueries(originalSql, nestedQueries)
    sql = modifiedSql
  }
  const sqlQueryMatch = getSqlQueryRegexMatch(sql)
  let sqlBuilder

  const regexTableAlias = /^([a-zA-Z0-9_$\-`]*)(?:\s+AS\s+([a-zA-Z0-9_$\-`]*)?)$/gi

  console.log('_____________ sqlQueryMatch', { sqlQueryMatch: !!sqlQueryMatch })
  if (sqlQueryMatch) {
    // get all 6 captured groups defined in regex
    const [
      ,
      selectPart,
      fromPart,
      joinPart,
      wherePart,
      groupByPart,
      havingPart,
    ] = sqlQueryMatch

    // Does the FROM source look like a table name? Eg: Device or Device as d or `Device` as d
    const tableALiasMatch = regexTableAlias.exec(fromPart)
    console.log('......', { tableALiasMatch: !!tableALiasMatch, fromPart })
    if (tableALiasMatch) {
      const [, tableName, tableAlias] = tableALiasMatch
      console.log('......', { tableName, tableAlias })
      // regexTableAlias.test(fromPart) // Does the FROM source look like a table name? Eg: Device or Device as d or `Device` as d

      if (sqlQueryMatch.length === 7) {
        sqlBuilder = knex.select(knex.raw(selectPart)).from(fromPart)
        if (joinPart) {
          sqlBuilder.joinRaw(joinPart)
        }
        if (wherePart) {
          sqlBuilder.whereRaw(wherePart)
        }
        if (groupByPart) {
          sqlBuilder.groupByRaw(groupByPart)
        }
        if (havingPart) {
          sqlBuilder.havingRaw(havingPart)
        }

        const sqlTableAlias = getTableAlias(sql)

        // apply constraints
        sqlBuilder.modify(addConstraints, dataConstraints, sqlTableAlias)

        // apply filters
        if (sqlTableAlias.result) {
          sqlBuilder.modify(filterDateRangeParams, query, 'r.endedOn')
        }
        if (sqlTableAlias.site) {
          sqlBuilder.modify(filterParams, query, { siteId: 's.id' })
        }
      }
    }
  }
  return sqlBuilder
}

async function queryValue(sql, dataConstraints, query) {
  let firstResult
  if (sql) {
    // get rid of all new-line symbols, if any exist
    sql = sql.replace(/\n/g, ' ')

    const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(
      sql,
      dataConstraints,
      query
    )
    if (sqlBuilder) {
      // const sqlTableAlias = getTableAlias(sql)
      // sqlBuilder.modify(addConstraints, dataConstraints, sqlTableAlias).first()
      // if (sqlTableAlias.result) {
      //   sqlBuilder.modify(filterDateRangeParams, query, 'r.endedOn')
      // }
      // if (sqlTableAlias.site) {
      //   sqlBuilder.modify(filterParams, query, { siteId: 's.id' })
      // }
      firstResult = await sqlBuilder.first()
    } else if (sql) {
      firstResult = await knex.raw(sql)
    }
    while (_.isArray(firstResult)) {
      ;[firstResult] = firstResult
    }
  }
  return firstResult
}

module.exports = {
  getTableAlias,
  isSelectQuery,
  getBalancedParentheses,
  getNestedQueries,
  // getSqlQueryRegexMatch,
  tryConvertSqlStringToKnexQueryBuilder,
  queryValue,
}
