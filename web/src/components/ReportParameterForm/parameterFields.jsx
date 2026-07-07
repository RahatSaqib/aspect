import React from 'react'
import { Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material'
import AssaySelect from '../AssaySelect'
import ConsumableSelect from '../ConsumableSelect'
import LgaSelect from '../LgaSelect'
import PeriodSelector from '../PeriodSelector'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import StateSelect from '../StateSelect'

// Registry: parameter type -> field renderer. Wiring is copied verbatim from the
// legacy global filter (FilterContainer.Reports.jsx) so behavior is identical.
// Each renderer receives { def, values, label, user, set, onChange } where
// set(name, value) applies the value plus the dependsOn cascade resets and
// onChange replaces the whole values object.
const parameterFields = {
  state: ({ def, values, label, user, set }) => (
    <StateSelect
      label={label}
      value={values[def.name]}
      onChange={e => set(def.name, e.target.value)}
      countryId={user.countryId}
    />
  ),
  lga: ({ def, values, label, set }) => (
    <LgaSelect
      label={label}
      value={values[def.name]}
      onChange={e => set(def.name, e.target.value)}
      stateId={values.stateId}
    />
  ),
  assay: ({ def, values, label, set }) => (
    <AssaySelect label={label} value={values[def.name]} onChange={e => set(def.name, e.target.value)} onlyResults />
  ),
  consumable: ({ def, values, label, set }) => (
    <ConsumableSelect valueBy="id" label={label} value={values[def.name]} onChange={value => set(def.name, value)} />
  ),
  site: ({ def, values, label, set }) => (
    <SiteAutoCompleteField
      name={def.name}
      value={values[def.name] || ''}
      onChange={site => set(def.name, site.name)}
      floatingLabelFixed
      floatingLabelText={label}
      stateId={values.stateId}
      lgaId={values.lgaId}
      width="100%"
    />
  ),
  dateRange: ({ values, label, onChange }) => (
    <PeriodSelector
      label={label}
      minDate={values.minDate || null}
      maxDate={values.maxDate || null}
      onChange={dateValues => onChange({ ...values, ...dateValues })}
    />
  ),
  enum: ({ def, values, label, set }) => (
    <TextField
      select
      fullWidth
      label={label}
      value={values[def.name] ?? ''}
      onChange={e => set(def.name, e.target.value)}
    >
      {(def.options || []).map(option => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  ),
  number: ({ def, values, label, set }) => (
    <TextField
      type="number"
      fullWidth
      label={label}
      value={values[def.name] ?? ''}
      onChange={e => set(def.name, e.target.value === '' ? null : Number(e.target.value))}
      inputProps={{ min: def.min, max: def.max }}
    />
  ),
  text: ({ def, values, label, set }) => (
    <TextField fullWidth label={label} value={values[def.name] ?? ''} onChange={e => set(def.name, e.target.value)} />
  ),
  boolean: ({ def, values, label, set }) => (
    <FormControlLabel
      label={label}
      control={<Checkbox checked={Boolean(values[def.name])} onChange={e => set(def.name, e.target.checked)} />}
    />
  ),
}

export default parameterFields
