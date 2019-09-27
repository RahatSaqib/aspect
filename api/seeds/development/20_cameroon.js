module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')

const utils = require('../utils')
const { seedCheckTbAppWebHook } = require('../utils_cameroon')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { commonInserts } = require('../common')

module.exports = require('../utils').seed(seed, __filename)

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'cm_admin',
    password: bcrypt.hashSync('Cameroon123', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Cameroon',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'cameroon',
  })

  await commonInserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [
        {
          abbreviation: 'CR',
          name: 'Cameroon',
          a3: 'CMR',
          culture: 'FR',
          countryCode: '237',
          stateLabel: 'Region',
          lgaLabel: 'Division',
          timezone: 'W. Central Africa Standard Time',
          portNumber: 3029,
          exportColumns:
            'DeploymentDescription|TestEndedOn|AssayName|AssayVersion|User|Result1|Result2|ResultText|PatientId|ReagentLotID|ExpirationDate|CartridgeSerial|ModuleSerial|SoftwareVersion|ErrorCode|ErrorCategory|ErrorDescription|SampleId|Notes|ProbeDCt|ProbeCCt|ProbeECt|ProbeBCt|Qc1Ct|Qc2Ct',
          inventoryDaysThreshold: 21,
          monthStartsOnDay: 1,
          states: [
            {
              name: 'Nord-Ouest',
              lgas: [
                {
                  name: 'Boyo',
                },
                {
                  name: 'Bui',
                },
                {
                  name: 'Donga-Mantung',
                },
                {
                  name: 'Menchum',
                },
                {
                  name: 'Mezam',
                },
                {
                  name: 'Momo',
                },
                {
                  name: 'Ngo-Ketunjia',
                },
              ],
            },
          ],
        },
      ],
    },
    'CM',
    'fkhrolf5kovl5ynya44h'
  )

  // Grant access to sites
  // Reuse previously seeded "static" data
  const { id: permissionSiteAdminId } = await knex('Permission')
    .where('module', 'site')
    .where('activity', 'admin')
    .first('id')

  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .first('id')

  if (
    !(await knex('JobFunctionPermission')
      .where('jobFunctionId', jobFunctionIdAdmin)
      .where('permissionId', permissionSiteAdminId))
  ) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionSiteAdminId,
      },
    ])
  }

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  await seedCheckTbAppWebHook(knex, { partnerId, auditFields })
}
