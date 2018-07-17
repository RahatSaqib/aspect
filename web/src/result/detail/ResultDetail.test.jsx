import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Immutable from 'immutable'
import _ from 'lodash'
import { Button } from 'react-toolbox/lib/button'
import { ResultDetail } from './ResultDetail'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import { ExpansionPanelHeader } from '../../components/shared/expansionPanel'

describe('Result Detail screen', () => {
  const defaultProps = {
    match: { params: { resultId: 23048 } },
    result: Immutable.Map({
      id: 103897,
      assay: Immutable.Map({}),
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

      describe('When the user clicks on one of the buttons', () => {
        it("should update the value in the result's formData", () => {
          const resultDetailsScreen = renderResultDetailsScreen(
            propsWithFormSchemaInResult
          )
          const positiveOption = resultDetailsScreen
            .find(ExpansionPanelHeader)
            .filter({ label: 'Confirmed Interpretation of Result' })
            .find(Button)
            .filter({ 'data-value': 'positive' })
            .first()

          const { updateResultFormData, result } = propsWithFormSchemaInResult
          expect(updateResultFormData.callCount).toBe(0)

          positiveOption.simulate('click')

          expect(updateResultFormData.callCount).toBe(1)
          expect(updateResultFormData.lastCall.args).toEqual([
            result.get('id'),
            Object.keys(result.get('formSchema').toJS())[0],
            'positive',
          ])
        })
      })
    })

    describe('With multiple fields', () => {
      const propsWithFormSchemaInResult = _.merge({}, defaultProps, {
        result: Immutable.Map({
          id: 103897,
          assay: Immutable.Map({}),
          formSchema: Immutable.Map({
            field1: Immutable.Map({
              i18nLabel: 'tags',
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
            field2: Immutable.Map({
              i18nLabel: 'fieldFollowup',
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

      it('should show both form fields', () => {
        const resultDetailsScreen = renderResultDetailsScreen(
          propsWithFormSchemaInResult
        )
        const formDataSection = resultDetailsScreen
          .find(ExpansionPanelHeader)
          .filter({ label: 'Additional Result Details' })
        expect(formDataSection.length).toEqual(1)
        const fields = formDataSection.find(FormGroup)
        expect(fields.length).toEqual(2)
      })
    })

    describe('With unrecognised field types', () => {
      const propsWithFormSchemaInResult = _.merge({}, defaultProps, {
        result: Immutable.Map({
          id: 103897,
          assay: Immutable.Map({}),
          formSchema: Immutable.Map({
            field1: Immutable.Map({
              i18nLabel: 'tags',
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
            field2: Immutable.Map({
              i18nLabel: 'fieldFollowup',
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
            field3: Immutable.Map({
              i18nLabel: 'fieldFollowup',
              control: Immutable.Map({
                type: 'UnrecognisedType',
              }),
            }),
          }),
        }),
      })

      it('should only render the fields where the type is recognised', () => {
        const resultDetailsScreen = renderResultDetailsScreen(
          propsWithFormSchemaInResult
        )
        const formDataSection = resultDetailsScreen
          .find(ExpansionPanelHeader)
          .filter({ label: 'Additional Result Details' })
        expect(formDataSection.length).toEqual(1)
        const fields = formDataSection.find(FormGroup)
        expect(fields.length).toEqual(2)
        expect(fields.get(0).props.label).toEqual('Tags')
        expect(fields.get(1).props.label).toEqual('Followup')
      })
    })

    describe('But is empty', () => {
      it('should not show the form fields section', () => {
        const resultDetailsScreen = renderResultDetailsScreen(
          _.merge({}, defaultProps, {
            result: Immutable.Map({
              id: 23454,
              assay: Immutable.Map({}),
              formSchema: Immutable.Map({}),
            }),
          })
        )

        const formDataSection = resultDetailsScreen
          .find(ExpansionPanelHeader)
          .filter({ label: 'Confirmed Interpretation of Result' })

        expect(formDataSection.length).toEqual(0)
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
