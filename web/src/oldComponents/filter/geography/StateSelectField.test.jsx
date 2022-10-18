import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import sinon from 'sinon'
import { mountWithTheme } from '../../../__setup__/common'
import { LazyLoadItems, LazyLoadParent, LazyLoadChild } from '../../../store/GeographyRedux'
import SelectField from '../../shared/SelectField'

describe('StateSelectField module', () => {
  const { StateSelectField } = require('./StateSelectField')

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

  describe('StateSelectField component', () => {
    it('should trigger fetchStatesForLocationSelector on mount', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onStateIdChange: sinon.spy(),
        countryId: '1',
      }
      mountWithTheme(<StateSelectField {...props} />)

      expect(props.fetchStatesForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger fetchStatesForLocationSelector when countryId has changed', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onStateIdChange: sinon.spy(),
        countryId: '2',
      }
      const StateSelectFieldWrapper = mountWithTheme(<StateSelectField {...props} />)
      expect(props.fetchStatesForLocationSelector.calledOnce).toBe(true)

      StateSelectFieldWrapper.setProps({
        children: <StateSelectField {...props} countryId={1} />,
      })
      expect(props.fetchStatesForLocationSelector.calledTwice).toBe(true)
    })

    it('should trigger onStateIdChange when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onStateIdChange: sinon.spy(),
        countryId: '2',
      }
      const StateSelectFieldWrapper = shallow(<StateSelectField {...props} />)
      const SelectFieldWrapper = StateSelectFieldWrapper.find(SelectField)

      SelectFieldWrapper.simulate('change', { target: { value: '2' } })
      expect(props.onStateIdChange.calledOnce).toBe(true)
      expect(props.onStateIdChange.calledWith('2')).toBe(true)

      SelectFieldWrapper.simulate('change', { target: { value: undefined } })
      expect(props.onStateIdChange.calledTwice).toBe(true)
      expect(props.onStateIdChange.calledWith(undefined)).toBe(true)
    })
  })
})
