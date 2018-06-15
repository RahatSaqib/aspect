const _ = require('lodash')
const Boom = require('boom')
const { getDateOrDefault } = require('../../../shared/date')

async function transformInitialPayload({ payload }) {
  if (_.get(payload, 'form.@name') !== 'RDT Assay') {
    throw Boom.badRequest('Expecting RDT Assay Form')
  }

  const attachments = _.get(payload, 'attachments', {})
  const rdtPicture = _.get(payload, 'form.rdt_picture')
  const pictureUrl = _.get(attachments[rdtPicture], 'url', '')

  const aspectPayload = {
    name: 'HIV RDT App',
    type: { id: 'CommCareGatesRDT' },
    result: {
      assay: {
        id: 'CommCareGatesRDT',
        version: String(_.get(payload, 'metadata.app_build_version')),
      },
      startedOn: getDateOrDefault(payload, 'form.meta.timeStart'),
      endedOn: getDateOrDefault(payload, 'form.meta.timeEnd'),
      data: {
        resultText: _.get(payload, 'form.rdt_result'),
        urlPicture: pictureUrl,
      },
      category: [
        {
          id:
            _.get(payload, 'form.rdt_result') === 'positive'
              ? 'Detected'
              : 'NotDetected',
        },
      ],
      patient: {
        id: _.get(payload, 'form.study_id'),
        age: _.get(payload, 'form.age'),
        gender: _.get(payload, 'form.gender'),
      },
      sample: {
        id: _.get(payload, 'form.study_id'),
      },
      sender: {
        operator: _.get(payload, 'metadata.username'),
      },
      rawData: payload,
    },
  }

  return aspectPayload
}

module.exports = transformInitialPayload
