const setModuleName = require('../../common/20210406_set_module_name')

module.exports = require('../../utils').seed(async knex => setModuleName(knex), __filename)
