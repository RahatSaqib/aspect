const Promise = require('bluebird')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')

function* listReports(request){
  const {query} = request

  const data = _.sortBy([
    {
      id: 1,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 2,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 3,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 4,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 5,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5011',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 6,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 7,
      deploymentName: 'Akron Labs',
      moduleSerial: 618601,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 665,
      totalErrors: 23
    },
    {
      id: 8,
      deploymentName: 'Akron Labs',
      moduleSerial: 618601,
      dateOfError: '2016-04-22',
      error: '5006',
      totalTestsRun: 665,
      totalErrors: 23
    },
    {
      id: 9,
      deploymentName: 'Akron Labs',
      moduleSerial: 618601,
      dateOfError: '2016-04-22',
      error: '2008',
      totalTestsRun: 665,
      totalErrors: 23
    },
    {
      id: 10,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 11,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5011',
      totalTestsRun: 661,
      totalErrors: 23
    },
    {
      id: 12,
      deploymentName: 'Akron Labs',
      moduleSerial: 618601,
      dateOfError: '2016-04-22',
      error: '5006',
      totalTestsRun: 665,
      totalErrors: 23
    },
    {
      id: 13,
      deploymentName: 'Akron Labs',
      moduleSerial: 618533,
      dateOfError: '2016-04-22',
      error: '5007',
      totalTestsRun: 661,
      totalErrors: 23
    }
  ], query.sortCol || _.identity)

  const total = data.length

  const result = {ok: true, total, data, length: data.length}

  return result
}

module.exports = {
  listReports
}
