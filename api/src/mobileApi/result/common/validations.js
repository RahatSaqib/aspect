const Joi = require('@hapi/joi')
const { validateSortPageParams } = require('../../../routes')

const downloadResultValidation = () => {
  return {
    minUpdatedOn: Joi.date().iso().allow(null).description('Updated From Date'),
    diseaseExternalIds: Joi.string().allow(null).optional().description('A csv of the diseases external ID'),
    maxUpdatedOn: Joi.date().iso().allow(null).description('Updated To Date'),
    patientSample: Joi.string()
      .optional()
      .description(
        'Is the string for look for the patient. this string could be the patient id, the sample id or the patient name'
      ),
    assayExternalIds: Joi.string().optional().description('a csv string with the assay externalId'),
    resultCategories: Joi.string().optional().description('an array with the assay type abbreviation'),
    workflowStatus: Joi.string().optional().description('External Id of the workflow status'),
    treatmentStatus: Joi.string().optional().description('External Id of the treatment status'),
    deviceType: Joi.string().optional().description('External Id Device type, the default value is CepheidGeneXpert'),
    isTransferred: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
    ...validateSortPageParams('updatedOn'),
  }
}

const downloadResultResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    total: Joi.number().required().description('The total number of results that match the given filters'),
    length: Joi.number().required().description('The number of results included in this response'),
    data: Joi.array()
      .required()
      .description('The results')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
          externalId: Joi.string().required().description('Unique ID of the result for this diagnostic device'),
          endedOn: Joi.date()
            .required()
            .description(
              'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
            ),
          updatedOn: Joi.date()
            .required()
            .description(
              'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
            ),
          assayExternalId: Joi.string().required().description('Unique ID of the Assay'),
          diseaseName: Joi.string().allow('', null).description('Disease name'),
          diseaseExternalId: Joi.string().allow('', null).required().description('Unique ID of the disease'),
          siteName: Joi.string()
            .required()
            .description('Name of the site where the device was located when the sample was processed'),
          deviceName: Joi.string().required().description('Name of the device'),
          resultCategory1ExternalId: Joi.string().allow(null).description('Category of the first result'),
          resultCategory2ExternalId: Joi.string().allow(null).description('Category of the second result'),
          workflowStatus: Joi.object()
            .description('Current workflow status of the result')
            .keys({
              changedOn: Joi.date().description('Date of the latest change to the workflow status'),
              createdOn: Joi.date().description('Date of creation of the workflow status'),
              externalId: Joi.string().description('External ID of the workflow status'),
              i18nKey: Joi.string().description('i18nKey ID of the workflow status'),
              name: Joi.string().description('Name of the workflow status'),
              reason: Joi.string().description('Reason for the latest workflow status change').allow(null, ''),
              setDelivered: Joi.boolean()
                .optional()
                .allow(null)
                .description('Tells if the record was updated manually'),
            }),
          treatmentStatus: Joi.object()
            .allow(null)
            .description('Current treatment status of the result')
            .keys({
              changedOn: Joi.date().description('Date of the latest change to the treatment status').allow(null),
              externalId: Joi.string().description('External ID of the treatment status').allow(null),
              i18nKey: Joi.string().description('i18nKey ID of the treatment status').allow(null),
              name: Joi.string().description('Name of the treatment status').allow(null),
            }),
          patientData: Joi.object().allow(null).description('Data about the patient'),
          resultData: Joi.object().allow(null).description('Data about the result'),
          sampleOriginSiteId: Joi.number().allow(null).description('Sample Origin Site Id for the patient'),
          firstViewedOn: Joi.date().allow(null).description('date when result first viewed'),
          sample: Joi.object()
            .description('The sample that the result is based on')
            .keys({
              id: Joi.string().allow(null).description('ID of the sample'),
              originSite: Joi.object()
                .allow(null)
                .description('The site where the sample was taken')
                .keys({
                  externalId: Joi.string().description('ID of the site'),
                  name: Joi.string().description('Name of the site'),
                }),
            }),
          followUps: Joi.array()
            .description('Result Follow Ups')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Result follow up ID'),
                externalId: Joi.string().allow(null, '').description('External ID of the follow up'),
                date: Joi.date().allow(null).description('When the follow up started'),
                createdOn: Joi.date().required().description('When the follow up was first created in Aspect'),
                updatedOn: Joi.date().required().description('When the follow up was last updated in Aspect'),
                followUpExternalId: Joi.string().required().description('External ID of the follow up'),
                followUpName: Joi.string().required().description('Name of the follow up'),
                followUpi18nKey: Joi.string().required().description('Translation key for the follow up'),
                followUpTypeName: Joi.string().required().description('Name of the follow up type'),
                followUpTypeExternalId: Joi.string().required().description('External ID of the follow up type'),
                followUpTypei18nKey: Joi.string().required().description('Translation key for the follow up type'),
              })
            ),
          comments: Joi.array()
            .allow(null)
            .description('Result comments')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Result comment ID'),
                text: Joi.string().allow(null, '').description('Comment text'),
                createdOn: Joi.date().required().description('When comment was first created'),
                createdBy: Joi.string().allow(null, '').description('Who added comment'),
                changedOn: Joi.date().required().description('When the comment was last updated'),
                changedBy: Joi.string().allow(null, '').description('Who changed comment'),
                noteType: Joi.string().allow(null, '').description('Type of comment'),
              })
            ),
          // transfer result
          reportableSiteName: Joi.string()
            .allow('', null)
            .description('The name of reportable site, differ from siteName when transferred'),
          transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
          transferredBy: Joi.string().allow(null).description('Who transferred result to another clinic'),
          resultStatusLogId: Joi.number()
            .allow(null)
            .integer()
            .positive()
            .description('The id of last entry in ResultStatusLog for current result'),
          reportableSiteId: Joi.number().allow(null).description('Reportable siteId of the patient'),
        })
      ),
  })
}

const downloadResultValidationV2 = () => {
  return {
    minUpdatedOn: Joi.date().iso().allow(null).description('Updated From Date'),
    diseaseExternalIds: Joi.string().allow(null).optional().description('A csv of the diseases external ID'),
    maxUpdatedOn: Joi.date().iso().allow(null).description('Updated To Date'),
    patientSample: Joi.string()
      .optional()
      .description(
        'Is the string for look for the patient. this string could be the patient id, the sample id or the patient name'
      ),
    assayExternalIds: Joi.string().optional().description('a csv string with the assay externalId'),
    resultCategories: Joi.string().optional().description('an array with the assay type abbreviation'),
    workflowStatus: Joi.string().optional().description('External Id of the workflow status'),
    treatmentStatus: Joi.string().optional().description('External Id of the treatment status'),
    deviceType: Joi.string().optional().description('External Id Device type, the default value is CepheidGeneXpert'),
    isTransferred: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
    ...validateSortPageParams('updatedOn'),
  }
}

const downloadResultResponseValidationV2 = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    total: Joi.number().required().description('The total number of results that match the given filters'),
    awaitingTreatment: Joi.number().required().description('The total number of awaiting treatments'),
    length: Joi.number().required().description('The number of results included in this response'),
    offset: Joi.number().required().description('Current page number'),
    pages: Joi.number().required().description('Total number of pages'),
    nextPage: Joi.number().allow(false).description('Next page to call for more records'),
    hasNext: Joi.bool().allow(false).description('If there is next page then it will be true else it will be false'),
    data: Joi.array()
      .required()
      .description('The results')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
          externalId: Joi.string().required().description('Unique ID of the result for this diagnostic device'),
          endedOn: Joi.date()
            .required()
            .description(
              'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
            ),
          updatedOn: Joi.date()
            .required()
            .description(
              'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
            ),
          assayExternalId: Joi.string().required().description('Unique ID of the Assay'),
          diseaseName: Joi.string().allow('', null).description('Disease name'),
          diseaseExternalId: Joi.string().allow('', null).required().description('Unique ID of the disease'),
          siteName: Joi.string()
            .required()
            .description('Name of the site where the device was located when the sample was processed'),
          deviceName: Joi.string().required().description('Name of the device'),
          resultCategory1ExternalId: Joi.string().allow(null).description('Category of the first result'),
          resultCategory2ExternalId: Joi.string().allow(null).description('Category of the second result'),
          workflowStatus: Joi.object()
            .description('Current workflow status of the result')
            .keys({
              changedOn: Joi.date().description('Date of the latest change to the workflow status'),
              createdOn: Joi.date().description('Date of creation of the workflow status'),
              externalId: Joi.string().description('External ID of the workflow status'),
              i18nKey: Joi.string().description('i18nKey ID of the workflow status'),
              name: Joi.string().description('Name of the workflow status'),
              reason: Joi.string().description('Reason for the latest workflow status change').allow(null, ''),
              setDelivered: Joi.boolean()
                .optional()
                .allow(null)
                .description('Tells if the record was updated manually'),
            }),
          treatmentStatus: Joi.object()
            .allow(null)
            .description('Current treatment status of the result')
            .keys({
              changedOn: Joi.date().description('Date of the latest change to the treatment status').allow(null),
              externalId: Joi.string().description('External ID of the treatment status').allow(null),
              i18nKey: Joi.string().description('i18nKey ID of the treatment status').allow(null),
              name: Joi.string().description('Name of the treatment status').allow(null),
              visible: Joi.boolean().description('External ID of the treatment status').allow(null),
              severity: Joi.string().description('External ID of the treatment status').allow(null),
              daysInCurrentStatus: Joi.string().description('External ID of the treatment status').allow(null),
            }),
          patientData: Joi.object().allow(null).description('Data about the patient'),
          testId: Joi.string().allow(null).description('Patient Id'),
          resultData: Joi.object().allow(null).description('Data about the result'),
          sampleOriginSiteId: Joi.number().allow(null).description('Sample Origin Site Id for the patient'),
          firstViewedOn: Joi.date().allow(null).description('date when result first viewed'),
          sample: Joi.object()
            .description('The sample that the result is based on')
            .keys({
              id: Joi.string().allow(null).description('ID of the sample'),
              originSite: Joi.object()
                .allow(null)
                .description('The site where the sample was taken')
                .keys({
                  externalId: Joi.string().description('ID of the site'),
                  name: Joi.string().description('Name of the site'),
                }),
            }),
          followUps: Joi.array()
            .description('Result Follow Ups')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Result follow up ID'),
                externalId: Joi.string().allow(null, '').description('External ID of the follow up'),
                date: Joi.date().allow(null).description('When the follow up started'),
                createdOn: Joi.date().required().description('When the follow up was first created in Aspect'),
                updatedOn: Joi.date().required().description('When the follow up was last updated in Aspect'),
                followUpExternalId: Joi.string().required().description('External ID of the follow up'),
                followUpName: Joi.string().required().description('Name of the follow up'),
                followUpi18nKey: Joi.string().required().description('Translation key for the follow up'),
                followUpTypeName: Joi.string().required().description('Name of the follow up type'),
                followUpTypeExternalId: Joi.string().required().description('External ID of the follow up type'),
                followUpTypei18nKey: Joi.string().required().description('Translation key for the follow up type'),
              })
            ),
          testInformation: Joi.array()
            .description('Test information list')
            .items(
              Joi.object().keys({
                label: Joi.string().allow(null, '').description('Test label'),
                labelI18nKey: Joi.string().required().description('Test label key').allow(null),
                value: Joi.string().required().description('Test result value').allow(null, ''),
                valueI18nKey: Joi.string().required().description('Test result value key').allow(null, ''),
                severity: Joi.string().description('Severity of the test'),
              })
            ),
          comments: Joi.array()
            .allow(null)
            .description('Result comments')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Result comment ID'),
                text: Joi.string().allow(null, '').description('Comment text'),
                createdOn: Joi.date().required().description('When comment was first created'),
                createdBy: Joi.string().allow(null, '').description('Who added comment'),
                changedOn: Joi.date().required().description('When the comment was last updated'),
                changedBy: Joi.string().allow(null, '').description('Who changed comment'),
                noteType: Joi.string().allow(null, '').description('Type of comment'),
              })
            ),
          // transfer result
          reportableSiteName: Joi.string()
            .allow('', null)
            .description('The name of reportable site, differ from siteName when transferred'),
          transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
          transferredBy: Joi.string().allow(null).description('Who transferred result to another clinic'),
          resultStatusLogId: Joi.number()
            .allow(null)
            .integer()
            .positive()
            .description('The id of last entry in ResultStatusLog for current result'),
          reportableSiteId: Joi.number().allow(null).description('Reportable siteId of the patient'),
          assayAvatar: Joi.object()
            .description('The assay avatar')
            .keys({
              contentI18nKey: Joi.string().allow(null).description('Translation key for the content text'),
              contentText: Joi.string().allow(null).description('Name of the content text'),
              backgroundColour: Joi.string().allow(null).description('Background color code'),
              foregroundColour: Joi.string().allow(null).description('Foreground color code'),
              contentIcon: Joi.string().allow(null).description('Icon of content'),
            }),
        })
      ),
  })
}

module.exports = {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
}
