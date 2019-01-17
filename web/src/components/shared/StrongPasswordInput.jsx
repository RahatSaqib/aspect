import PropTypes from 'prop-types'
import React, { useState } from 'react'
import _ from 'lodash'
import { defineMessages, intlShape } from 'react-intl'
import { withStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import LinearProgress from '@material-ui/core/LinearProgress'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import TextField from '@material-ui/core/TextField'
import classNames from 'classnames'
import styles from './Shared.css'

const blue = 'rgb(78, 145, 252)'
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
  passwordStrengthMeterMinLength: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterMinLength',
    defaultMessage: 'Is at least {minLength} characters long',
  },
  passwordStrengthMeterContainsNumber: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterContainsNumber',
    defaultMessage: 'Has a number',
  },
  passwordStrengthMeterMixUpperAndLowerCase: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterMixUpperAndLowerCase',
    defaultMessage: 'Has a mix of UPPER and lower case characters',
  },
  passwordStrengthMeterContainsSpecialCharacter: {
    id:
      'pages.StrongPasswordInput.passwordStrengthMeterContainsSpecialCharacter',
    defaultMessage: 'Has a special character (%!$*...)',
  },
})

const StrongPasswordInput = ({
  classes: classesMap,
  input,
  meta: { touched, dirty, error },
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
  const passwordStrengthRules = {
    minLength: input.value.length > 7,
    containsNumber: /\d/.test(input.value),
    mixUpperAndLowerCase: /(?=.*?[a-z])(?=.*?[A-Z])/.test(input.value),
    containSpecialCharacter: /(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/.test(
      input.value
    ),
  }
  const passwordStrengthResults = {
    isWeak:
      !passwordStrengthRules.minLength ||
      (!passwordStrengthRules.containsNumber &&
        !passwordStrengthRules.containSpecialCharacter),
    isOkay:
      passwordStrengthRules.minLength &&
      (passwordStrengthRules.containsNumber ||
        passwordStrengthRules.containSpecialCharacter),
    isStrong:
      passwordStrengthRules.minLength &&
      passwordStrengthRules.containsNumber &&
      passwordStrengthRules.mixUpperAndLowerCase &&
      passwordStrengthRules.containSpecialCharacter,
  }

  const passwordStrengthScore = passwordStrengthResults.isWeak
    ? 30
    : passwordStrengthResults.isStrong ? 100 : 60
  const iconStyle = {
    lineHeight: '1.3em',
    width: '1.3em',
    height: '1.3em',
    margin: '0 0.3em',
    verticalAlign: 'bottom',
  }
  const checkIconStyle = { ...iconStyle, fill: blue }
  const crossIconStyle = { ...iconStyle, fill: red }
  const strengthRuleStyle = { lineHeight: '1em' }
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
    : passwordStrengthResults.isWeak ? weakStyle : okayStyle

  return (
    <div>
      <TextField
        {...input}
        errorStyle={{
          float: 'left',
          whiteSpace: 'nowrap',
          textOverflow: 'visible',
        }}
        errorText={(touched || dirty) && error}
        {...textFieldProps}
        className={classNames({
          [styles.Form__Field]: textFieldProps.fullWidth,
        })}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <Popper
        anchorEl={anchorEl}
        open={showMeter && !_.isEmpty(input.value)}
        placement="bottom-start"
        {...popOverProps}
      >
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
          <ul className={styles.List__Unstyled}>
            <li>
              {passwordStrengthRules.minLength ? (
                <CheckIcon style={checkIconStyle} />
              ) : (
                <CloseIcon style={crossIconStyle} />
              )}
              <span style={strengthRuleStyle}>
                {formatMessage(messages.passwordStrengthMeterMinLength, {
                  minLength: 8,
                })}
              </span>
            </li>
            <li>
              {passwordStrengthRules.containsNumber ? (
                <CheckIcon style={checkIconStyle} />
              ) : (
                <CloseIcon style={crossIconStyle} />
              )}
              <span style={strengthRuleStyle}>
                {formatMessage(messages.passwordStrengthMeterContainsNumber)}
              </span>
            </li>
            <li>
              {passwordStrengthRules.mixUpperAndLowerCase ? (
                <CheckIcon style={checkIconStyle} />
              ) : (
                <CloseIcon style={crossIconStyle} />
              )}
              <span style={strengthRuleStyle}>
                {formatMessage(
                  messages.passwordStrengthMeterMixUpperAndLowerCase
                )}
              </span>
            </li>
            <li>
              {passwordStrengthRules.containSpecialCharacter ? (
                <CheckIcon style={checkIconStyle} />
              ) : (
                <CloseIcon style={crossIconStyle} />
              )}
              <span style={strengthRuleStyle}>
                {formatMessage(
                  messages.passwordStrengthMeterContainsSpecialCharacter
                )}
              </span>
            </li>
          </ul>
        </Paper>
      </Popper>
    </div>
  )
}

StrongPasswordInput.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  input: PropTypes.object.isRequired, // eslint-disable-line
  meta: PropTypes.object.isRequired, // eslint-disable-line
  textFieldProps: PropTypes.object.isRequired, // eslint-disable-line
  popOverProps: PropTypes.object.isRequired, // eslint-disable-line
  intl: intlShape.isRequired,
}

export default withStyles(muiStyles)(StrongPasswordInput)
