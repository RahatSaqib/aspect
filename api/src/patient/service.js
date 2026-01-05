const _ = require('lodash')
const Promise = require('bluebird')
const { knex } = require('../db')
const { patientAdded, patientUpdated } = require('./actions')
const { getPartnerPluginName, getDeviceTypePluginName } = require('../plugin/utils')
const { processUsingDataSourceQuery } = require('../stringTemplate/service')

function validatePatientIdentifier(patient) {
  let errors = ''

  if (!patient.externalId) errors += 'You must provide the externalId field /n'

  if (!patient.partnerId) errors += 'You must provide the partnerId field /n'

  if (errors) throw new Error(errors)
}

/**
 * Gets the patient id related to the external id and partner provided
 * @param  {object} patient The patient filter
 * @param  {boolean} createIfNonExistent If true, if the patient doesn't exist, it will create a new patient before returning the patientId
 * @param  {int} userId (only necessary if createIfNonExistent is true) The userId that creates the patient
 * @return {int} The patient id
 */
async function getPatientId(patient, createIfNonExistent, userId) {
  validatePatientIdentifier(patient)

  let { patientId } = (await knex('Patient')
    .where({
      externalId: patient.externalId,
      partnerId: patient.partnerId,
    })
    .first('id as patientId')) || { patientId: null }

  if (!patientId && createIfNonExistent) {
    patient.createdBy = userId
    patient.updatedBy = userId
    patientId = await addPatient(patient)
  }

  return patientId
}

/**
 * Adds a new casepatient to database
 * @param  {object} patient
 * @param  {object} options
 * @return {int} The created patient id
 */
async function addPatient(patient, { messageContext } = {}) {
  const [patientId] = await knex('Patient').insert({
    createdOn: new Date(),
    updatedOn: new Date(),
    ...patient,
    data: !patient.data ? '{}' : !_.isString(patient.data) ? JSON.stringify(patient.data) : patient.data,
  })

  if (messageContext) {
    if (!messageContext.patientAdded) {
      messageContext = messageContext.bindActionCreators({ patientAdded })
    }
    messageContext.patientAdded(patientId)
  }

  return patientId
}

/**
 * Removes the patients associated to the provided filter
 * @param  {object} patient The case filter
 * @return {boolean} True if the action was successful
 */
async function removePatient(patient) {
  await knex('Patient')
    .where(_.omit(patient, ['data']))
    .del()
}

const mergeDeep = (baseValue, sourceValue) => {
  if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
    return sourceValue
  }
  if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
    return baseValue
  }
  if (_.isArray(baseValue) && _.isArray(sourceValue)) {
    return _.uniqBy([...(baseValue || []), ...(sourceValue || [])], JSON.stringify)
  }
  if (_.isPlainObject(baseValue) || _.isPlainObject(sourceValue)) {
    return _.mergeWith(_.cloneDeep(baseValue), _.cloneDeep(sourceValue), mergeDeep)
  }
  return sourceValue || baseValue
}

async function updatePatient(whereFields, updateFields, { messageContext } = {}) {
  const patientRecordsToUpdate = await knex('Patient').where(whereFields).select()
  // TODO: This is where we need to evaluate whether the patient
  //       data should be overwritten or not. We may want to take
  //       the data update out of this function and defer it to a
  //       plugin that handles PATIENT_ADDED & PATIENT_UPDATED
  //       messages
  //       https://ops.systemone.id/browse/ASP-1452
  const patientsToUpdate = patientRecordsToUpdate.map(patient => ({
    ...patient,
    ...updateFields,
    data: mergeDeep(
      patient.data ? JSON.parse(patient.data) : {},
      updateFields.data ? JSON.parse(updateFields.data) : {}
    ),
  }))
  await Promise.each(patientsToUpdate, patientToUpdate =>
    knex('Patient')
      .where('id', patientToUpdate.id)
      .update({
        ...patientToUpdate,
        data: _.isEmpty(patientToUpdate.data) ? '{}' : JSON.stringify(patientToUpdate.data),
      })
  )
  const patientIds = await knex('Patient').where(whereFields).pluck('id')
  if (messageContext && patientIds.length) {
    // queue message for each affected Case row
    if (!messageContext.patientUpdated) {
      messageContext = messageContext.bindActionCreators({ patientUpdated })
    }
    patientIds.forEach(id => messageContext.patientUpdated(id))
  }
  return patientIds
}

async function onPatientAdded({ patientId }, { messageContext }) {
  return onPatientChanged(patientId, messageContext, true)
}

async function onPatientUpdated({ patientId }, { messageContext }) {
  return onPatientChanged(patientId, messageContext, false)
}

async function onPatientChanged(patientId, messageContext, isAdded) {
  // get plugin names
  const { deviceId } = messageContext
  const partnerPluginName = await getPartnerPluginName({ patientId })
  const deviceTypePluginName = await getDeviceTypePluginName(deviceId)
  // exec plugin
  if (partnerPluginName || deviceTypePluginName) {
    const { loadPlugin } = require('../plugin/loadPlugin')
    const pluginOnPatientChanged = await loadPlugin(
      partnerPluginName,
      deviceTypePluginName,
      isAdded ? 'onPatientAdded' : 'onPatientUpdated'
    )
    await pluginOnPatientChanged({ patientId }, { messageContext })
  }
}

async function onResultLogged({ resultId }, { messageContext }) {
  return messageContext.run(async knex => {
    // Linking the result service here to avoid cyclic
    //   references between this service and case service
    const { getResultForStringTemplateProcessing } = require('../result/service')
    const { RESULT_STRING_TEMPLATE_FIELDS } = require('../result/query')
    const result = await getResultForStringTemplateProcessing(
      resultId,
      [
        ...RESULT_STRING_TEMPLATE_FIELDS,
        'r.partnerId',
        'sample.patientId as existingPatientId',
        'patient.externalId as existingPatientExternalId',
        'r.updatedBy',
      ],
      knex
    )
    if (result) {
      const {
        reliablePatientExternalIdTemplate,
        unreliablePatientExternalIdTemplate,
        sampleId,
        existingCaseId,
        existingPatientId,
        existingPatientExternalId,
        patientData,
        updatedBy,
        partnerId,
      } = result
      if (reliablePatientExternalIdTemplate || unreliablePatientExternalIdTemplate) {
        let { reliablePatientExternalId: patientExternalId } =
          (await processUsingDataSourceQuery({ ...result, reliablePatientExternalIdTemplate }, [
            'reliablePatientExternalIdTemplate',
          ])) || {}
        const isReliablePatientId = !!patientExternalId
        if (!patientExternalId) {
          ;({ unreliablePatientExternalId: patientExternalId } =
            (await processUsingDataSourceQuery({ ...result, unreliablePatientExternalIdTemplate }, [
              'unreliablePatientExternalIdTemplate',
            ])) || {})
        }
        if (patientExternalId) {
          // Get the patient that matched the patient ID in the payload
          // If the patient doesn't exist and the result's sample & case is not assigned yet, creat the patient
          let patientId = await getPatientId(
            {
              externalId: patientExternalId,
              partnerId,
              reliable: isReliablePatientId,
              data: patientData,
            },
            !existingPatientId,
            updatedBy
          )
          // If no patient was found or created, use the patient already assigned to the sample & case
          if (!patientId) {
            patientId = existingPatientId
          }
          // Do nothing if the result's sample & case is already assigned to a patient and the patient ID has not changed
          if (existingPatientExternalId === patientExternalId) {
            return
          }
          // Lookup if any other patients have the same patient ID
          const otherPatientId = await getPatientId(
            {
              externalId: patientExternalId,
              partnerId,
            },
            false,
            updatedBy
          )
          // If the patient ID for the result's sample & case has changed to an unknown patient ID
          //   update the case number on the existing case
          if (isReliablePatientId && (!otherPatientId || otherPatientId === patientId)) {
            await updatePatient(
              { id: patientId },
              {
                externalId: patientExternalId,
                data: patientData,
                updatedBy,
                updatedOn: new Date(),
              }
            )
          }
          // If the patient ID for the result's sample & case has changed
          //   update the patient ID on the result's sample & case
          if (
            ((isReliablePatientId && existingPatientId !== patientId) ||
              (!isReliablePatientId && !existingPatientId)) &&
            otherPatientId
          ) {
            if (sampleId) {
              await knex('Sample').where('id', sampleId).update({ patientId: otherPatientId, updatedOn: new Date() })
            }
            if (existingCaseId) {
              await knex('PatientCase').where('id', existingCaseId).update({ patientId: otherPatientId })
            }
            // TODO: If the old patient is now empty (with no cases or samples),
            //       should it be purged?
            //       We need to consider if there is a use case for patient records
            //       that don't have any samples or cases in the database
            //       Do empty orphaned patient records even present a problem?
            //       https://ops.systemone.id/browse/ASP-1453
          }
        }
      }
    }
  })
}

module.exports = {
  getPatientId,
  addPatient,
  removePatient,
  updatePatient,
  // MQ consumers
  onPatientAdded,
  onPatientUpdated,
  onResultLogged,
}
