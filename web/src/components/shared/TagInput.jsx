import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Downshift from 'downshift'
import { withStyles } from '@material-ui/core/styles'
import Chip from '@material-ui/core/Chip'
import ClearIcon from '@material-ui/icons/Clear'
import Grid from '@material-ui/core/Grid'
import Input from '@material-ui/core/Input'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import RootRef from '@material-ui/core/RootRef'

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
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: `calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    } * 10)`,
  },
  chip: {
    backgroundColor:
      theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
    borderRadius:
      theme.customPropertiesVariables['--aspect-button-border-radius'],
    color: theme.palette.common.white,
    padding: `0 ${theme.spacing.unit}px`,
    marginRight: theme.spacing.unit / 2,
  },
  deleteIcon: {
    color: theme.palette.common.white,
    margin: 0,
  },
})

const renderSuggestion = ({
  suggestion,
  index,
  itemProps,
  highlightedIndex,
  selectedItem,
  tagName,
}) => {
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
  const inputValue = _.deburr(value.trim()).toLowerCase()

  return inputValue.length === 0
    ? []
    : suggestions.filter(
        suggestion =>
          !_.some(selectedItem, suggestion) &&
          suggestion[tagName].toLowerCase().indexOf(inputValue) > -1
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
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        isOpen,
        inputValue,
        selectedItem,
        highlightedIndex,
      }) => (
        <div className={classNameValues.container}>
          <Grid container spacing={4} alignItems="stretch">
            {selectedItem.length > 0 && (
              <Grid item>
                {selectedItem.map(item => {
                  const name = item[tagName]
                  return (
                    <Chip
                      key={item.id}
                      tabIndex={-1}
                      label={name}
                      deleteIcon={
                        <ClearIcon className={classNameValues.deleteIcon} />
                      }
                      className={classNameValues.chip}
                      onDelete={handleDelete(item)}
                    />
                  )
                })}
              </Grid>
            )}
            <Grid item className={classNameValues.inputContainer}>
              <RootRef rootRef={popperNode}>
                <Input
                  fullWidth={fullWidth}
                  {...getInputProps({
                    onChange: handleInputChange,
                    onKeyDown: handleInputKeyDown,
                  })}
                />
              </RootRef>
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
                {getSuggestions(source, selectedItem, inputValue, tagName).map(
                  (suggestion, index) =>
                    renderSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({ item: suggestion }),
                      highlightedIndex,
                      selectedItem,
                      tagName,
                    })
                )}
              </Paper>
            ) : null}
          </Popper>
        </div>
      )}
    </Downshift>
  )
}

TagInput.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  tagName: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  source: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.arrayOf(PropTypes.object),
}

TagInput.defaultProps = {
  disabled: false,
  fullWidth: true,
  maxTags: 10,
  source: [],
  value: [],
}

export default withStyles(styles)(TagInput)
