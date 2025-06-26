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
        [a-z0-9_$\\-\`]*
      )
\\s+
      AS
\\s+
      (
        [a-z0-9_$\\-\`]*
      )
      \\b
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim'
  )
  let match
  const tableAlias = { allowAdminThrough: true }
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
  const regex = /^SELECT\s+/i
  const match = regex.exec(text.trim())
  return (match && match.index === 0) || false
}

/**
 * Simplified algorithm of finding balanced groups `()`
 *
 * 'simplified' because we do not take into account
 * base comment pattern, i.e. // and /*  * /, as well as sql comments '--'
 * because all queries we use are pre-formatted to a single line, even if
 * they are prepared as multi-lined with back-ticks `...`.
 * So, this func is generic but skips processing comments blocks
 *
 * @param {sql} string multiline string with line breaks
 * @return { all, tree } Two arrays - 'all' with all found pairs of
 * balanced parentheses, and 'tree' with root items only
 */
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
            // 0-based position within original sql
            globalIndexStart: currentIndex,
            globalIndexEnd: -1,
            // substring between open-close parentheses, to be
            // defined when close-counterpart is found
            innerText: '',
            // direct parent of this item, is 'null' for root items
            parent: null,
            // direct children
            children: [],
          }
          stack.push(item)
          matches.push(item)
          break
        }
        case ')': {
          // pop item from stack and add few props
          const item = stack.pop()
          item.globalIndexEnd = currentIndex
          // cut text between parentheses
          item.innerText = sql.substring(item.globalIndexStart + 1, item.globalIndexEnd)
          // if stack is not empty - add this item to 'children' array of it's parent
          // notice that 'children' contains only full matches, with open/close chars
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

  // get only matches with close-char found, i.e. do not return incomplete items
  const all = matches.filter(({ globalIndexEnd }) => globalIndexEnd !== -1)

  // throw error if text has different number or open/close parentheses
  if (matches.length !== all.length) {
    throw new Error('Malformed text - not all parentheses have open and/or close parts')
  }

  return {
    all,
    // return root items only, whole hierarchy is in 'children' arrays
    tree: all.filter(item => !item.parent),
  }
}

function getNestedQueries(sql) {
  const balancedParentheses = getBalancedParentheses(sql)

  // --------------------------------------------------
  // if balancedParentheses's item
  // is sql query then define additional props for it
  // --------------------------------------------------
  let counter = 0
  balancedParentheses.all.forEach(item => {
    item.isQuery = isSelectQuery(item.innerText)
    if (item.isQuery) {
      // Set unique token with pattern $$$_N which will be used to
      // replace current innerText with a token in parent's innerText
      // Notice that char $ is valid for MySql table names
      item.token = `$$$_${++counter}` // eslint-disable-line no-plusplus
      item.subQueries = []
      item.isProcessed = false
      item.localIndexStart = item.globalIndexStart
      item.localIndexEnd = item.globalIndexEnd

      if (item.parent) {
        if (!item.parent.subQueries) {
          item.parent.subQueries = []
        }
        item.parent.subQueries.push(item)

        // set relative position within parent.innerText
        item.localIndexStart = item.globalIndexStart - item.parent.globalIndexStart - 1
        item.localIndexEnd = item.globalIndexEnd - item.parent.globalIndexStart - 1
      }
    }
  })

  return {
    all: balancedParentheses.all.filter(item => item.isQuery),
    // get all hierarchies of sub-queries - notice that 'tree'
    // contains only root items of each hierarchy
    tree: balancedParentheses.all.filter(item => item.isQuery && (!item.parent || !item.parent.isQuery)),
  }
}

function processNestedQueries(sql, treeOfSubQueries, params) {
  const byToken = {}
  // ------------
  // helper func 1 - to replace sub-query text with table name '$$$_N'
  // ------------
  const replaceSubQueries = ({ innerText, subQueries }) => {
    const textParts = []
    let indexStart = 0
    _.forEach(subQueries, subQ => {
      const tableName = subQ.token
      const partBefore = innerText.substring(indexStart, subQ.localIndexStart)
      textParts.push(partBefore)
      textParts.push(` ${tableName} `)
      byToken[tableName] = subQ
      // next chunk to start right after current one
      indexStart = subQ.localIndexEnd + 1
    })
    const partAfter = innerText.substring(indexStart)
    textParts.push(partAfter)
    return textParts.join('')
  }
  // ------------
  // helper func 2 - process sub-queries for each item and convert each to knex
  // ------------
  const processItems = items => {
    items.forEach(item => {
      if (item.isProcessed) {
        return
      }

      // 1. process all sub-queries
      processItems(item.subQueries)

      // 2. replace each sub-query with table-like placeholder to pass main regex
      item.sqlText = trimSql(replaceSubQueries(item))

      // 3. prepare knex
      item.sqlBuilder = convertSqlToKnex(item.sqlText, byToken, params)

      item.isProcessed = true
    })
  }

  // recursively process sub-queries from top of the tree
  processItems(treeOfSubQueries)

  // 'byToken' now is defined and here we may do the last step of
  // processing main 'sql'
  const modifiedSql = replaceSubQueries({
    innerText: sql,
    subQueries: treeOfSubQueries,
  })

  return {
    modifiedSql,
    byToken,
  }
}

function getSqlQueryRegex() {
  return new RegExp(
    `
      \\b  SELECT  \\s+
        (.*?)

      \\s?
      (?:
        \\s+  FROM  \\s+
        (.*?)

        \\s*
        (
          (?:
            (?:
              (?: LEFT | RIGHT )   \\s+
            )?
            (?:
              (?: INNER | OUTER | CROSS )  \\s+
            )?
            JOIN    \\s+
          )
          (?:.*?)
        )?

        \\s*
        (?:
          \\s+  WHERE  \\s+
          (.*?)
        )?

        \\s*
        (?:
          \\s+  GROUP  \\s+  BY \\s+
          (.*?)
        )?

        \\s*
        (?:
          \\s+  HAVING  \\s+
          (.*?)
        )?

        \\s*
        (?:
          \\s+  ORDER  \\s+  BY  \\s+
          (.*?)
        )?

        \\s*
        (?:
          \\s+  LIMIT  \\s+
          (.*?)
        )?

      )?
      $
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim'
  )
}

function isSubQueryInText(text) {
  return /(\$\$\$_\d+)/.test(text)
}

function resolveSubQueryWithAlias(sql, byToken) {
  const sqlBuilders = []
  // Notice that sub-query in SELECT block always goes with alias
  const regex = new RegExp(
    `
      (
        \\$\\$\\$_\\d+
      )
      (
        \\s+
        AS
        \\s+
      )
      (
        [a-z0-9_\`]+
      )
      \\s*
    `.replace(/\s/g, ''),
    'gim'
  )
  let match
  let indexStart = 0
  let text

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(sql))) {
    const [, tableName, as, tableAlias] = match
    const { index } = match

    // raw text from the left of each sub-query
    text = _.trim(sql.substring(indexStart, index), ' ,')
    if (text.length > 0) {
      sqlBuilders.push(knex.raw(text))
    }
    // add knex of sub-query
    sqlBuilders.push(byToken[tableName].sqlBuilder.as(_.trim(tableAlias, '`')))
    indexStart = index + `${tableName}${as}${tableAlias}`.length
  }
  if (indexStart < sql.length - 1) {
    // raw text from the right of last sub-query
    text = sql.substring(indexStart)
    if (text.length > 0) {
      sqlBuilders.push(knex.raw(text))
    }
  }
  return sqlBuilders
}

function resolveOn(queryBuilder, condition) {
  const regex = new RegExp(
    `
      (?:
        ^  \\s*
        |
        \\s+   ( OR | AND )   \\s+
      )
      \\s*
      (.*?)
      \\s*
      (?:
        (
          \\s+  IS  \\s+  (?:  NOT  \\s+)?  NULL
        )
        |
        (?:
          (
            [\\!  \\=  \\>  \\<]+
            |
            \\s+  (?:  NOT  \\s+)?   IN  \\s+
            |
            \\s+  (BETWEEN)  \\s+  (.*?)  \\s+  AND  \\s+
          )
          \\s*
          (.*?)
        )?
      )
      \\s*
      (?=
        $
        |
        \\s+  (?: OR | AND )  \\s+
      )
    `.replace(/\s/g, ''),
    'gim'
  )
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(condition))) {
    const [, conjunction, field, unary, operation, between, value0, value] = match

    let funcName
    if (conjunction) {
      funcName = conjunction.toUpperCase() === 'OR' ? 'orOn' : 'andOn'
    } else {
      funcName = 'on'
    }

    if (unary) {
      // --------------------
      // 'IS NULL' or 'IS NOT NULL'
      // --------------------
      const unaryUp = unary.toUpperCase().replace(/\s/g, ' ')
      funcName = unaryUp === 'IS NULL' ? `${funcName}Null` : `${funcName}NotNull`
      queryBuilder[funcName](field)
    } else if (between) {
      // --------------------
      // BETWEEN _val1 AND _val
      // --------------------
      queryBuilder[`${funcName}Between`](field, [knex.raw(value0), knex.raw(value)])
    } else {
      const operationUp = operation.toUpperCase().replace(/\s/g, ' ')
      if (operationUp === 'IN' || operationUp === 'NOT IN') {
        // --------------------
        // 'IN (value)' or 'NOT IN (value)'
        // --------------------
        funcName = operationUp === 'IN' ? `${funcName}In` : `${funcName}NotIn`
        const val = _.trim(value, '( )')
        queryBuilder[`${funcName}`](field, knex.raw(`[${val}]`))
      } else {
        queryBuilder[funcName](field, operation, value)
      }
    }
  }
}

function resolveJoins(sqlBuilder, sql, byToken) {
  // Notice that sub-query in JOIN block always goes with alias
  const regex = new RegExp(
    `
      (?:
        ( LEFT | RIGHT )   \\s+
      )?
      (?:
        ( INNER | OUTER | CROSS )   \\s+
      )?
      (
        JOIN   \\s+
      )
      (
        [a-z0-9_$\\-\`]*
      )
      (?:
        \\s+
        AS
        \\s+
        ([a-z0-9_$\\-\`]*)?
      )
      \\s+
      ON
      \\s+
    `.replace(/\s/g, ''),
    'gim'
  )
  let match
  // put all matches in an array 'matches' because we need to know
  // the index of next match-item to be able to cut text between ON
  // and next match-item. This simplifies current regex.
  const matches = []
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(sql))) {
    matches.push(match)
  }

  matches.forEach((match, j) => {
    const [wholeMatch, , , , tableName, tableAlias] = match
    let [, leftRight = '', innerOuterCross = ''] = match
    const { index } = match
    const nextMatch = matches[j + 1]
    const nextIndex = nextMatch ? nextMatch.index : sql.length
    const condition = sql.substring(index + wholeMatch.length, nextIndex).trim()

    const subQuery = byToken[tableName]

    innerOuterCross = innerOuterCross.toUpperCase().trim()
    leftRight = leftRight.toUpperCase().trim()
    // helper func to return join type
    const getJoinType = (leftRight, innerOuterCross) => {
      if (leftRight === 'LEFT') {
        if (innerOuterCross === 'OUTER') {
          return 'leftOuterJoin'
        }
        if (!innerOuterCross || innerOuterCross === 'INNER') {
          // Notice that LEFT CROSS JOIN is invalid flow because
          // cross join does not establish relationship between joined tables.
          // So we do 'crossJoin' in this case when query still has LEFT CROSS JOIN
          return 'leftJoin'
        }
      } else if (leftRight === 'RIGHT') {
        if (innerOuterCross === 'OUTER') {
          return 'rightOuterJoin'
        }
        if (!innerOuterCross || innerOuterCross === 'INNER') {
          // see above comment about LEFT CROSS JOIN
          return 'rightJoin'
        }
      }
      if (innerOuterCross === 'CROSS') {
        return 'crossJoin'
      }
      if (innerOuterCross === 'INNER') {
        return 'innerJoin'
      }

      return 'join'
    }
    const joinType = getJoinType(leftRight, innerOuterCross)

    if (joinType) {
      if (subQuery) {
        sqlBuilder[joinType](subQuery.sqlBuilder.as(tableAlias), function () {
          resolveOn(this, condition)
        })
      } else {
        sqlBuilder[joinType](`${tableName} as ${tableAlias}`, function () {
          resolveOn(this, condition)
        })
      }
    }
  })
}

function resolveLimit(sqlBuilder, limitPart) {
  let rowCount
  let offset
  // spec --> [LIMIT {[offset,] row_count | row_count OFFSET offset}]
  if (limitPart.match(/OFFSET/gi)) {
    ;[rowCount, offset] = limitPart
      .replace(/OFFSET/i, ',')
      .replace(/\s/, '')
      .split(',')
  } else {
    ;[offset, rowCount] = limitPart.replace(/\s/, '').split(',')
    if (offset && !rowCount) {
      rowCount = offset
      offset = null
    }
  }
  if (rowCount) {
    sqlBuilder.limit(rowCount)
  }
  if (offset) {
    sqlBuilder.offset(offset)
  }
}

function convertSqlToKnex(sql, byToken = {}, params = {}) {
  // make sure 'sql' is a single line with no LineBreak/Tab symbols
  // as well as remove leading/trailing semicolons
  sql = trimSql(sql)

  // execute main regex
  // see specs of SELECT - https://dev.mysql.com/doc/refman/8.0/en/select.html
  const sqlQueryRegex = getSqlQueryRegex()
  const sqlQueryMatch = sqlQueryRegex.exec(sql)

  // process all captured groups and define 'sqlBuilder'
  let sqlBuilder
  if (sqlQueryMatch) {
    // get all 8 captured groups defined in regex
    const [, selectPart, fromPart, joinPart, wherePart, groupByPart, havingPart, orderByPart, limitPart] = sqlQueryMatch

    const isSubQueryInSelect = isSubQueryInText(selectPart)
    if (isSubQueryInSelect) {
      sqlBuilder = knex.select(resolveSubQueryWithAlias(selectPart, byToken))
    }

    // check if FROM looks like a table name -
    // i.e. Device or Device as d or `Device` as d
    const tableAliasRegex = /^([a-z0-9_$\-`]*)(?:\s+AS\s+([a-z0-9_$\-`]*)?)$/gi
    const tableAliasMatch = tableAliasRegex.exec(fromPart)

    if (tableAliasMatch) {
      const [, tableName, tableAlias] = tableAliasMatch
      if (sqlQueryMatch.length === 9) {
        //-----------
        // SELECT
        //-----------
        if (!isSubQueryInSelect) {
          sqlBuilder = knex.select(knex.raw(selectPart))
        }
        //-----------
        // FROM
        //-----------
        const subQuery = byToken[tableName]
        if (subQuery) {
          // tableAlias must exist if table is $$$_N
          sqlBuilder.from(subQuery.sqlBuilder.as(tableAlias))
        } else {
          sqlBuilder.from(fromPart)
        }
        //-----------
        // JOIN
        //-----------
        if (joinPart) {
          if (isSubQueryInText(joinPart)) {
            resolveJoins(sqlBuilder, joinPart, byToken)
          } else {
            sqlBuilder.joinRaw(joinPart)
          }
        }
        //-----------
        // WHERE
        //-----------
        if (wherePart) {
          sqlBuilder.whereRaw(wherePart)
        }
        //-----------
        // GROUP BY
        //-----------
        if (groupByPart) {
          sqlBuilder.groupByRaw(groupByPart)
        }
        //-----------
        // HAVING
        //-----------
        if (havingPart) {
          sqlBuilder.havingRaw(havingPart)
        }
        //-----------
        // ORDER BY
        //-----------
        if (orderByPart) {
          sqlBuilder.orderByRaw(orderByPart)
        }

        //-----------
        // LIMIT
        //-----------
        if (limitPart) {
          resolveLimit(sqlBuilder, limitPart)
        }

        const sqlTableAlias = getTableAlias(sql)

        // apply constraints
        const { dataConstraints = {} } = params
        if (!_.isEmpty(dataConstraints)) {
          sqlBuilder.modify(addConstraints, dataConstraints, sqlTableAlias)
        }

        // apply filters
        const { urlQuery = {} } = params
        if (!_.isEmpty(urlQuery)) {
          if (sqlTableAlias.result) {
            sqlBuilder.modify(filterDateRangeParams, urlQuery, 'r.endedOn')
          }
          if (sqlTableAlias.site) {
            sqlBuilder.modify(filterParams, urlQuery, { siteId: 's.id' })
          }
        }
      }
    }
  }

  if (!sqlBuilder) {
    sqlBuilder = knex.raw(sql)
  }

  return sqlBuilder
}

function tryConvertSqlStringToKnexQueryBuilder(originalSql, dataConstraints, urlQuery) {
  let sql = trimSql(originalSql)
  const params = { dataConstraints, urlQuery }
  const treeOfSubQueries = getNestedQueries(sql).tree
  let byToken = {}

  if (treeOfSubQueries.length > 0) {
    // replace all sub-queries with table-like placeholder to pass regex
    // like '$$$_N' (N is number) or '$$$ as $$$_N' which map to object with prepared knex
    // All such 'tables' will be handled below where sqlBuilder is assembled
    const nestedQueries = processNestedQueries(sql, treeOfSubQueries, params)
    ;[{ modifiedSql: sql, byToken }] = [nestedQueries]
  }

  const sqlBuilder = convertSqlToKnex(sql, byToken, {
    dataConstraints,
    urlQuery,
  })

  return sqlBuilder
}

async function queryValue(sql, dataConstraints, query, timezoneIANA) {
  let firstResult
  sql = trimSql(sql)
  if (sql) {
    sql = sql.replace(/{timeZone}/g, timezoneIANA)
    const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(sql, dataConstraints, query)

    try {
      if (sqlBuilder) {
        firstResult = await sqlBuilder
      } else {
        firstResult = await knex.raw(sql).then(data => data[0])
      }
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.error('ERROR in function queryValue (sql-2-knex.js):', ex.toString())
    }

    while (_.isArray(firstResult)) {
      ;[firstResult] = firstResult
    }
  }
  return firstResult
}

/**
 * Puts query in a single line and removes edge semicolon/space symbols
 */
function trimSql(sql) {
  return _.trim((sql || '').replace(/[\n\t]/gm, ' '), '; ')
}

module.exports = {
  getTableAlias,
  isSelectQuery,
  getBalancedParentheses,
  getNestedQueries,
  processNestedQueries,
  tryConvertSqlStringToKnexQueryBuilder,
  queryValue,
}
