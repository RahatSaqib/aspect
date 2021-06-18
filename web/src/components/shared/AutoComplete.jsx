import React, { useRef, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import Downshift from 'downshift'
import { withStyles } from '@material-ui/styles'
import TextField from '@material-ui/core/TextField'
import Popper from '@material-ui/core/Popper'
import Paper from '@material-ui/core/Paper'
import MenuItem from '@material-ui/core/MenuItem'

function renderInput(inputProps) {
  const { InputProps, classesMap, ref, ...other } = inputProps
  return (
    <TextField
      margin="normal"
      InputProps={{
        inputRef: ref,
        classes: {
          root: classesMap.inputRoot,
          input: classesMap.inputInput,
        },
        ...InputProps,
      }}
      {...other}
    />
  )
}

function renderSuggestion({
  suggestion,
  index,
  itemProps,
  highlightedIndex,
  selectedItem,
}) {
  const isHighlighted = highlightedIndex === index
  const isSelected = (selectedItem || '').indexOf(suggestion.text) > -1

  return (
    <MenuItem
      {...itemProps}
      key={suggestion.value}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {suggestion.text}
    </MenuItem>
  )
}

function getSuggestions(suggestions, value = '') {
  const inputValue = deburr(value.trim()).toLowerCase()

  return inputValue.length === 0
    ? []
    : suggestions.filter(
        suggestion => suggestion.text.toLowerCase().indexOf(inputValue) > -1
      )
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  popper: {
    zIndex: theme.zIndex.tooltip,
  },
  paper: {
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: `calc(${theme.typography.button.lineHeight} * ${theme.typography.button.fontSize} * 10)`,
  },
  inputRoot: {
    flexWrap: 'wrap',
  },
  inputInput: {
    width: 256,
    flexGrow: 1,
  },
  divider: {
    height: theme.spacing(2),
  },
})

const getSelectedItemByText = (dataSource, inputValue) => {
  const inputValueLo = inputValue.toLowerCase()
  const selectedItem = dataSource.find(
    item => item.text.toLowerCase() === inputValueLo
  )
  return selectedItem
}

const AutoComplete = ({
  classes: classesMap,
  searchText,
  dataSource,
  hintText,
  floatingLabelText,
  floatingLabelFixed,
  fullWidth,
  onSelect,
  onUpdateInput,
}) => {
  const popperNode = useRef(null)

  // last processed values
  const [lastInputValue, setLastInputValue] = useState(searchText)
  const [lastSelectedItem, setLastSelectedItem] = useState(
    getSelectedItemByText(dataSource, searchText)
  )
  // set static value at 1-st render for initial text and item
  const initialInputValue = useMemo(() => lastInputValue, []) // eslint-disable-line react-hooks/exhaustive-deps
  const initialSelectedItem = useMemo(() => lastSelectedItem, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = selectedItem => {
    const changedText = selectedItem ? selectedItem.text : ''
    const hasChanged = lastInputValue !== changedText

    if (hasChanged) {
      setLastInputValue(changedText)
      setLastSelectedItem(selectedItem)

      onSelect(selectedItem)
    }
  }

  const processChangedText = text => {
    setLastInputValue(text)
    setLastSelectedItem(getSelectedItemByText(dataSource, text))

    onUpdateInput(text)
  }

  const handleInputBlur = ({ target: { value } }) => {
    if (lastInputValue !== value) {
      processChangedText(value)
    }
  }

  const handleInputKeyUp = ({ key, target: { value } }) => {
    if (key === 'Enter' && lastInputValue !== value) {
      processChangedText(value)
    }
  }

  const handleInputKeyDown = ({ key, nativeEvent }, setState) => {
    if (key === 'Escape') {
      /**
       * see https://www.npmjs.com/package/downshift#default-handlers for 'Escape'
       *
       * Default functionality has 2 glitches:
       * 1. By default, if isOpen is false (i.e. no matches/suggestions found), the inputValue
       * will be set to an empty string and selectedItem will be set to null.
       * 2. Or, if user touched input text (typed something and then removed entered symbols)
       * then on hitting `Esc` key default behavior is the same and above - input value is set
       * to empty and selectedItem sets to null.
       *
       * But we need to restore inputValue to the last processed value,
       * so we directly set state here
       */

      // prevent default 'Escape' behavior
      nativeEvent.preventDownshiftDefault = true

      // enforce state props to the latest processed value
      setState({
        isOpen: false,
        inputValue: lastInputValue,
      })
    }
  }

  const itemToString = item => (item ? item.text : '')

  return (
    <div className={classesMap.root}>
      <Downshift
        selectedItem={searchText}
        initialInputValue={initialInputValue}
        initialSelectedItem={initialSelectedItem}
        itemToString={itemToString}
        onChange={handleChange}
      >
        {({
          getInputProps,
          getItemProps,
          getMenuProps,
          highlightedIndex,
          inputValue,
          isOpen,
          selectedItem,
          setState,
        }) => (
          <div className={classesMap.container}>
            {renderInput({
              fullWidth,
              label: floatingLabelText,
              placeholder: hintText,
              classesMap,
              InputLabelProps: {
                shrink: floatingLabelFixed || undefined,
              },
              ref: popperNode,
              InputProps: getInputProps({
                onBlur: handleInputBlur,
                onKeyUp: handleInputKeyUp,
                /**
                 * use some custom code to overwrite default behavior of 'Escape' event handler
                 * (see details in https://www.npmjs.com/package/downshift#default-handlers for 'Escape')
                 */
                onKeyDown: event => handleInputKeyDown(event, setState),
              }),
            })}
            <Popper
              open={isOpen}
              anchorEl={popperNode.current}
              className={classesMap.popper}
              transition
              popperOptions={{ placement: 'bottom-start' }}
            >
              <div
                {...(isOpen
                  ? getMenuProps({}, { suppressRefError: true })
                  : {})}
              >
                {isOpen ? (
                  <Paper
                    square
                    className={classesMap.paper}
                    style={{
                      minWidth: popperNode
                        ? popperNode.current.clientWidth + 32
                        : null,
                    }}
                  >
                    {getSuggestions(dataSource, inputValue).map(
                      (suggestion, index) =>
                        renderSuggestion({
                          suggestion,
                          index,
                          itemProps: getItemProps({ item: suggestion }),
                          highlightedIndex,
                          selectedItem,
                        })
                    )}
                  </Paper>
                ) : null}
              </div>
            </Popper>
          </div>
        )}
      </Downshift>
    </div>
  )
}

AutoComplete.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  searchText: PropTypes.string,
  dataSource: PropTypes.arrayOf(PropTypes.object),
  hintText: PropTypes.string,
  floatingLabelText: PropTypes.string,
  floatingLabelFixed: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onSelect: PropTypes.func,
  onUpdateInput: PropTypes.func,
}
AutoComplete.defaultProps = {
  searchText: '',
  dataSource: [],
  hintText: '',
  floatingLabelText: '',
  floatingLabelFixed: false,
  fullWidth: false,
  onSelect: noop,
  onUpdateInput: noop,
}

export default withStyles(styles)(AutoComplete)
