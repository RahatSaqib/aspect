import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import { defineMessages, intlShape } from 'react-intl'
import TextField from 'material-ui/TextField'
import Popover from 'material-ui/Popover'
import LinearProgress from 'material-ui/LinearProgress'
import CheckIcon from 'material-ui/svg-icons/navigation/check'
import CloseIcon from 'material-ui/svg-icons/navigation/close'
import classNames from 'classnames'
import styles from './Shared.css'

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

export class StrongPasswordInput extends React.PureComponent {
  static propTypes = {
    input: PropTypes.object.isRequired, // eslint-disable-line
    meta: PropTypes.object.isRequired, // eslint-disable-line
    textFieldProps: PropTypes.object.isRequired, // eslint-disable-line
    popOverProps: PropTypes.object.isRequired, // eslint-disable-line
    intl: intlShape.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      showMeter: false,
    }
  }

  handleFocus = event => {
    this.setState({
      anchorEl: event.currentTarget,
      showMeter: true,
    })
  }

  handleBlur = () => {
    this.setState({
      showMeter: false,
    })
  }

  render() {
    const {
      input,
      meta: { touched, dirty, error },
      textFieldProps,
      popOverProps,
      intl,
    } = this.props
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
    const blue = 'rgb(78, 145, 252)'
    const red = 'rgb(226, 18, 18)'
    const amber = 'rgb(255, 174, 0)'
    const green = 'rgb(27, 186, 13)'
    const passwordStrengthColor = passwordStrengthResults.isWeak
      ? red
      : passwordStrengthResults.isStrong ? green : amber
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
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        <Popover
          anchorEl={this.state.anchorEl}
          open={this.state.showMeter && !_.isEmpty(input.value)}
          useLayerForClickAway={false}
          {...popOverProps}
        >
          <span style={strengthMessageStyle}>{strengthMessage}</span>
          <LinearProgress
            mode="determinate"
            value={passwordStrengthScore}
            color={passwordStrengthColor}
            style={{ height: '1em', backgroundColor: 'transparent' }}
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
        </Popover>
      </div>
    )
  }
}

export default StrongPasswordInput
