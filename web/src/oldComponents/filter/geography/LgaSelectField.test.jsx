import Immutable from 'immutable'
import React from 'react'
import sinon from 'sinon'
import { shallow } from 'enzyme'

import { LazyLoadItems, LazyLoadParent, LazyLoadChild } from '../../../store/GeographyRedux'
import SelectField from '../../shared/SelectField'
import { mountWithTheme } from '../../../__setup__/common'

describe('LgaSelectField module', () => {
  const { LgaSelectField } = require('./LgaSelectField')

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
        onLgaIdChange: sinon.spy(),
        countryId: '1',
        stateId: '2',
      }
      mountWithTheme(<LgaSelectField {...props} />)

      expect(props.fetchLgasForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger fetchLgasForLocationSelector when stateId has changed', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchLgasForLocationSelector: sinon.spy(),
        onLgaIdChange: sinon.spy(),
        countryId: '1',
        stateId: '2',
      }
      const LgaSelectFieldWrapper = mountWithTheme(<LgaSelectField {...props} />)
      expect(props.fetchLgasForLocationSelector.calledOnce).toBe(true)

      LgaSelectFieldWrapper.setProps({
        children: <LgaSelectField {...props} stateId={1} />,
      })
      expect(props.fetchLgasForLocationSelector.calledTwice).toBe(true)
    })

    it('should trigger onLgaIdChange when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchLgasForLocationSelector: sinon.spy(),
        onLgaIdChange: sinon.spy(),
        countryId: '2',
      }
      const LgaSelectFieldWrapper = shallow(<LgaSelectField {...props} />)
      const SelectFieldWrapper = LgaSelectFieldWrapper.find(SelectField)

      SelectFieldWrapper.simulate('change', { target: { value: '2' } })
      expect(props.onLgaIdChange.calledOnce).toBe(true)
      expect(props.onLgaIdChange.calledWith('2')).toBe(true)

      SelectFieldWrapper.simulate('change', { target: { value: undefined } })
      expect(props.onLgaIdChange.calledTwice).toBe(true)
      expect(props.onLgaIdChange.calledWith(undefined)).toBe(true)
    })
  })
})
