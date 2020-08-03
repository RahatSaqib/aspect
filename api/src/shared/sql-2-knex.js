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
  const regex = /^\s*SELECT\s+/i
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
          item.innerText = sql.substring(
            item.globalIndexStart + 1,
            item.globalIndexEnd
          )
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
    throw new Error(
      'Malformed text - not all parentheses have open and/or close parts'
    )
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
        item.localIndexStart =
          item.globalIndexStart - item.parent.globalIndexStart - 1
        item.localIndexEnd =
          item.globalIndexEnd - item.parent.globalIndexStart - 1
      }
    }
  })

  return {
    all: balancedParentheses.all.filter(item => item.isQuery),
    // get all hierarchies of sub-queries - notice that 'tree'
    // contains only root items of each hierarchy
    tree: balancedParentheses.all.filter(
      item => item.isQuery && (!item.parent || !item.parent.isQuery)
    ),
  }
}

function processNestedQueries(sql, treeOfSubQueries, params) {
  const byToken = {}
  // helper func to replace sub-query text with table name '$$$_N'
  const replaceSubQueries = (originalText, subQueries) => {
    let text = originalText
    _.forEachRight(subQueries, subQ => {
      const tableName = subQ.token
      const partBefore = text.substring(0, subQ.localIndexStart)
      const partAfter = text.substring(subQ.localIndexEnd + 1)
      // assemble text back with spaces around tableName
      text = `${partBefore} ${tableName} ${partAfter}`
      byToken[tableName] = subQ
    })
    return text
  }
  const processItems = items => {
    items.forEach(item => {
      if (item.isProcessed) {
        return
      }

      // 1. process all sub-queries
      processItems(item.subQueries)

      // 2. replace each sub-query with table-like placeholder to pass regex
      item.sqlText = replaceSubQueries(item.innerText, item.subQueries)
        .replace(/[\n\t]/g, ' ')
        .trim()

      // 3. prepare knex
      item.sqlBuilder = convertSqlToKnex(item.sqlText, byToken, params)

      item.isProcessed = true
    })
  }
  processItems(treeOfSubQueries)

  const modifiedSql = replaceSubQueries(sql, treeOfSubQueries)

  return {
    modifiedSql,
    byToken,
  }
}

function getSqlQueryRegex() {
  const regexString = `
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

  \\s*
        (?:
          (?:
  \\s+
            ORDER\\s+BY
          )
  \\s+
          (.*?)
        )?

    )?
    $
  `.replace(/\s/g, '') // remove all white spaces, tabs and line breaks

  return new RegExp(regexString, 'gim')
}

function isSubQueryInText(text) {
  return /(\$\$\$_\d+)/.test(text)
}

function resolveSubQueryWithAlias(sql, byToken) {
  const sqlBuilders = []
  // sub-query in SELECT block always goes with alias
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
    `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'gim' // leave 'm' for tests because they are testing multi-line queries too
  )
  let match
  let indexStart = 0
  let text
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(sql))) {
    const [, tableName, as, alias] = match
    const { index } = match

    // raw text from the left of each sub-query
    text = _.trim(sql.substring(indexStart, index), ' ,')
    if (text.length > 0) {
      sqlBuilders.push(knex.raw(text))
    }
    // add knex of sub-query
    sqlBuilders.push(byToken[tableName].sqlBuilder.as(_.trim(alias, '`')))
    indexStart = index + `${tableName}${as}${alias}`.length
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

function onJoin(qb, condition) {
  // eslint-disable-next-line
  const regex = /(?:^\s*|\s+(OR)\s+|\s+(AND)\s+)\s*(.*?)\s*(?:(\s+IS\s+NULL|\s+IS\s+NOT\s+NULL)|(?:([\!\=\>\<]+|\s+IN\s+|NOT\s+IN\s+|\s+(BETWEEN)\s+(.*?)\s+AND\s+)\s*(.*?))?)\s*(?=$|(?:\s+OR\s+)|(?:\s+AND\s+))/gim
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(condition))) {
    const [
      ,
      _or_,
      _and_,
      field,
      _unary_,
      _sign_,
      _between_,
      _val1,
      _val,
    ] = match

    let onFuncName
    if (_or_) {
      onFuncName = 'orOn'
    } else if (_and_) {
      onFuncName = 'andOn'
    } else {
      onFuncName = 'on'
    }

    if (_unary_) {
      // --------------------
      // 'IS NULL' or 'IS NOT NULL'
      // --------------------
      const unary = _unary_.toUpperCase().replace(/\s/g, ' ')
      onFuncName =
        unary === 'IS NULL' ? `${onFuncName}Null` : `${onFuncName}NotNull`
      qb[onFuncName](field)
    } else if (_between_) {
      // --------------------
      // BETWEEN _val1 AND _val
      // --------------------
      qb[`${onFuncName}Between`](field, [knex.raw(_val1), knex.raw(_val)])
    } else {
      const signUp = _sign_.toUpperCase().replace(/\s/g, ' ')
      if (signUp === 'IN' || signUp === 'NOT IN') {
        // --------------------
        // 'IN (_val)' or 'NOT IN (_val)'
        // --------------------
        onFuncName = signUp === 'IN' ? `${onFuncName}In` : `${onFuncName}NotIn`
        const val = _.trim(_val, '( )')
        qb[`${onFuncName}`](field, knex.raw(`[${val}]`))
      } else {
        qb[onFuncName](field, _sign_, _val)
      }
    }
  }
}

function resolveJoins(sqlBuilder, sql, byToken) {
  // sub-query in JOIN block always goes with alias
  const regexString = `
    (
      LEFT    \\s+
      |
      RIGHT   \\s+
    )?
    (
      INNER   \\s+
      |
      OUTER   \\s+
    )?
    (
      JOIN    \\s+
    )
    (
      [a-zA-Z0-9_$\\-\`]*
    )
    (
      ?:
      \\s+
      AS
      \\s+
      ([a-zA-Z0-9_$\\-\`]*)?
    )
    \\s+
    ON
    \\s+
  `.replace(/\s/g, '')
  const regex = new RegExp(regexString, 'gim')
  let match
  const matches = []
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(sql))) {
    matches.push(match)
  }

  matches.forEach((match, j) => {
    const [wholeMatch, , , , tableName, tableAlias] = match
    let [, leftRight = '', innerOuter = ''] = match
    const { index } = match
    const nextMatch = matches[j + 1]
    const nextIndex = nextMatch ? nextMatch.index : sql.length
    const condition = sql.substring(index + wholeMatch.length, nextIndex).trim()

    const subQuery = byToken[tableName]

    innerOuter = innerOuter.toUpperCase().trim()
    leftRight = leftRight.toUpperCase().trim()
    let joinType
    if (leftRight === 'LEFT') {
      if (innerOuter === 'OUTER') {
        joinType = 'leftOuterJoin'
      } else if (!innerOuter || innerOuter === 'INNER') {
        joinType = 'leftJoin'
      }
    } else if (leftRight === 'RIGHT') {
      if (innerOuter === 'OUTER') {
        joinType = 'rightOuterJoin'
      } else if (!innerOuter || innerOuter === 'INNER') {
        joinType = 'rightJoin'
      }
    } else {
      joinType = innerOuter === 'INNER' ? 'innerJoin' : 'join'
    }

    if (joinType) {
      if (subQuery) {
        sqlBuilder[joinType](subQuery.sqlBuilder.as(tableAlias), function () {
          onJoin(this, condition)
        })
      } else {
        sqlBuilder[joinType](`${tableName} as ${tableAlias}`, function () {
          onJoin(this, condition)
        })
      }
    }
  })
}

function convertSqlToKnex(sql, byToken = {}, params = {}) {
  const sqlQueryRegex = getSqlQueryRegex()
  const tableAliasRegex = /^([a-zA-Z0-9_$\-`]*)(?:\s+AS\s+([a-zA-Z0-9_$\-`]*)?)$/gi
  sql = sql.replace(/[\n\t]/g, ' ')
  const sqlQueryMatch = sqlQueryRegex.exec(sql)
  let sqlBuilder

  if (sqlQueryMatch) {
    // get all 7 captured groups defined in regex
    const [
      ,
      selectPart,
      fromPart,
      joinPart,
      wherePart,
      groupByPart,
      havingPart,
      orderByPart,
    ] = sqlQueryMatch

    const isSubQueryInSelect = isSubQueryInText(selectPart)
    if (isSubQueryInSelect) {
      sqlBuilder = knex.select(resolveSubQueryWithAlias(selectPart, byToken))
    }

    // check if FROM looks like a table name -
    // i.e. Device or Device as d or `Device` as d
    const tableAliasMatch = tableAliasRegex.exec(fromPart)

    if (tableAliasMatch) {
      const [, tableName, tableAlias] = tableAliasMatch

      if (sqlQueryMatch.length === 8) {
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
        if (havingPart) {
          sqlBuilder.orderByRaw(orderByPart)
        }

        const sqlTableAlias = getTableAlias(sql)

        // apply constraints
        const { dataConstraints = {} } = params
        sqlBuilder.modify(addConstraints, dataConstraints, sqlTableAlias)

        // apply filters
        const { urlQuery = {} } = params
        if (sqlTableAlias.result) {
          sqlBuilder.modify(filterDateRangeParams, urlQuery, 'r.endedOn')
        }
        if (sqlTableAlias.site) {
          sqlBuilder.modify(filterParams, urlQuery, { siteId: 's.id' })
        }
      }
    }
  }

  if (!sqlBuilder) {
    sqlBuilder = knex.raw(sql)
  }

  return sqlBuilder
}

function tryConvertSqlStringToKnexQueryBuilder(
  originalSql,
  dataConstraints,
  urlQuery
) {
  const params = { dataConstraints, urlQuery }
  const treeOfSubQueries = getNestedQueries(originalSql).tree
  let sql = originalSql
  let byToken = {}

  sql = sql.replace(/[\n\t]/gm, ' ')
  if (treeOfSubQueries.length > 0) {
    // replace all sub-queries with table-like placeholder to pass regex
    // like '$$$_N' (N is number) or '$$$ as $$$_N' which map to object with prepared knex
    // All such 'tables' will be handled below where sqlBuilder is assembled
    const nestedQueries = processNestedQueries(
      originalSql,
      treeOfSubQueries,
      params
    )
    ;[{ modifiedSql: sql, byToken }] = [nestedQueries]
  }

  sql = sql.replace(/[\n\t]/gm, ' ')
  const sqlBuilder = convertSqlToKnex(sql, byToken, {
    dataConstraints,
    urlQuery,
  })

  return sqlBuilder
}

async function queryValue(sql, dataConstraints, query) {
  let firstResult
  if (sql) {
    // put query in a single line
    sql = sql.replace(/[\n\t]/g, ' ')

    const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(
      sql,
      dataConstraints,
      query
    )
    if (sqlBuilder) {
      firstResult = await sqlBuilder // .first()
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
  processNestedQueries,
  tryConvertSqlStringToKnexQueryBuilder,
  queryValue,
}
