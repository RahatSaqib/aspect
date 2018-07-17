import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Immutable from 'immutable'
import _ from 'lodash'
import { Button } from 'react-toolbox/lib/button'
import { ResultDetail } from './ResultDetail'
import { ExpansionPanelHeader } from '../../components/shared/expansionPanel'

describe('Result Detail screen', () => {
  const defaultProps = {
    match: { params: { resultId: 23048 } },
    result: Immutable.Map({
      assay: {},
    }),
    updateTags() {},
    fetchSingleResult() {},
    fetchResultLog() {},
    fetchTags() {},
    updateResultFormData: sinon.spy(),
    updateResultQcCheck() {},
    deviceLogs: Immutable.List([]),
    intl: {
      formatMessage(message) {
        return message.defaultMessage
      },
    },
    token: '',
    screenSchema: {},
    resultTags: Immutable.List([]),
    editable: false,
  }
  function renderResultDetailsScreen(props) {
    return shallow(<ResultDetail {...props} />)
  }

  describe('When a form schema exists for the result', () => {
    describe('With a single ButtonGroup field', () => {
      const propsWithFormSchemaInResult = _.merge({}, defaultProps, {
        result: Immutable.Map({
          id: 103897,
          assay: Immutable.Map({}),
          formSchema: Immutable.Map({
            expertInterpretation: Immutable.Map({
              i18nLabel: 'confirmedInterpretationOfResult',
              control: Immutable.Map({
                type: 'ButtonGroup',
                allowMultipleSelection: false,
                options: Immutable.List([
                  Immutable.Map({
                    i18nText: 'none',
                    value: null,
                  }),
                  Immutable.Map({
                    i18nText: 'negative',
                    value: 'negative',
                  }),
                  Immutable.Map({
                    i18nText: 'positive',
                    value: 'positive',
                  }),
                  Immutable.Map({
                    i18nText: 'uninterpretable',
                    value: 'uninterpretable',
                  }),
                ]),
              }),
            }),
          }),
        }),
      })

      it('should show a ButtonGroup form field', () => {
        const resultDetailsScreen = renderResultDetailsScreen(
          propsWithFormSchemaInResult
        )
        const formDataSection = resultDetailsScreen
          .find(ExpansionPanelHeader)
          .filter({ label: 'Confirmed Interpretation of Result' })
        expect(formDataSection.length).toEqual(1)
      })

      it('should select the null option for a field when no value has been set', () => {
        const resultDetailsScreen = renderResultDetailsScreen(
          propsWithFormSchemaInResult
        )
        const optionButtons = resultDetailsScreen
          .find(ExpansionPanelHeader)
          .filter({ label: 'Confirmed Interpretation of Result' })
          .find(Button)
        const nullOptionButton = optionButtons
          .filter({ 'data-value': null })
          .first()
        expect(nullOptionButton.props.inverse).toBeFalsy()
        const notNullOptionButtons = optionButtons.filterWhere(
          button => button.props['data-value']
        )
        notNullOptionButtons.forEach(button =>
          expect(button.props.inverse).toBeTruthy()
        )
      })
    })
  })

  describe('When a form schema does not exist for the result', () => {
    it('should not show the form fields section', () => {
      const resultDetailsScreen = renderResultDetailsScreen(defaultProps)
      const formDataSection = resultDetailsScreen
        .find(ExpansionPanelHeader)
        .filter({ label: 'Confirmed Interpretation of Result' })
      expect(formDataSection.length).toEqual(0)
    })
  })
})
