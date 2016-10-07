import { assert } from 'chai'
import Immutable from 'immutable'
import _ from 'lodash'
import types from './../constants/action_types'
import geography from './geography'

describe('geography reducer', () => {
  describe('initial state', () => {
    let initialState

    beforeEach(()=>{
      initialState = geography(undefined, {})
    })

    it('should contain an empty LazyLoadItems object that isn\'t loading and has not been refreshed yet', () => {
      assert.instanceOf(initialState.countriesForLocationSelector, Immutable.Record)
      assert.isFalse(initialState.countriesForLocationSelector.loading)
      assert.isUndefined(initialState.countriesForLocationSelector.lastRefreshed)
      assert.instanceOf(initialState.countriesForLocationSelector.items, Immutable.List)
      assert.equal(initialState.countriesForLocationSelector.items.size, 0)
    })
  })

  describe('actions', () => {
    describe('REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are busy loading', () => {
        const state = geography(undefined, { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR })
        assert.isTrue(state.countriesForLocationSelector.loading)
      })
    })

    describe('RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are not loading anymore and update the last refreshed date', () => {
        const now = new Date(),
          state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: [],
            lastRefreshed: now
          })
        assert.isFalse(state.countriesForLocationSelector.loading)
        assert.equal(state.countriesForLocationSelector.lastRefreshed, now)
      })

      describe('with shallow country list', () => {
        it('should update the items to a list of LazyLoadParents', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), countryIds = _.map(countriesReceived, 'id'),
            countryNames = _.map(countriesReceived, 'name')

          assert.instanceOf(state.countriesForLocationSelector.items, Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            assert.include(countryIds, countryRecord.id)
            assert.include(countryNames, countryRecord.name)
            assert.instanceOf(countryRecord.children, Immutable.Record)
            assert.isFalse(countryRecord.children.loading)
            assert.isUndefined(countryRecord.children.items)
            assert.isUndefined(countryRecord.children.lastRefreshed)
          })
        })
      })

      describe('with deep country list', () => {
        it('should update the items to a list of LazyLoadParents and populate the state and lga children', () => {
          const now = new Date(),
            countriesReceived = [{
              id: 1,
              name: 'South Africa',
              states: [{id: 1, name: 'Eastern Cape'},
                {
                  id: 2,
                  name: 'Gauteng',
                  lgas: [{id: 1, name: 'Midrand'},
                    {id: 2, name: 'Pretoria'},
                    {id: 3, name: 'Randburg'}]
                }, {id: 3, name: 'Western Cape'}]},
              {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), countryIds = _.map(countriesReceived, 'id'),
            countryNames = _.map(countriesReceived, 'name')

          assert.instanceOf(state.countriesForLocationSelector.items, Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            assert.include(countryIds, countryRecord.id)
            assert.include(countryNames, countryRecord.name)
            assert.instanceOf(countryRecord.children, Immutable.Record)
            assert.isFalse(countryRecord.children.loading)
            const countryReceived = _.find(countriesReceived, {id: countryRecord.id})
            if(countryReceived.states) {
              const stateIds = _.map(countryReceived.states, 'id'),
                stateNames = _.map(countryReceived.states, 'name')
              assert.instanceOf(countryRecord.children.items, Immutable.List)
              assert.equal(countryRecord.children.lastRefreshed, now)
              countryRecord.children.items.forEach(stateRecord => {
                assert.include(stateIds, stateRecord.id)
                assert.include(stateNames, stateRecord.name)
                assert.instanceOf(stateRecord.children, Immutable.Record)
                assert.isFalse(stateRecord.children.loading)
                const stateReceived = _.find(countryReceived.states, {id: stateRecord.id})
                if(stateReceived.lgas) {
                  const lgaIds = _.map(stateReceived.lgas, 'id'),
                    lgaNames = _.map(stateReceived.lgas, 'name')
                  assert.instanceOf(stateRecord.children.items, Immutable.List)
                  assert.equal(stateRecord.children.lastRefreshed, now)
                  stateRecord.children.items.forEach(lgaRecord => {
                    assert.include(lgaIds, lgaRecord.id)
                    assert.include(lgaNames, lgaRecord.name)
                  })
                } else {
                  assert.isUndefined(stateRecord.children.items)
                  assert.isUndefined(stateRecord.children.lastRefreshed)
                }
              })
            } else {
              assert.isUndefined(countryRecord.children.items)
              assert.isUndefined(countryRecord.children.lastRefreshed)
            }
          })
        })
      })
    })

    describe('REQUEST_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
              selectedCountryId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when countries have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date(),
            selectedCountryId = 1,
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), newState = geography(state, {
              type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
              selectedCountryId: selectedCountryId
            }), selectedCountry = newState.countriesForLocationSelector.items.find(val => val.id === selectedCountryId)

          assert.isTrue(selectedCountry.children.loading)
        })
      })
    })

    describe('RECEIVE_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when countries have been loaded', () => {
        let initialState, countries = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
          now = new Date(),
          selectedCountryId = 1,
          selectedCountry = null,
          indexOfSelectedCountry = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items.indexOf(selectedCountry)
          initialState = geography(initialState, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: selectedCountryId
          })
        })

        it('should show that states for the selected country are not loading anymore and update the last refreshed date', () => {
          assert.isTrue(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading']))
          assert.isUndefined(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed']))
          const newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
            states: [],
            selectedCountryId: selectedCountryId,
            lastRefreshed: now
          })

          assert.isFalse(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading']))
          assert.equal(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed']), now)
        })

        describe('with shallow states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}],
              stateIds = _.map(statesReceived, 'id'),
              stateNames = _.map(statesReceived, 'name'),
              newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: statesReceived,
              selectedCountryId: selectedCountryId,
              lastRefreshed: now
            }), selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            assert.instanceOf(selectedCountryStates, Immutable.List)
            assert.equal(selectedCountryStates.size, statesReceived.length)
            selectedCountryStates.forEach(stateRecord => {
              assert.include(stateIds, stateRecord.id)
              assert.include(stateNames, stateRecord.name)
              assert.instanceOf(stateRecord.children, Immutable.Record)
              assert.isFalse(stateRecord.children.loading)
              assert.isUndefined(stateRecord.children.items)
              assert.isUndefined(stateRecord.children.lastRefreshed)
            })
          })
        })

        describe('with deep states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{id: 1, name: 'Eastern Cape'}, {
                id: 2,
                name: 'Gauteng',
                lgas: [{id: 1, name: 'Midrand'},
                  {id: 2, name: 'Pretoria'},
                  {id: 3, name: 'Randburg'}]
              }, {id: 3, name: 'Western Cape'}],
              stateIds = _.map(statesReceived, 'id'),
              stateNames = _.map(statesReceived, 'name'),
              newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: statesReceived,
                selectedCountryId: selectedCountryId,
                lastRefreshed: now
              }), selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            assert.instanceOf(selectedCountryStates, Immutable.List)
            assert.equal(selectedCountryStates.size, statesReceived.length)
            selectedCountryStates.forEach(stateRecord => {
              assert.include(stateIds, stateRecord.id)
              assert.include(stateNames, stateRecord.name)
              assert.instanceOf(stateRecord.children, Immutable.Record)
              assert.isFalse(stateRecord.children.loading)
              const stateReceived = _.find(statesReceived, {id: stateRecord.id})
              if(stateReceived.lgas) {
                const lgaIds = _.map(stateReceived.lgas, 'id'),
                  lgaNames = _.map(stateReceived.lgas, 'name')
                assert.instanceOf(stateRecord.children.items, Immutable.List)
                assert.equal(stateRecord.children.lastRefreshed, now)
                stateRecord.children.items.forEach(lgaRecord => {
                  assert.include(lgaIds, lgaRecord.id)
                  assert.include(lgaNames, lgaRecord.name)
                })
              } else {
                assert.isUndefined(stateRecord.children.items)
                assert.isUndefined(stateRecord.children.lastRefreshed)
              }
            })
          })
        })
      })
    })

    describe('REQUEST_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
              selectedCountryId: 1,
              selectedStateId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            stateWithCountriesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            })
          assert.equal(stateWithCountriesLoaded.getIn(['countriesForLocationSelector', 'items']).size, 2)
          const newState = geography(stateWithCountriesLoaded, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          })
          assert.deepEqual(stateWithCountriesLoaded, newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date(),
            selectedCountryId = 1,
            selectedStateId = 2,
            countriesReceived = [{
              id: 1,
              name: 'South Africa',
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}]
            }, {id: 2, name: 'United Sates'}],
            stateWithCountriesAndStatesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), newState = geography(stateWithCountriesAndStatesLoaded, {
              type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
              selectedCountryId: selectedCountryId,
              selectedStateId: selectedStateId
            }), selectedCountry = newState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId),
            selectedState = selectedCountry.children.items.find(state => state.id === selectedStateId)

          assert.isTrue(selectedState.children.loading)
        })
      })
    })

    describe('RECEIVE_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1,
              selectedStateId: 2
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            stateWithCountriesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }),
            newState = geography(stateWithCountriesLoaded, {
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1,
              selectedStateId: 2
            })

          assert.deepEqual(stateWithCountriesLoaded, newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        let initialState, countries = [{
            id: 1,
            name: 'South Africa',
            states: [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}]
          }, {id: 2, name: 'United Sates'}],
          now = new Date(),
          selectedCountryId = 1,
          selectedCountry = null,
          indexOfSelectedCountry = -1,
          selectedStateId = 2,
          selectedState = null,
          indexOfSelectedState = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items.indexOf(selectedCountry)
          selectedState = selectedCountry.children.items.find(state => state.id === selectedStateId)
          indexOfSelectedState = selectedCountry.children.items.indexOf(selectedState)
          initialState = geography(initialState, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: selectedCountryId,
            selectedStateId: selectedStateId
          })
        })

        it('should show that LGAs for the selected state are not loading anymore and update the last refreshed date', () => {
          assert.isTrue(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading']))
          assert.isUndefined(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed']))
          const newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            lgas: [],
            selectedCountryId: selectedCountryId,
            selectedStateId: selectedStateId,
            lastRefreshed: now
          })

          assert.isFalse(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading']))
          assert.equal(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed']), now)
        })

        it('should update the items of the selected country to a list of LazyLoadParents', () => {
          const lgasReceived = [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}],
            lgaIds = _.map(lgasReceived, 'id'),
            lgaNames = _.map(lgasReceived, 'name'),
            newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: lgasReceived,
              selectedCountryId: selectedCountryId,
              selectedStateId: selectedStateId,
              lastRefreshed: now
            }), selectedStateLgas = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry,
              'children', 'items', indexOfSelectedState, 'children', 'items'])

          assert.instanceOf(selectedStateLgas, Immutable.List)
          assert.equal(selectedStateLgas.size, lgasReceived.length)
          selectedStateLgas.forEach(lgaRecord => {
            assert.include(lgaIds, lgaRecord.id)
            assert.include(lgaNames, lgaRecord.name)
          })
        })
      })
    })
  })
})
