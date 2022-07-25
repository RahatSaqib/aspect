const addUnitResultCategory = require('../common/20210327_add_unit_result_category')

module.exports = require('../utils').seed(async knex => addUnitResultCategory(knex), __filename)
