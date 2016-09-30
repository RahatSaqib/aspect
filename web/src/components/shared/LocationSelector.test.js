import React from 'react'
import { assert } from 'chai'
import { shallow, mount } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import _ from 'lodash'
import SelectInput from './SelectInput'

describe('LocationSelector Component', () => {
  const CountriesForSelectLists = Immutable.Record({
      loading: false,
      countries: Immutable.List(),
      lastRefreshed: undefined
    }), countriesForSelectLists = new CountriesForSelectLists({
      countries: Immutable.List([{
        id: 1,
        name: 'United States',
        states: [{
          id: 1,
          name: 'Massachusetts',
          lgas: [{ id: 1, name: 'Franklin' }, { id: 2, name: 'Suffolk' }]
        }, {
          id: 2,
          name: 'Nebraska',
          lgas: [{ id: 3, name: 'Hall' }, { id: 4, name: 'Gage' }, { id: 5, name: 'Lancaster' }, { id: 6, name: 'Wayne' }]
        }]
      }, {
        id: 2,
        name: 'South Africa',
        states: [{
          id: 3,
          name: 'Eastern Cape',
          lgas: [{ id: 7, name: 'East London' }, { id: 8, name: 'Uitenhage' }]
        }, {
          id: 4,
          name: 'KwaZulu Natal',
          lgas: [{ id: 9, name: 'Durban' }, { id: 10, name: 'Nottingham Road' }]
        }]
      }]),
      loading: false,
      lastRefreshed: new Date()
    })

  describe('LocationSelector', () => {
    const fakeReactRedux = {
      connect: () => component => component
    }, fakeRedux = {
      bindActionCreators: (actionCreators) => actionCreators
    }, LocationSelector = proxyquire('./LocationSelector', {
      'react-redux': fakeReactRedux,
      'redux': fakeRedux
    }).default

    let props, LocationSelectorWrapper

    const shallowRenderLocationSelector = () => {
      LocationSelectorWrapper = shallow(<LocationSelector {...props} />)
    }

    beforeEach(() => {
      props = {
        fetchCountriesForSelectLists: () => {},
        countriesForSelectLists: countriesForSelectLists,
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        disabled: false,
        initialCountryId: null,
        initialStateId: null
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
        disabled: props.disabled || countriesForSelectLists.get('loading') || !countriesForSelectLists.get('countries').size,
        dataSource: countriesForSelectLists.get('countries').toJS(),
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
      it('Should set the selected country on the component\'s state', () => {
        const countrySelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.countryIdFieldName),
          selectCountryId = 1,
          expectedCountryToSelect = countriesForSelectLists.get('countries')
            .find(country => country.id === selectCountryId)
        assert.equal(LocationSelectorWrapper.state('selectedCountry'), undefined)

        countrySelect.simulate('change', undefined, undefined, selectCountryId)

        assert.deepEqual(LocationSelectorWrapper.state('selectedCountry'), expectedCountryToSelect)

        countrySelect.simulate('change', undefined, undefined, selectCountryId)

        assert.deepEqual(LocationSelectorWrapper.state('selectedCountry'), expectedCountryToSelect)
      })
    })

    describe('selectState', () => {
      it('Should set the selected state on the component\'s state', () => {
        const selectedCountryId = 2,
          selectedCountry = countriesForSelectLists.get('countries')
            .find(country => country.id === selectedCountryId)
        shallowRenderLocationSelector()
        LocationSelectorWrapper.setState({
          selectedCountry: selectedCountry
        })
        const stateSelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.stateIdFieldName),
          selectStateId = 3,
          expectedStateToSelect = _.find(selectedCountry.states, {id: selectStateId})
        assert.equal(LocationSelectorWrapper.state('selectedState'), undefined)

        stateSelect.simulate('change', undefined, undefined, selectStateId)

        assert.deepEqual(LocationSelectorWrapper.state('selectedState'), expectedStateToSelect)

        stateSelect.simulate('change', undefined, undefined, selectStateId)

        assert.deepEqual(LocationSelectorWrapper.state('selectedState'), expectedStateToSelect)
      })
    })
  })

  describe('react-redux connect', () => {
    const expectedBoundActionCreators = { value: 'Bound Action Creators' }
    let reactReduxStub, mapStateToProps, mapDispatchToProps, reduxStub, countryCreatorsStub
    beforeEach(() => {
      reactReduxStub = {
        connect: sinon.stub().returns(() => {})
      }
      reduxStub = {
        bindActionCreators: sinon.stub().returns(expectedBoundActionCreators)
      }
      countryCreatorsStub = {
        fetchCountriesForSelectLists: () => {}
      }
      proxyquire('./LocationSelector', {
        'react-redux': reactReduxStub,
        'redux': reduxStub,
        '../../action_creators/country_creators': countryCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchCountriesForSelectLists action creators to the component\'s properties', () => {
      const expectedDispatcher = {value: 'I am a dispatch function'}
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [countryCreatorsStub, expectedDispatcher])
    })

    it('mapStateToProps should map countriesForSelectLists from countriesForSelectLists on state', () => {
      const state = {
        countriesForSelectLists: countriesForSelectLists
      }
      assert.deepEqual(mapStateToProps(state), {
        countriesForSelectLists: countriesForSelectLists
      })
    })
  })
})
