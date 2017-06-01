import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { Field } from 'redux-form/immutable'

import {
  LazyLoadItems,
  LazyLoadParent,
  LazyLoadChild,
} from '../../geography/GeographyRedux'

describe('LocationSelector module', () => {
  const { LocationSelector } = require('./LocationSelector')

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
                    name: 'Apapa',
                  }),
                  new LazyLoadChild({
                    id: 2,
                    name: 'Mushin',
                  }),
                  new LazyLoadChild({
                    id: 3,
                    name: 'Ojo',
                  }),
                ]),
              }),
            }),
            new LazyLoadParent({
              id: 2,
              name: 'Ogun',
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: undefined,
                items: Immutable.List([]),
              }),
            }),
          ]),
        }),
      }),
      new LazyLoadParent({
        id: 2,
        name: 'United States',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: undefined,
          items: Immutable.List([]),
        }),
      }),
    ]),
  })

  describe('LocationSelector component', () => {
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
          formatMessage: message => message.defaultMessage,
        },
      }
      shallowRenderLocationSelector()
    })

    it('Should be a div', () => {
      expect(LocationSelectorWrapper.node.type).toEqual('div')
    })

    it('Should contain three Field for country, state and LGA', () => {
      const CountrySelectFieldWrapper = LocationSelectorWrapper.find(
        Field
      ).filter({ name: 'countryId' })
      expect(CountrySelectFieldWrapper.length).toEqual(1)

      const StateSelectFieldWrapper = LocationSelectorWrapper.find(
        Field
      ).filter({ name: 'stateId' })
      expect(StateSelectFieldWrapper.length).toEqual(1)

      const LgaSelectFieldWrapper = LocationSelectorWrapper.find(Field).filter({
        name: 'lgaId',
      })
      expect(LgaSelectFieldWrapper.length).toEqual(1)
    })
  })
})
