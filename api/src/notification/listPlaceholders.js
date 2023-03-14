// const Boom = require('@hapi/boom')
// const { notificationTypeCreated } = require('../notificationType/actions')
// const { getNotificationStatusInfo } = require('./common/db')
// const ReportBasedNotificationCacheSingleton = require('./reportBased/reportBasedNotificationCache')
// const logger = require('../shared/logger')
// const { knex } = require('../db')
// const { getCustomFields } = require('../forms/service.js')
// const { addConstraints, getConstraints } = require('../../auth/constraints')

const placeholders = [
  {
    notificationTypeWhitelist: ['reportBased'],
    labelI18nKey: 'placeholderReport',
    label: 'Report',
    options: [
      {
        id: 'report.downloadLink',
        nameI18nKey: 'placeholderReportDownloadLink',
        name: 'Download Link',
      },
    ],
  },
  {
    notificationTypeWhitelist: [
      'reportBased',
      'resultBased',
      'inventoryStockout',
      'siteWithLowFieldCompletionRate',
      'InventoryStockExpiring',
    ],
    labelI18nKey: 'placeholderSite',
    label: 'Site',
    options: [
      {
        id: 'site.id',
        nameI18nKey: 'placeholderId',
        name: 'Site ID',
      },
      {
        id: 'site.name',
        nameI18nKey: 'placeholderName',
        name: 'Site Name',
      },
      {
        id: 'site.shortName',
        nameI18nKey: 'placeholderNameShort',
        name: 'Site Short Name',
      },
      {
        id: 'site.completionRatePercentage',
        nameI18nKey: 'placeholderCompletionRatePercentage',
        name: 'Custom Fields Completion Rate Percentage',
      },
    ],
  },
  {
    notificationTypeWhitelist: [
      'reportBased',
      'resultBased',
      'DeviceNoResults',
      'DeviceOffline',
      'CalibrationDueDate',
      'ModuleReplaced',
      'ModuleDisabled',
      'UnusedModules',
      'InstrumentReplaced',
    ],
    labelI18nKey: 'placeholderDevice',
    label: 'Device',
    options: [
      {
        id: 'device.name',
        nameI18nKey: 'placeholderName',
        name: 'Device Name',
      },
      {
        id: 'device.calibrationDueDate',
        nameI18nKey: 'placeHolderCalibrationDueDate',
        name: 'Calibration Due Date',
      },
      {
        id: 'device.daysToCalibrationDueDate',
        nameI18nKey: 'placeHolderDaysToCalibrationDueDate',
        name: 'Days To Calibration Due Date',
      },
    ],
  },
  {
    notificationTypeWhitelist: ['resultBased'],
    labelI18nKey: 'placeholderResult',
    label: 'Result',
    options: [
      {
        id: 'result.data.resultText',
        nameI18nKey: 'placeholderResultText',
        name: 'Result Text',
      },
      {
        id: 'result.patient.id',
        nameI18nKey: 'placeholderResultPatientId',
        name: 'Patient ID',
      },
      {
        id: 'result.startedOn',
        nameI18nKey: 'placeholderResultStartedOn',
        name: 'Started On',
      },
      {
        id: 'result.endedOn',
        nameI18nKey: 'placeholderResultEndedOn',
        name: 'Ended On',
      },
      {
        id: 'result.notes',
        nameI18nKey: 'placeholderResultNotes',
        name: 'Notes',
      },
      {
        id: 'result.moduleName',
        nameI18nKey: 'placeholderResultModuleName',
        name: 'Module Name',
      },
      {
        id: 'result.moduleSerial',
        nameI18nKey: 'placeholderResultModuleSerial',
        name: 'Module Serial',
      },
      {
        id: 'result.errorCode',
        nameI18nKey: 'placeholderResultErrorCode',
        name: 'Error Code',
      },
      {
        id: 'result.assay.id',
        nameI18nKey: 'placeholderResultAssay',
        name: 'Assay',
      },
      {
        id: 'result.sample.id',
        nameI18nKey: 'placeholderResultSampleId',
        name: 'Sample ID',
      },
      {
        id: 'result.sample.originSite.id',
        nameI18nKey: 'placeholderResultSampleOriginSite',
        name: 'Origin Site',
      },
      {
        id: 'result.sample.collectedOn',
        nameI18nKey: 'placeholderResultSampleCollectedDate',
        name: 'Collected On',
      },

      {
        id: 'result.category1.id',
        nameI18nKey: 'placeholderResult1',
        name: 'Result 1',
      },
      {
        id: 'result.category2.id',
        nameI18nKey: 'placeholderResult2',
        name: 'Result 2',
      },
    ],
  },
  {
    notificationTypeWhitelist: ['resultBased'],
    labelI18nKey: 'placeholderCustomFields',
    label: 'Result Custom Fields',
    options: [
      {
        id: 'result.customFields.PatientAge',
        nameI18nKey: 'placeholderPatientAge',
        name: 'Patient Age',
        assayWhitelist: ['GxMtbRifUltra'],
      },
      {
        id: 'result.customFields.PatientPhone',
        nameI18nKey: 'placeHolderPatientPhone',
        name: 'Patient Phone',
        assayWhitelist: ['GxMtbRif'],
      },
    ],
  },
]

/**
 * Does a deeper validation of the filterCondition object.
 * @param {object} filterCondition The filterCondition object
 * @returns true if filterCondition is correct, or a Boom object if a problem was detected
 */

module.exports = async function (/* request */) {
  // const { auth } = request
  // const { credentials } = auth

  // const dataConstraints = await getConstraints(credentials)

  // console.log('dataConstraints', dataConstraints)

  // await getCustomFields()

  // try {
  //   const { notificationType } = await getNotificationStatusInfo(id)
  //   await knex('NotificationType').where({ id }).delete()

  //   if (notificationType === 'reportBased') {
  //     const cache = ReportBasedNotificationCacheSingleton.getInstance()
  //     cache.removeTask(id)
  //   }

  //   if (!messageContext.notificationTypeCreated) {
  //     messageContext.bindActionCreators({ notificationTypeCreated })
  //   }

  //   messageContext.notificationTypeCreated(id)
  // } catch (e) {
  //   logger.info({ info: `NotificationType ${id} cannot be deleted`, e }, { relabelI18nKey: 'aspect:api:notification:delete' })
  //   throw Boom.badData(`Can not delete this notification type because it already triggered notifications`)
  // }

  return { ok: true, data: placeholders }
}
