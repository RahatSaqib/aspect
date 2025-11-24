const Joi = require('@hapi/joi')
const { validateSortPageParams } = require('../../../routes')

// download result - v1
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
    treatmentStatus: Joi.string().optional().description('External Id of the treatment status'),
    deviceType: Joi.string().optional().description('External Id Device type, the default value is CepheidGeneXpert'),
    isTransferred: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
    ...validateSortPageParams('updatedOn'),
  }
}

// download result response - v1
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
                followUpTypeI18nKey: Joi.string().required().description('Translation key for the follow up type'),
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

// download result - v2
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
    treatmentStatus: Joi.string().optional().description('External Id of the treatment status'),
    deviceType: Joi.string().optional().description('External Id Device type, the default value is CepheidGeneXpert'),
    isTransferred: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
    ...validateSortPageParams('updatedOn'),
  }
}

// download result response - v2
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
          testId: Joi.string().allow(null).description('Patient ID/Sample ID'),
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
                followUpTypeI18nKey: Joi.string().required().description('Translation key for the follow up type'),
              })
            ),
          // clinical response
          clinicalResponse: {
            recorded: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
            confirmedOn: Joi.date()
              .allow(null)
              .description('Date & time that checkbox was checked, if not checked, return null'),
            treatment: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
            treatmentStarted: Joi.date().allow(null).description('When result was transferred to another clinic'),
            outcome: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
            outcomeOccurred: Joi.date().allow(null).description('When result was transferred to another clinic'),
          },
          // test information
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
          testType: Joi.object()
            .required()
            .keys({
              i18nKey: Joi.string().description('Test type key'),
              text: Joi.string().description('Test type text'),
            }),
          transferred: Joi.string()
            .allow(null)
            .description('The result has transferred to another clinic, probable value : Here or Away'),
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
              backgroundColor: Joi.string().allow(null).description('Background color code'),
              foregroundColor: Joi.string().allow(null).description('Foreground color code'),
              contentIcon: Joi.string().allow(null).description('Icon of content'),
            }),
        })
      ),
  })
}

const baseResultResponse = {
  id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
  deviceName: Joi.string().allow(null, '').description('Filter for device name'),
  sampleId: Joi.string().allow(null, '').description('Sample id'),
  externalId: Joi.string().allow(null, '').description('Unique ID of the result for this diagnostic device'),
  startedOn: Joi.date()
    .allow(null)
    .description(
      'When sample processing started. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
    ),
  endedOn: Joi.date()
    .allow(null)
    .description(
      'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
    ),
  stateName: Joi.string().allow(null, '').description("The device's state name"),
  resultCategory1Name: Joi.string().allow(null, '').description("The result's category 1 name"),
  resultCategory2Name: Joi.string().allow(null, '').description("The result's category 2 name"),
  siteName: Joi.string().allow(null, '').description('The name of the site'),
  assayId: Joi.number().integer().description('The id of the assay'),
  sampleOriginSiteName: Joi.string().allow(null, '').description('Sample original site name'),
  patientId: Joi.string().allow(null, '').description('The patient Id'),
  treatmentStatusInfo: Joi.string().allow(null, '').description('treatment status info'),
  errorCode: Joi.string().allow(null, '').description('If an error occurred, contains the error code from the device'),
  caseExternalId: Joi.string().optional().allow(null, '').description('The id of the case'),
  diseaseId: Joi.number().positive().allow(null).required().description('the Id of the disease'),
  diseaseName: Joi.string().required().allow(null).description('the name of the disease'),
  diseaseExternalId: Joi.string().required().allow(null).description('the external id of the disease'),

  detectedResistance: Joi.alternatives()
    .try(Joi.string(), Joi.array())
    .optional()
    .allow(null, '')
    .description('CSV with detected resistances'),

  partnerId: Joi.number().allow(null).description('The Partner Id'),
  partnerPluginName: Joi.string().allow(null, '').description('Plugin name for Partner'),
  deviceTypePluginName: Joi.string().allow(null, '').description('Plugin name for Device'),
  customFieldsValues: Joi.array().allow(null).description('Custom Fields Values'),
}

const validateResultDetailResponse = () => {
  return {
    ...baseResultResponse,

    createdOn: Joi.date()
      .required()
      .description('When the result was added to the Aspect database. This can be converted to the user time zone.'),
    updatedOn: Joi.date()
      .required()
      .description(
        'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
      ),
    deviceId: Joi.number().integer().positive().required().description('Device id in aspect'),
    deviceTypeId: Joi.number().integer().positive().allow(null).description('The id of the deviceType'),
    deviceSerial: Joi.string().allow(null, '').description('The device serial number'),
    countryName: Joi.string().description("The device's country name"),
    stateId: Joi.number().integer().positive().allow(null).description('The id of the state'),
    stateName: Joi.string().allow(null, '').description("The device's state name"),
    lgaName: Joi.string().allow(null, '').description("The device's lga name"),
    resultCategory1: Joi.number().integer().positive().allow(null).description('Value of ResultCategory1'),
    resultCategory2: Joi.number().integer().positive().allow(null).description('Value of ResultCategory1'),
    resultCategory1Name: Joi.string().allow(null, '').description("The result's category 1 name"),
    resultCategory2Name: Joi.string().allow(null, '').description("The result's category 2 name"),
    resultData: Joi.object().description('The result data'),
    files: Joi.array().description('Result Files'),
    formData: Joi.object().allow(null).description('The form data'),
    siteId: Joi.number().integer().positive().description('The id of the site'),
    resultTreatmentStatusCreatedBy: Joi.string()
      .allow(null, '')
      .description('The name of the user that created the note'),
    siteName: Joi.string().allow(null, '').description('The name of the site'),
    assayVersion: Joi.string().allow(null, '').description('The assay Version'),
    assayName: Joi.string().allow(null, '').description('The assay name'),
    consumableSerial: Joi.string().allow(null, '').description('The consumable serial'),
    instrumentalSerial: Joi.string().allow(null, '').description('The instrumental serial'),
    consumableLot: Joi.string().allow(null, '').description('The consumable lot'),
    instrumentSerial: Joi.string().allow(null, '').description('Instrumental serial number'),
    moduleName: Joi.string().allow(null, '').description('The module name'),
    moduleSerial: Joi.string().allow(null, '').description('The module serial'),
    researchId: Joi.string().allow(null, '').description('The research id'),
    senderVersion: Joi.string().allow(null, '').description('The sender version'),
    senderOperator: Joi.string().allow(null, '').description('The sender operator'),
    consumableExpirationDate: Joi.date().allow(null).description('The consumable expiration date'),
    notes: Joi.string().allow(null, '').description('Any notes entered for the sample'),
    errorCode: Joi.string()
      .allow(null, '')
      .description('If an error occurred, contains the error code from the device'),
    errorNotes: Joi.string().allow(null, '').description('Contains any details about the error'),
    assayId: Joi.number().integer().description('The id of the assay'),
    sampleOriginSiteId: Joi.number().allow(null).integer().description('the id of the original site'),
    sampleId: Joi.string().allow(null, '').description('Sample id'),
    sampleGroup: Joi.string().allow(null, '').description('Sample group'),
    sampleCollectedOn: Joi.date().allow(null).description('The date when the sample has been collected'),
    sampleOriginSiteName: Joi.string().allow(null, '').description('Sample original site name'),
    sampleTypeName: Joi.string().allow(null, '').description('Sample type name'),
    sampleTypeId: Joi.number().integer().positive().allow(null).description('Sample type Id'),
    patientId: Joi.string().allow(null, '').description('The patient Id'),
    patientData: Joi.object().allow(null).description('The patient data'),
    assay: Joi.object().allow(null).description('The assay object'),
    assayType: Joi.string().allow(null, '').description("The type of the result's assay"),
    deviceType: Joi.string().allow(null, '').description("The type of the result's device"),
    resultText: Joi.string().allow(null, '').description('The result represented in text format'),
    fullResultText: Joi.string().allow(null, '').description('The full result represented in text format'),
    resultCategory1Label: Joi.string()
      .allow(null, '')
      .description('The name of the test made for the first result category'),
    resultCategory2Label: Joi.string()
      .allow(null, '')
      .description('The name of the test made for the second result category'),
    treatmentStatus: Joi.object().allow(null).description('The treatment status object'),
    resultTreatmentStatusChangedOn: Joi.date()
      .allow(null)
      .description('ChangedOn date from the latest ResultTreatmentStatusLog'),
    resultTreatmentStatusCreatedOn: Joi.date()
      .allow(null)
      .description('CreatedOn date from the latest ResultTreatmentStatusLog'),
    resultTreatmentStatusId: Joi.number().allow(null).description('ID of the result treatment status'),
    resultTreatmentMethod: Joi.string().allow(null, '').description('Method from latest ResultTreatmentWorkflowLog'),
    resultTreatmentStatus: Joi.string().allow(null, '').description('ExternalId of the result treatment status'),
    treatmentStatusInfo: Joi.string().allow(null, '').description('treatment status info'),
    resultTreatmentData: Joi.string().allow(null, '').description('Operator from latest ResultTreatmentWorkflowLog'),
    resultNotes: Joi.array().description('List of result notes'),
    requiresTreatment: Joi.number()
      .allow(null, '')
      .description('Indicates if the result category and assay require treatment'),
    patientCaseId: Joi.number().allow(null).optional().description('Case ID for the result.'),
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
          followUpTypeI18nKey: Joi.string().required().description('Translation key for the follow up type'),
        })
      ),
    // transfer result
    reportableSiteId: Joi.number()
      .allow(null)
      .integer()
      .positive()
      .description('The id of reportable site, differ from siteId when transferred'),
    reportableSiteName: Joi.string()
      .allow(null, '')
      .description('The name of reportable site, differ from siteName when transferred'),
    transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
    firstViewedOn: Joi.date().allow(null).description('When transferred result was clicked'),
    transferredBy: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
    resultStatusLogId: Joi.number()
      .allow(null)
      .integer()
      .positive()
      .description('The id of last entry in ResultStatusLog for current result'),
    canEdit: Joi.number().allow(null).description("Is the result's assay configured to allow editing of results?"),
    canDelete: Joi.number().allow(null).description("Is the result's assay configured to allow deleting of results?"),
    resultSourceExternalId: Joi.string()
      .required() // resultSourceId is NOT NULL in Result table
      .description('External ID of the result source'),
    clinicalResponse: {
      recorded: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
      confirmedOn: Joi.date()
        .allow(null)
        .description('Date & time that checkbox was checked, if not checked, return null'),
      treatment: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      treatmentStarted: Joi.date().allow(null).description('When result was transferred to another clinic'),
      outcome: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      outcomeOccurred: Joi.date().allow(null).description('When result was transferred to another clinic'),
    },
  }
}

// add clinicalResponse params - v1
const addClinicalResponseParamValidation = () => {
  return {
    resultId: Joi.number().required().integer().positive().description('Result ID'),
  }
}

// add clinicalResponse payload - v1
const addClinicalResponsePayloadValidation = () => {
  return Joi.array().items(
    Joi.object().keys({
      fieldName: Joi.string().when('fieldType', {
        is: 'custom-field',
        then: Joi.string().required(),
        otherwise: Joi.string()
          .valid(
            'confirmed',
            'treatment',
            'treatmentOccurred',
            'outcome',
            'outcomeOccurred',
            'followUpNotPossible',
            'followUpNotPossibleReason'
          )
          .description(
            'Optional either confirmed, treatment, treatmentOccurred, outcome, outcomeOccurred, followUpNotPossible or followUpNotPossibleReason.'
          ),
      }),
      fieldType: Joi.string()
        .valid('custom-field')
        .optional()
        .description('When set to custom-field, allows any string value for fieldName'),
      formDefinitionExternalId: Joi.string()
        .when('fieldType', {
          is: 'custom-field',
          then: Joi.string().required(),
          otherwise: Joi.string().optional(),
        })
        .description('Required when fieldType is custom-field, specifies which form definition this field belongs to'),
      value: [
        Joi.bool()
          .required()
          .description('The boolean value of whether the result has been confirmed or the follow up is not possible'),
        Joi.string()
          .allow('', null)
          .description(
            'The external ID of the follow up or the free text reason/explanation for why a follow up is not possible'
          ),
        Joi.date()
          .required()
          .allow('', null)
          .iso()
          .description('The date/time value when fieldName is treatmentOccurred or outcomeOccurred'),
        Joi.number().description('Numeric value for custom fields'),
      ],
      clientTime: Joi.date()
        .iso()
        .optional()
        .allow('', null)
        .description('This is the local time when the follow up was recorded'),
    })
  )
}

// add clinicalResponse response - v1
const addClinicalResponseResultValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    data: Joi.object().required().description('The results').keys(validateResultDetailResponse()),
  })
}

module.exports = {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
  addClinicalResponseParamValidation,
  addClinicalResponsePayloadValidation,
  addClinicalResponseResultValidation,
}
