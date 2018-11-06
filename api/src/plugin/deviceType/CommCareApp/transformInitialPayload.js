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

  const resultText = _.get(form, 'rdt_result')
  const hcwResult = _.get(form, 'hcw_rdt_result')
  const hcwConfirmatoryResult = _.get(form, 'hcw_confirmatory_result')
  const hcwTiebreakerResult = _.get(form, 'hcw_tiebreak_result')

  // Category 1 is from patient
  let resultCategory1
  if (resultText === 'positive') {
    resultCategory1 = 'Detected'
  } else if (resultText === 'negative') {
    resultCategory1 = 'NotDetected'
  } else {
    resultCategory1 = 'Invalid'
  }

  // Category 2 is HCW preference to tiebreaker, then confirmatory
  let resultCategory2
  if (hcwTiebreakerResult === 'positive') {
    resultCategory2 = 'Detected'
  } else if (hcwTiebreakerResult === 'negative') {
    resultCategory2 = 'NotDetected'
  } else if (hcwTiebreakerResult === 'invalid') {
    resultCategory2 = 'Invalid'
  } else if (hcwConfirmatoryResult === 'positive') {
    resultCategory2 = 'Detected'
  } else if (hcwConfirmatoryResult === 'negative') {
    resultCategory2 = 'NotDetected'
  } else {
    resultCategory2 = 'Invalid'
  }

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
        resultText,
        resultImageUrl: pictureUrl,
        resultImageFileName: rdtPicture,
        hcwResult,
        hcwConfirmatoryResult,
        hcwTiebreakerResult,
      },
      category: [
        {
          id: resultCategory1,
        },
        {
          id: resultCategory2,
        },
      ],
      patient: {
        id: _.get(form, 'study_id'),
        age: _.get(form, 'age'),
        gender: _.get(form, 'gender'),
        phone: normalizePhoneNumber(_.get(form, 'phone_number')),
        educationLevel: _.get(form, 'education_level'),
        previousTesting: _.get(form, 'previous_testing'),
      },
      sample: {
        id: _.get(form, 'study_id'),
      },
      sender: {
        operator: _.get(metadata, 'username'),
        version: String(_.get(metadata, 'commcare_version')),
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

function normalizePhoneNumber(phoneNumber) {
  // strip to digits only
  phoneNumber = phoneNumber.replace(/[^\d]/g, '')

  // strip off leading 0 if ten digits
  if (phoneNumber.length === 10 && phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber.substring(1)
  }

  // Prepend country code if specified and does not already start with it
  if (phoneNumber.length === 9 && !phoneNumber.startsWith('27')) {
    phoneNumber = `+27${phoneNumber}`
  }

  return phoneNumber
}

module.exports = transformInitialPayload
