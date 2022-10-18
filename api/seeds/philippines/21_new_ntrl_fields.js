module.exports = require('../utils').seed(seed, __filename)

const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')
const patientDataSchema = require('./fixtures/dataSchemas/patientDataSchema.json')
const tbLampResultDataSchema = require('../fixtures/AssayTbLampResultDataSchema.json')
const smearResultDataSchema = require('./fixtures/dataSchemas/smearResultDataSchema.json')
const lpaLampResultDataSchema = require('./fixtures/dataSchemas/lpaResultDataSchema.json')
const mtbRifResultDataSchema = require('./fixtures/dataSchemas/geneXpertResultDataSchemaMTBRif.json')
const AssayBdMgitAstResultDataSchema = require('../fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('../fixtures/AssayBdMgitGndResultDataSchema.json')
const resultSignOffResultDataSchema = require('./fixtures/dataSchemas/resultSignOffResultDataSchema.json')
const { upsertTbLampDeviceTypes } = require('../commonTBLamp')
const { updateAssayResultCategoryTreatmentEmphasize } = require('../utils')

async function seed(knex) {
  // TB LAMP Assays Data Schema Updates
  const { id: partnerId } = await knex('Partner').where('name', 'Philippines').first('id')
  const { id: deviceTypeId } = await knex('DeviceType').where('externalId', 'PhilippinesNtrl').first('id')
  await upsertTbLampDeviceTypes(knex, partnerId, deviceTypeId, patientDataSchema, {
    encodedResult: {
      list: false,
      type: 'object',
      order: 0,
      title: 'Encoded Result',
      properties: {
        ...tbLampResultDataSchema,
        verifiedBy: {
          type: 'string',
          title: 'Verified By',
        },
        notedBy: {
          type: 'string',
          title: 'Noted By',
        },
      },
    },
    ...resultSignOffResultDataSchema,
  })
  // SMEAR Assays Data Schema Updates
  await knex('Assay')
    .where('externalId', 'assaySmear')
    .update({
      resultDataSchema: JSON.stringify({
        ...smearResultDataSchema,
        ...resultSignOffResultDataSchema,
      }),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })

  // LPA Assays Data Schema Updates
  await knex('Assay')
    .where('externalId', 'assayLPA')
    .update({
      resultDataSchema: JSON.stringify({
        ...lpaLampResultDataSchema,
        ...resultSignOffResultDataSchema,
      }),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })

  // GeneXpert TB Assays Data Schema Updates
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra'],
    patientDataSchema,
    mtbRifResultDataSchema
  )

  // Culture Assays Data Schema Updates
  const ntrlDatabaseGenericCultureResultDataSchema = {
    encodedResult: {
      list: false,
      order: 0,
      type: 'object',
      title: 'Encoded Result',
      properties: {
        dateInoculated: {
          title: 'Date Inoculated',
          type: 'date',
          order: 0,
        },
        medTech: {
          title: 'Med Tech',
          type: 'string',
          order: 1,
        },
        resultStatus: {
          title: 'Result Status',
          type: 'string',
          order: 2,
        },
        dstStatus: {
          title: 'DST Status',
          type: 'string',
          order: 3,
        },
        methodUsed1: {
          title: 'Culture Method',
          type: 'string',
          order: 4,
        },
        result1: {
          title: 'Result 1',
          type: 'string',
          order: 5,
        },
        grade1: {
          title: 'Grade 1',
          type: 'string',
          order: 6,
        },
        methodUsed2: {
          title: 'Culture Method 2',
          type: 'string',
          order: 7,
        },
        result2: {
          title: 'Result 2',
          type: 'string',
          order: 8,
        },
        grade2: {
          title: 'Grade 2',
          type: 'string',
          order: 9,
        },
        result3: {
          title: 'Result 3',
          type: 'string',
          order: 10,
        },
        grade3: {
          title: 'Grade 3',
          type: 'string',
          order: 11,
        },
        finalResult: {
          title: 'Final Result',
          type: 'string',
          order: 12,
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
          order: 13,
        },
        dateReleased: {
          title: 'Date Released',
          type: 'date',
          order: 14,
        },
        encodedBy: {
          title: 'Encoded By',
          type: 'string',
          order: 15,
        },
        labTech: {
          title: 'Lab Tech',
          type: 'string',
          order: 16,
        },
        validatedBy: {
          title: 'Validated By',
          type: 'string',
          order: 17,
        },
        notedBy: {
          title: 'Noted By',
          type: 'string',
          order: 18,
        },
      },
    },
    ...JSON.parse(JSON.stringify(resultSignOffResultDataSchema)),
  }

  const ntrlDatabaseGenericDstResultDataSchema = {
    ...require('./fixtures/dataSchemas/dstResultDataSchema.json'),
    ...JSON.parse(JSON.stringify(resultSignOffResultDataSchema)),
  }

  await knex('Assay')
    .where('externalId', 'assayGenericCulture')
    .update({
      resultDataSchema: JSON.stringify(ntrlDatabaseGenericCultureResultDataSchema),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })
  await knex('Assay')
    .where('externalId', 'assayGenericDst')
    .update({
      resultDataSchema: JSON.stringify(ntrlDatabaseGenericDstResultDataSchema),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })

  // MGIT Assays Data Schema Updates
  const ntrlDatabaseMGITCultureResultDataSchema = {
    ...AssayBdMgitGndResultDataSchema,
    ...JSON.parse(JSON.stringify(ntrlDatabaseGenericCultureResultDataSchema)),
  }

  const maxOrderFromBdMgitGndResultDataSchema = Math.max(
    ...Object.values(AssayBdMgitGndResultDataSchema)
      .filter(mgitDataValue => typeof mgitDataValue.order !== 'undefined')
      .map(mgitDataValue => mgitDataValue.order)
  )
  ntrlDatabaseMGITCultureResultDataSchema.encodedResult.order = maxOrderFromBdMgitGndResultDataSchema + 1
  ntrlDatabaseMGITCultureResultDataSchema.resultSignOff.order = maxOrderFromBdMgitGndResultDataSchema + 2

  const ntrlDatabaseMGITDstResultDataSchema = {
    ...AssayBdMgitAstResultDataSchema,
    ...JSON.parse(JSON.stringify(ntrlDatabaseGenericDstResultDataSchema)),
  }
  const maxOrderFromBdMgitAstResultDataSchema = Math.max(
    ...Object.values(AssayBdMgitAstResultDataSchema)
      .filter(mgitDataValue => typeof mgitDataValue.order !== 'undefined')
      .map(mgitDataValue => mgitDataValue.order)
  )
  ntrlDatabaseMGITDstResultDataSchema.encodedResult.order = maxOrderFromBdMgitAstResultDataSchema + 1
  ntrlDatabaseMGITDstResultDataSchema.resultSignOff.order = maxOrderFromBdMgitAstResultDataSchema + 2

  await knex('Assay')
    .where('externalId', 'assayBdMgitGnd')
    .update({
      resultDataSchema: JSON.stringify(ntrlDatabaseMGITCultureResultDataSchema),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })
  await knex('Assay')
    .where('externalId', 'assayBdMgitAst')
    .update({
      resultDataSchema: JSON.stringify(ntrlDatabaseMGITDstResultDataSchema),
      patientDataSchema: JSON.stringify(patientDataSchema),
    })

  await updateAssayResultCategoryTreatmentEmphasize(knex)
}
