const fixCategoriesAndErrorCodes = require('../../common/20210108_fix_categories_and_errorcodes')

module.exports = require('../../utils').seed(async knex => fixCategoriesAndErrorCodes(knex), __filename)
