/* eslint-disable no-prototype-builtins */
import React from 'react'
import { Autocomplete, useTheme, TextField, useMediaQuery } from '@mui/material'
import filter from 'lodash/filter'
import startCase from 'lodash/startCase'
import { defineMessages } from 'react-intl'
import { VariableSizeList } from 'react-window'
import { i18nWrapper } from '../../../../../providers/I18nProvider'

const messages = defineMessages({
  noOptions: {
    id: 'form.noOptions',
    defaultMessage: 'No options',
  },
})

/**
 * this component should not contain **ANY**
 * new styles, logic or functions
 */

const PureSelect = props => {
  const { formatMessage } = i18nWrapper()

  const { inputProps, form } = props
  const { id, disabled, label, type, variant, options, initialValue, renderOption: RenderComponent } = inputProps
  const { errors, touched, handleBlur, values, setFieldValue } = form
  const value = filter(options, { value: values[id] })[0] || null

  return (
    <Autocomplete
      id={`select-${id}`}
      disabled={disabled}
      autoSelect
      options={options || []}
      getOptionLabel={option => option?.label || ''}
      noOptionsText={formatMessage(messages.noOptions)}
      defaultValue={initialValue}
      value={value}
      onChange={(_e, selected) => setFieldValue(id, selected?.value || '')}
      onBlur={handleBlur}
      renderOption={(props, option) =>
        RenderComponent ? <RenderComponent {...props} option={option} /> : <div {...props}>{option.label}</div>
      }
      renderInput={params => (
        <TextField
          {...params}
          fullWidth
          id={id}
          name={id}
          label={label || startCase(id)}
          type={type}
          inputProps={{
            ...params.inputProps,
            autoComplete: `select-${id}`,
          }}
          variant={variant || 'standard'}
          error={touched[id] && Boolean(errors[id])}
          helperText={touched[id] && errors[id]}
        />
      )}
      disableListWrap
      ListboxComponent={ListboxComponent}
      renderGroup={params => params}
      // renderOption={(props, option) => [props, option]}
    />
  )
}

PureSelect.whyDidYouRender = false

export default PureSelect

const LISTBOX_PADDING = 8 // px

// all the following logic is to enable a virtual list of options and prevent it to
// be outside the viewport. See ASP-5386 and https://mui.com/material-ui/react-autocomplete/#virtualization
function renderRow(props) {
  const { data, index, style } = props
  const dataSet = data[index]
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  }

  return <div style={inlineStyle}>{dataSet}</div>
}

const OuterElementContext = React.createContext({})

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext)
  return <div ref={ref} {...props} {...outerProps} />
})

function useResetCache(data) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true)
    }
  }, [data])
  return ref
}

const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props

  const theme = useTheme()
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true })

  const itemCount = children.length
  const itemSize = smUp ? 36 : 48

  const getChildSize = child => {
    // eslint-disable-next-line no-prototype-builtins
    if (child.hasOwnProperty('group')) {
      return 48
    }

    return itemSize
  }

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize
    }
    return children.map(getChildSize).reduce((a, b) => a + b, 0)
  }

  const gridRef = useResetCache(itemCount)

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={children}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={index => getChildSize(children[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  )
})
