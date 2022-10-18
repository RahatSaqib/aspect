const Knex = require('knex')

module.exports = function (knex) {
  Knex.QueryBuilder.extend('paginate', function (perPage = 10, page = 1, isLengthAware = false) {
    // Object that will be returned
    let paginator = {}

    // Validate argument type
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(perPage)) {
      throw new Error('Paginator error: perPage must be a number.')
    }

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(page)) {
      throw new Error('Paginator error: page must be an number.')
    }

    if (typeof isLengthAware !== 'boolean') {
      throw new Error('Paginator error: isLengthAware must be a boolean.')
    }

    // Don't allow negative pages
    if (page < 0) {
      page = 0
    }

    const offset = page * perPage
    const promises = []

    // If the paginator is aware of its length, count the resulting rows
    if (isLengthAware) {
      if (this.clone().toSQL().sql.toLowerCase().indexOf('group by') !== -1) {
        promises.push(
          knex.raw(
            `select count(*) as total from (${this.clone().clearSelect().clearOrder().count('*').toString()}) as q`
          )
        )
      } else {
        promises.push(this.clone().clearSelect().clearOrder().count('* as total').first())
      }
    } else {
      // eslint-disable-next-line no-unused-vars
      promises.push(new Promise((resolve, _) => resolve()))
    }

    // This will paginate the data itself
    promises.push(this.offset(offset).limit(perPage))

    return Promise.all(promises).then(([countQuery, result]) => {
      // If the paginator is length aware...
      if (isLengthAware) {
        let total = 0
        if (countQuery[0] && countQuery[0][0] !== undefined)
          // eslint-disable-next-line prefer-destructuring
          total = countQuery[0][0].total
        else total = countQuery ? countQuery.total : 0
        paginator = {
          ...paginator,
          total,
          last_page: Math.ceil(total / perPage),
        }
      }

      // Add pagination data to paginator object
      paginator = {
        ...paginator,
        per_page: perPage,
        current_page: page,
        from: offset,
        to: offset + result.length,
        data: result,
      }

      return paginator
    })
  })
}
