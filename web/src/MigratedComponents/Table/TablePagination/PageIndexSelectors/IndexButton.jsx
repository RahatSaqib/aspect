import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const IndexButton = ({ modifier, disabled, action, icon, label }) => {
  return (
    <Button
      className={cssClasses([
        'pageindex__button',
        `pageindex__button--${modifier}`,
      ])}
      disabled={disabled}
      onClick={action}
    >
      <IconProvider icon={icon} />
      {label}
    </Button>
  )
}

IndexButton.propTypes = {
  modifier: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  action: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
}

export default IndexButton
