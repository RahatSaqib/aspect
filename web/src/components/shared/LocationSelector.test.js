import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import SelectInput from './SelectInput'

describe('LocationSelector Component', () => {
  const now = new Date(),
    LazyLoadItems = Immutable.Record({
      loading: false,
      items: Immutable.List(),
      lastRefreshed: undefined
    }), LazyLoadParent = Immutable.Record({
      id: undefined,
      name: undefined,
      children: new LazyLoadItems()
    }), LazyLoadChild = Immutable.Record({
      id: undefined,
      name: undefined
    }),
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
        fetchCountriesForLocationSelector: () => {},
        fetchStatesForLocationSelector: () => {},
        fetchLgasForLocationSelector: () => {},
        countries: countriesForLocationSelector,
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        disabled: false,
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
      it('Should set the selected country on the component\'s state', () => {
        const countrySelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.countryIdFieldName),
          selectCountryId = 1,
          expectedCountryToSelect = countriesForLocationSelector.get('items')
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
        const selectedCountryId = 1,
          selectedCountry = countriesForLocationSelector.get('items')
            .find(country => country.id === selectedCountryId)
        shallowRenderLocationSelector()
        LocationSelectorWrapper.setState({
          selectedCountry: selectedCountry
        })
        const stateSelect = LocationSelectorWrapper.findWhere(
          selectInput => selectInput.type() === SelectInput &&
          selectInput.props().name === props.stateIdFieldName),
          selectStateId = 3,
          expectedStateToSelect = selectedCountry.children.items.find(
            state => state.id === selectStateId)
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
        fetchCountriesForLocationSelector: () => {},
        fetchStatesForLocationSelector: () => {},
        fetchLgasForLocationSelector: () => {}
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
        fetchCountriesForLocationSelector: geographyCreatorsStub.fetchCountriesForLocationSelector,
        fetchStatesForLocationSelector: geographyCreatorsStub.fetchStatesForLocationSelector,
        fetchLgasForLocationSelector: geographyCreatorsStub.fetchLgasForLocationSelector
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
      assert.deepEqual(mapStateToProps(state), {
        countries: countriesForLocationSelector
      })
    })
  })
})
