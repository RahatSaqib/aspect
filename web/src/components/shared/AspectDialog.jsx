import React, { useCallback } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import IconProvider from '../IconProvider'
import styles from './AspectDialog.module.css'

const AspectDialog = ({
  actions,
  autoScrollBodyContent,
  children,
  dialogContentClasses,
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
          <IconButton aria-label="close" className={styles.button_close} onClick={onRequestClose} size="medium">
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

      <DialogContent
        classes={{
          ...dialogContentClasses,
        }}
      >
        {children}
      </DialogContent>

      {React.Children.count(actions) > 0 && <DialogActions>{React.Children.toArray(actions)}</DialogActions>}
    </Dialog>
  )
}

AspectDialog.propTypes = {
  actions: PropTypes.node, // eslint-disable-line
  autoScrollBodyContent: PropTypes.bool,
  children: PropTypes.node.isRequired,
  dialogContentClasses: PropTypes.objectOf(PropTypes.shape),
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  modal: PropTypes.bool,
  onRequestClose: PropTypes.func, // eslint-disable-line
  showCrossIcon: PropTypes.bool,
  title: PropTypes.string,
}
AspectDialog.defaultProps = {
  autoScrollBodyContent: false,
  dialogContentClasses: {},
  maxWidth: 'md',
  modal: false,
  title: '',
  showCrossIcon: false,
}

export default AspectDialog
