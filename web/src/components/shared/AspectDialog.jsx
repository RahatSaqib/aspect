import PropTypes from 'prop-types'
import React, { useCallback } from 'react'
import classnames from 'classnames/bind'

import IconButton from '@material-ui/core/IconButton'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

import IconProvider from '../../MigratedComponents/IconProvider'

const cssClasses = classnames.bind(require('./AspectDialog.css'))

const AspectDialog = ({
  actions,
  autoScrollBodyContent,
  children,
  maxWidth,
  modal,
  onRequestClose,
  showCrossIcon,
  title,
  ...restProps
}) => {
  const renderTitle = useCallback(
    () => (
      <DialogTitle id="dialog-title">
        {title}
        {showCrossIcon && onRequestClose ? (
          <IconButton
            aria-label="close"
            className={cssClasses('button-close')}
            onClick={onRequestClose}
          >
            <IconProvider icon="MdClose" />
          </IconButton>
        ) : null}
      </DialogTitle>
    ),
    [title, showCrossIcon, onRequestClose]
  )

  return (
    <Dialog
      disableEscapeKeyDown={modal}
      fullWidth
      maxWidth={maxWidth}
      scroll={autoScrollBodyContent ? 'paper' : 'body'}
      onClose={onRequestClose}
      aria-labelledby="dialog-title"
      {...restProps}
    >
      {title && renderTitle()}

      <DialogContent>{children}</DialogContent>

      {React.Children.count(actions) > 0 && (
        <DialogActions>{React.Children.toArray(actions)}</DialogActions>
      )}
    </Dialog>
  )
}

AspectDialog.propTypes = {
  actions: PropTypes.node, // eslint-disable-line
  autoScrollBodyContent: PropTypes.bool,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  modal: PropTypes.bool,
  onRequestClose: PropTypes.func, // eslint-disable-line
  showCrossIcon: PropTypes.bool,
  title: PropTypes.string,
}
AspectDialog.defaultProps = {
  autoScrollBodyContent: false,
  maxWidth: 'md',
  modal: false,
  title: '',
  showCrossIcon: false,
}

export default AspectDialog
