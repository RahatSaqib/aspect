import Immutable from 'immutable'
import React, { PropTypes } from 'react'
import { assert } from 'chai'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import { LazyLoadItems, LazyLoadParent, LazyLoadChild } from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

describe('StateSelectField module', () => {
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
    let StateSelectField

    before(() => {
      const StateSelectFieldModule = require('./StateSelectField')
      StateSelectField = StateSelectFieldModule.StateSelectField
    })

    it('should trigger fetchStatesForLocationSelector on mount', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onChangeState: sinon.spy(),
        countryId: '1'
      }
      mountWithMuiTheme(<StateSelectField {...props} />)

      assert.isTrue(props.fetchStatesForLocationSelector.calledOnce)
    })

    it('should trigger fetchStatesForLocationSelector when countryId has changed', () => {
      const props = {
        countries: countriesForLocationSelector,
        fetchStatesForLocationSelector: sinon.spy(),
        onChangeState: sinon.spy(),
        countryId: '2'
      }
      const StateSelectFieldWrapper = mountWithMuiTheme(<StateSelectField {...props} />)
      assert.isTrue(props.fetchStatesForLocationSelector.calledOnce)

      StateSelectFieldWrapper.setProps({ countryId: '1' })
      assert.isTrue(props.fetchStatesForLocationSelector.calledTwice)
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
      assert.isTrue(props.onChangeState.calledOnce)
      assert.isTrue(props.onChangeState.calledWith('2'))

      ForkedSelectFieldWrapper.simulate('change', undefined, undefined, undefined)
      assert.isTrue(props.onChangeState.calledTwice)
      assert.isTrue(props.onChangeState.calledWith(undefined))
    })
  })
})
