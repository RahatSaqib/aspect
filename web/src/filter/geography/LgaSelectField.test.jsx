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

describe('LgaSelectField module', () => {
  const { LgaSelectField } = require('./LgaSelectField')

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

  describe('LgaSelectField component', () => {
    it('should trigger fetchLgasForLocationSelector on mount', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchLgasForLocationSelector: sinon.spy(),
        onChangeLga: sinon.spy(),
        countryId: '1',
        stateId: '2',
      }
      mountWithMuiTheme(<LgaSelectField {...props} />)

      expect(props.fetchLgasForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger fetchLgasForLocationSelector when stateId has changed', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchLgasForLocationSelector: sinon.spy(),
        onChangeLga: sinon.spy(),
        countryId: '1',
        stateId: '2',
      }
      const LgaSelectFieldWrapper = mountWithMuiTheme(
        <LgaSelectField {...props} />
      )
      expect(props.fetchLgasForLocationSelector.calledOnce).toBe(true)

      LgaSelectFieldWrapper.setProps({ stateId: '1' })
      expect(props.fetchLgasForLocationSelector.calledTwice).toBe(true)
    })

    it('should trigger onChangeLga when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchLgasForLocationSelector: sinon.spy(),
        onChangeLga: sinon.spy(),
        countryId: '2',
      }
      const LgaSelectFieldWrapper = shallow(<LgaSelectField {...props} />)
      const ForkedSelectFieldWrapper = LgaSelectFieldWrapper.find(
        ForkedSelectField
      )

      ForkedSelectFieldWrapper.simulate('change', undefined, undefined, '2')
      expect(props.onChangeLga.calledOnce).toBe(true)
      expect(props.onChangeLga.calledWith('2')).toBe(true)

      ForkedSelectFieldWrapper.simulate(
        'change',
        undefined,
        undefined,
        undefined
      )
      expect(props.onChangeLga.calledTwice).toBe(true)
      expect(props.onChangeLga.calledWith(undefined)).toBe(true)
    })
  })
})
