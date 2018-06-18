const _ = require('lodash')
const Boom = require('boom')
const { getDateOrDefault } = require('../../../shared/date')

async function transformInitialPayload({ payload }) {
  const form = _.get(payload, 'form')
  if (_.get(form, '@name') !== 'RDT Assay') {
    throw Boom.badRequest('Expecting RDT Assay Form')
  }

  const metadata = _.get(payload, 'metadata')
  const formMeta = _.get(form, 'meta')
  const rdtPicture = _.get(form, 'rdt_picture')
  const attachments = _.get(payload, 'attachments', {})
  const pictureUrl = _.get(attachments[rdtPicture], 'url', '')

  const aspectPayload = {
    name: 'HIV RDT App',
    type: { id: 'CommCareApp' },
    result: {
      id: _.get(payload, 'id'),
      assay: {
        id: 'CommCareGatesRDT',
        version: String(_.get(metadata, 'app_build_version')),
      },
      startedOn: getDateOrDefault(formMeta, 'timeStart'),
      endedOn: getDateOrDefault(formMeta, 'timeEnd'),
      data: {
        resultText: _.get(form, 'rdt_result'),
        urlPicture: pictureUrl,
      },
      category: [
        {
          id:
            _.get(form, 'rdt_result') === 'positive'
              ? 'Detected'
              : 'NotDetected',
        },
      ],
      patient: {
        id: _.get(form, 'study_id'),
        age: _.get(form, 'age'),
        gender: _.get(form, 'gender'),
      },
      sample: {
        id: _.get(form, 'study_id'),
      },
      sender: {
        operator: _.get(metadata, 'username'),
      },
      rawData: JSON.stringify(payload),
    },
  }
  return aspectPayload
}

module.exports = transformInitialPayload
