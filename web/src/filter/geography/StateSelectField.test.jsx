import Immutable from 'immutable'
import React, { PropTypes } from 'react'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import { LazyLoadItems, LazyLoadParent, LazyLoadChild } from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

describe('StateSelectField module', () => {
  const {
    StateSelectField
  } = require('./StateSelectField')

  const mountWithMuiTheme = node => (
    mount(node, {
      context: {
        muiTheme: getMuiTheme()
      },
      childContextTypes: {
        muiTheme: PropTypes.object.isRequired
      }
    })
  )

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
                    name: 'Apapa'
                  }),
                  new LazyLoadChild({
                    id: '2',
                    name: 'Mushin'
                  }),
                  new LazyLoadChild({
                    id: '3',
                    name: 'Ojo'
                  })
                ])
              })
            }),
            new LazyLoadParent({
              id: '2',
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
        id: '2',
        name: 'United States',
        children: new LazyLoadItems({
          loading: false,
          lastRefreshed: undefined,
          items: Immutable.List([])
        })
      })
    ])
  })

  describe('StateSelectField component', () => {
    it('should trigger fetchStatesForLocationSelector on mount', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onChangeState: sinon.spy(),
        countryId: '1'
      }
      mountWithMuiTheme(<StateSelectField {...props} />)

      expect(props.fetchStatesForLocationSelector.calledOnce).toBe(true)
    })

    it('should trigger fetchStatesForLocationSelector when countryId has changed', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onChangeState: sinon.spy(),
        countryId: '2'
      }
      const StateSelectFieldWrapper = mountWithMuiTheme(<StateSelectField {...props} />)
      expect(props.fetchStatesForLocationSelector.calledOnce).toBe(true)

      StateSelectFieldWrapper.setProps({ countryId: '1' })
      expect(props.fetchStatesForLocationSelector.calledTwice).toBe(true)
    })

    it('should trigger onChangeState when value has been selected', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onChangeState: sinon.spy(),
        countryId: '2'
      }
      const StateSelectFieldWrapper = shallow(<StateSelectField {...props} />)
      const ForkedSelectFieldWrapper = StateSelectFieldWrapper.find(ForkedSelectField)

      ForkedSelectFieldWrapper.simulate('change', undefined, undefined, '2')
      expect(props.onChangeState.calledOnce).toBe(true)
      expect(props.onChangeState.calledWith('2')).toBe(true)

      ForkedSelectFieldWrapper.simulate('change', undefined, undefined, undefined)
      expect(props.onChangeState.calledTwice).toBe(true)
      expect(props.onChangeState.calledWith(undefined)).toBe(true)
    })
  })
})
