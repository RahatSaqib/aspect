import React, { useState } from 'react'
import { LinearProgress, Paper, Popper, TextField } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import passwordComplexityMessages from '../../messages/passwordComplexityMessages'
import PropTypeOf from '../../utils/types'
import { getPasswordComplexity, getPasswordHintKey } from '../../utils/utils/passwordComplexity'
import styles from './Shared.module.css'

const red = 'rgb(226, 18, 18)'
const amber = 'rgb(255, 174, 0)'
const green = 'rgb(27, 186, 13)'

const muiStyles = theme => ({
  linearProgress: {
    height: '1em',
    backgroundColor: 'transparent',
  },
  linearColorError: {
    backgroundColor: red,
  },
  linearColorWarning: {
    backgroundColor: amber,
  },
  linearColorSuccess: {
    backgroundColor: green,
  },
  warningPopover: {
    marginTop: theme.typography.pxToRem(24),
  },
})

const messages = defineMessages({
  passwordStrengthMeterWeak: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterWeak',
    defaultMessage: 'Weak',
  },
  passwordStrengthMeterOkay: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterOkay',
    defaultMessage: 'Okay',
  },
  passwordStrengthMeterStrong: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterStrong',
    defaultMessage: 'Strong',
  },
})

const StrongPasswordInput = ({
  classes: classesMap,
  input,
  // meta: { touched, dirty, error },
  textFieldProps,
  popOverProps,
  intl,
}) => {
  const [showMeter, setShowMeter] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const handleFocus = event => {
    setShowMeter(true)
    setAnchorEl(event.currentTarget)
  }

  const handleBlur = () => {
    setShowMeter(false)
  }

  const { formatMessage } = intl
  const complexity = getPasswordComplexity(input.value)
  const passwordStrengthResults = {
    isWeak: !complexity.acceptable,
    isOkay: complexity.acceptable && complexity.classCount < 3,
    isStrong: complexity.acceptable && complexity.classCount >= 3,
  }

  const passwordStrengthScore = passwordStrengthResults.isWeak ? 30 : passwordStrengthResults.isStrong ? 100 : 70
  const hintKey = getPasswordHintKey(input.value)
  const hint = hintKey ? formatMessage(passwordComplexityMessages[hintKey]) : null
  const strengthStyle = {
    display: 'inline-block',
    width: '100%',
    textAlign: 'center',
    margin: '0.5em 0',
  }
  const weakStyle = { ...strengthStyle, color: red }
  const okayStyle = { ...strengthStyle, color: amber }
  const strongStyle = { ...strengthStyle, color: green }

  const strengthMessage = passwordStrengthResults.isStrong
    ? formatMessage(messages.passwordStrengthMeterStrong)
    : passwordStrengthResults.isWeak
    ? formatMessage(messages.passwordStrengthMeterWeak)
    : formatMessage(messages.passwordStrengthMeterOkay)

  const strengthMessageStyle = passwordStrengthResults.isStrong
    ? strongStyle
    : passwordStrengthResults.isWeak
    ? weakStyle
    : okayStyle

  return (
    <div>
      <TextField
        {...input}
        // errorStyle={{
        //   float: 'left',
        //   whiteSpace: 'nowrap',
        //   textOverflow: 'visible',
        // }}
        // errorText={(touched || dirty) && error}
        {...textFieldProps}
        className={classNames({
          [styles.Form__Field]: textFieldProps.fullWidth,
        })}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <Popper anchorEl={anchorEl} open={showMeter} placement="bottom-start" {...popOverProps}>
        <Paper className={classesMap.warningPopover}>
          <span style={strengthMessageStyle}>{strengthMessage}</span>
          <LinearProgress
            classes={{
              root: classesMap.linearProgress,
              barColorPrimary: passwordStrengthResults.isWeak
                ? classesMap.linearColorError
                : passwordStrengthResults.isStrong
                ? classesMap.linearColorSuccess
                : classesMap.linearColorWarning,
            }}
            variant="determinate"
            value={passwordStrengthScore}
          />
          {hint ? <p>{hint}</p> : null}
        </Paper>
      </Popper>
    </div>
  )
}

StrongPasswordInput.propTypes = {
  classes: PropTypes.object.isRequired,
  input: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
  textFieldProps: PropTypes.object.isRequired,
  popOverProps: PropTypes.object.isRequired,
  intl: PropTypeOf.intl.isRequired,
}

export default withStyles(muiStyles)(StrongPasswordInput)
