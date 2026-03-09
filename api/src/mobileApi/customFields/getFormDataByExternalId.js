const Boom = require('@hapi/boom')
const { getConstraints } = require('../../auth/constraints')
const { getAccessibleFormDataByExternalId } = require('./db')

async function getFormDataByExternalId(request) {
  const dataConstraints = await getConstraints(request.auth.credentials)
  const row = await getAccessibleFormDataByExternalId(request.params.externalId, dataConstraints)

  if (!row) {
    throw Boom.notFound('FormData entry not found.')
  }

  return {
    ok: true,
    data: serializeFormDataRow(row),
  }
}

function serializeFormDataRow({ data, ...row }) {
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data
  return { ...row, ...parsedData }
}

module.exports = { getFormDataByExternalId }
