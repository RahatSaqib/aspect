const chai = require('chai')
const { gxAlertResultPayload, gxConnectResultPayload } = require('./simpleResultPayloads')
const {
  gxConnectResultPayloadWithCustomFieldsV1,
  gxAlertPayloadWithCustomFieldsV1,
} = require('./customFieldV1ResultPayloads')
const {
  gxAlertPayloadWithCustomFields,
  gxConnectResultPayloadWithCustomFields,
} = require('./customFieldV2ResultPayloads')
const { gxAlertResultPayloadBig, aspectPayloadBig } = require('./bigResultPayloads')
const customFieldsPakistan = require('../../../src/forms/formsDefinition/CustomFields_Pakistan.json')
const { gxAlertHcvPayload, gxConnectHcvPayload } = require('./hcvResultPayloads')
const { transformPayload } = require('../../../src/plugin/deviceType/transformPayload')

const { expect } = chai

const pakistanTimeZoneData = {
  timezone: 'Pakistan Standard Time',
  timezoneIANA: 'Asia/Karachi',
  timezoneUtcOffset: '05:00',
}

const usTimeZoneData = {
  timezone: 'Mountain Standard Time',
  timezoneIANA: 'America/Denver',
  timezoneUtcOffset: '-07:00',
}

describe('This test is for testing the transformation of a gxalert payload into aspect payload', () => {
  it('transform simple result payload', async () => {
    const transformedPayload = transformPayload(gxAlertResultPayload, true, pakistanTimeZoneData, customFieldsPakistan)
    expect(gxConnectResultPayload).to.containSubset(transformedPayload)
  })

  // Mountain Standard Time (-07:00)
  it('transform customFieldV1 result payload', async () => {
    const transformedPayload = transformPayload(
      gxAlertPayloadWithCustomFieldsV1,
      true,
      usTimeZoneData,
      customFieldsPakistan
    )
    expect(gxConnectResultPayloadWithCustomFieldsV1).to.containSubset(transformedPayload)
  })

  it('transform customFieldV2 result payload', async () => {
    const transformedPayload = transformPayload(
      gxAlertPayloadWithCustomFields,
      true,
      pakistanTimeZoneData,
      customFieldsPakistan
    )
    expect(gxConnectResultPayloadWithCustomFields).to.containSubset(transformedPayload)
  })

  it('transform big result payload', async () => {
    const transformedPayload = transformPayload(
      gxAlertResultPayloadBig,
      true,
      pakistanTimeZoneData,
      customFieldsPakistan
    )
    expect(aspectPayloadBig).to.containSubset(transformedPayload)
  })

  it('transform hcv result payload', async () => {
    const transformedPayload = transformPayload(gxAlertHcvPayload, true, pakistanTimeZoneData, customFieldsPakistan)
    expect(gxConnectHcvPayload).to.containSubset(transformedPayload)
  })
})
