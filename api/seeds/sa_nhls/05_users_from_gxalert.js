module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')

const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const existingUser = await knex('User')
    .where('name', 'sergio.carmona@nhls.ac.za')
    .first()
  if (existingUser) {
    return
  }

  const { id: partnerId } = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first('id')

  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where({ name: 'Admin', partnerId })
    .first('id')
  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({ name: 'Regional Officer', partnerId })
    .first('id')
  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({ name: 'Lab User', partnerId })
    .first('id')

  /* Generated With:
SELECT
    CONCAT(
    '{personName:''', IFNULL(person.Name, ''),
    ''',jobFunctionId:', CASE WHEN role.token IN ('admin', 'national') THEN 'jobFunctionIdAdmin' WHEN role.token IN ('state', 'lga') THEN 'jobFunctionIdRegionalOfficer' ELSE 'jobFunctionIdLabUser' END,
    ',emailAddress:', CASE WHEN person.Email IS NOT NULL THEN CONCAT('''', person.Email, '''') ELSE 'null' END,
    CASE WHEN my_aspnet_users.Name IS NULL THEN ',username:null,password:null' ELSE CONCAT(
    ',username:''', my_aspnet_users.Name,
    ''',password:''', SUBSTR(MD5(CONCAT(person.Name, my_aspnet_users.Name)), 1, 10), '''') END,
    ',mobile:', CASE WHEN person.Cell IS NOT NULL THEN CONCAT('''', REPLACE(person.Cell, ' ', ''), '''') ELSE 'null' END,
    ',tags:[', CASE WHEN tag.Title IS NULL THEN ''
                      WHEN GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%EID+%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%VL>50%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50'
                          THEN CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), ''',''EID+'',''HIV-VL>50''')
                      WHEN GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%EID+%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%VL>50%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+'
                          THEN CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), ''',''EID+''')
                      WHEN GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%EID+%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%VL>50%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50'
                          THEN CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), ''',''HIV-VL>50''')
                      WHEN GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%EID+%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'EID+,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,EID+'
                          THEN CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), ''',''EID+''')
                      WHEN GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') LIKE '%VL>50%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE 'HIV-VL>50,%'
                           AND GROUP_CONCAT(DISTINCT tag.Title SEPARATOR ',') NOT LIKE '%,HIV-VL>50'
                          THEN CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), ''',''HIV-VL>50''')
                      ELSE CONCAT('''', GROUP_CONCAT(DISTINCT tag.Title ORDER BY tag.Title ASC SEPARATOR ''','''), '''')
                 END,
    '],stateName:',  CASE WHEN state.Name IS NOT NULL THEN CONCAT('''', state.Name, '''') ELSE 'null' END,
    ',lgaName:',  CASE WHEN lga.Name IS NOT NULL THEN CONCAT('''', lga.Name, '''') ELSE 'null' END,
    ',deploymentShortName:',  CASE WHEN deployment.Description IS NOT NULL THEN CONCAT('''', deployment.Description, '''') WHEN deployment.HostId IS NOT NULL THEN CONCAT('''', deployment.HostId, '''') ELSE 'null' END,
    ',timezone:''', IFNULL(person.TimeZoneId, ''),
    ''',culture:''', IFNULL(person.Culture, ''),
    ''',title:', CASE WHEN Person.Title  IS NOT NULL THEN CONCAT('''', Person.Title , '''') ELSE 'null' END,
    ',hidePatientId:', CASE WHEN person.HidePatientId = 1 THEN 'true' ELSE 'false' END,
    ',hideSampleId:', CASE WHEN person.HideSampleId = 1 THEN 'true' ELSE 'false' END,
    ',hideNotes:', CASE WHEN person.HideNotes = 1 THEN 'true' ELSE 'false' END, '}') AS personObject
FROM country
JOIN person ON person.CountryId = country.CountryId
JOIN role ON role.RoleId = person.RoleId
LEFT JOIN my_aspnet_users ON my_aspnet_users.id = person.UserId
LEFT JOIN state ON state.StateId = person.StateId
LEFT JOIN lga ON lga.LgaId = person.LgaId
LEFT JOIN persondeployment ON persondeployment.PersonId = person.PersonId
LEFT JOIN deployment ON deployment.DeploymentId = person.DeploymentId OR deployment.DeploymentId = persondeployment.DeploymentId
LEFT JOIN tagperson ON tagperson.PersonId = person.PersonId
LEFT JOIN tag ON tag.TagId = tagperson.TagId
WHERE country.Name = 'South Africa NHLS'
AND person.PersonId NOT IN (4705, 4703, 4349, 4922)
GROUP BY person.PersonId
*/
  const saNhlsStaff = [
    {
      personName: 'Sergio Carmona',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'sergio.carmona@nhls.ac.za',
      username: 'sergio.carmona@nhls.ac.za',
      password: 'e243cd1ae9',
      mobile: '+27114898496',
      tags: [
        'EID+',
        'EID+CHBAH',
        'EID+CMJAH',
        'EID+KPTH',
        'EID+RMMCH',
        'HIV-VL>50',
        'VL>50CHBAH',
        'VL>50CMJAH',
        'VL>50KPTH',
        'VL>50RMMCH',
      ],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Dr',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Sonjiha Khan',
      jobFunctionId: jobFunctionIdLabUser,
      emailAddress: 'sonjiha.khan@wits.ac.za',
      username: null,
      password: null,
      mobile: '+27795024672',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: 'RMMCH',
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Lab Contact',
      hidePatientId: true,
      hideSampleId: true,
      hideNotes: true,
    },
    {
      personName: 'Ms Ntaoleng Moreko',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: 'ntaolengmoreko@gmail.com',
      username: null,
      password: null,
      mobile: '+27739023780',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'NICD',
      hidePatientId: true,
      hideSampleId: true,
      hideNotes: true,
    },
    {
      personName: 'Dr. Thomas',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27829296310',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Doctor',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Nakwa',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27724140622',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Sono',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27829222441',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Seake',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27783936743',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Sepeng',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27824394027',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Ontdongo',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27795148681',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Ntuli',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27733359191',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Paeds',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Van Kwawegen',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27832750107',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Matron Nomusa Ramela',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27725514491',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Mary Adam',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27721800036',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'O&G',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Philiswa Mlandu',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27826692783',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Ahmad Haeri',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'ahmadh@nicd.ac.za',
      username: 'ahmadh@nicd.ac.za',
      password: '1e8bac51d8',
      mobile: '+27826428609',
      tags: [
        'EID+',
        'EID+CHBAH',
        'EID+CMJAH',
        'EID+KPTH',
        'EID+RMMCH',
        'HIV-VL>50',
        'VL>50CHBAH',
        'VL>50CMJAH',
        'VL>50KPTH',
        'VL>50RMMCH',
      ],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Sr Moipone Piliso',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'moipone.piliso@wits.ac.za',
      username: 'moipone.piliso@wits.ac.za',
      password: '19753210ea',
      mobile: '+27834345688',
      tags: [
        'EID+',
        'EID+CHBAH',
        'EID+CMJAH',
        'EID+KPTH',
        'EID+RMMCH',
        'HIV-VL>50',
        'VL>50CHBAH',
        'VL>50CMJAH',
        'VL>50KPTH',
        'VL>50RMMCH',
      ],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Study Coordinator',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Natasha Gous',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'ngous@systemone.id',
      username: 'ngous@systemone.id',
      password: 'e53b42841b',
      mobile: '+27828299006',
      tags: [],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Dr',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Karl Technau',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: 'karltechnau@gmail.com',
      username: null,
      password: null,
      mobile: '+27826873633',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Senior Doctor Paeditric  HIV Department',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Kate Braithwaite',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27722070358',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Medical Officer Paeds HIV dept',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Ebrahim Bera',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27767886888',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Obstetric Consultant',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Fortein',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27828831991',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Obstetric Medical Officer',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Loshnee Nair',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27827576666',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Paediatric Consultant',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Tracy Turner',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27848051365',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Paediatric Registrar',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Auréllie Mukendi',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'aureliem@nicd.ac.za',
      username: 'aureliem@nicd.ac.za',
      password: 'f54b8ba50f',
      mobile: '+27817524959',
      tags: [
        'EID+',
        'EID+CHBAH',
        'EID+CMJAH',
        'EID+KPTH',
        'EID+RMMCH',
        'HIV-VL>50',
        'VL>50CHBAH',
        'VL>50CMJAH',
        'VL>50KPTH',
        'VL>50RMMCH',
      ],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Research Assistant',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Bahle Matrose',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27781639062',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Phlebotomist',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Lerato Mthombeni',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27825926204',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'NICD',
      hidePatientId: true,
      hideSampleId: true,
      hideNotes: true,
    },
    {
      personName: 'Dr. Coceka Mnyani',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: 'nandipha.mnyani@gmail.com',
      username: null,
      password: null,
      mobile: '+27824919203',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Gynae and Obstets Consultant',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Natalie Odell',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27829033418',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Gynae and Obstets',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Felicia Molokoane',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27833684995',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Gynae and Obstets Consultant',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Derisha Pillay',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27825083744',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Kalafong Paeds Consultant',
      hidePatientId: true,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Meera Ooka',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+270726037070',
      tags: ['EID+RMMCH', 'VL>50RMMCH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Coronationville',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Paeds',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Natasha Davies',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27829077581',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Adult ARV clinic',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Sr Beverly Letsoalo',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27837379763',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'PCR Coordinator',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Vuyelwa Baba',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27823254230',
      tags: ['EID+CHBAH', 'VL>50CHBAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Diepkloof ',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'O&G',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Khosi Ngobesi',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27726049019',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Prof Nicolette du Plessis',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27729545480',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Khomotso Masemola',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27723477244',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Marike Boersema',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27824421579',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Valerie Vannevel',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27729988704',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Debbie Vaz',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27826346206',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dr. Sonia Hitchcock',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27825795057',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Gayle Sherman',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'gayles@nicd.ac.za',
      username: 'gayles@nicd.ac.za',
      password: 'f0781cc81c',
      mobile: null,
      tags: [],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Tanya Murray',
      jobFunctionId: jobFunctionIdAdmin,
      emailAddress: 'tanyaymurray@gmail.com',
      username: 'tanyaymurray@gmail.com',
      password: '04fe6f2ac9',
      mobile: null,
      tags: [],
      stateName: null,
      lgaName: null,
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Lerato Mthombeni',
      jobFunctionId: jobFunctionIdLabUser,
      emailAddress: 'shivlera@yahoo.com',
      username: null,
      password: null,
      mobile: '+27825926204',
      tags: [],
      stateName: null,
      lgaName: null,
      deploymentShortName: 'CMJAH',
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Lab Contact',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Veronica Mphaphuli',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27069967719',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Neonatology',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Yoliswa magadla',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+270836957059',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Neonatology',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Tanusha Ramdin',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+270823324242',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'Neonatology',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Dalubuhle Ndiweni',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+270834604792',
      tags: ['EID+CMJAH', 'VL>50CMJAH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Parktown',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: 'General paeds/HIV clinic',
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
    {
      personName: 'Nkele Selepe',
      jobFunctionId: jobFunctionIdRegionalOfficer,
      emailAddress: null,
      username: null,
      password: null,
      mobile: '+27832944504',
      tags: ['EID+KPTH', 'VL>50KPTH', 'EID+', 'HIV-VL>50'],
      stateName: 'Gauteng',
      lgaName: 'Kalafong',
      deploymentShortName: null,
      timezone: 'South Africa Standard Time',
      culture: 'en',
      title: null,
      hidePatientId: false,
      hideSampleId: false,
      hideNotes: false,
    },
  ]

  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const southAfricaCountry = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .first('c.id', 'c.culture', 'c.timezone')
  const { id: countryId } = southAfricaCountry
  const southAfricaProvinces = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const southAfricaDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = southAfricaProvinces.reduce(
    (provinceMemo, province) => {
      provinceMemo[province.name.toLowerCase()] = province
      const provinceDistricts = _.filter(southAfricaDistricts, {
        stateName: province.name,
      })
      if (provinceDistricts) {
        provinceMemo[
          province.name.toLowerCase()
        ].districts = provinceDistricts.reduce((districtMemo, district) => {
          districtMemo[district.name.toLowerCase()] = district
          return districtMemo
        }, {})
      }
      return provinceMemo
    },
    {}
  )

  const siteIds = await knex('Geography as g')
    .join('Site as s', 'g.id', 's.geographyId')
    .where('g.countryId', countryId)
    .select('s.id', 's.shortName')
    .distinct('s.id', 's.shortName')
    .reduce((siteMap, site) => {
      siteMap[site.shortName] = site.id
      return siteMap
    }, {})

  await Promise.each(saNhlsStaff, async person => {
    let userId = null
    if (person.username) {
      const pw = bcrypt.hashSync(person.password, saltRounds)
      const baseUserData = {
        password: pw,
        failedPasswordAttempts: 0,
        legacyPassword: 1,
        lockedOut: 0,
      }
      ;[userId] = await knex('User').insert({
        name: person.username,
        approved: 1,
        createdOn: now,
        ...baseUserData,
      })
    }

    const province = person.stateName
      ? provincesByName[person.stateName.toLowerCase()] || {
          id: null,
          districts: {},
        }
      : {
          id: null,
          districts: {},
        }
    const district =
      province.districts && person.lgaName
        ? province.districts[person.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: geographyId } = await knex('Geography')
      .where({
        countryId,
        stateId: province.id,
        lgaId: district.id,
      })
      .first()

    const [personId] = await knex('Person').insert({
      name: person.personName,
      timezone: person.timezone,
      culture: person.culture,
      geographyId,
      title: person.title,
      email: person.emailAddress,
      cell: person.mobile,
      userId,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      hidePatientId: person.hidePatientId,
      hideSampleId: person.hideSampleId,
      hideNotes: person.hideNotes,
      ...auditFields,
    })

    if (!_.isEmpty(person.tags)) {
      const tagsInDatabase = await knex('Tag')
        .whereIn('title', person.tags)
        .andWhere('partnerId', partnerId)
        .select()
      const tagsToInsert = _.filter(
        _.uniq(person.tags),
        tagTitle => !_.some(tagsInDatabase, { title: tagTitle })
      )
      await Promise.each(tagsToInsert, async tagToInsert => {
        const [tagId] = await knex('Tag').insert({
          title: tagToInsert,
          partnerId,
        })
        tagsInDatabase.push({
          id: tagId,
          title: tagToInsert,
          partnerId,
        })
      })

      const personTagsInDatabase = await knex('PersonTag').where(
        'personId',
        personId
      )
      const tagsToAppendToPerson = _.filter(
        tagsInDatabase,
        tagInDatabase =>
          !_.some(personTagsInDatabase, { tagId: tagInDatabase.id })
      )
      return Promise.each(tagsToAppendToPerson, async tag =>
        knex('PersonTag').insert({ tagId: tag.id, personId })
      )
    }
    const [jobId] = await knex('Job').insert({
      personId,
      jobFunctionId: person.jobFunctionId,
    })
    if (person.jobFunctionId === jobFunctionIdLabUser) {
      await knex('JobContext').insert({
        jobId,
        siteId: siteIds[person.deploymentShortName],
      })
    } else {
      await knex('JobContext').insert({ jobId, geographyId })
    }
  })
}
