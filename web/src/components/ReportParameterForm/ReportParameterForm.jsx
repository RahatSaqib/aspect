import React, { useEffect, useState } from 'react'
import { FormHelperText, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import { defineMessages, useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages'
import FilterMessages from '../../messages/FilterMessages'
import reportMessages from '../../messages/report'
import { isPermittedUser } from '../shared/requirePermissions'
import parameterFields from './parameterFields'

const ownMessages = defineMessages({
  requiredField: {
    id: 'report.parameterForm.requiredField',
    defaultMessage: 'This field is required',
  },
})

// Clears (deletes) every declared param whose dependsOn chain leads back to the
// changed param, transitively — reproduces the legacy state -> lga -> site resets
// generically from the parameter definitions.
const applyDependsOnResets = (parameters, values, changedName) => {
  const next = { ...values }
  const clear = name => {
    parameters.forEach(def => {
      if (def.dependsOn === name) {
        delete next[def.name]
        clear(def.name)
      }
    })
  }
  clear(changedName)
  return next
}

// Per-type default labels, mirroring the legacy global filter (FilterContainer.Reports.jsx).
const defaultTypeLabel = (def, formatMessage, user) => {
  switch (def.type) {
    case 'state':
    case 'lga':
      return getCustomMessage(formatMessage, FilterMessages, def.type, user)
    case 'assay':
      return formatMessage(FilterMessages.assay)
    case 'consumable':
      return formatMessage(FilterMessages.consumable)
    case 'site':
      return formatMessage(FilterMessages.site)
    case 'dateRange':
      return formatMessage(FilterMessages.date)
    default:
      return undefined
  }
}

const isMissingValue = value => value === undefined || value === null || value === ''

// Mirrors the server rule: a dateRange param is missing only when BOTH bounds are
// missing — one bound satisfies `required`.
const isParamMissing = (def, values) =>
  def.type === 'dateRange'
    ? isMissingValue(values.minDate) && isMissingValue(values.maxDate)
    : isMissingValue(values[def.name])

const ReportParameterForm = ({ parameters, values, onChange, onValidityChange }) => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  // Params the user has interacted with since the form (re)received its parameters;
  // required errors only show after touch, never on open.
  const [touched, setTouched] = useState(() => new Set())

  useEffect(() => {
    setTouched(new Set())
  }, [parameters])

  const visibleParameters = parameters.filter(
    def => !def.permission || isPermittedUser(user.userPermissions, { required: [def.permission] })
  )

  // Validity is computed over VISIBLE params only: a permission-hidden required
  // field must never block submit (curation forbids that combination anyway).
  const isValid = visibleParameters.every(def => !def.required || !isParamMissing(def, values))

  useEffect(() => {
    if (onValidityChange) onValidityChange(isValid)
  }, [isValid, onValidityChange])

  // Pinned label resolution order: i18nKey (FilterMessages, then report messages)
  // -> per-type default -> def.label -> def.name.
  const getLabel = def => {
    const message = def.i18nKey && (FilterMessages[def.i18nKey] || reportMessages[def.i18nKey])
    const label = message ? formatMessage(message) : defaultTypeLabel(def, formatMessage, user) || def.label || def.name
    return def.required ? `${label} *` : label
  }

  const touch = name => setTouched(prev => (prev.has(name) ? prev : new Set(prev).add(name)))

  const set = (name, value) => onChange(applyDependsOnResets(parameters, { ...values, [name]: value }, name))

  return (
    <Grid container spacing={2}>
      {visibleParameters.map(def => {
        const Field = parameterFields[def.type]
        if (!Field) return null
        const fieldSet = (name, value) => {
          touch(def.name)
          set(name, value)
        }
        const fieldChange = next => {
          touch(def.name)
          onChange(next)
        }
        const showRequiredError = def.required && isParamMissing(def, values) && touched.has(def.name)
        return (
          <Grid item xs={12} sm={6} key={def.name}>
            <Field def={def} values={values} label={getLabel(def)} user={user} set={fieldSet} onChange={fieldChange} />
            {showRequiredError && <FormHelperText error>{formatMessage(ownMessages.requiredField)}</FormHelperText>}
          </Grid>
        )
      })}
    </Grid>
  )
}

ReportParameterForm.propTypes = {
  parameters: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      dependsOn: PropTypes.string,
      permission: PropTypes.string,
      i18nKey: PropTypes.string,
      label: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      min: PropTypes.number,
      max: PropTypes.number,
    })
  ).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidityChange: PropTypes.func,
}

ReportParameterForm.defaultProps = {
  onValidityChange: undefined,
}

export default ReportParameterForm
