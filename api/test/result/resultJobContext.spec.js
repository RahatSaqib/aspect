const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const { createResult } = require('./result_utils')
const server = require('../utils/testUtils')

const { assert } = chai

describe('Result route Job constraints', () => {
  const path = '/api/result'
  const partnerName = 'Partner One'
  const withinLastXDays = 30
  const resultIdsToRemove = []

  after(async () => {
    await Promise.each(resultIdsToRemove, async resultId => knex('Result').where('id', resultId).del())
  })

  describe('Assay based', () => {
    const bdMgitDeviceTypeExternalId = 'BDMGIT'
    const assayBdMgitGndAssayExternalId = 'assayBdMgitGnd'
    const bdMgitGndClinicianUsername = 'mgit_gnd_clinician'
    const bdMgitGndClinicianPassword = 'mgit-gnd-clinician-pass'
    let bdMgitGndClinicianUserId
    let bdMgitGndClinicianAuthAccessToken

    const daktariVirologyDeviceTypeExternalId = 'DaktariVirology'
    const assayDaktariHivVlExternalId = 'DaktariHivVL'
    const daktariHivVlClinicianUsername = 'dak_vl_clinician'
    const daktariHivVlClinicianPassword = 'vl-vl-clinician-pass'
    let daktariHivVlClinicianUserId
    let daktariHivVlClinicianAuthAccessToken

    const geneXpertDeviceTypeExternalId = 'CepheidGeneXpert'
    const assayGxEbolaExternalId = 'GxEbola'

    const gxEbolaClinicianUsername = 'gx_ebola_clinician'
    const gxEbolaClinicianPassword = 'gx-ebola-clinician-pass'
    let gxEbolaClinicianUserId
    const bothAssaysClinicianUsername = 'both_assay_clinician'
    const bothAssaysClinicianPassword = 'both-assay-clinician-pass'
    let bothAssaysClinicianUserId
    let bothAssaysClinicianAuthAccessToken

    before(async () => {
      shared.checkToken(server, path)
      const { id: partnerId } = await knex('Partner').where('name', partnerName).first('id')
      const otherUserId = (await knex('User').where('name', '<>', 'admin').first('id')).id
      await Promise.each(_.range(0, 15), async () => {
        resultIdsToRemove.push(
          await createResult(
            partnerId,
            bdMgitDeviceTypeExternalId,
            'Sputum',
            assayBdMgitGndAssayExternalId,
            otherUserId,
            {},
            {},
            false,
            withinLastXDays
          )
        )
      })
      bdMgitGndClinicianUserId = await createUser(
        partnerName,
        'US',
        bdMgitGndClinicianUsername,
        bdMgitGndClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayBdMgitGndAssayExternalId,
          },
        ]
      )
      bdMgitGndClinicianAuthAccessToken = await getAccessToken(bdMgitGndClinicianUsername, bdMgitGndClinicianPassword)

      await Promise.each(_.range(0, 15), async () => {
        resultIdsToRemove.push(
          await createResult(
            partnerId,
            daktariVirologyDeviceTypeExternalId,
            'Plasma',
            assayDaktariHivVlExternalId,
            otherUserId,
            {},
            {},
            false,
            withinLastXDays
          )
        )
      })
      daktariHivVlClinicianUserId = await createUser(
        partnerName,
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

      await Promise.each(_.range(0, 15), async () => {
        resultIdsToRemove.push(
          await createResult(
            partnerId,
            geneXpertDeviceTypeExternalId,
            'DBS',
            assayGxEbolaExternalId,
            otherUserId,
            {},
            {},
            false,
            withinLastXDays
          )
        )
      })
      gxEbolaClinicianUserId = await createUser(partnerName, 'US', gxEbolaClinicianUsername, gxEbolaClinicianPassword, [
        {
          jobFunctionExternalId: 'clinician',
          assayExternalId: assayGxEbolaExternalId,
        },
      ])
      gxEbolaClinicianAuthAccessToken = await getAccessToken(gxEbolaClinicianUsername, gxEbolaClinicianPassword)
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
      await removeUser(bdMgitGndClinicianUserId)
      await removeUser(daktariHivVlClinicianUserId)
      await removeUser(gxEbolaClinicianUserId)
      await removeUser(bothAssaysClinicianUserId)
    })

    it("should constrain results returned based on the user's job context", async () => {
      const bdMgitUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bdMgitGndClinicianAuthAccessToken}`)
      assert.equal(bdMgitUserResultsResponse.status, 200)
      assert.typeOf(bdMgitUserResultsResponse.body, 'Object')
      assert.property(bdMgitUserResultsResponse.body, 'data')
      assert.typeOf(bdMgitUserResultsResponse.body.data, 'array')
      assert.equal(bdMgitUserResultsResponse.body.data.length, 0)
      assert.typeOf(bdMgitUserResultsResponse.body.extraColumns, 'array')

      const daktariHivVlUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${daktariHivVlClinicianAuthAccessToken}`)
      assert.equal(daktariHivVlUserResultsResponse.status, 200)
      assert.typeOf(daktariHivVlUserResultsResponse.body, 'Object')
      assert.property(daktariHivVlUserResultsResponse.body, 'data')
      assert.typeOf(daktariHivVlUserResultsResponse.body.data, 'array')
      assert.isAtLeast(daktariHivVlUserResultsResponse.body.data.length, 1)
      const { name: daktariHivVlAssayName } = await knex('Assay')
        .where('externalId', assayDaktariHivVlExternalId)
        .first()
      daktariHivVlUserResultsResponse.body.data.forEach(result => {
        assert.equal(result.assayName, daktariHivVlAssayName)
      })
      assert.typeOf(daktariHivVlUserResultsResponse.body.extraColumns, 'array')

      const { name: gxEbolaAssayName } = await knex('Assay').where('externalId', assayGxEbolaExternalId).first()
      const bothAssaysUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bothAssaysClinicianAuthAccessToken}`)
      assert.equal(bothAssaysUserResultsResponse.status, 200)
      assert.typeOf(bothAssaysUserResultsResponse.body, 'Object')
      assert.property(bothAssaysUserResultsResponse.body, 'data')
      assert.typeOf(bothAssaysUserResultsResponse.body.data, 'array')
      bothAssaysUserResultsResponse.body.data.forEach(result => {
        assert.include([gxEbolaAssayName, daktariHivVlAssayName], result.assayName)
      })
      assert.typeOf(bothAssaysUserResultsResponse.body.extraColumns, 'array')
    })
  })

  describe('Mixed disease and site based', () => {
    const daktariVirologyDeviceTypeExternalId = 'DaktariVirology'
    const assayDaktariHivVlExternalId = 'DaktariHivVL'
    const diseaseHivExternalId = 'hiv'
    const geneXpertDeviceTypeExternalId = 'CepheidGeneXpert'
    const assayGxCovid19ExternalId = 'assayGXCovid19'
    const diseaseCovid19ExternalId = 'covid19'

    const bothAssaysClinicianUsername = 'both_disease_clinician'
    const bothAssaysClinicianPassword = 'both-disease-clinician-pass'
    let bothDiseasesClinicianUserId
    let bothDiseasesClinicianAuthAccessToken
    let hivSiteExternalId
    let covid19SiteExternalId

    before(async () => {
      shared.checkToken(server, path)
      const { id: partnerId } = await knex('Partner').where('name', partnerName).first('id')
      const otherUserId = (await knex('User').where('name', '<>', 'admin').first('id')).id
      await Promise.each(_.range(0, 15), async () => {
        resultIdsToRemove.push(
          await createResult(
            partnerId,
            daktariVirologyDeviceTypeExternalId,
            'DBS',
            assayDaktariHivVlExternalId,
            otherUserId,
            {},
            {},
            false,
            withinLastXDays
          )
        )
      })
      ;({ externalId: hivSiteExternalId } = await knex('Disease as d')
        .join('AssayType as at', 'd.id', 'at.diseaseId')
        .join('Assay as a', 'at.id', 'a.assayTypeId')
        .join('Result as r', 'a.id', 'r.assayId')
        .join('Site as rs', 'r.reportableSiteId', 'rs.id')
        .where('d.externalId', diseaseHivExternalId)
        .first('rs.externalId'))
      await Promise.each(_.range(0, 15), async () => {
        resultIdsToRemove.push(
          await createResult(
            partnerId,
            geneXpertDeviceTypeExternalId,
            'Plasma',
            assayGxCovid19ExternalId,
            otherUserId,
            {},
            {},
            false,
            withinLastXDays
          )
        )
      })
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

    after(async () => removeUser(bothDiseasesClinicianUserId))

    it("should constrain results returned based on the user's job context", async () => {
      const { name: diseaseHivName } = await knex('Disease').where('externalId', diseaseHivExternalId).first()
      const { name: diseaseCovid19Name } = await knex('Disease').where('externalId', diseaseCovid19ExternalId).first()
      const bothDiseasesUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bothDiseasesClinicianAuthAccessToken}`)
      assert.equal(bothDiseasesUserResultsResponse.status, 200)
      assert.typeOf(bothDiseasesUserResultsResponse.body, 'Object')
      assert.property(bothDiseasesUserResultsResponse.body, 'data')
      assert.typeOf(bothDiseasesUserResultsResponse.body.data, 'array')
      assert.isAtLeast(bothDiseasesUserResultsResponse.body.data.length, 5)
      await Promise.each(bothDiseasesUserResultsResponse.body.data, async result => {
        assert.include([diseaseHivName, diseaseCovid19Name], result.diseaseName)
        const { reportableSiteExternalId, diseaseExternalId } = await knex('Result as r')
          .join('Site as rs', 'r.reportableSiteId', 'rs.id')
          .join('Assay as a', 'r.assayId', 'a.id')
          .join('AssayType as at', 'a.assayTypeId', 'at.id')
          .join('Disease as dis', 'at.diseaseId', 'dis.id')
          .where('r.id', result.id)
          .first('rs.externalId as reportableSiteExternalId', 'dis.externalId as diseaseExternalId')
        const expectedReportableSiteExternalId =
          result.diseaseName === diseaseHivName ? hivSiteExternalId : covid19SiteExternalId
        assert.equal(
          reportableSiteExternalId,
          expectedReportableSiteExternalId,
          `The user can see a ${diseaseExternalId} result from ${reportableSiteExternalId} when they only have permissions to view ${diseaseHivExternalId} results from ${hivSiteExternalId} and ${diseaseCovid19ExternalId} results from ${covid19SiteExternalId}`
        )
      })
      assert.typeOf(bothDiseasesUserResultsResponse.body.extraColumns, 'array')
    })
  })
})
