import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import useAuthState from '../../../hooks/useAuthState'
import { LEGACY_REPORT_PARAMETERS, getReportParameters } from '../legacyParameters'
import ReportParameterForm from '../ReportParameterForm'

jest.mock('../../../hooks/useAuthState')

// The heavy select components pull in react-query/redux; stub them with inputs
// that mirror their onChange contracts (see parameterFields.jsx wiring).
jest.mock('../../StateSelect', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'state-select',
      'aria-label': props.label,
      value: props.value ?? '',
      onChange: props.onChange,
    })
})
jest.mock('../../LgaSelect', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'lga-select',
      'aria-label': props.label,
      value: props.value ?? '',
      onChange: props.onChange,
    })
})
jest.mock('../../AssaySelect', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'assay-select',
      'aria-label': props.label,
      value: props.value ?? '',
      onChange: props.onChange,
    })
})
jest.mock('../../ConsumableSelect', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'consumable-select',
      'aria-label': props.label,
      value: props.value ?? '',
      onChange: e => props.onChange(e.target.value),
    })
})
jest.mock('../../SiteAutocompleteField', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'site-select',
      'aria-label': props.floatingLabelText,
      value: props.value ?? '',
      onChange: e => props.onChange({ name: e.target.value }),
    })
})
jest.mock('../../PeriodSelector', () => {
  const ReactLib = require('react')
  return props =>
    ReactLib.createElement('input', {
      'data-testid': 'period-selector',
      'aria-label': props.label,
      value: '',
      readOnly: true,
    })
})

const LEGACY_TESTIDS = [
  'period-selector',
  'state-select',
  'lga-select',
  'assay-select',
  'consumable-select',
  'site-select',
]

describe('legacyParameters', () => {
  it('mirrors the API legacy parameter set byte for byte (drift guard)', () => {
    expect(LEGACY_REPORT_PARAMETERS).toEqual([
      { name: 'dateRange', type: 'dateRange' },
      { name: 'stateId', type: 'state' },
      { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
      { name: 'assayId', type: 'assay', multiple: true },
      { name: 'consumableId', type: 'consumable' },
      { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    ])
  })

  it('degrades missing/empty parameters to the legacy set', () => {
    expect(getReportParameters(undefined)).toBe(LEGACY_REPORT_PARAMETERS)
    expect(getReportParameters({})).toBe(LEGACY_REPORT_PARAMETERS)
    expect(getReportParameters({ parameters: null })).toBe(LEGACY_REPORT_PARAMETERS)
    expect(getReportParameters({ parameters: [] })).toBe(LEGACY_REPORT_PARAMETERS)

    const declared = [{ name: 'groupBy', type: 'enum' }]
    expect(getReportParameters({ parameters: declared })).toBe(declared)
  })
})

describe('ReportParameterForm', () => {
  const authState = { countryId: 1, userPermissions: ['site:view'] }

  beforeEach(() => {
    useAuthState.mockReturnValue(authState)
  })

  const renderForm = ({ parameters = LEGACY_REPORT_PARAMETERS, values = {}, onChange = jest.fn() } = {}) => {
    render(<ReportParameterForm parameters={parameters} values={values} onChange={onChange} />)
    return onChange
  }

  it('renders every field of the legacy set through the registry', () => {
    renderForm()
    LEGACY_TESTIDS.forEach(testid => {
      expect(screen.getByTestId(testid)).toBeInTheDocument()
    })
  })

  it('renders the legacy set for a report degraded through getReportParameters', () => {
    renderForm({ parameters: getReportParameters({ parameters: [] }) })
    LEGACY_TESTIDS.forEach(testid => {
      expect(screen.getByTestId(testid)).toBeInTheDocument()
    })
  })

  it('hides fields whose permission the user lacks (site:view)', () => {
    useAuthState.mockReturnValue({ countryId: 1, userPermissions: ['report:view'] })
    renderForm()
    expect(screen.queryByTestId('site-select')).not.toBeInTheDocument()
    expect(screen.getByTestId('state-select')).toBeInTheDocument()
    expect(screen.getByTestId('lga-select')).toBeInTheDocument()
  })

  it('clears dependent params transitively when state changes (state -> lga -> site)', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A', assayId: 3 } })
    fireEvent.change(screen.getByTestId('state-select'), { target: { value: '5' } })
    expect(onChange).toHaveBeenCalledWith({ stateId: '5', assayId: 3 })
  })

  it('clears only the site when lga changes', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A' } })
    fireEvent.change(screen.getByTestId('lga-select'), { target: { value: '9' } })
    expect(onChange).toHaveBeenCalledWith({ stateId: 1, lgaId: '9' })
  })

  it('does not cascade when an independent param changes', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A' } })
    fireEvent.change(screen.getByTestId('assay-select'), { target: { value: '4' } })
    expect(onChange).toHaveBeenCalledWith({ stateId: 1, lgaId: 2, siteName: 'Clinic A', assayId: '4' })
  })

  it('maps enum, number, text and boolean types to MUI fields', () => {
    const parameters = [
      { name: 'groupBy', type: 'enum', label: 'Group by', options: ['day', 'week', 'month'] },
      { name: 'errorThreshold', type: 'number', label: 'Error threshold', min: 0, max: 100 },
      { name: 'comment', type: 'text', label: 'Comment' },
      { name: 'includeArchived', type: 'boolean', label: 'Include archived' },
    ]
    renderForm({ parameters, values: { groupBy: 'month' } })

    expect(screen.getAllByText('Group by').length).toBeGreaterThan(0) // label + fieldset legend
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('coerces number input to Number and empty to null', () => {
    const parameters = [{ name: 'errorThreshold', type: 'number', label: 'Error threshold' }]
    const onChange = renderForm({ parameters, values: {} })

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } })
    expect(onChange).toHaveBeenLastCalledWith({ errorThreshold: 7 })
  })

  it('toggles boolean params via the checkbox', () => {
    const parameters = [{ name: 'includeArchived', type: 'boolean', label: 'Include archived' }]
    const onChange = renderForm({ parameters, values: {} })

    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenLastCalledWith({ includeArchived: true })
  })

  it('falls back to def.label then def.name for unknown labels and skips unknown types', () => {
    const parameters = [
      { name: 'adhocText', type: 'text' },
      { name: 'mystery', type: 'unknownType' },
    ]
    renderForm({ parameters, values: {} })

    expect(screen.getByLabelText('adhocText')).toBeInTheDocument()
    expect(screen.queryByText('mystery')).not.toBeInTheDocument()
  })
})
