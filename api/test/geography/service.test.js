const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const sinon = require('sinon')
const { run } = require('../utils/generatorFunctionUtils')

describe('geography service', () => {
  const countriesStatesAndLGAs = [
    {
      countryId: 1,
      countryName: 'Nigeria',
      stateId: 1,
      stateName: 'Lagos',
      lgaId: 1,
      lgaName: 'Apapa',
    },
    {
      countryId: 1,
      countryName: 'Nigeria',
      stateId: 1,
      stateName: 'Lagos',
      lgaId: 2,
      lgaName: 'Mushin',
    },
    {
      countryId: 1,
      countryName: 'Nigeria',
      stateId: 1,
      stateName: 'Lagos',
      lgaId: 3,
      lgaName: 'Ojo',
    },
    {
      countryId: 1,
      countryName: 'Nigeria',
      stateId: 2,
      stateName: 'Ogun',
      lgaId: 4,
      lgaName: 'Ifo',
    },
    {
      countryId: 1,
      countryName: 'Nigeria',
      stateId: 2,
      stateName: 'Ogun',
      lgaId: 5,
      lgaName: 'Ipokia',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 4,
      stateName: 'Alabama',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 3,
      stateName: 'Alaska',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 6,
      stateName: 'Arizona',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 5,
      stateName: 'Arkansas',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 7,
      stateName: 'California',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 8,
      stateName: 'Colorado',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 9,
      stateName: 'Connecticut',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 11,
      stateName: 'Delaware',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 10,
      stateName: 'District of Columbia',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 12,
      stateName: 'Florida',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 13,
      stateName: 'Georgia',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 14,
      stateName: 'Hawaii',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 16,
      stateName: 'Idaho',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 17,
      stateName: 'Illinois',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 18,
      stateName: 'Indiana',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 15,
      stateName: 'Iowa',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 19,
      stateName: 'Kansas',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 20,
      stateName: 'Kentucky',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 21,
      stateName: 'Louisiana',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 23,
      stateName: 'Maine',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 22,
      stateName: 'Maryland',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 24,
      stateName: 'Massachusetts',
      lgaId: 6,
      lgaName: 'Franklin',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 24,
      stateName: 'Massachusetts',
      lgaId: 7,
      lgaName: 'Suffolk',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 25,
      stateName: 'Michigan',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 26,
      stateName: 'Minnesota',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 28,
      stateName: 'Mississippi',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 27,
      stateName: 'Missouri',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 29,
      stateName: 'Montana',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 32,
      stateName: 'Nebraska',
      lgaId: 9,
      lgaName: 'Gage',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 32,
      stateName: 'Nebraska',
      lgaId: 8,
      lgaName: 'Hall',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 32,
      stateName: 'Nebraska',
      lgaId: 10,
      lgaName: 'Lancaster',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 32,
      stateName: 'Nebraska',
      lgaId: 11,
      lgaName: 'Wayne',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 36,
      stateName: 'Nevada',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 33,
      stateName: 'New Hampshire',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 34,
      stateName: 'New Jersey',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 35,
      stateName: 'New Mexico',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 37,
      stateName: 'New York',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 30,
      stateName: 'North Carolina',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 31,
      stateName: 'North Dakota',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 39,
      stateName: 'Ohio',
      lgaId: 13,
      lgaName: 'Cuyahoga',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 39,
      stateName: 'Ohio',
      lgaId: 12,
      lgaName: 'Wayne',
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 38,
      stateName: 'Oklahoma',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 40,
      stateName: 'Oregon',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 41,
      stateName: 'Pennsylvania',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 42,
      stateName: 'Rhode Island',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 43,
      stateName: 'South Carolina',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 44,
      stateName: 'South Dakota',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 45,
      stateName: 'Tennessee',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 46,
      stateName: 'Texas',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 47,
      stateName: 'Utah',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 49,
      stateName: 'Vermont',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 48,
      stateName: 'Virginia',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 50,
      stateName: 'Washington',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 52,
      stateName: 'West Virginia',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 51,
      stateName: 'Wisconsin',
      lgaId: null,
      lgaName: null,
    },
    {
      countryId: 2,
      countryName: 'United States',
      stateId: 53,
      stateName: 'Wyoming',
      lgaId: null,
      lgaName: null,
    },
  ]
  let dbSpy
  let service

  beforeEach(() => {
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    service = proxyquire.noCallThru().load('../../src/geography/service', {
      '../db': dbSpy,
    })
  })

  afterEach(() => {
    dbSpy.query.restore()
  })

  describe('buildGeographySelectList', () => {
    beforeEach(() => {
      dbSpy.query
        .for('Get countries, states and LGAs for select lists')
        .resolvesWith(countriesStatesAndLGAs)
    })

    it('Should query the country, state and lga tables, sorting the results by country name, then state name, then lga name', () =>
      run(service.buildGeographySelectList)(() => {
        const countriesStatesAndLGAsQuery = dbSpy.query.withArgs(
          'Get countries, states and LGAs for select lists'
        ).lastCall.returnValue
        assert.equal(
          countriesStatesAndLGAsQuery.from.lastCall.args[0],
          'Country as c'
        )
        const leftJoins = countriesStatesAndLGAsQuery.leftJoin.getCalls()
        const statesLeftJoin = _.find(leftJoins, leftJoin =>
          _.isEqual(leftJoin.args, ['State as s', 's.id', 'g.stateId'])
        )
        assert.isOk(statesLeftJoin, "Can't find the join to the states table")
        const lgasLeftJoin = _.find(leftJoins, leftJoin =>
          _.isEqual(leftJoin.args, ['Lga as l', 'l.id', 'g.lgaId'])
        )
        assert.isOk(lgasLeftJoin, "Can't find the join to the LGAs table")
        assert.deepEqual(
          countriesStatesAndLGAsQuery.orderBy.lastCall.args,
          [['c.name', 's.name', 'l.name'], 'asc'],
          'The orderBy clause seems to be incorrect'
        )
        assert.deepEqual(
          countriesStatesAndLGAsQuery.select.lastCall.args,
          [
            'c.id as countryId',
            'c.name as countryName',
            's.id as stateId',
            's.name as stateName',
            'l.id as lgaId',
            'l.name as lgaName',
          ],
          'The select clause seems to be incorrect'
        )
      }))

    it('Should return a list of countries containing its nested states and LGAs', () =>
      run(service.buildGeographySelectList)(response => {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, countries)
      }))

    const countries = _.map(
      _.uniqBy(countriesStatesAndLGAs, 'countryId'),
      countryRecord => ({
        id: countryRecord.countryId,
        name: countryRecord.countryName,
        states: _.map(
          _.filter(
            _.uniqBy(countriesStatesAndLGAs, 'stateId'),
            stateRecord =>
              stateRecord.stateId &&
              stateRecord.countryId === countryRecord.countryId
          ),
          stateRecord => ({
            id: stateRecord.stateId,
            name: stateRecord.stateName,
            lgas: _.map(
              _.filter(
                _.uniqBy(countriesStatesAndLGAs, 'lgaId'),
                lgaRecord =>
                  lgaRecord.lgaId &&
                  lgaRecord.countryId === countryRecord.countryId &&
                  lgaRecord.stateId === stateRecord.stateId
              ),
              lgaRecord => ({
                id: lgaRecord.lgaId,
                name: lgaRecord.lgaName,
              })
            ),
          })
        ),
      })
    )
  })

  describe('countrySelectList', () => {
    describe('when no selected country or state is specified', () => {
      const countriesForSelectList = _.sortBy(
        _.uniqBy(
          _.map(countriesStatesAndLGAs, result => ({
            id: result.countryId,
            name: result.countryName,
          })),
          'id'
        ),
        'name'
      )

      beforeEach(() => {
        dbSpy.query
          .for('Get countries for select list')
          .resolvesWith(countriesForSelectList)
      })

      it('Should query the country table, sorting the results by country name', () =>
        run(service.countrySelectList, [{ params: {} }])(() => {
          const countryQuery = dbSpy.query.withArgs(
            'Get countries for select list'
          ).lastCall.returnValue
          assert.equal(countryQuery.from.lastCall.args[0], 'Country as c')
          assert.deepEqual(
            countryQuery.orderBy.lastCall.args,
            [['c.name'], 'asc'],
            'The orderBy clause seems to be incorrect'
          )
          assert.deepEqual(
            countryQuery.select.lastCall.args,
            ['c.id', 'c.name'],
            'The select clause seems to be incorrect'
          )
        }))

      it('Should return a list of countries', () =>
        run(service.countrySelectList, [{ params: {} }])(response => {
          assert.isTrue(response.ok)
          assert.deepEqual(response.data, countriesForSelectList)
        }))
    })

    describe('when a selected country is specified', () => {
      const selectedCountryId = 2
      const countriesForSelectList = _.sortBy(
        _.map(countriesStatesAndLGAs, result => ({
          countryId: result.countryId,
          countryName: result.countryName,
          stateId:
            selectedCountryId === result.countryId ? result.stateId : null,
          stateName:
            selectedCountryId === result.countryId ? result.stateName : null,
        })),
        ['countryName', 'stateName']
      )

      beforeEach(() => {
        dbSpy.query
          .for('Get countries and country states for select lists')
          .resolvesWith(countriesForSelectList)
      })

      it('Should query the country and state tables, sorting the results by country name and then state name', () =>
        run(service.countrySelectList, [
          { params: { countryId: selectedCountryId } },
        ])(() => {
          const countryQuery = dbSpy.query.withArgs(
            'Get countries and country states for select lists'
          ).lastCall.returnValue
          assert.equal(countryQuery.from.lastCall.args[0], 'Country as c')
          assert.equal(countryQuery.leftJoin.lastCall.args[0], 'State as s')

          const joinOnCallbackFunction = countryQuery.leftJoin.lastCall.args[1]
          const knexQueryBuilderSpy = {
            on: sinon.stub(),
          }
          const boundJoinOnCallbackFunction = joinOnCallbackFunction.bind(
            knexQueryBuilderSpy
          )
          knexQueryBuilderSpy.on.returns(knexQueryBuilderSpy)
          dbSpy.knex.raw.withArgs(2).returns(`${selectedCountryId}`)
          boundJoinOnCallbackFunction()
          assert.isOk(knexQueryBuilderSpy.on.calledTwice)
          assert.deepEqual(knexQueryBuilderSpy.on.firstCall.args, [
            's.id',
            'g.stateId',
          ])
          assert.deepEqual(knexQueryBuilderSpy.on.secondCall.args, [
            { 'g.countryId': `${selectedCountryId}` },
          ])

          assert.deepEqual(
            countryQuery.orderBy.lastCall.args,
            [['c.name', 's.name'], 'asc'],
            'The orderBy clause seems to be incorrect'
          )
          assert.deepEqual(
            countryQuery.distinct.lastCall.args,
            [
              'c.id as countryId',
              'c.name as countryName',
              's.id as stateId',
              's.name as stateName',
            ],
            'The select clause seems to be incorrect'
          )
        }))

      it("Should return a list of countries with the selected country's states populated", () => {
        const expectedCountries = _.map(
          _.uniqBy(countriesForSelectList, 'countryId'),
          countryRecord => ({
            id: countryRecord.countryId,
            name: countryRecord.countryName,
          })
        )
        const selectedCountry = _.find(expectedCountries, {
          id: selectedCountryId,
        })
        const selectedCountryStates = _.map(
          _.filter(
            countriesForSelectList,
            stateRecord => stateRecord.stateId != null
          ),
          stateRecord => ({
            id: stateRecord.stateId,
            name: stateRecord.stateName,
          })
        )
        selectedCountry.states = _.sortBy(selectedCountryStates, 'name')

        return run(service.countrySelectList, [
          { params: { countryId: selectedCountryId } },
        ])(response => {
          assert.isTrue(response.ok)
          assert.deepEqual(response.data, expectedCountries)
        })
      })
    })

    describe('when selected country and state are specified', () => {
      const selectedCountryId = 2
      const selectedStateId = 32
      const countriesForSelectList = _.sortBy(
        _.map(countriesStatesAndLGAs, result => ({
          countryId: result.countryId,
          countryName: result.countryName,
          stateId:
            selectedCountryId === result.countryId ? result.stateId : null,
          stateName:
            selectedCountryId === result.countryId ? result.stateName : null,
          lgaId: selectedStateId === result.stateId ? result.lgaId : null,
          lgaName: selectedStateId === result.stateId ? result.lgaName : null,
        })),
        ['countryName', 'stateName', 'lgaName']
      )

      beforeEach(() => {
        dbSpy.query
          .for('Get countries, country states and state LGAs for select lists')
          .resolvesWith(countriesForSelectList)
      })

      it('Should query the country, state and lga tables, sorting the results by country name, then state and then LGA name', () =>
        run(service.countrySelectList, [
          {
            params: { countryId: selectedCountryId, stateId: selectedStateId },
          },
        ])(() => {
          const countryQuery = dbSpy.query.withArgs(
            'Get countries, country states and state LGAs for select lists'
          ).lastCall.returnValue
          assert.equal(countryQuery.from.lastCall.args[0], 'Country as c')
          assert.isOk(countryQuery.leftJoin.calledTwice)
          assert.equal(countryQuery.leftJoin.firstCall.args[0], 'State as s')

          let knexQueryBuilderSpy = {
            on: sinon.stub(),
          }
          knexQueryBuilderSpy.on.returns(knexQueryBuilderSpy)
          const stateJoinOnCallbackFunction =
            countryQuery.leftJoin.firstCall.args[1]
          const boundStateJoinOnCallbackFunction = stateJoinOnCallbackFunction.bind(
            knexQueryBuilderSpy
          )
          dbSpy.knex.raw.withArgs(2).returns(`${selectedCountryId}`)
          boundStateJoinOnCallbackFunction()
          assert.isOk(knexQueryBuilderSpy.on.calledTwice)
          assert.deepEqual(knexQueryBuilderSpy.on.firstCall.args, [
            's.id',
            'g.stateId',
          ])
          assert.deepEqual(knexQueryBuilderSpy.on.secondCall.args, [
            { 'g.countryId': `${selectedCountryId}` },
          ])

          knexQueryBuilderSpy = {
            on: sinon.stub(),
          }
          knexQueryBuilderSpy.on.returns(knexQueryBuilderSpy)
          assert.equal(countryQuery.leftJoin.secondCall.args[0], 'Lga as l')
          const lgaJoinOnCallbackFunction =
            countryQuery.leftJoin.secondCall.args[1]
          const boundLgaJoinOnCallbackFunction = lgaJoinOnCallbackFunction.bind(
            knexQueryBuilderSpy
          )
          dbSpy.knex.raw.withArgs(32).returns(`${selectedStateId}`)
          boundLgaJoinOnCallbackFunction()
          assert.isOk(knexQueryBuilderSpy.on.calledTwice)
          assert.deepEqual(knexQueryBuilderSpy.on.firstCall.args, [
            'l.id',
            'g.lgaId',
          ])
          assert.deepEqual(knexQueryBuilderSpy.on.secondCall.args, [
            { 'g.stateId': `${selectedStateId}` },
          ])

          assert.deepEqual(
            countryQuery.orderBy.lastCall.args,
            [['c.name', 's.name', 'l.name'], 'asc'],
            'The orderBy clause seems to be incorrect'
          )
          assert.deepEqual(
            countryQuery.distinct.lastCall.args,
            [
              'c.id as countryId',
              'c.name as countryName',
              's.id as stateId',
              's.name as stateName',
              'l.id as lgaId',
              'l.name as lgaName',
            ],
            'The select clause seems to be incorrect'
          )
        }))

      it("Should return a list of countries with the selected country's states populated and the selected state's LGAs populated", () => {
        const expectedCountries = _.map(
          _.uniqBy(countriesForSelectList, 'countryId'),
          countryRecord => ({
            id: countryRecord.countryId,
            name: countryRecord.countryName,
          })
        )
        const selectedCountry = _.find(expectedCountries, {
          id: selectedCountryId,
        })
        const selectedCountryStates = _.map(
          _.uniqBy(
            _.filter(
              countriesForSelectList,
              stateRecord => stateRecord.stateId != null
            ),
            'stateId'
          ),
          stateRecord => ({
            id: stateRecord.stateId,
            name: stateRecord.stateName,
          })
        )
        selectedCountry.states = _.sortBy(selectedCountryStates, 'name')
        const selectedState = _.find(selectedCountry.states, {
          id: selectedStateId,
        })
        const selectedStateLgas = _.map(
          _.filter(
            countriesForSelectList,
            lgaRecord => lgaRecord.lgaId != null
          ),
          lgaRecord => ({
            id: lgaRecord.lgaId,
            name: lgaRecord.lgaName,
          })
        )

        selectedState.lgas = _.sortBy(selectedStateLgas, 'name')

        return run(service.countrySelectList, [
          {
            params: { countryId: selectedCountryId, stateId: selectedStateId },
          },
        ])(response => {
          assert.isTrue(response.ok)
          assert.deepEqual(response.data, expectedCountries)
        })
      })
    })
  })

  describe('stateSelectList', () => {
    const statesForSelectList = _.sortBy(
      _.uniqBy(
        _.map(_.filter(countriesStatesAndLGAs, { countryId: 2 }), result => ({
          id: result.stateId,
          name: result.stateName,
        })),
        'id'
      ),
      'name'
    )
    const requestData = { params: { countryId: 2 } }

    beforeEach(() => {
      dbSpy.query
        .for('Get states for select list')
        .resolvesWith(statesForSelectList)
    })

    it('Should query the state table, filtering by country ID, sorting the results by state name', () =>
      run(service.stateSelectList, [requestData])(() => {
        const stateQuery = dbSpy.query.withArgs('Get states for select list')
          .lastCall.returnValue
        assert.equal(stateQuery.from.lastCall.args[0], 'State as s')
        assert.deepEqual(
          stateQuery.where.lastCall.args,
          ['g.countryId', requestData.params.countryId],
          'The where clause seems to be incorrect'
        )
        assert.deepEqual(
          stateQuery.orderBy.lastCall.args,
          [['s.name'], 'asc'],
          'The orderBy clause seems to be incorrect'
        )
        assert.deepEqual(
          stateQuery.distinct.lastCall.args,
          ['s.id', 's.name'],
          'The select clause seems to be incorrect'
        )
      }))

    it('Should return a list of states', () =>
      run(service.stateSelectList, [requestData])(response => {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, statesForSelectList)
      }))
  })

  describe('lgaSelectList', () => {
    const lgasForSelectList = _.sortBy(
      _.uniqBy(
        _.map(_.filter(countriesStatesAndLGAs, { stateId: 32 }), result => ({
          id: result.lgaId,
          name: result.lgaName,
        })),
        'id'
      ),
      'name'
    )
    const requestData = { params: { stateId: 32 } }

    beforeEach(() => {
      dbSpy.query
        .for('Get LGAs for select list')
        .resolvesWith(lgasForSelectList)
    })

    it('Should query the lga table, filtering by state ID, sorting the results by LGA name', () =>
      run(service.lgaSelectList, [requestData])(() => {
        const stateQuery = dbSpy.query.withArgs('Get LGAs for select list')
          .lastCall.returnValue
        assert.equal(stateQuery.from.lastCall.args[0], 'Lga as l')
        assert.deepEqual(
          stateQuery.where.lastCall.args,
          ['g.stateId', requestData.params.stateId],
          'The orderBy clause seems to be incorrect'
        )
        assert.deepEqual(
          stateQuery.orderBy.lastCall.args,
          [['l.name'], 'asc'],
          'The orderBy clause seems to be incorrect'
        )
        assert.deepEqual(
          stateQuery.distinct.lastCall.args,
          ['l.id', 'l.name'],
          'The select clause seems to be incorrect'
        )
      }))

    it('Should return a list of LGAs', () =>
      run(service.lgaSelectList, [requestData])(response => {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, lgasForSelectList)
      }))
  })
})
