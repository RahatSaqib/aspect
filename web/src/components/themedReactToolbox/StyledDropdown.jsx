import classnames from 'classnames/bind'
import { compose, mapProps } from 'recompose'
import Dropdown from 'react-toolbox/lib/dropdown'

const cssClasses = classnames.bind(require('./StyledDropdown.css'))

const enhance = compose(
  mapProps(props => ({
    ...props,
    theme: {
      ...props.theme,
      inputDisabled: cssClasses('input__disabled'),
      inputInput: cssClasses('input__input'),
      inputInputElement: cssClasses('input__inputElement'),
    },
  }))
)

export default enhance(Dropdown)
