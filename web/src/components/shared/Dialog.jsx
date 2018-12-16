import PropTypes from 'prop-types'
import React from 'react'

import { withStyles } from '@material-ui/core/styles'
import MUIDialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

const styles = () => ({})

const Dialog = ({
  actions,
  autoScrollBodyContent,
  children,
  maxWidth,
  modal,
  onRequestClose,
  title,
  ...restProps
}) => (
  <MUIDialog
    disableEscapeKeyDown={modal}
    fullWidth
    maxWidth={maxWidth}
    scroll={autoScrollBodyContent ? 'paper' : 'body'}
    onClose={onRequestClose}
    aria-labelledby="dialog-title"
    {...restProps}
  >
    {title && <DialogTitle id="dialog-title">{title}</DialogTitle>}
    <DialogContent>{children}</DialogContent>

    {React.Children.count(actions) > 0 && (
      <DialogActions>{React.Children.toArray(actions)}</DialogActions>
    )}
  </MUIDialog>
)

Dialog.propTypes = {
  actions: PropTypes.node, // eslint-disable-line
  autoScrollBodyContent: PropTypes.bool,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  modal: PropTypes.bool,
  onRequestClose: PropTypes.func, // eslint-disable-line
  title: PropTypes.string,
}
Dialog.defaultProps = {
  autoScrollBodyContent: false,
  maxWidth: 'md',
  modal: false,
  title: '',
}

export default withStyles(styles)(Dialog)
