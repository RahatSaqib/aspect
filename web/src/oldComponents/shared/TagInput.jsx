import React, { useRef, useState } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { Chip, Grid, Input, MenuItem, Paper, Popper } from '@mui/material'
import { withStyles } from '@mui/styles'
import Downshift from 'downshift'
import deburr from 'lodash/deburr'
import some from 'lodash/some'
import PropTypes from 'prop-types'

const styles = theme => ({
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  inputContainer: {
    flexGrow: 1,
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
  chip: {
    backgroundColor: theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
    borderRadius: theme.customPropertiesVariables['--aspect-button-border-radius'],
    color: theme.palette.common.white,
    padding: `0 ${theme.spacing(1)}`,
    marginRight: theme.spacing(0.5),
  },
  deleteIcon: {
    color: theme.palette.common.white,
    margin: 0,
  },
})

const renderSuggestion = ({ suggestion, index, itemProps, highlightedIndex, selectedItem, tagName }) => {
  const isHighlighted = highlightedIndex === index
  const isSelected = (selectedItem || '').indexOf(suggestion.text) > -1
  return (
    <MenuItem
      {...itemProps}
      key={suggestion.id}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {suggestion[tagName]}
    </MenuItem>
  )
}

const getSuggestions = (suggestions, selectedItem, value = '', tagName) => {
  const inputValue = deburr(value.trim()).toLowerCase()

  return inputValue.length === 0
    ? []
    : suggestions.filter(
        suggestion => !some(selectedItem, suggestion) && suggestion[tagName].toLowerCase().indexOf(inputValue) > -1
      )
}

const TagInput = ({
  classes: classNameValues,
  disabled,
  fullWidth,
  source,
  onDelete,
  onAdd,
  tagName,
  value: selectedItem,
  noMatch,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [active, setActive] = useState(false)
  const popperNode = useRef(null)

  const handleInputKeyDown = event => {
    // Backspace
    if (selectedItem.length && !inputValue.length && event.which === 8) {
      onDelete(selectedItem[selectedItem.length - 1], selectedItem)
    }
    // Enter / comma
    if (!active && (event.which === 13 || event.which === 188)) {
      select(inputValue)
      event.preventDefault()
    }
  }

  const handleInputChange = event => {
    setInputValue(event.target.value)
  }

  const handleChange = item => {
    select(item)
  }

  const handleStateChange = changes => {
    if (
      changes.type === Downshift.stateChangeTypes.keyDownArrowUp ||
      changes.type === Downshift.stateChangeTypes.keyDownArrowDown
    ) {
      setActive(source[changes.highlightedIndex])
    } else {
      setActive('')
    }
  }

  const handleDelete = item => () => {
    if (!disabled) {
      onDelete(item, selectedItem)
    }
  }

  const select = newValue => {
    onAdd(newValue, selectedItem)
    setInputValue('')
  }

  return (
    <Downshift
      inputValue={inputValue}
      onChange={handleChange}
      onStateChange={handleStateChange}
      selectedItem={selectedItem}
      tagName={tagName}
      noMatch={noMatch}
    >
      {({ getInputProps, getItemProps, getMenuProps, isOpen, inputValue, selectedItem, highlightedIndex }) => {
        const options = getSuggestions(source, selectedItem, inputValue, tagName)
        return (
          <div className={classNameValues.container}>
            <Grid container spacing={4} alignItems="stretch">
              {selectedItem.length > 0 && (
                <Grid>
                  {selectedItem.map(item => {
                    const name = item[tagName]
                    return (
                      <Chip
                        key={item.id}
                        tabIndex={-1}
                        label={name}
                        deleteIcon={<ClearIcon className={classNameValues.deleteIcon} />}
                        className={classNameValues.chip}
                        onDelete={handleDelete(item)}
                      />
                    )
                  })}
                </Grid>
              )}
              <Grid className={classNameValues.inputContainer}>
                <Input
                  fullWidth={fullWidth}
                  ref={popperNode}
                  {...getInputProps({
                    onChange: handleInputChange,
                    onKeyDown: handleInputKeyDown,
                  })}
                />
              </Grid>
            </Grid>
            <Popper
              open={isOpen}
              anchorEl={popperNode.current}
              className={classNameValues.popper}
              transition
              popperOptions={{ placement: 'bottom-start' }}
              {...(isOpen ? getMenuProps({}, { suppressRefError: true }) : {})}
            >
              {isOpen ? (
                <Paper className={classNameValues.paper} square>
                  {options.length ? (
                    options.map((suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion }),
                        highlightedIndex,
                        selectedItem,
                        tagName,
                      })
                    )
                  ) : (
                    <MenuItem>{noMatch}</MenuItem>
                  )}
                </Paper>
              ) : null}
            </Popper>
          </div>
        )
      }}
    </Downshift>
  )
}

TagInput.defaultProps = {
  noMatch: '',
}
TagInput.propTypes = {
  classes: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  tagName: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  source: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.arrayOf(PropTypes.object),
  noMatch: PropTypes.string,
}

TagInput.defaultProps = {
  disabled: false,
  fullWidth: true,
  source: [],
  value: [],
}

export default withStyles(styles)(TagInput)
