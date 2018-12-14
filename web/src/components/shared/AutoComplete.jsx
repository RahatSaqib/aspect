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

function getSuggestions(suggestions, value = '') {
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
  static defaultProps = {
    searchText: '',
    dataSource: [],
    hintText: '',
    floatingLabelText: '',
    floatingLabelFixed: false,
    fullWidth: false,
    onSelect: _.noop,
    onUpdateInput: _.noop,
  }

  handleChange = value => {
    this.props.onSelect(value)
  }

  handleInputBlur = ({ target: { value } }) => {
    this.props.onUpdateInput(value)
  }

  handleInputKeyUp = ({ key, target: { value } }) => {
    if (key === 'Enter') {
      this.props.onUpdateInput(value)
    }
  }

  itemToString = item => (item ? item.text : '')

  preventResetOnBlur = (state, changes) => {
    if (changes.type === Downshift.stateChangeTypes.blurInput) {
      return {}
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
          itemToString={this.itemToString}
          onChange={this.handleChange}
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
                  shrink: floatingLabelFixed || undefined,
                },
                ref: node => {
                  this.popperNode = node
                },
                InputProps: getInputProps({
                  onBlur: this.handleInputBlur,
                  onKeyUp: this.handleInputKeyUp,
                }),
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
                          ? this.popperNode.clientWidth + 32
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
}

export default withStyles(styles)(AutoComplete)
