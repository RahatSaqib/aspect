import Immutable from 'immutable'
import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Field } from 'redux-form/immutable'

import { LazyLoadItems, LazyLoadParent, LazyLoadChild } from '../../geography/GeographyRedux'

describe('LocationSelector Component', () => {
  const now = new Date()
  const countriesForLocationSelector = new LazyLoadItems({
    loading: false,
    lastRefreshed: now,
    items: Immutable.List([
      new LazyLoadParent({
        id: 1,
        name: 'Nigeria',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: now,
          items: Immutable.List([
            new LazyLoadParent({
              id: 1,
              name: 'Lagos',
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: now,
                items: Immutable.List([
                  new LazyLoadChild({
                    id: 1,
                    name: 'Apapa'
                  }),
                  new LazyLoadChild({
                    id: 2,
                    name: 'Mushin'
                  }),
                  new LazyLoadChild({
                    id: 3,
                    name: 'Ojo'
                  })
                ])
              })
            }),
            new LazyLoadParent({
              id: 2,
              name: 'Ogun',
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: undefined,
                items: Immutable.List([])
              })
            })
          ])
        })
      }),
      new LazyLoadParent({
        id: 2,
        name: 'United States',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: undefined,
          items: Immutable.List([])
        })
      })
    ])
  })

  describe('LocationSelector', () => {
    const fakeIntl = {
      injectIntl: component => component
    }
    const fakeReactRedux = {
      connect: () => component => component
    }
    const fakeRedux = {
      bindActionCreators: actionCreators => actionCreators
    }
    const LocationSelector = proxyquire('./LocationSelector', {
      'react-intl': fakeIntl,
      'react-redux': fakeReactRedux,
      redux: fakeRedux
    }).default

    let props
    let LocationSelectorWrapper

    const shallowRenderLocationSelector = () => {
      LocationSelectorWrapper = shallow(<LocationSelector {...props} />)
    }

    beforeEach(() => {
      props = {
        fetchCountriesForLocationSelector: sinon.spy(),
        fetchStatesForLocationSelector: sinon.spy(),
        fetchLgasForLocationSelector: sinon.spy(),
        changeFieldValue: () => {},
        countries: countriesForLocationSelector,
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        loading: false,
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderLocationSelector()
    })

    it('Should be a div', () => {
      assert.equal(LocationSelectorWrapper.node.type, 'div')
    })

    it('Should contain three Field for country, state and LGA', () => {
      const CountrySelectFieldWrapper = LocationSelectorWrapper.find(Field).filter({ name: 'countryId' })
      assert.equal(CountrySelectFieldWrapper.length, 1)

      const StateSelectFieldWrapper = LocationSelectorWrapper.find(Field).filter({ name: 'stateId' })
      assert.equal(StateSelectFieldWrapper.length, 1)

      const LgaSelectFieldWrapper = LocationSelectorWrapper.find(Field).filter({ name: 'lgaId' })
      assert.equal(LgaSelectFieldWrapper.length, 1)
    })
  })

  describe('react-redux connect', () => {
    const expectedBoundActionCreators = { value: 'Bound Action Creators' }
    let reactReduxStub
    let intlStub
    let mapDispatchToProps
    let reduxStub
    let reduxFormStub
    beforeEach(() => {
      reactReduxStub = {
        connect: sinon.stub().returns(() => {})
      }
      intlStub = {
        injectIntl: sinon.stub().returns(() => {})
      }
      reduxStub = {
        bindActionCreators: sinon.stub().returns(expectedBoundActionCreators)
      }
      reduxFormStub = {
        change: () => {}
      }
      proxyquire('./LocationSelector', {
        'react-intl': intlStub,
        'react-redux': reactReduxStub,
        redux: reduxStub,
        'redux-form/immutable': reduxFormStub
      })
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind changeFieldValue action creators to the component\'s properties', () => {
      const expectedDispatcher = { value: 'I am a dispatch function' }
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [{
        changeFieldValue: reduxFormStub.change
      },
        expectedDispatcher])
    })
  })
})
