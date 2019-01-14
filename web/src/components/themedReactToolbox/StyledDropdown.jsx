import classnames from 'classnames/bind'
import { compose, mapProps } from 'recompose'
import Dropdown from 'react-toolbox/lib/dropdown'

const cssClasses = classnames.bind(require('./StyledDropdown.css'))

const enhance = compose(
  mapProps(props => ({
    ...props,
    theme: {
      ...props.theme,
      dropdown: cssClasses('dropdown'),
      inputDisabled: cssClasses('input__disabled'),
      inputInput: cssClasses('input__input'),
      inputInputElement: cssClasses('input__inputElement'),
      values: cssClasses('input__values'),
    },
  }))
)

export default enhance(Dropdown)
