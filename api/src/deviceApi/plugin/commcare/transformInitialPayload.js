const _ = require('lodash')
const Boom = require('boom')
const { getDateOrDefault } = require('../../../shared/date')

async function transformInitialPayload({ payload }) {
  const form = _.get(payload, 'form')
  if (_.get(form, '@name') !== 'RDT Assay') {
    // Assay can be mapped by form name if we support more than one
    // to allow one CommCare plugin / device Type with multiple assays
    // But it would also be good to come up with a naming convention
    // for field names
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
      location: parseLocation(_.get(metadata, 'location')),
      data: {
        resultText: _.get(form, 'rdt_result'),
        urlPicture: pictureUrl,
        // TODO should HCW results be additional categories?
        hcwResult: _.get(form, 'hcw_rdt_result'),
        hcwConfirmatoryResult: _.get(form, 'hcw_confirmatory_result'),
        hcwTiebreakerResult: _.get(form, 'hcw_tiebreak_result'),
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
        phone: _.get(form, 'phone_number'),
        educationLevel: _.get(form, 'education_level'),
        previousTesting: _.get(form, 'previous_testing'),
      },
      sample: {
        id: _.get(form, 'study_id'),
      },
      sender: {
        operator: _.get(metadata, 'username'),
      },
      instrument: {
        serial: _.get(metadata, 'deviceID'),
        module: {
          name: _.get(metadata, 'appVersion'),
          serial: _.get(metadata, 'commcare_version'),
        },
      },
      rawData: JSON.stringify(payload),
    },
  }
  return aspectPayload
}

function parseLocation(locationText) {
  let location = null
  if (locationText != null) {
    const locationParts = locationText.split(' ')
    if (locationParts.length >= 2) {
      location = { latitude: locationParts[0], longitude: locationParts[1] }
    }
  }
  return location
}

module.exports = transformInitialPayload
