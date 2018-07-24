const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const Promise = require('bluebird')

const { getUser } = require('../../src/auth/service')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { processDynamicMessage } = require('../../src/stringTemplate/service')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { getAccessToken } = require('../utils/authUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Dashboard routes', () => {
  const path = '/api/dashboard/summary'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of stat dashboard widget objects', done => {
      server
        .get(`${path}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 4)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'icon')
          assert.property(res.body.data[0], 'title')
          assert.property(res.body.data[0], 'titleI18nKey')
          assert.property(res.body.data[0], 'subTitle')
          assert.property(res.body.data[0], 'subTitleI18nKey')
          assert.property(res.body.data[0], 'link')
          assert.property(res.body.data[0], 'count')
          done()
        })
    })

    it('should return a list of target dashboard widget objects', done => {
      server
        .get(`${path}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          done()
        })
    })

    describe('/dashboard/action', () => {
      const actionDashboardPath = '/api/dashboard/action'

      async function lookUpUserActions(username, knex, query = {}) {
        const user = await getUser(username)
        const dataConstraints = await getConstraints({ name: username })

        const { jobFunctionName } = await knex('JobFunction as jf')
          .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
          .innerJoin('Person as ps', 'j.personId', 'ps.id')
          .where({
            'ps.userId': user.id,
            'jf.partnerId': user.partnerId,
          })
          .first('jf.name as jobFunctionName')
        const isAdmin = jobFunctionName === 'Admin'
        const isRegionalOfficer = jobFunctionName === 'Regional Officer'

        const alertMessages = await knex('AlertMessage as am')
          .innerJoin('MessageStatus as ms', 'am.messageStatusId', 'ms.id')
          .innerJoin('Notification as n', 'am.id', 'n.alertMessageId')
          .innerJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
          .innerJoin('Issue as i', 'n.issueId', 'i.id')
          .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
          .innerJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
          .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
          .innerJoin(
            'IssueStatusSeverity as iss',
            'is.issueStatusSeverityId',
            'iss.id'
          )
          .innerJoin('Site as s', 'am.siteId', 's.id')
          .where({ 'ms.externalId': 'Sent' })
          .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
          .modify((queryBuilder, query) => {
            if (!isAdmin) {
              queryBuilder.where({ 'am.personId': user.personId })
            }
            if (query.siteId) {
              queryBuilder.where({ 'am.siteId': query.siteId })
            }
            if (isAdmin || isRegionalOfficer) {
              // If specific lab selected, show LU issues, otherwise show RO
              queryBuilder.where(
                'nt.name',
                query.siteId == null ? 'not like' : 'like',
                'LU%'
              )
            }
          }, query)
          .select(
            'am.id',
            'am.siteId',
            'am.deviceId',
            'am.resultId',
            'am.message',
            's.name as siteName',
            'i.id as issueId',
            'is.name as status',
            'is.i18nKey as statusI18nKey',
            'is.sortOrder as issueStatusSortOrder',
            'iss.externalId as issueStatusSeverityExternalId',
            'it.name as issueType',
            'it.externalId as issueTypeExternalId',
            'it.i18nKey as issueTypeI18nKey',
            'ic.externalId as issueCategory',
            'ic.i18nKey as issueCategoryI18nKey',
            'nt.name as notificationType',
            'nt.level as notificationTypeLevel',
            'nt.canAcknowledge'
          )
        const alertMessagesByIssue = _.map(
          _.values(_.groupBy(alertMessages, 'issueId')),
          issueMessages =>
            _.head(_.orderBy(issueMessages, 'notificationTypeLevel', 'desc'))
        )

        // TODO do not hardcode inventory item lookup
        // this is here to always show inventory in action
        // list for all devices assigned to the user, even
        // if there are currently no triggered errors since
        // the user can update stock levels at any time
        const inventoryItems = await knex('Site as s')
          .leftJoin('InventoryItem as ii', 'ii.siteId', 's.id')
          .leftJoin('Consumable as c', 'ii.consumableId', 'c.id')
          .modify(addConstraints, dataConstraints, { site: 's' })
          .modify((queryBuilder, query) => {
            if (query.siteId) {
              queryBuilder.where({ 's.id': query.siteId })
            }
          }, query)
          .groupBy('s.id', 'c.id')
          .select(
            's.id as siteId',
            's.name as siteName',
            'c.id as consumableId',
            knex.raw('coalesce(sum(ii.quantityOnHand), 0) as totalInStock')
          )

        // FIXME: Replace always loading the ID for GeneXpert cartridges by adding consumable ID to the AlertMessage table and adding it to the query above
        const { id: defaultConsumableId } = await knex('Consumable')
          .where('name', 'GeneXpert TB Cartridge')
          .first()

        // set consumable id, totalIn Stock on StockInHand issues
        const inventoryItemsBySite = _.groupBy(inventoryItems, 'siteId')
        const results = _.map(alertMessagesByIssue, alertMessage => {
          alertMessage.message = processDynamicMessage(alertMessage.message)
          // TODO we should not be using notification type name
          // as a constant, as it could be user editable in the future
          alertMessage.notificationType = _.camelCase(
            alertMessage.notificationType
          )
          if (
            alertMessage.siteId &&
            alertMessage.issueTypeExternalId === 'StockLevelUpdate' &&
            inventoryItemsBySite[alertMessage.siteId]
          ) {
            const [inventoryItem] = inventoryItemsBySite[alertMessage.siteId]
            alertMessage.totalInStock =
              inventoryItem == null ? 0 : inventoryItem.totalInStock
            alertMessage.consumableId =
              inventoryItem == null ? null : inventoryItem.consumableId
            delete inventoryItemsBySite[alertMessage.siteId]
          }
          if (alertMessage.consumableId == null) {
            alertMessage.consumableId = defaultConsumableId
          }
          return alertMessage
        })

        // Add consumables by site that aren't in issues
        _.forEach(
          inventoryItemsBySite,
          ([{ siteId, siteName, totalInStock, consumableId }]) => {
            results.push({
              // ID is needed in UI to distinquish table rows
              id: `stocklevel_${siteId}`,
              siteId,
              deviceId: null,
              resultId: null,
              message: 'Stock Level',
              siteName,
              issueId: null,
              status: 'OK',
              statusI18nKey: 'issueStatusOk',
              issueStatusSortOrder: 5,
              issueStatusSeverityExternalId: 'Low',
              issueType: 'Stock Level Update',
              issueTypeExternalId: 'StockLevelUpdate',
              issueTypeI18nKey: 'stockLevelUpdateIssue',
              issueCategory: 'ReagentHealth',
              issueCategoryI18nKey: 'issueCategoryReagentHealth',
              notificationType: 'luStockLevelUpdate',
              canAcknowledge: 0,
              totalInStock,
              consumableId:
                consumableId != null ? consumableId : defaultConsumableId,
            })
          }
        )

        return _.flowRight(
          x => _.groupBy(x, 'issueCategory'),
          query.sortDir === 'desc' ? _.reverse : _.identity,
          x => _.sortBy(x, query.sortCol || _.identity),
          x =>
            _.map(x, result => {
              // TODO remove quick patch for StockLevelUpdate status
              if (result.issueTypeExternalId === 'StockLevelUpdate') {
                if (result.totalInStock <= 0) {
                  result.status = 'Active'
                  result.statusI18nKey = 'issueStatusActive'
                  result.issueStatusSortOrder = 0
                  result.issueStatusSeverityExternalId = 'High'
                } else {
                  result.status = 'OK'
                  result.statusI18nKey = 'issueStatusOk'
                  result.issueStatusSortOrder = 5
                  result.issueStatusSeverityExternalId = 'Low'
                }
              }
              return result
            })
        )(results)
      }

      async function lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
        username,
        password,
        knex,
        query = {}
      ) {
        const userActionByCategory = await lookUpUserActions(
          username,
          knex,
          query
        )
        const authAccessToken = await getAccessToken(username, password)

        const actionDashboardData = await server
          .get(actionDashboardPath)
          .query(query)
          .set('Authorization', `Bearer ${authAccessToken}`)
          .then(res => res.body.data)

        expect(actionDashboardData).to.containSubset(userActionByCategory)
        expect(
          _.get(actionDashboardData, 'ConnectivityHealth', [])
        ).to.have.lengthOf(
          _.get(userActionByCategory, 'ConnectivityHealth', []).length
        )
        expect(_.get(actionDashboardData, 'DeviceHealth', [])).to.have.lengthOf(
          _.get(userActionByCategory, 'DeviceHealth', []).length
        )
        expect(
          _.get(actionDashboardData, 'ReagentHealth', [])
        ).to.have.lengthOf(
          _.get(userActionByCategory, 'ReagentHealth', []).length
        )
        expect(_.get(actionDashboardData, 'DataHealth', [])).to.have.lengthOf(
          _.get(userActionByCategory, 'DataHealth', []).length
        )
        if (query.siteId) {
          _.get(actionDashboardData, 'ConnectivityHealth', []).forEach(alert =>
            expect(alert.siteId).to.equal(query.siteId)
          )
          _.get(actionDashboardData, 'DeviceHealth', []).forEach(alert =>
            expect(alert.siteId).to.equal(query.siteId)
          )
          _.get(actionDashboardData, 'ReagentHealth', []).forEach(alert =>
            expect(alert.siteId).to.equal(query.siteId)
          )
          _.get(actionDashboardData, 'DataHealth', []).forEach(alert =>
            expect(alert.siteId).to.equal(query.siteId)
          )
        }
      }

      async function getSitesUnderUser(username, password) {
        const authAccessToken = await getAccessToken(username, password)

        return server
          .get('/api/site')
          .set('Authorization', `Bearer ${authAccessToken}`)
          .then(res => res.body.data)
      }

      describe('for Admin', () => {
        it("should return the highest level notification for all labs under admin's jurisdiction", async () =>
          runTestWithKnex(async knex =>
            lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
              'myanmar_admin',
              'test07',
              knex
            )
          ))

        it('should return the highest level notification for the selected lab', async () =>
          runTestWithKnex(async knex => {
            const sites = await getSitesUnderUser('myanmar_admin', 'test07')

            return Promise.each(sites, site =>
              lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
                'myanmar_admin',
                'test07',
                knex,
                { siteId: site.id }
              )
            )
          }))
      })

      describe('for Regional Officer', () => {
        it("should return the highest level notification for all labs under regional officer's jurisdiction", async () =>
          runTestWithKnex(async knex =>
            Promise.each(
              ['myanmar_ro1', 'myanmar_ro2', 'myanmar_ro3'],
              async regionalOfficerName =>
                lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
                  regionalOfficerName,
                  regionalOfficerName,
                  knex
                )
            )
          ))

        it('should return the highest level notification for the selected lab', async () =>
          runTestWithKnex(async knex =>
            Promise.each(
              ['myanmar_ro1', 'myanmar_ro2', 'myanmar_ro3'],
              async regionalOfficerName => {
                const sites = await getSitesUnderUser(
                  regionalOfficerName,
                  regionalOfficerName
                )

                return Promise.each(sites, site =>
                  lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
                    'myanmar_admin',
                    'test07',
                    knex,
                    { siteId: site.id }
                  )
                )
              }
            )
          ))
      })

      describe('for Lab User', () => {
        it('should return the lab user level alerts for the lab', async () =>
          runTestWithKnex(async knex =>
            Promise.each(
              ['myanmar_lab1', 'myanmar_lab2', 'myanmar_lab3'],
              async labUserName =>
                lookUpUserActionsAndCheckThatTheyMatchActionDashboardResponse(
                  labUserName,
                  labUserName,
                  knex
                )
            )
          ))
      })
    })
  })
})
