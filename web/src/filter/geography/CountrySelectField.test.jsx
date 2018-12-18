import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React from 'react'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import { createMuiTheme } from '@material-ui/core/styles'

import {
  LazyLoadItems,
  LazyLoadParent,
  LazyLoadChild,
} from '../../geography/GeographyRedux'
import SelectField from '../../components/shared/SelectField'

describe('CountrySelectField module', () => {
  const { CountrySelectField } = require('./CountrySelectField')

  const mountWithMuiTheme = node =>
    mount(node, {
      context: {
        muiTheme: createMuiTheme(),
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
        onCountryIdChange: sinon.spy(),
        countryId: '1',
      }
      mountWithMuiTheme(<CountrySelectField {...props} />)

      expect(props.fetchCountriesForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger onCountryIdChange when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchCountriesForLocationSelector: sinon.spy(),
        onCountryIdChange: sinon.spy(),
        countryId: '2',
      }
      const CountrySelectFieldWrapper = shallow(
        <CountrySelectField {...props} />
      )
      const SelectFieldWrapper = CountrySelectFieldWrapper.find(SelectField)

      SelectFieldWrapper.simulate('change', { target: { value: '2' } })
      expect(props.onCountryIdChange.calledOnce).toBe(true)
      expect(props.onCountryIdChange.calledWith('2')).toBe(true)

      SelectFieldWrapper.simulate('change', { target: { value: undefined } })
      expect(props.onCountryIdChange.calledTwice).toBe(true)
      expect(props.onCountryIdChange.calledWith(undefined)).toBe(true)
    })
  })
})
