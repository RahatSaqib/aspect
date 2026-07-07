import React from 'react'
import { Grid } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages'
import FilterMessages from '../../messages/FilterMessages'
import reportMessages from '../../messages/report'
import { isPermittedUser } from '../shared/requirePermissions'
import parameterFields from './parameterFields'

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

const ReportParameterForm = ({ parameters, values, onChange }) => {
  const { formatMessage } = useIntl()
  const user = useAuthState()

  // Pinned label resolution order: i18nKey (FilterMessages, then report messages)
  // -> per-type default -> def.label -> def.name.
  const getLabel = def => {
    const message = def.i18nKey && (FilterMessages[def.i18nKey] || reportMessages[def.i18nKey])
    if (message) return formatMessage(message)
    return defaultTypeLabel(def, formatMessage, user) || def.label || def.name
  }

  const set = (name, value) => onChange(applyDependsOnResets(parameters, { ...values, [name]: value }, name))

  const visibleParameters = parameters.filter(
    def => !def.permission || isPermittedUser(user.userPermissions, { required: [def.permission] })
  )

  return (
    <Grid container spacing={2}>
      {visibleParameters.map(def => {
        const Field = parameterFields[def.type]
        if (!Field) return null
        return (
          <Grid item xs={12} sm={6} key={def.name}>
            <Field def={def} values={values} label={getLabel(def)} user={user} set={set} onChange={onChange} />
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
}

export default ReportParameterForm
