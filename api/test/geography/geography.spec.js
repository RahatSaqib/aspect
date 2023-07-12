const _ = require('lodash')

const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')
const { getUserByToken } = require('../utils/authUtils')

const { assert } = chai

describe('Geography routes', () => {
  describe('/api/geography/select-list', () => {
    const path = '/api/geography/select-list'
    before(() => {
      shared.checkToken(server, path)
    })

    describe('GET', () => {
      it('should return a list of countries, each with its nested set of states and LGAs, all ordered by name', done => {
        server
          .get(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1)
            const expectedCountriesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
            assert.isTrue(
              _.isEqual(res.body.data, expectedCountriesInAlphabeticalOrder),
              `Countries returned are not in alphabetical order ${JSON.stringify(res.body.data)}`
            )
            _.each(res.body.data, country => {
              assert.property(country, 'id')
              assert.property(country, 'name')
              assert.property(country, 'states')
              const expectedStatesInAlphabeticalOrder = _.orderBy(country.states, 'name', 'asc')
              assert.isTrue(
                _.isEqual(country.states, expectedStatesInAlphabeticalOrder),
                `States returned are not in alphabetical order ${JSON.stringify(country.states)}`
              )
              _.each(country.states, state => {
                assert.property(state, 'id')
                assert.property(state, 'name')
                assert.property(state, 'lgas')
                const expectedLGAsInAlphabeticalOrder = _.orderBy(state.lgas, [lga => lga.name.toLowerCase()])
                assert.isTrue(
                  _.isEqual(state.lgas, expectedLGAsInAlphabeticalOrder),
                  `LGAs returned are not in alphabetical order ${JSON.stringify(state.lgas)}`
                )
                _.each(country.lgas, lga => {
                  assert.property(lga, 'id')
                  assert.property(lga, 'name')
                })
              })
            })
            done()
          })
      })
    })
  })

  describe('/geography/country-select-list', () => {
    const path = '/api/geography/country-select-list'
    before(() => {
      shared.checkToken(server, path)
    })

    describe('GET', () => {
      describe('with no selected country', () => {
        it('should return a list of country IDs and names ordered by name', done => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 1)
              const expectedCountriesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
              assert.isTrue(
                _.isEqual(res.body.data, expectedCountriesInAlphabeticalOrder),
                `Countries returned are not in alphabetical order ${JSON.stringify(res.body.data)}`
              )
              _.each(res.body.data, country => {
                assert.property(country, 'id')
                assert.property(country, 'name')
              })
              done()
            })
        })
      })

      describe('with a selected country and no selected state', () => {
        it('should return a list of country IDs and names, ordered by name and populating the states of the selected country', done => {
          // First get the full country/state/LGA tree so that we can pick a countryId to query
          server
            .get('/api/geography/select-list')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const countryWithStates = _.find(res.body.data, country => country.name === 'United States')
              server
                .get(`${path}/${countryWithStates.id}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'array')
                  assert.isAtLeast(res.body.data.length, 1)
                  const expectedCountriesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
                  assert.isTrue(
                    _.isEqual(res.body.data, expectedCountriesInAlphabeticalOrder),
                    `Countries returned are not in alphabetical order ${JSON.stringify(res.body.data)}`
                  )
                  _.each(res.body.data, country => {
                    assert.property(country, 'id')
                    assert.property(country, 'name')
                    if (country.id === countryWithStates.id) {
                      assert.property(country, 'states')
                      assert.typeOf(country.states, 'array')
                      assert.isAtLeast(country.states.length, 1)
                    } else {
                      assert.equal(country.states, undefined)
                    }
                  })
                  done()
                })
            })
        })
      })

      describe('with a selected country and a selected state', () => {
        it('should return a list of country IDs and names, ordered by name and populating the states of the selected country and the LGAs of the selected state', done => {
          // First get the full country/state/LGA tree so that we can pick a countryId to query
          server
            .get('/api/geography/select-list')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const countryWithStatesAndLGAs = _.find(
                res.body.data,
                country => country.name === 'United States' && _.some(country.states, state => state.lgas.length > 0)
              )
              const stateWithLGAs = _.find(countryWithStatesAndLGAs.states, state => state.lgas.length > 0)
              server
                .get(`${path}/${countryWithStatesAndLGAs.id}/${stateWithLGAs.id}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'array')
                  assert.isAtLeast(res.body.data.length, 1)
                  const expectedCountriesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
                  assert.isTrue(
                    _.isEqual(res.body.data, expectedCountriesInAlphabeticalOrder),
                    `Countries returned are not in alphabetical order ${JSON.stringify(res.body.data)}`
                  )
                  _.each(res.body.data, country => {
                    assert.property(country, 'id')
                    assert.property(country, 'name')
                    if (country.id === countryWithStatesAndLGAs.id) {
                      assert.property(country, 'states')
                      assert.typeOf(country.states, 'array')
                      assert.isAtLeast(country.states.length, 1)
                      _.each(country.states, state => {
                        assert.property(state, 'id')
                        assert.property(state, 'name')
                        if (state.id === stateWithLGAs.id) {
                          assert.property(state, 'lgas')
                          assert.typeOf(state.lgas, 'array')
                          assert.isAtLeast(state.lgas.length, 1)
                        } else {
                          assert.equal(state.lgas, undefined)
                        }
                      })
                    } else {
                      assert.equal(country.states, undefined)
                    }
                  })
                  done()
                })
            })
        })
      })
    })
  })

  describe('/geography/state-select-list/{countryId}', () => {
    const path = '/api/geography/state-select-list/'

    describe('GET', () => {
      it('should return a list of state IDs and names for the country ordered by name', async () => {
        const { countryId } = await getUserByToken(shared.token)
        // First get the full country/state/LGA tree so that we can pick a countryId to query
        const res = await server.get('/api/geography/select-list').set('Authorization', `Bearer ${shared.token}`)

        const countryWithStates = _.find(res.body.data, country => country.id === countryId)
        const res2 = await server.get(path + countryWithStates.id).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res2.status, 200)
        assert.typeOf(res2.body, 'Object')
        assert.property(res2.body, 'data')
        assert.typeOf(res2.body.data, 'array')
        assert.isAtLeast(res2.body.data.length, 1)
        const expectedStatesInAlphabeticalOrder = _.orderBy(res2.body.data, 'name', 'asc')
        assert.isTrue(
          _.isEqual(res2.body.data, expectedStatesInAlphabeticalOrder),
          `States returned are not in alphabetical order ${JSON.stringify(res2.body.data)}`
        )
        _.each(res2.body.data, state => {
          assert.property(state, 'id')
          assert.property(state, 'name')
        })
      })
    })
  })

  describe('/geography/lga-select-list/{stateId}', () => {
    const path = '/api/geography/lga-select-list/'

    describe('GET', () => {
      it('should return a list of LGA IDs and names for the country ordered by name', async () => {
        // First get the full country/state/LGA tree so that we can pick a stateId to query
        const { countryId } = await getUserByToken(shared.token)
        const res = await server.get('/api/geography/select-list').set('Authorization', `Bearer ${shared.token}`)
        const stateWithLgas = _.find(
          _.find(
            res.body.data,
            country => country.id === countryId && _.some(country.states, state => state.lgas.length > 0)
          ).states,
          state => state.lgas.length > 0
        )
        const res2 = await server.get(path + stateWithLgas.id).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res2.status, 200)
        assert.typeOf(res2.body, 'Object')
        assert.property(res2.body, 'data')
        assert.typeOf(res2.body.data, 'array')
        assert.isAtLeast(res2.body.data.length, 1)
        const expectedStatesInAlphabeticalOrder = _.orderBy(res2.body.data, 'name', 'asc')
        assert.isTrue(
          _.isEqual(res2.body.data, expectedStatesInAlphabeticalOrder),
          `LGAs returned are not in alphabetical order ${JSON.stringify(res2.body.data)}`
        )
        _.each(res2.body.data, state => {
          assert.property(state, 'id')
          assert.property(state, 'name')
        })
      })
    })
  })
})
