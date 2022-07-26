const Promise = require('bluebird')
const { allAssayTypeToId, deviceTypeCategoryToId, resultSourceToId } = require('../src/shared/dictionary')
const { seedPartnerAssay, seedPartnerDisease } = require('./utils')

async function seedAbbottM2000AndAssays(knex, updateExistingAssays) {
  const m2000ConfigurationDataSchema = JSON.stringify({
    deviceTypeName: {
      title: 'Device Type',
      type: 'string',
    },
    deviceVersion: {
      title: 'Device Version',
      type: 'string',
    },
    interfaceVersion: {
      title: 'Interface Version',
      type: 'string',
    },
    softwareVersion: {
      title: 'Software Version',
      type: 'string',
    },
  })

  const deviceTypeCategoryLabId = await deviceTypeCategoryToId('Lab')

  const deviceTypeExternalId = 'AbbottM2000'
  let { id: deviceTypeM2000Id } = (await knex('DeviceType').where('externalId', deviceTypeExternalId).first('id')) || {}
  if (!deviceTypeM2000Id) {
    ;[deviceTypeM2000Id] = await knex('DeviceType').insert({
      externalId: deviceTypeExternalId,
      name: 'm2000',
      manufacturer: 'Abbott',
      deviceTypeCategoryId: deviceTypeCategoryLabId,
      configurationDataSchema: m2000ConfigurationDataSchema,
      deviceOperationSchema: '{}',
    })
  }

  const abbottM2000ResultDataSchema = {
    resultText: {
      title: 'Result Text',
      type: 'string',
    },
    resultUnit: {
      title: 'Result Unit',
      type: 'string',
    },
    referenceRanges: {
      title: 'Reference Ranges',
      type: 'string',
    },
    priority: {
      title: 'Priority',
      type: 'string',
    },
    assayName: {
      title: 'Assay Name',
      type: 'string',
    },
    assayProtocol: {
      title: 'Assay Protocol',
      type: 'string',
    },
    collectedBy: {
      title: 'Sample Collected By',
      type: 'string',
    },
    finalResultAbnormalFlags: {
      title: 'Final Result Abnormal Flags',
      type: 'array',
    },
    preliminaryResultAbnormalFlags: {
      title: 'Preliminary Result Abnormal Flags',
      type: 'array',
    },
    orderOperatorId: {
      title: 'Ordered By',
      type: 'string',
    },
    controlConsumableLotNumber: {
      title: 'Quality Control Consumable Lot',
      type: 'string',
    },
    passedQualityControl: {
      title: 'Passed Quality Control',
      type: 'bool',
    },
    typeOfMessage: {
      title: 'Message Type',
      type: 'string',
    },
    messageIsComplete: {
      title: 'Message Complete',
      type: 'bool',
    },
    messageSentOn: {
      title: 'Message Sent On',
      type: 'time',
    },
    testQualifier: {
      title: 'Test Qualifier',
      type: 'string',
    },
    actionCode: {
      title: 'Action',
      type: 'string',
    },
    reportType: {
      title: 'Report Type',
      type: 'string',
    },
    resultType: {
      title: 'Result Type',
      type: 'string',
    },
    resultStatus: {
      title: 'Status',
      type: 'string',
    },
  }

  const abbottM2000PatientDataSchema = {
    id: {
      list: true,
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    practicePatientId: {
      list: false,
      title: 'Practice Patient ID',
      type: 'string',
      order: 1,
    },
    additionalPatientId: {
      list: false,
      title: 'Additional Patient ID',
      type: 'string',
      order: 2,
    },
    name: {
      list: false,
      title: 'Name',
      type: 'string',
      order: 3,
    },
    dateOfBirth: {
      list: false,
      title: 'Date of Birth',
      type: 'date',
      order: 4,
    },
    gender: {
      list: false,
      title: 'Gender',
      type: 'string',
      order: 5,
    },
    ethnicOrigin: {
      list: false,
      title: 'Ethnicity',
      type: 'string',
      order: 6,
    },
    address: {
      list: false,
      title: 'Address',
      type: 'string',
      order: 7,
    },
    phone: {
      list: false,
      title: 'Phone',
      type: 'string',
      order: 8,
    },
    attendingPhysician: {
      list: false,
      title: 'Attending Physician',
      type: 'string',
      order: 9,
    },
    height: {
      list: false,
      title: 'Height',
      type: 'string',
      order: 10,
    },
    weight: {
      list: false,
      title: 'Weight',
      type: 'string',
      order: 11,
    },
    diet: {
      list: false,
      title: 'Diet',
      type: 'string',
      order: 12,
    },
    admissionOrDischargeDates: {
      list: false,
      title: 'Admission/Discharge Date',
      type: 'date',
      order: 13,
    },
    admissionStatus: {
      list: false,
      title: 'Admission Status',
      type: 'string',
      order: 14,
    },
    location: {
      list: false,
      title: 'Location',
      type: 'string',
      order: 15,
    },
    isolationStatus: {
      list: false,
      title: 'Isolation Status',
      type: 'string',
      order: 16,
    },
    hospitalInstitution: {
      list: false,
      title: 'Hospital',
      type: 'string',
      order: 17,
    },
    dosageCategory: {
      list: false,
      title: 'Dosage Category',
      type: 'string',
      order: 18,
    },
  }

  const assayTypes = await allAssayTypeToId()

  const resultSourceDiagnosticId = await resultSourceToId('DiagnosticDevice')

  const ensureAssay = async (
    externalId,
    name,
    i18nKey,
    resultCategory1Label,
    resultCategory1i18nKey,
    assayType,
    abbreviation,
    resultDataSchema
  ) => {
    let { id } = (await knex('Assay').where({ externalId }).first('id')) || {}
    if (!id) {
      ;[id] = await knex('Assay').insert({
        name,
        i18nKey,
        externalId,
        assayTypeId: assayTypes[assayType],
        deviceTypeId: deviceTypeM2000Id,
        resultSourceId: resultSourceDiagnosticId,
        resultCategory1Label,
        resultCategory1i18nKey,
        resultDataSchema: JSON.stringify(resultDataSchema),
        patientDataSchema: JSON.stringify(abbottM2000PatientDataSchema),
        abbreviation,
      })
    } else if (updateExistingAssays) {
      await knex('Assay')
        .where({ id })
        .update({
          name,
          i18nKey,
          assayTypeId: assayTypes[assayType],
          deviceTypeId: deviceTypeM2000Id,
          resultSourceId: resultSourceDiagnosticId,
          resultCategory1Label,
          resultCategory1i18nKey,
          resultDataSchema: JSON.stringify(resultDataSchema),
          patientDataSchema: JSON.stringify(abbottM2000PatientDataSchema),
          abbreviation,
        })
    }
    return id
  }

  const ensureResultCategories = async (assayId, resultCategories) =>
    Promise.each(resultCategories, async resultCategory => {
      let { id: resultCategoryId } =
        (await knex('ResultCategory').where('externalId', resultCategory.externalId).first()) || {}
      if (!resultCategoryId) {
        ;[resultCategoryId] = await knex('ResultCategory').insert(resultCategory)
      }
      const resultCategoryAssay = await knex('ResultCategoryAssay').where({ assayId, resultCategoryId }).first()
      if (!resultCategoryAssay) {
        await knex('ResultCategoryAssay').insert({
          assayId,
          resultCategoryId,
        })
      }
    })

  const vlQuantitativeQCSummary = {
    qualityControlSummary: {
      title: 'Quality Control Summary',
      type: 'object',
      properties: {
        negativeControl: {
          title: 'Negative Control',
          type: 'object',
          properties: {
            passed: {
              title: 'Passed',
              type: 'bool',
            },
            result: {
              title: 'Result',
              type: 'string',
            },
            endedOn: {
              title: 'Time Ended',
              type: 'time',
            },
            cycleNumber: {
              title: 'Cycle Number',
              type: 'string',
            },
            moduleName: {
              title: 'Well Position',
              type: 'string',
            },
            moduleSerial: {
              title: 'Instrument Serial',
              type: 'string',
            },
            assayCode: {
              title: 'Assay Code',
              type: 'string',
            },
            assayName: {
              title: 'Assay Name',
              type: 'string',
            },
            orderOperatorId: {
              title: 'Ordered By',
              type: 'string',
            },
            senderOperator: {
              title: 'Sent By',
              type: 'string',
            },
            consumableLot: {
              title: 'Consumable Lot Number',
              type: 'string',
            },
            consumableSerial: {
              title: 'Consumable Serial Number',
              type: 'string',
            },
            controlConsumableLotNumber: {
              title: 'Control Consumable Lot Number',
              type: 'string',
            },
            reportType: {
              title: 'Report Type',
              type: 'string',
            },
            finalResultAbnormalFlags: {
              title: 'Final Result Abnormal Flags',
              type: 'array',
            },
            preliminaryResultAbnormalFlags: {
              title: 'Preliminary Result Abnormal Flags',
              type: 'array',
            },
          },
        },
        lowPositiveControl: {
          title: 'Low Positive Control',
          type: 'object',
          properties: {
            passed: {
              title: 'Passed',
              type: 'bool',
            },
            result: {
              title: 'Result',
              type: 'string',
            },
            endedOn: {
              title: 'Time Ended',
              type: 'time',
            },
            cycleNumber: {
              title: 'Cycle Number',
              type: 'string',
            },
            moduleName: {
              title: 'Well Position',
              type: 'string',
            },
            moduleSerial: {
              title: 'Instrument Serial',
              type: 'string',
            },
            assayCode: {
              title: 'Assay Code',
              type: 'string',
            },
            assayName: {
              title: 'Assay Name',
              type: 'string',
            },
            orderOperatorId: {
              title: 'Ordered By',
              type: 'string',
            },
            senderOperator: {
              title: 'Sent By',
              type: 'string',
            },
            consumableLot: {
              title: 'Consumable Lot Number',
              type: 'string',
            },
            consumableSerial: {
              title: 'Consumable Serial Number',
              type: 'string',
            },
            controlConsumableLotNumber: {
              title: 'Control Consumable Lot Number',
              type: 'string',
            },
            reportType: {
              title: 'Report Type',
              type: 'string',
            },
            finalResultAbnormalFlags: {
              title: 'Final Result Abnormal Flags',
              type: 'array',
            },
            preliminaryResultAbnormalFlags: {
              title: 'Preliminary Result Abnormal Flags',
              type: 'array',
            },
          },
        },
        highPositiveControl: {
          title: 'High Positive Control',
          type: 'object',
          properties: {
            passed: {
              title: 'Passed',
              type: 'bool',
            },
            result: {
              title: 'Result',
              type: 'string',
            },
            endedOn: {
              title: 'Time Ended',
              type: 'time',
            },
            cycleNumber: {
              title: 'Cycle Number',
              type: 'string',
            },
            moduleName: {
              title: 'Well Position',
              type: 'string',
            },
            moduleSerial: {
              title: 'Instrument Serial',
              type: 'string',
            },
            assayCode: {
              title: 'Assay Code',
              type: 'string',
            },
            assayName: {
              title: 'Assay Name',
              type: 'string',
            },
            orderOperatorId: {
              title: 'Ordered By',
              type: 'string',
            },
            senderOperator: {
              title: 'Sent By',
              type: 'string',
            },
            consumableLot: {
              title: 'Consumable Lot Number',
              type: 'string',
            },
            consumableSerial: {
              title: 'Consumable Serial Number',
              type: 'string',
            },
            controlConsumableLotNumber: {
              title: 'Control Consumable Lot Number',
              type: 'string',
            },
            reportType: {
              title: 'Report Type',
              type: 'string',
            },
            finalResultAbnormalFlags: {
              title: 'Final Result Abnormal Flags',
              type: 'array',
            },
            preliminaryResultAbnormalFlags: {
              title: 'Preliminary Result Abnormal Flags',
              type: 'array',
            },
          },
        },
      },
    },
  }
  const abbottM2000PlasmaHivVLId = await ensureAssay(
    'abbottM2000PlasmaHivVL',
    'Abbott m2000 Plasma HIV VL',
    'abbottM2000PlasmaHivVL',
    'HIV',
    'resultCategoryHivVl',
    'HIV VL',
    'M2000 Plasma HIV VL',
    {
      ...abbottM2000ResultDataSchema,
      ...vlQuantitativeQCSummary,
    }
  )
  await ensureResultCategories(abbottM2000PlasmaHivVLId, [
    {
      name: 'Not Detected',
      i18nKey: 'resultCategoryNotDetected',
      externalId: 'NotDetected',
    },
    {
      name: 'Detected',
      i18nKey: 'resultCategoryDetected',
      externalId: 'Detected',
    },
    {
      name: '< 40',
      i18nKey: 'resultCategoryLessThan40',
      externalId: 'LessThan40',
    },
    {
      name: '>= 40',
      i18nKey: 'resultCategoryMoreThan40',
      externalId: 'MoreThan40',
    },
    {
      name: '< 150',
      i18nKey: 'resultCategoryLessThan150',
      externalId: 'LessThan150',
    },
    {
      name: '>= 150',
      i18nKey: 'resultCategoryMoreThan150',
      externalId: 'MoreThan150',
    },
    {
      name: '< 550',
      i18nKey: 'resultCategoryLessThan550',
      externalId: 'LessThan550',
    },
    {
      name: '>= 550',
      i18nKey: 'resultCategoryMoreThan550',
      externalId: 'MoreThan550',
    },
    {
      name: 'Indeterminate',
      i18nKey: 'resultCategoryIndeterminate',
      externalId: 'Indeterminate',
    },
    {
      name: 'Error',
      i18nKey: 'resultCategoryError',
      externalId: 'Error',
    },
    {
      name: 'Invalid',
      i18nKey: 'resultCategoryInvalid',
      externalId: 'Invalid',
    },
  ])

  const abbottM2000PlasmaHbvVLId = await ensureAssay(
    'abbottM2000PlasmaHbvVL',
    'Abbott m2000 Plasma HBV VL',
    'abbottM2000PlasmaHbvVL',
    'HBV',
    'resultCategoryHbvVl',
    'HBV VL',
    'M2000 Plasma HBV VL',
    {
      ...abbottM2000ResultDataSchema,
      ...vlQuantitativeQCSummary,
    }
  )
  await ensureResultCategories(abbottM2000PlasmaHbvVLId, [
    {
      name: 'Not Detected',
      i18nKey: 'resultCategoryNotDetected',
      externalId: 'NotDetected',
    },
    {
      name: 'Detected',
      i18nKey: 'resultCategoryDetected',
      externalId: 'Detected',
    },
    {
      name: '< 15',
      i18nKey: 'resultCategoryLessThan40',
      externalId: 'LessThan40',
    },
    {
      name: '>= 15',
      i18nKey: 'resultCategoryMoreThan40',
      externalId: 'MoreThan40',
    },
    {
      name: 'Indeterminate',
      i18nKey: 'resultCategoryIndeterminate',
      externalId: 'Indeterminate',
    },
    {
      name: 'Error',
      i18nKey: 'resultCategoryError',
      externalId: 'Error',
    },
    {
      name: 'Invalid',
      i18nKey: 'resultCategoryInvalid',
      externalId: 'Invalid',
    },
  ])

  const abbottM2000DBSHivVLId = await ensureAssay(
    'abbottM2000DBSHivVL',
    'Abbott m2000 DBS HIV VL',
    'AssayAbbottM2000DBSHivVl',
    'HIV',
    'resultCategoryHivVl',
    'HIV VL',
    'm2000 DBS HIV VL',
    {
      ...abbottM2000ResultDataSchema,
      ...vlQuantitativeQCSummary,
    }
  )
  await ensureResultCategories(abbottM2000DBSHivVLId, [
    {
      name: 'Not Detected',
      i18nKey: 'resultCategoryNotDetected',
      externalId: 'NotDetected',
    },
    {
      name: 'Detected',
      i18nKey: 'resultCategoryDetected',
      externalId: 'Detected',
    },
    {
      name: '< 150',
      i18nKey: 'resultCategoryLessThan150',
      externalId: 'LessThan150',
    },
    {
      name: '>= 150',
      i18nKey: 'resultCategoryMoreThan150',
      externalId: 'MoreThan150',
    },
    {
      name: '< 550',
      i18nKey: 'resultCategoryLessThan550',
      externalId: 'LessThan550',
    },
    {
      name: '>= 550',
      i18nKey: 'resultCategoryMoreThan550',
      externalId: 'MoreThan550',
    },
    {
      name: 'Indeterminate',
      i18nKey: 'resultCategoryIndeterminate',
      externalId: 'Indeterminate',
    },
    {
      name: 'Error',
      i18nKey: 'resultCategoryError',
      externalId: 'Error',
    },
    {
      name: 'Invalid',
      i18nKey: 'resultCategoryInvalid',
      externalId: 'Invalid',
    },
  ])

  const vlQualitativeQCSummary = {
    qualityControlSummary: {
      title: 'Quality Control Summary',
      type: 'object',
      properties: {
        negativeControl: {
          title: 'Negative Control',
          type: 'object',
          properties: {
            passed: {
              title: 'Passed',
              type: 'bool',
            },
            endedOn: {
              title: 'Time Ended',
              type: 'time',
            },
            moduleName: {
              title: 'Well Position',
              type: 'string',
            },
            moduleSerial: {
              title: 'Instrument Serial',
              type: 'string',
            },
            assayCode: {
              title: 'Assay Code',
              type: 'string',
            },
            assayName: {
              title: 'Assay Name',
              type: 'string',
            },
            reportType: {
              title: 'Report Type',
              type: 'string',
            },
            finalResultAbnormalFlags: {
              title: 'Final Result Abnormal Flags',
              type: 'array',
            },
            preliminaryResultAbnormalFlags: {
              title: 'Preliminary Result Abnormal Flags',
              type: 'array',
            },
          },
        },
        positiveControl: {
          title: 'Positive Control',
          type: 'object',
          properties: {
            passed: {
              title: 'Passed',
              type: 'bool',
            },
            result: {
              title: 'Result',
              type: 'string',
            },
            endedOn: {
              title: 'Time Ended',
              type: 'time',
            },
            cycleNumber: {
              title: 'Cycle Number',
              type: 'number',
            },
            moduleName: {
              title: 'Well Position',
              type: 'string',
            },
            moduleSerial: {
              title: 'Instrument Serial',
              type: 'string',
            },
            assayCode: {
              title: 'Assay Code',
              type: 'string',
            },
            assayName: {
              title: 'Assay Name',
              type: 'string',
            },
            orderOperatorId: {
              title: 'Ordered By',
              type: 'string',
            },
            senderOperator: {
              title: 'Sent By',
              type: 'string',
            },
            consumableLot: {
              title: 'Consumable Lot Number',
              type: 'string',
            },
            consumableSerial: {
              title: 'Consumable Serial Number',
              type: 'string',
            },
            controlConsumableLotNumber: {
              title: 'Control Consumable Lot Number',
              type: 'string',
            },
            reportType: {
              title: 'Report Type',
              type: 'string',
            },
            finalResultAbnormalFlags: {
              title: 'Final Result Abnormal Flags',
              type: 'array',
            },
            preliminaryResultAbnormalFlags: {
              title: 'Preliminary Result Abnormal Flags',
              type: 'array',
            },
          },
        },
      },
    },
  }
  const abbottM2000HIVEIDId = await ensureAssay(
    'abbottM2000HIVEID',
    'Abbott m2000 HIV EID',
    'AssayAbbottM2000HivEid',
    'HIV',
    'resultCategoryEid',
    'HIV Qual',
    'm2000 HIV EID',
    {
      ...abbottM2000ResultDataSchema,
      ...vlQualitativeQCSummary,
    }
  )
  await ensureResultCategories(abbottM2000HIVEIDId, [
    {
      name: 'Not Detected',
      i18nKey: 'resultCategoryNotDetected',
      externalId: 'NotDetected',
    },
    {
      name: 'Detected',
      i18nKey: 'resultCategoryDetected',
      externalId: 'Detected',
    },
    {
      name: 'Indeterminate',
      i18nKey: 'resultCategoryIndeterminate',
      externalId: 'Indeterminate',
    },
    {
      name: 'Error',
      i18nKey: 'resultCategoryError',
      externalId: 'Error',
    },
    {
      name: 'Invalid',
      i18nKey: 'resultCategoryInvalid',
      externalId: 'Invalid',
    },
  ])

  const covid19QualitativeQCSummary = {
    qualityControlSummary: {
      title: 'Quality Control Summary',
      type: 'object',
      properties: {
        'Daan nCOVID-19 ORF LDA': {
          title: 'Daan nCOVID-19 ORF LDA',
          type: 'object',
          properties: {
            negativeControl: {
              title: 'Negative Control',
              type: 'object',
              properties: {
                passed: {
                  title: 'Passed',
                  type: 'bool',
                },
                endedOn: {
                  title: 'Time Ended',
                  type: 'time',
                },
                moduleName: {
                  title: 'Well Position',
                  type: 'string',
                },
                moduleSerial: {
                  title: 'Instrument Serial',
                  type: 'string',
                },
                assayCode: {
                  title: 'Assay Code',
                  type: 'string',
                },
                assayName: {
                  title: 'Assay Name',
                  type: 'string',
                },
                reportType: {
                  title: 'Report Type',
                  type: 'string',
                },
                finalResultAbnormalFlags: {
                  title: 'Final Result Abnormal Flags',
                  type: 'array',
                },
                preliminaryResultAbnormalFlags: {
                  title: 'Preliminary Result Abnormal Flags',
                  type: 'array',
                },
              },
            },
            positiveControl: {
              title: 'Positive Control',
              type: 'object',
              properties: {
                passed: {
                  title: 'Passed',
                  type: 'bool',
                },
                result: {
                  title: 'Result',
                  type: 'string',
                },
                endedOn: {
                  title: 'Time Ended',
                  type: 'time',
                },
                cycleNumber: {
                  title: 'Cycle Number',
                  type: 'number',
                },
                moduleName: {
                  title: 'Well Position',
                  type: 'string',
                },
                moduleSerial: {
                  title: 'Instrument Serial',
                  type: 'string',
                },
                assayCode: {
                  title: 'Assay Code',
                  type: 'string',
                },
                assayName: {
                  title: 'Assay Name',
                  type: 'string',
                },
                orderOperatorId: {
                  title: 'Ordered By',
                  type: 'string',
                },
                senderOperator: {
                  title: 'Sent By',
                  type: 'string',
                },
                consumableLot: {
                  title: 'Consumable Lot Number',
                  type: 'string',
                },
                consumableSerial: {
                  title: 'Consumable Serial Number',
                  type: 'string',
                },
                controlConsumableLotNumber: {
                  title: 'Control Consumable Lot Number',
                  type: 'string',
                },
                reportType: {
                  title: 'Report Type',
                  type: 'string',
                },
                finalResultAbnormalFlags: {
                  title: 'Final Result Abnormal Flags',
                  type: 'array',
                },
                preliminaryResultAbnormalFlags: {
                  title: 'Preliminary Result Abnormal Flags',
                  type: 'array',
                },
              },
            },
          },
        },
        'Daan Target N gene LDA': {
          title: 'Daan Target N gene LDA',
          type: 'object',
          properties: {
            negativeControl: {
              title: 'Negative Control',
              type: 'object',
              properties: {
                passed: {
                  title: 'Passed',
                  type: 'bool',
                },
                endedOn: {
                  title: 'Time Ended',
                  type: 'time',
                },
                moduleName: {
                  title: 'Well Position',
                  type: 'string',
                },
                moduleSerial: {
                  title: 'Instrument Serial',
                  type: 'string',
                },
                assayCode: {
                  title: 'Assay Code',
                  type: 'string',
                },
                assayName: {
                  title: 'Assay Name',
                  type: 'string',
                },
                reportType: {
                  title: 'Report Type',
                  type: 'string',
                },
                finalResultAbnormalFlags: {
                  title: 'Final Result Abnormal Flags',
                  type: 'array',
                },
                preliminaryResultAbnormalFlags: {
                  title: 'Preliminary Result Abnormal Flags',
                  type: 'array',
                },
              },
            },
            positiveControl: {
              title: 'Positive Control',
              type: 'object',
              properties: {
                passed: {
                  title: 'Passed',
                  type: 'bool',
                },
                result: {
                  title: 'Result',
                  type: 'string',
                },
                endedOn: {
                  title: 'Time Ended',
                  type: 'time',
                },
                cycleNumber: {
                  title: 'Cycle Number',
                  type: 'number',
                },
                moduleName: {
                  title: 'Well Position',
                  type: 'string',
                },
                moduleSerial: {
                  title: 'Instrument Serial',
                  type: 'string',
                },
                assayCode: {
                  title: 'Assay Code',
                  type: 'string',
                },
                assayName: {
                  title: 'Assay Name',
                  type: 'string',
                },
                orderOperatorId: {
                  title: 'Ordered By',
                  type: 'string',
                },
                senderOperator: {
                  title: 'Sent By',
                  type: 'string',
                },
                consumableLot: {
                  title: 'Consumable Lot Number',
                  type: 'string',
                },
                consumableSerial: {
                  title: 'Consumable Serial Number',
                  type: 'string',
                },
                controlConsumableLotNumber: {
                  title: 'Control Consumable Lot Number',
                  type: 'string',
                },
                reportType: {
                  title: 'Report Type',
                  type: 'string',
                },
                finalResultAbnormalFlags: {
                  title: 'Final Result Abnormal Flags',
                  type: 'array',
                },
                preliminaryResultAbnormalFlags: {
                  title: 'Preliminary Result Abnormal Flags',
                  type: 'array',
                },
              },
            },
          },
        },
      },
    },
  }
  const abbottM2000DaanNCOVID19Id = await ensureAssay(
    'abbottM2000DaanNCOVID19',
    'Abbott m2000 Daan N COVID-19',
    'AssayAbbottM2000DaanNCOVID19',
    'COVID-19 Region N',
    'resultCategoryCOVID19RegionN',
    'COVID-19 Test',
    'm2000 COVID-19 N',
    {
      ...abbottM2000ResultDataSchema,
      ...covid19QualitativeQCSummary,
    }
  )
  await ensureResultCategories(abbottM2000DaanNCOVID19Id, [
    {
      name: 'Negative',
      i18nKey: 'resultCategoryNegative',
      externalId: 'Negative',
    },
    {
      name: 'Positive',
      i18nKey: 'resultCategoryPositive',
      externalId: 'Positive',
    },
    {
      name: 'Inconclusive',
      i18nKey: 'resultCategoryInconclusive',
      externalId: 'Inconclusive',
    },
    {
      name: 'Error',
      i18nKey: 'resultCategoryError',
      externalId: 'Error',
    },
    {
      name: 'Invalid',
      i18nKey: 'resultCategoryInvalid',
      externalId: 'Invalid',
    },
  ])

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

module.exports = {
  seedAbbottM2000AndAssays,
}
