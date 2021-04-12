const chai = require('chai')
const Promise = require('bluebird')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result route Job constraints', () => {
  const path = '/api/result'

  describe('Assay based', () => {
    shared.checkToken(server, path)
    const assayBdMgitGndAssayExternalId = 'assayBdMgitGnd'
    const bdmgitGndClinicianUsername = 'mgit_gnd_clinician'
    const bdmgitGndClinicianPassword = 'mgit-gnd-clinician-pass'
    let bdmgitGndClinicianUserId
    let bdmgitGndClinicianAuthAccessToken

    const assayDaktariHivVlExternalId = 'DaktariHivVL'
    const daktariHivVlClinicianUsername = 'dak_vl_clinician'
    const daktariHivVlClinicianPassword = 'vl-vl-clinician-pass'
    let daktariHivVlClinicianUserId
    let daktariHivVlClinicianAuthAccessToken

    const assayGxEbolaExternalId = 'GxEbola'

    const gxEbolaClinicianUsername = 'gx_ebola_clinician'
    const gxEbolaClinicianPassword = 'gx-ebola-clinician-pass'
    let gxEbolaClinicianUserId
    let gxEbolaClinicianAuthAccessToken

    const bothAssaysClinicianUsername = 'both_assay_clinician'
    const bothAssaysClinicianPassword = 'both-assay-clinician-pass'
    let bothAssaysClinicianUserId
    let bothAssaysClinicianAuthAccessToken

    before(async () => {
      bdmgitGndClinicianUserId = await createUser(
        'Partner One',
        'US',
        bdmgitGndClinicianUsername,
        bdmgitGndClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayBdMgitGndAssayExternalId,
          },
        ]
      )
      bdmgitGndClinicianAuthAccessToken = await getAccessToken(
        bdmgitGndClinicianUsername,
        bdmgitGndClinicianPassword
      )

      daktariHivVlClinicianUserId = await createUser(
        'Partner One',
        'US',
        daktariHivVlClinicianUsername,
        daktariHivVlClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayDaktariHivVlExternalId,
          },
        ]
      )
      daktariHivVlClinicianAuthAccessToken = await getAccessToken(
        daktariHivVlClinicianUsername,
        daktariHivVlClinicianPassword
      )

      bothAssaysClinicianUserId = await createUser(
        'Partner One',
        'US',
        gxEbolaClinicianUsername,
        gxEbolaClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayGxEbolaExternalId,
          },
        ]
      )
      gxEbolaClinicianAuthAccessToken = await getAccessToken(
        gxEbolaClinicianUsername,
        gxEbolaClinicianPassword
      )
      bothAssaysClinicianUserId = await createUser(
        'Partner One',
        'US',
        bothAssaysClinicianUsername,
        bothAssaysClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayDaktariHivVlExternalId,
          },
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayGxEbolaExternalId,
          },
        ]
      )
      bothAssaysClinicianAuthAccessToken = await getAccessToken(
        bothAssaysClinicianUsername,
        bothAssaysClinicianPassword
      )
    })

    after(async () => {
      removeUser(bdmgitGndClinicianUserId)
      removeUser(daktariHivVlClinicianUserId)
      removeUser(gxEbolaClinicianUserId)
      removeUser(bothAssaysClinicianUserId)
    })

    it("should constrain results returned based on the user's job context", async () => {
      const mgitUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bdmgitGndClinicianAuthAccessToken}`)
      assert.equal(mgitUserResultsResponse.status, 200)
      assert.typeOf(mgitUserResultsResponse.body, 'Object')
      assert.property(mgitUserResultsResponse.body, 'data')
      assert.typeOf(mgitUserResultsResponse.body.data, 'array')
      assert.equal(mgitUserResultsResponse.body.data.length, 0)
      assert.property(mgitUserResultsResponse.body, 'total')
      assert.typeOf(mgitUserResultsResponse.body.extraColumns, 'array')

      const daktariHivVlUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${daktariHivVlClinicianAuthAccessToken}`)
      assert.equal(daktariHivVlUserResultsResponse.status, 200)
      assert.typeOf(daktariHivVlUserResultsResponse.body, 'Object')
      assert.property(daktariHivVlUserResultsResponse.body, 'data')
      assert.typeOf(daktariHivVlUserResultsResponse.body.data, 'array')
      assert.isAtLeast(daktariHivVlUserResultsResponse.body.data.length, 5)
      const { name: daktariHivVlAssayName } = await knex('Assay')
        .where('externalId', assayDaktariHivVlExternalId)
        .first()
      daktariHivVlUserResultsResponse.body.data.forEach(result => {
        assert.equal(result.assayName, daktariHivVlAssayName)
      })
      assert.property(daktariHivVlUserResultsResponse.body, 'total')
      assert.typeOf(daktariHivVlUserResultsResponse.body.extraColumns, 'array')

      const gxEbolaUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${gxEbolaClinicianAuthAccessToken}`)
      const { name: gxEbolaAssayName } = await knex('Assay')
        .where('externalId', assayGxEbolaExternalId)
        .first()
      assert.isAtLeast(gxEbolaUserResultsResponse.body.total, 1)
      const bothAssaysUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bothAssaysClinicianAuthAccessToken}`)
      assert.equal(bothAssaysUserResultsResponse.status, 200)
      assert.typeOf(bothAssaysUserResultsResponse.body, 'Object')
      assert.property(bothAssaysUserResultsResponse.body, 'data')
      assert.typeOf(bothAssaysUserResultsResponse.body.data, 'array')
      assert.equal(
        bothAssaysUserResultsResponse.body.total,
        daktariHivVlUserResultsResponse.body.total +
          gxEbolaUserResultsResponse.body.total
      )
      bothAssaysUserResultsResponse.body.data.forEach(result => {
        assert.include(
          [gxEbolaAssayName, daktariHivVlAssayName],
          result.assayName
        )
      })
      assert.property(bothAssaysUserResultsResponse.body, 'total')
      assert.typeOf(bothAssaysUserResultsResponse.body.extraColumns, 'array')
    })
  })

  describe('Mixed disease and site based', () => {
    shared.checkToken(server, path)
    const diseaseHivExternalId = 'hiv'
    const diseaseCovid19ExternalId = 'covid19'

    const bothAssaysClinicianUsername = 'both_disease_clinician'
    const bothAssaysClinicianPassword = 'both-disease-clinician-pass'
    let bothDiseasesClinicianUserId
    let bothDiseasesClinicianAuthAccessToken
    let hivSiteExternalId
    let covid19SiteExternalId

    before(async () => {
      ;({ externalId: hivSiteExternalId } = await knex('Disease as d')
        .join('AssayType as at', 'd.id', 'at.diseaseId')
        .join('Assay as a', 'at.id', 'a.assayTypeId')
        .join('Result as r', 'a.id', 'r.assayId')
        .join('Site as rs', 'r.reportableSiteId', 'rs.id')
        .where('d.externalId', diseaseHivExternalId)
        .first('rs.externalId'))
      ;({ externalId: covid19SiteExternalId } = await knex('Disease as d')
        .join('AssayType as at', 'd.id', 'at.diseaseId')
        .join('Assay as a', 'at.id', 'a.assayTypeId')
        .join('Result as r', 'a.id', 'r.assayId')
        .join('Site as rs', 'r.reportableSiteId', 'rs.id')
        .where('d.externalId', diseaseCovid19ExternalId)
        .first('rs.externalId'))
      bothDiseasesClinicianUserId = await createUser(
        'Partner One',
        'US',
        bothAssaysClinicianUsername,
        bothAssaysClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            diseaseExternalId: diseaseHivExternalId,
            siteExternalId: hivSiteExternalId,
          },
          {
            jobFunctionExternalId: 'clinician',
            diseaseExternalId: diseaseCovid19ExternalId,
            siteExternalId: covid19SiteExternalId,
          },
        ]
      )
      bothDiseasesClinicianAuthAccessToken = await getAccessToken(
        bothAssaysClinicianUsername,
        bothAssaysClinicianPassword
      )
    })

    after(async () => {
      removeUser(bothDiseasesClinicianUserId)
    })

    it("should constrain results returned based on the user's job context", async () => {
      const { name: diseaseHivName } = await knex('Disease')
        .where('externalId', diseaseHivExternalId)
        .first()
      const { name: diseaseCovid19Name } = await knex('Disease')
        .where('externalId', diseaseCovid19ExternalId)
        .first()
      const bothDiseasesUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bothDiseasesClinicianAuthAccessToken}`)
      assert.equal(bothDiseasesUserResultsResponse.status, 200)
      assert.typeOf(bothDiseasesUserResultsResponse.body, 'Object')
      assert.property(bothDiseasesUserResultsResponse.body, 'data')
      assert.typeOf(bothDiseasesUserResultsResponse.body.data, 'array')
      assert.isAtLeast(bothDiseasesUserResultsResponse.body.data.length, 5)
      await Promise.each(
        bothDiseasesUserResultsResponse.body.data,
        async result => {
          assert.include(
            [diseaseHivName, diseaseCovid19Name],
            result.diseaseName
          )
          const { reportableSiteExternalId, diseaseExternalId } = await knex(
            'Result as r'
          )
            .join('Site as rs', 'r.reportableSiteId', 'rs.id')
            .join('Assay as a', 'r.assayId', 'a.id')
            .join('AssayType as at', 'a.assayTypeId', 'at.id')
            .join('Disease as dis', 'at.diseaseId', 'dis.id')
            .where('r.id', result.id)
            .first(
              'rs.externalId as reportableSiteExternalId',
              'dis.externalId as diseaseExternalId'
            )
          const expectedReportableSiteExternalId =
            result.diseaseName === diseaseHivName
              ? hivSiteExternalId
              : covid19SiteExternalId
          assert.equal(
            reportableSiteExternalId,
            expectedReportableSiteExternalId,
            `The user can see a ${diseaseExternalId} result from ${reportableSiteExternalId} when they only have permissions to view ${diseaseHivExternalId} results from ${hivSiteExternalId} and ${diseaseCovid19ExternalId} results from ${covid19SiteExternalId}`
          )
        }
      )
      assert.property(bothDiseasesUserResultsResponse.body, 'total')
      assert.typeOf(bothDiseasesUserResultsResponse.body.extraColumns, 'array')
    })
  })
})
