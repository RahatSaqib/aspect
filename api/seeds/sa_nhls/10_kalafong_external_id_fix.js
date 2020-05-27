module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const config = require('../../src/config')

async function seed(knex) {
  const redCapAuthToken = _.get(config, 'webhook.redcap.authToken')
  if (!redCapAuthToken) {
    // eslint-disable-next-line no-console
    console.error(
      'Missing RedCAP webhook environment variable: authToken. Ensure that webhook.redcap.authToken is set in .env'
    )
    process.exit(1)
  }
  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  const redCAPWebhookTemplate = await knex('WebhookTemplate')
    .where('externalId', 'redCapAlereQ')
    .first()

  if (!redCAPWebhookTemplate) {
    return
  }

  const redCapDateTimeFormat = 'yyyy-MM-dd HH:mm'
  await knex('WebhookTemplate')
    .where('id', redCAPWebhookTemplate.id)
    .update({
      payload:
        `token=${redCapAuthToken}&content=record&format=json&type=flat&overwriteBehavior=normal&` +
        `forceAutoNumber=true&data=%5B%7B%22record_id%22%3A%221%22%2C%20` +
        `%22redcap_data_access_group%22%3A{{urlEncode (enclose (toLowerCase (defaultTo site.id '')) with='"')}}%2C%20` +
        `%22first_name%22%3A{{urlEncode (enclose (defaultTo result.formData.nameOfPatient '') with='"')}}%2C%20` +
        `%22surname%22%3A{{urlEncode (enclose (defaultTo result.formData.surnameOfPatient '') with='"')}}%2C%20` +
        `%22hospital_number%22%3A{{urlEncode (enclose (defaultTo result.formData.hospitalNumber '') with='"')}}%2C%20` +
        `%22site_code%22%3A{{urlEncode (enclose (defaultTo (mapValue site.id '{"DNAH":"D","KPTH":"K","CMJAH":"J","RMMCH":"R","CHBAH":"B"}') '') with='"')}}%2C%20` +
        `%22ward_cubicle%22%3A{{urlEncode (enclose (defaultTo result.formData.ward '') with='"')}}%2C%20` +
        `%22sample_category%22%3A{{urlEncode (enclose (defaultTo result.formData.sampleType '') with='"')}}%2C%20` +
        `%22instrument_ca%22%3A{{urlEncode (enclose (defaultTo (mapValue device.deviceType '{"CepheidGeneXpert":"1","AlereQ":"2"}') '') with='"')}}%2C%20` +
        `%22assayhiv%22%3A{{urlEncode (enclose (defaultTo (mapValue result.assay.id '{"assayAlereQHiv12VLPlasma":"1","assayAlereQHiv12Detect":"2","GxHiv1Vl":"1","GxHiv1Qual":"2"}') '') with='"')}}%2C%20` +
        `%22sample_barcode%22%3A{{urlEncode (enclose (defaultTo result.sample.id '') with='"')}}%2C%20` +
        `%22sample_taken%22%3A{{urlEncode (enclose (defaultTo (formatDate (offsetToTimeZone result.formData.timeSampleTaken 'Africa/Johannesburg') '${redCapDateTimeFormat}') '') with='"')}}%2C%20` +
        `%22point_of_care_instrument_r%22%3A{{urlEncode (enclose (defaultTo (mapValue (tryMergeResultCategories result.category1.id result.category2.id) '{"Detected":"1","MoreThan1000":"1","LessThan1000":"1","Trace Detected":"1","NotDetected":"2","NoResult":"3","Discordant":"3","Indeterminate":"3","Invalid":"3","Success":"3","CollectNewSample":"3","Rejected":"3","Missing":"3","Unknown":"3","Error":"4"}') '') with='"')}}%2C%20` +
        `%22error_code1%22%3A{{urlEncode (enclose (defaultTo result.errorCode '') with='"')}}%2C%20` +
        `%22poc_viral_load%22%3A` +
        `{{#if (eq result.assay.id 'assayAlereQHiv12VLPlasma')}}` +
        `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
        `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
        `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
        `{{else if (or (isRegexMatch result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
        `(isRegexMatch result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
        `(isRegexMatch result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL'))}}` +
        `{{#if (or (gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
        `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
        `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL')) 10000000))}}` +
        `%22%3E%2010%20000%20000%20copies%2Fml%22` +
        `{{else}}` +
        `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.hiv1MNResult result.data.hiv1OResult result.data.hiv2Result) '0')}}%20copies%2Fml%22` +
        `{{/if}}` +
        `{{else}}` +
        `%220%22` +
        `{{/if}}` +
        `{{else if (eq result.assay.id 'GxHiv1Vl')}}` +
        `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
        `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
        `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
        `{{else if (gt (toInt (extractValueFromRegexCaptureGroup result.data.copies '([\\d|\\s|\\.]+)')) 10000000)}}` +
        `%22%3E%2010%20000%20000%20copies%2Fml%22` +
        `{{else}}` +
        `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.copies) '0')}}%20copies%2Fml%22` +
        `{{/if}}` +
        `{{else}}` +
        `%22%22` +
        `{{/if}}` +
        `%2C%20` +
        `%22ct_value%22%3A{{urlEncode (enclose (defaultTo result.data.probes.probeCCt '0') with='"')}}%2C%20` +
        `%22result_instrument%22%3A{{urlEncode (enclose (defaultTo (formatDate (offsetToTimeZone result.formData.timeInstrumentResulted 'Africa/Johannesburg') '${redCapDateTimeFormat}') '') with='"')}}` +
        `%7D%5D&returnContent=ids&returnFormat=json`,
      updatedOn: now,
      updatedBy: adminId,
    })

  await knex('Site').where('externalId', 'kalafong').update({
    externalId: 'KPTH',
    updatedOn: now,
    updatedBy: adminId,
  })
}
