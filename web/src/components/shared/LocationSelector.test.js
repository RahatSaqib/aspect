import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import {LazyLoadItems, LazyLoadParent, LazyLoadChild} from '../../geography/GeographyRedux'
import SelectInput from './SelectInput'

describe('LocationSelector Component', () => {
  const now = new Date(),
    countriesForLocationSelector = new LazyLoadItems({
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
      }, fakeReactRedux = {
        connect: () => component => component
      }, fakeRedux = {
        bindActionCreators: (actionCreators) => actionCreators
      }, LocationSelector = proxyquire('./LocationSelector', {
        'react-intl': fakeIntl,
        'react-redux': fakeReactRedux,
        'redux': fakeRedux
      }).default

    let props, LocationSelectorWrapper

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

    it('Should contain SelectInput controls for country, state and LGA', () => {
      const expectedSelectListDataSourceMappings = { text: 'name', value: 'id' }
      const selectInputs = LocationSelectorWrapper.find(SelectInput)
      assert.equal(selectInputs.length, 3)
      const countrySelect = selectInputs.findWhere(selectInput => selectInput.props().name === props.countryIdFieldName)
      assert.deepEqual(countrySelect.props(), {...countrySelect.props(),
        name: props.countryIdFieldName,
        label: 'Country',
        disabled: props.disabled || countriesForLocationSelector.get('loading') || !countriesForLocationSelector.get('items').size,
        dataSource: countriesForLocationSelector.get('items').toJS(),
        dataSourceConfig: expectedSelectListDataSourceMappings
      })
      const stateSelect = selectInputs.findWhere(
        selectInput => selectInput.props().name === props.stateIdFieldName)
      assert.deepEqual(stateSelect.props(), {...stateSelect.props(),
        name: props.stateIdFieldName,
        label: 'State',
        disabled: true,
        dataSource: [],
        dataSourceConfig: expectedSelectListDataSourceMappings
      })
      const lgaSelect = selectInputs.findWhere(
        selectInput => selectInput.props().name === props.lgaIdFieldName)
      assert.deepEqual(lgaSelect.props(), {...lgaSelect.props(),
        name: props.lgaIdFieldName,
        label: 'Area',
        disabled: true,
        dataSource: [],
        dataSourceConfig: expectedSelectListDataSourceMappings
      })
    })

    describe('selectCountry', () => {
      it('should trigger fetchStatesForLocationSelector when value has been selected', () => {
        const countrySelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.countryIdFieldName),
          selectCountryId = 1

        countrySelect.simulate('change', undefined, undefined, selectCountryId)

        assert.isTrue(props.fetchStatesForLocationSelector.calledOnce)

        countrySelect.simulate('change', undefined, undefined, undefined)

        assert.isFalse(props.fetchStatesForLocationSelector.calledTwice)
      })
    })

    describe('selectState', () => {
      it('should trigger fetchLgasForLocationSelector when value has been selected', () => {
        props.selectedCountryId = 1
        shallowRenderLocationSelector()

        const stateSelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.stateIdFieldName),
          selectStateId = 2

        stateSelect.simulate('change', undefined, undefined, selectStateId)

        assert.isTrue(props.fetchLgasForLocationSelector.calledOnce)

        stateSelect.simulate('change', undefined, undefined, undefined)

        assert.isFalse(props.fetchLgasForLocationSelector.calledTwice)
      })
    })
  })

  describe('react-redux connect', () => {
    const expectedBoundActionCreators = { value: 'Bound Action Creators' }
    let reactReduxStub, intlStub, mapStateToProps, mapDispatchToProps, reduxStub, geographyCreatorsStub, reduxFormStub
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
      geographyCreatorsStub = {
        fetchCountriesForLocationSelector: () => {},
        fetchStatesForLocationSelector: () => {},
        fetchLgasForLocationSelector: () => {}
      }
      reduxFormStub = {
        change: () => {}
      }
      proxyquire('./LocationSelector', {
        'react-intl': intlStub,
        'react-redux': reactReduxStub,
        'redux': reduxStub,
        'redux-form': reduxFormStub,
        '../../geography/GeographyRedux': geographyCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchCountriesForLocationSelector action creators to the component\'s properties', () => {
      const expectedDispatcher = {value: 'I am a dispatch function'}
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [{
        fetchCountriesForLocationSelector: geographyCreatorsStub.fetchCountriesForLocationSelector,
        fetchStatesForLocationSelector: geographyCreatorsStub.fetchStatesForLocationSelector,
        fetchLgasForLocationSelector: geographyCreatorsStub.fetchLgasForLocationSelector,
        changeFieldValue: reduxFormStub.change
      },
        expectedDispatcher])
    })

    it('mapStateToProps should map countriesForLocationSelector from countriesForLocationSelector on state', () => {
      const Geograpy = Immutable.Record({
          countriesForLocationSelector: countriesForLocationSelector
        }), App = Immutable.Record({
          geography: new Geograpy()
        })

      const state = new App()
      assert.deepEqual(mapStateToProps(state, { initialValues: { get: () => 'selected id' }}), {
        countries: countriesForLocationSelector,
        selectedCountryId: 'selected id',
        selectedStateId: 'selected id',
        selectedLgaId: 'selected id'
      })
    })
  })
})
