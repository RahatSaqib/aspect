const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const logger = require('../../shared/logger')
const { getFollowUpsOfResultById, getItems, generateResultQuery, addResultDownloadLogQuery } = require('./common/db')
const { getResultItemTransformedData } = require('./common/logic')

async function getDownloadResultById(resultId, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = generateResultQuery(false, dataConstraints, resultId)

  // return result when both queries are finished
  const [data] = await getItems(resultQuery, resultId)
  let transformedData = null

  if (data) {
    // get follow ups for all result in the response for performance (filter later)
    const followUps = await getFollowUpsOfResultById(resultId)

    transformedData = getResultItemTransformedData(data, setDelivered, followUps)
  }

  const result = {
    ok: !!data,
    data: transformedData,
  }

  return result
}

async function downloadResultById(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const user = await getUser(auth.credentials.name)
  const result = await getDownloadResultById(resultId, auth, true)
  const myProm = async () => {
    if (result?.data?.id) {
      await addResultDownloadLog([result.data.id], user.id)
    }
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return result.ok ? result : Boom.notFound()
}

const addResultDownloadLog = async (idsToBeRegistered, userId) => {
  const now = new Date()
  return Promise.each(idsToBeRegistered, async resultId => addResultDownloadLogQuery(resultId, now, userId))
}

module.exports = {
  downloadResultById,
}
