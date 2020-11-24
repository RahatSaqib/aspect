const newIssuesSeeds = require('../common/20201124_update_issue_templates')

module.exports = require('../utils').seed(newIssuesSeeds, __filename)
