import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import useAuthState from '../../../hooks/useAuthState'
import { getReportParameters } from '../getReportParameters'
import ReportParameterForm from '../ReportParameterForm'

vi.mock('../../../hooks/useAuthState')

// The heavy select components pull in react-query/redux; stub them with inputs
// that mirror their onChange contracts (see parameterFields.jsx wiring).
vi.mock('../../StateSelect', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'state-select',
        'aria-label': props.label,
        value: props.value ?? '',
        onChange: props.onChange,
      }),
  }
})
vi.mock('../../LgaSelect', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'lga-select',
        'aria-label': props.label,
        value: props.value ?? '',
        onChange: props.onChange,
      }),
  }
})
vi.mock('../../AssayMultiSelect', async () => {
  const { createElement } = await import('react')
  return {
    default: props => {
      const rawValue = props.value
      const displayValue = Array.isArray(rawValue) ? rawValue.join(',') : rawValue ?? ''
      return createElement('input', {
        'data-testid': 'assay-multi-select',
        'aria-label': props.label,
        value: displayValue,
        onChange: e => props.onChange(e.target.value ? e.target.value.split(',').map(Number) : []),
      })
    },
  }
})
vi.mock('../../AssaySelect', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'assay-select',
        'aria-label': props.label,
        value: props.value ?? '',
        onChange: props.onChange,
      }),
  }
})
vi.mock('../../ConsumableSelect', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'consumable-select',
        'aria-label': props.label,
        value: props.value ?? '',
        onChange: e => props.onChange(e.target.value),
      }),
  }
})
vi.mock('../../SiteAutocompleteField', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'site-select',
        'aria-label': props.floatingLabelText,
        value: props.value ?? '',
        onChange: e => props.onChange({ name: e.target.value }),
      }),
  }
})
vi.mock('../../PeriodSelector', async () => {
  const { createElement } = await import('react')
  return {
    default: props =>
      createElement('input', {
        'data-testid': 'period-selector',
        'aria-label': props.label,
        value: '',
        readOnly: true,
      }),
  }
})

const LEGACY_TESTIDS = [
  'period-selector',
  'state-select',
  'lga-select',
  'site-select',
  'assay-multi-select',
  'consumable-select',
]

// Wire shape of the pre-feature global filter set, shared flags derived server-side.
const GLOBAL_FILTER_PARAMETERS = [
  { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' }, shared: true },
  { name: 'stateId', type: 'state', shared: true },
  { name: 'lgaId', type: 'lga', dependsOn: 'stateId', shared: true },
  { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view', shared: true },
  { name: 'assayId', type: 'assay', multiple: true, shared: true },
  { name: 'consumableId', type: 'consumable', shared: true },
]

describe('getReportParameters', () => {
  it('returns the declared parameters and guards against a report not loaded yet', () => {
    const declared = [{ name: 'groupBy', type: 'enum' }]
    expect(getReportParameters({ parameters: declared })).toBe(declared)
    expect(getReportParameters(undefined)).toEqual([])
    expect(getReportParameters({})).toEqual([])
    expect(getReportParameters({ parameters: null })).toEqual([])
  })
})

describe('ReportParameterForm', () => {
  const authState = { countryId: 1, userPermissions: ['site:view'] }

  beforeEach(() => {
    useAuthState.mockReturnValue(authState)
  })

  const renderForm = ({ parameters = GLOBAL_FILTER_PARAMETERS, values = {}, onChange = vi.fn() } = {}) => {
    render(<ReportParameterForm parameters={parameters} values={values} onChange={onChange} />)
    return onChange
  }

  it('renders every field of the global filter set through the registry', () => {
    renderForm()
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

  it('omits cleared state instead of storing null and clears dependents', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A', assayId: 3 } })
    fireEvent.change(screen.getByTestId('state-select'), { target: { value: null } })
    expect(onChange).toHaveBeenCalledWith({ assayId: 3 })
  })

  it('omits cleared lga instead of storing null and clears site', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A' } })
    fireEvent.change(screen.getByTestId('lga-select'), { target: { value: null } })
    expect(onChange).toHaveBeenCalledWith({ stateId: 1 })
  })

  it('clears only the site when lga changes', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A' } })
    fireEvent.change(screen.getByTestId('lga-select'), { target: { value: '9' } })
    expect(onChange).toHaveBeenCalledWith({ stateId: 1, lgaId: '9' })
  })

  it('does not cascade when an independent param changes', () => {
    const onChange = renderForm({ values: { stateId: 1, lgaId: 2, siteName: 'Clinic A' } })
    fireEvent.change(screen.getByTestId('assay-multi-select'), { target: { value: '4' } })
    expect(onChange).toHaveBeenCalledWith({ stateId: 1, lgaId: 2, siteName: 'Clinic A', assayId: [4] })
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

  it('coerces number input to Number', () => {
    const parameters = [{ name: 'errorThreshold', type: 'number', label: 'Error threshold' }]
    const onChange = renderForm({ parameters, values: {} })

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } })
    expect(onChange).toHaveBeenLastCalledWith({ errorThreshold: 7 })
  })

  it('omits cleared number values instead of storing null', () => {
    const parameters = [{ name: 'errorThreshold', type: 'number', label: 'Error threshold' }]
    const onChange = renderForm({ parameters, values: { errorThreshold: 7 } })

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({})
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

describe('ReportParameterForm required UX', () => {
  beforeEach(() => {
    useAuthState.mockReturnValue({ countryId: 1, userPermissions: ['site:view'] })
  })

  // Controlled harness so touched tracking and validity react to real value flow.
  const StatefulForm = ({ parameters, initialValues = {}, onValidityChange = undefined }) => {
    const [values, setValues] = React.useState(initialValues)
    return (
      <ReportParameterForm
        parameters={parameters}
        values={values}
        onChange={setValues}
        onValidityChange={onValidityChange}
      />
    )
  }

  const requiredText = [{ name: 'comment', type: 'text', label: 'Comment', required: true }]

  it('marks required fields with an asterisk but shows no error before the field is touched', () => {
    render(<StatefulForm parameters={requiredText} />)
    expect(screen.getByLabelText('Comment *')).toBeInTheDocument()
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
  })

  it('shows the required error only after the field was touched and left empty', () => {
    render(<StatefulForm parameters={requiredText} />)
    const input = screen.getByLabelText('Comment *')
    fireEvent.change(input, { target: { value: 'x' } })
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('reports validity: false while a required field is empty, true once filled', () => {
    const onValidityChange = vi.fn()
    render(<StatefulForm parameters={requiredText} onValidityChange={onValidityChange} />)
    expect(onValidityChange).toHaveBeenLastCalledWith(false)
    fireEvent.change(screen.getByLabelText('Comment *'), { target: { value: 'hello' } })
    expect(onValidityChange).toHaveBeenLastCalledWith(true)
  })

  it('reports validity true for the global filter set (nothing required)', () => {
    const onValidityChange = vi.fn()
    render(<StatefulForm parameters={GLOBAL_FILTER_PARAMETERS} onValidityChange={onValidityChange} />)
    expect(onValidityChange).toHaveBeenLastCalledWith(true)
  })

  it('never blocks submit on a permission-hidden required field', () => {
    useAuthState.mockReturnValue({ countryId: 1, userPermissions: [] })
    const parameters = [{ name: 'siteName', type: 'site', required: true, permission: 'site:view' }]
    const onValidityChange = vi.fn()
    render(<StatefulForm parameters={parameters} onValidityChange={onValidityChange} />)
    expect(screen.queryByTestId('site-select')).not.toBeInTheDocument()
    expect(onValidityChange).toHaveBeenLastCalledWith(true)
  })

  it('accepts one bound as satisfying a required dateRange', () => {
    const parameters = [{ name: 'dateRange', type: 'dateRange', required: true }]
    const onValidityChange = vi.fn()
    render(
      <StatefulForm
        parameters={parameters}
        initialValues={{ minDate: new Date() }}
        onValidityChange={onValidityChange}
      />
    )
    expect(onValidityChange).toHaveBeenLastCalledWith(true)
  })

  it('reports validity false for a required dateRange with both bounds missing', () => {
    const parameters = [{ name: 'dateRange', type: 'dateRange', required: true }]
    const onValidityChange = vi.fn()
    render(<StatefulForm parameters={parameters} onValidityChange={onValidityChange} />)
    expect(onValidityChange).toHaveBeenLastCalledWith(false)
  })
})
