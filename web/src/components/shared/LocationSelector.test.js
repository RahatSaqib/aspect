import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
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
    }), countriesForLocationSelector = new CountriesForSelectLists({
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
        fetchCountriesForLocationSelector: () => {},
        countriesForLocationSelector: countriesForLocationSelector,
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        disabled: false,
        initialCountryId: null,
        initialStateId: null,
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
        disabled: props.disabled || countriesForLocationSelector.get('loading') || !countriesForLocationSelector.get('countries').size,
        dataSource: countriesForLocationSelector.get('countries').toJS(),
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
          expectedCountryToSelect = countriesForLocationSelector.get('countries')
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
          selectedCountry = countriesForLocationSelector.get('countries')
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
    let reactReduxStub, intlStub, mapStateToProps, mapDispatchToProps, reduxStub, geographyCreatorsStub
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
        fetchCountriesForLocationSelector: () => {}
      }
      proxyquire('./LocationSelector', {
        'react-intl': intlStub,
        'react-redux': reactReduxStub,
        'redux': reduxStub,
        '../../action_creators/geography_creators': geographyCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchCountriesForLocationSelector action creators to the component\'s properties', () => {
      const expectedDispatcher = {value: 'I am a dispatch function'}
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [{
        fetchCountriesForLocationSelector: geographyCreatorsStub.fetchCountriesForLocationSelector},
        expectedDispatcher])
    })

    it('mapStateToProps should map countriesForLocationSelector from countriesForLocationSelector on state', () => {
      const state = {
        countriesForLocationSelector: countriesForLocationSelector
      }
      assert.deepEqual(mapStateToProps(state), {
        countriesForLocationSelector: countriesForLocationSelector
      })
    })
  })
})
