import isPromise from 'is-promise'
import _fp from 'lodash/fp'
import React, { PureComponent, PropTypes } from 'react'
import createHelper from 'recompose/createHelper'
import createEagerFactory from 'recompose/createEagerFactory'

export const normalChangeEventReader = event => event.target.value

const mapFieldNames = _fp.map((fieldNameLike) => (
  _fp.isObject(fieldNameLike) ? fieldNameLike : {
    fieldName: fieldNameLike,
    valueFromChangeEvent: normalChangeEventReader
  })
)

const createFieldListHandlers = _fp.reduce((acc, {fieldName, valueFromChangeEvent}) => {
  const fieldNameUpperFirst = _fp.upperFirst(fieldName)

  return _fp.mergeAll([acc, {
    state: {
      meta: {
        [fieldName]: {
          touched: false,
          error: null
        }
      }
    },
    handlers: {
      [`onChange${fieldNameUpperFirst}`]: function (event) {
        const value = valueFromChangeEvent(event)
        const nextValues = {
          ...this.props.values,
          [fieldName]: value
        }

        this.props.onChange(nextValues)
        const nextState = this.validateFields(nextValues)
        this.setState(state => _fp.mergeAll([state, nextState, {
          meta: {
            [fieldName]: {
              touched: true
            }
          }
        }]))
      }
    }
  }, {}])
})

const createFormHandlers = fieldNameList => {
  return {
    state: {
      form: {
        pristine: true,
        valid: true,
        submitting: false,
        submitSucceed: false
      }
    },
    handlers: {
      handleSubmit: function(event) {
        event.preventDefault()
        event.stopPropagation()

        const nextState = this.validateFields()
        this.setState(state => _fp.mergeAll([state, nextState]))
        if (!nextState.form.valid) {
          return
        }
        const result = this.props.onSubmit(this.props.values)
        if (!isPromise(result)) {
          return
        }
        this.handleSubmitting()
        result.then(this.handleSubmitSucceed, this.handleSubmitFailed)
      }
    }
  }
}

/*
 * An HOC that provides various form handlers/props to BaseComponent.
 * Given the fields = ['name'], we will get:
 *
 * 1. form state:
 *   props.form = {
        valid: PropTypes.bool
        pristine: PropTypes.bool
        submitting: PropTypes.bool
        submitSucceed: PropTypes.bool
     }
     props.handleSubmit: a callback that should be passed into <form onSubmit={props.handleSubmit} />
 * 2. field state:
     props.meta.name = {
       touched: PropTypes.bool
       error: PropTypes.any
     }
     props.onChangeName: a callback that should be passed into <input onChange={props.onChangeName} />
 *
 * The valid/error properties reflects the result of calling `validate(values)`.
 * By default, onChangeName will reads input value from `event.target.value`.
 * If your change handler does differently, customize it when initializing recomposeForm:
 *
     recomposeForm = ({
       fields: [{
         fieldName: 'siteId',
         valueFromChangeEvent: it => it.value
       }],
       validate
     })
 */
const recomposeForm = ({
  fields: fieldNameLikeList,
  validate
}) => BaseComponent => {
  const fieldNameList = mapFieldNames(fieldNameLikeList)
  const factory = createEagerFactory(BaseComponent)

  return class extends PureComponent {

    constructor(...args) {
      super(...args)

      const {state, handlers} = createFieldListHandlers(
        createFormHandlers(fieldNameList),
        fieldNameList
      )
      this.state = state
      this.handlers = _fp.mapValues(_fp.bind(_fp.placeholder, this), handlers)
    }

    validateFields = (values = this.props.values) => {
      const errors = validate(values)

      const meta = _fp.reduce((acc, {fieldName}) => {
        const error = errors[fieldName]
        if (error) {
          return {
            ...acc,
            [fieldName]: {
              error
            }
          }
        } else {
          return {
            ...acc,
            [fieldName]: {
              error: null
            }
          }
        }
      }, {}, fieldNameList)

      return {
        meta,
        form: {
          pristine: false,
          valid: _fp.isEmpty(errors)
        }
      }
    }

    handleFormStateChange = form => (
        this.setState(state => _fp.mergeAll([state, { form }]))
    )

    handleSubmitting = _ => {
      this.handleFormStateChange({
        submitting: true
      })
    }

    handleSubmitSucceed = _ => {
      this.handleFormStateChange({
        pristine: true,
        submitting: false,
        submitSucceed: true
      })
    }

    handleSubmitFailed = _ => {
      this.handleFormStateChange({
        valid: false,
        submitting: false,
        submitSucceed: false
      })
    }

    render() {
      return factory({
        ...this.props,
        ...this.state,
        ...this.handlers
      })
    }
  }
}

export default createHelper(recomposeForm, 'recomposeForm')
