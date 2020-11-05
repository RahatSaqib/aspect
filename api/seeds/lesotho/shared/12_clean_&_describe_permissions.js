const cleanAndDescribePermissions = require('../../common/20200807_clean_and_describe_permissions')

module.exports = async function (knex) {
  await cleanAndDescribePermissions(knex)
}
