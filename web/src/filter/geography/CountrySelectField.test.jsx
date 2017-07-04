import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React from 'react'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import {
  LazyLoadItems,
  LazyLoadParent,
  LazyLoadChild,
} from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

describe('CountrySelectField module', () => {
  const { CountrySelectField } = require('./CountrySelectField')

  const mountWithMuiTheme = node =>
    mount(node, {
      context: {
        muiTheme: getMuiTheme(),
      },
      childContextTypes: {
        muiTheme: PropTypes.object.isRequired,
      },
    })

  const now = new Date()
  const countriesForLocationSelector = new LazyLoadItems({
    loading: false,
    lastRefreshed: now,
    items: Immutable.List([
      new LazyLoadParent({
        id: '1',
        name: 'Nigeria',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: now,
          items: Immutable.List([
            new LazyLoadParent({
              id: '1',
              name: 'Lagos',
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: now,
                items: Immutable.List([
                  new LazyLoadChild({
                    id: '1',
                    name: 'Apapa',
                  }),
                  new LazyLoadChild({
                    id: '2',
                    name: 'Mushin',
                  }),
                  new LazyLoadChild({
                    id: '3',
                    name: 'Ojo',
                  }),
                ]),
              }),
            }),
            new LazyLoadParent({
              id: '2',
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
        id: '2',
        name: 'United States',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: undefined,
          items: Immutable.List([]),
        }),
      }),
    ]),
  })

  describe('CountrySelectField component', () => {
    it('should trigger fetchCountriesForLocationSelector on mount', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchCountriesForLocationSelector: sinon.spy(),
        onChangeCountry: sinon.spy(),
        countryId: '1',
      }
      mountWithMuiTheme(<CountrySelectField {...props} />)

      expect(props.fetchCountriesForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger onChangeCountry when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchCountriesForLocationSelector: sinon.spy(),
        onChangeCountry: sinon.spy(),
        countryId: '2',
      }
      const CountrySelectFieldWrapper = shallow(
        <CountrySelectField {...props} />
      )
      const ForkedSelectFieldWrapper = CountrySelectFieldWrapper.find(
        ForkedSelectField
      )

      ForkedSelectFieldWrapper.simulate('change', undefined, undefined, '2')
      expect(props.onChangeCountry.calledOnce).toBe(true)
      expect(props.onChangeCountry.calledWith('2')).toBe(true)

      ForkedSelectFieldWrapper.simulate(
        'change',
        undefined,
        undefined,
        undefined
      )
      expect(props.onChangeCountry.calledTwice).toBe(true)
      expect(props.onChangeCountry.calledWith(undefined)).toBe(true)
    })
  })
})
