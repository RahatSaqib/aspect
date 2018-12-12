import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Downshift from 'downshift'
import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Popper from '@material-ui/core/Popper'
import Paper from '@material-ui/core/Paper'
import MenuItem from '@material-ui/core/MenuItem'

function renderInput(inputProps) {
  const { InputProps, classes, ref, ...other } = inputProps
  return (
    <TextField
      margin="normal"
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
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

function getSuggestions(suggestions, value) {
  const inputValue = _.deburr(value.trim()).toLowerCase()

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
    zIndex: 1300,
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
    width: 'calc(200% + 5px)',
  },
  inputRoot: {
    flexWrap: 'wrap',
  },
  inputInput: {
    width: 256,
    flexGrow: 1,
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
})

export class AutoComplete extends PureComponent {
  static propTypes = {
    onSelect: PropTypes.func,
    onUpdateInput: PropTypes.func,
  }
  static defaultProps = {
    onSelect: _.noop,
    onUpdateInput: _.noop,
  }

  handleStateChange = changes => {    
    if (changes.hasOwnProperty('selectedItem')) {
      this.props.onSelect(changes.selectedItem)
    } else if (changes.hasOwnProperty('inputValue')) {
      this.inputValue = changes.inputValue
    }
  }

  preventResetOnBlur = (state, changes) => {
    if (changes.type === Downshift.stateChangeTypes.blurInput) {
      this.props.onUpdateInput(this.inputValue)
      return Object.assign(changes, { inputValue: this.inputValue })
    }
    return changes
  }

  render() {
    const {
      classes,
      searchText,
      dataSource,
      hintText,
      floatingLabelText,
      floatingLabelFixed,
      fullWidth,
    } = this.props
    return (
      <div className={classes.root}>
        <Downshift
          selectedItem={searchText}
          onStateChange={this.handleStateChange}
          stateReducer={this.preventResetOnBlur}
        >
          {({
            getInputProps,
            getItemProps,
            getMenuProps,
            highlightedIndex,
            inputValue,
            isOpen,
            selectedItem,
          }) => (
            <div className={classes.container}>
              {renderInput({
                fullWidth,
                label: floatingLabelText,
                placeholder: hintText,
                classes,
                InputLabelProps: {
                  shrink: floatingLabelFixed,
                },
                ref: node => {
                  this.popperNode = node
                },
                InputProps: getInputProps({}),
              })}
              <Popper
                open={isOpen}
                anchorEl={this.popperNode}
                className={classes.popper}
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
                      className={classes.paper}
                      style={{
                        minWidth: this.popperNode
                          ? this.popperNode.clientWidth
                          : null,
                      }}
                    >
                      {getSuggestions(dataSource, inputValue).map(
                        (suggestion, index) =>
                          renderSuggestion({
                            suggestion,
                            index,
                            itemProps: getItemProps({ item: suggestion.text }),
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
}

export default withStyles(styles)(AutoComplete)
