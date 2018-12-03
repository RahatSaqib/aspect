import _fp from 'lodash/fp'
import { themr } from 'react-css-themr'
import classnames from 'classnames/bind'
import { compose, mapProps, withHandlers } from 'recompose'
import { Input } from 'react-toolbox/lib/input'
import { Chip } from 'react-toolbox/lib/chip'
import { AUTOCOMPLETE, CHIP } from 'react-toolbox/lib/identifiers'
import theme from 'react-toolbox/lib/autocomplete/theme.module.css'
import { autocompleteFactory } from '../../components/themedReactToolbox/ForkedAutocomplete'

const cssClasses = classnames.bind(require('./TagInput.css'))

const AUTOCOMPLETE_THEME = {
  autocomplete: cssClasses('autocomplete'),
  input: cssClasses('input'),
  values: cssClasses('values'),
  suggestions: cssClasses('suggestions'),
}

const CHIP_THEME = {
  chip: cssClasses('chip'),
  deleteIcon: cssClasses('chip__deleteIcon'),
  delete: cssClasses('chip__delete'),
  deletable: cssClasses('chip__deletable'),
}

const enhance = compose(
  mapProps(({ onTagChange, source, value, disabled, ...restProps }) => ({
    ...restProps,
    source,
    value,
    label: '',
    theme: AUTOCOMPLETE_THEME,
    onTagChange: onTagChange || _fp.noop,
    className: cssClasses({ autocomplete_disabled: disabled }),
  })),
  withHandlers({
    onChange: ({ disabled, onTagChange }) => value => {
      if (!disabled) {
        onTagChange(value)
      }
    },
  })
)
const injectChip = themr(CHIP, CHIP_THEME)(Chip)
export const TagInput = themr(AUTOCOMPLETE, theme)(
  autocompleteFactory(injectChip, Input)
)

export default enhance(TagInput)
