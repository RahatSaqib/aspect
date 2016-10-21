import React, {PropTypes} from 'react'
import _ from 'lodash'
import { injectIntl, defineMessages } from 'react-intl'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import Popover from 'material-ui/Popover'
import LinearProgress from 'material-ui/LinearProgress'
import CheckIcon from 'material-ui/svg-icons/navigation/check'
import CloseIcon from 'material-ui/svg-icons/navigation/close'
import styles from './Shared.css'

const messages = defineMessages({
  passwordStrengthMeterWeak: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterWeak',
    defaultMessage: 'Weak'
  },
  passwordStrengthMeterOkay: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterOkay',
    defaultMessage: 'Okay'
  },
  passwordStrengthMeterStrong: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterStrong',
    defaultMessage: 'Strong'
  },
  passwordStrengthMeterMinLength: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterMinLength',
    defaultMessage: 'Is at least 6 characters long'
  },
  passwordStrengthMeterContainsNumber: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterContainsNumber',
    defaultMessage: 'Has a number'
  },
  passwordStrengthMeterMixUpperAndLowerCase: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterMixUpperAndLowerCase',
    defaultMessage: 'Has a mix of UPPER and lower case characters'
  },
  passwordStrengthMeterContainsSpecialCharacter: {
    id: 'pages.StrongPasswordInput.passwordStrengthMeterContainsSpecialCharacter',
    defaultMessage: 'Has a special character (%!$*...)'
  }
})

class StrongPasswordInput extends React.PureComponent {
  static propTypes = {
    input: PropTypes.object.isRequired,
    meta: PropTypes.object.isRequired,
    textFieldProps: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      showMeter: false
    }
  }

  handleFocus = event => {
    this.setState({
      anchorEl: event.currentTarget,
      showMeter: true
    })
  }

  handleBlur = () => {
    this.setState({
      showMeter: false
    })
  }

  render() {
    const {input, meta, textFieldProps, intl} = this.props,
      {touched, error} = meta,
      {formatMessage} = intl,
      passwordStrengthRules = {
        minLength: input.value.length >= 6,
        containsNumber: /\d/.test(input.value),
        mixUpperAndLowerCase: /(?=.*?[a-z])(?=.*?[A-Z])/.test(input.value),
        containSpecialCharacter: /(?=.*?[`~!@#$%\^&*()\-=_+\\\[\]{}/?,.<>])/.test(input.value)
      },
      passwordStrengthResults = {
        isWeak: !passwordStrengthRules.minLength,
        isOkay: passwordStrengthRules.minLength,
        isStrong: passwordStrengthRules.minLength && passwordStrengthRules.containsNumber &&
          passwordStrengthRules.mixUpperAndLowerCase && passwordStrengthRules.containSpecialCharacter
      },
      blue = 'rgb(78, 145, 252)',
      red = 'rgb(226, 18, 18)',
      amber = 'rgb(255, 174, 0)',
      green = 'rgb(27, 186, 13)',
      passwordStrengthColor = passwordStrengthResults.isWeak ? red : (passwordStrengthResults.isStrong ? green : amber),
      passwordStrengthScore = passwordStrengthResults.isWeak ? 30 : (passwordStrengthResults.isStrong ? 100 : 60),
      iconStyle = {
        lineHeight: '1.3em',
        width: '1.3em',
        height: '1.3em',
        margin: '0 0.3em',
        verticalAlign: 'bottom'
      },
      checkIconStyle = {...iconStyle, fill: blue },
      crossIconStyle = {...iconStyle, fill: red },
      strengthRuleStyle = { lineHeight: '1em' },
      strengthStyle = {
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        margin: '0.5em 0'
      },
      weakStyle = {...strengthStyle, color: red },
      okayStyle = {...strengthStyle, color: amber },
      strongStyle = {...strengthStyle, color: green },
      strengthMessage = passwordStrengthResults.isStrong ? formatMessage(messages.passwordStrengthMeterStrong) :
        (passwordStrengthResults.isWeak ? formatMessage(messages.passwordStrengthMeterWeak) : formatMessage(messages.passwordStrengthMeterOkay)),
      strengthMessageStyle = passwordStrengthResults.isStrong ? strongStyle :
        (passwordStrengthResults.isWeak ? weakStyle : okayStyle)
    return (<div>
      <TextField {...input} errorStyle={{ float: 'left' }}
                 errorText={touched && error} {...textFieldProps}
                 className={textFieldProps.fullWidth ? '' : styles.Form__Field}
                 onFocus={this.handleFocus} onBlur={this.handleBlur} />
      <Popover anchorEl={this.state.anchorEl} open={this.state.showMeter && !_.isEmpty(input.value)} useLayerForClickAway={false}>
        <span style={strengthMessageStyle}>{strengthMessage}</span>
        <LinearProgress mode="determinate" value={passwordStrengthScore} color={passwordStrengthColor} style={{height: '1em', backgroundColor: 'transparent'}} />
        <ul className={styles.List__Unstyled}>
          <li>
            {passwordStrengthRules.minLength ? <CheckIcon style={checkIconStyle} /> : <CloseIcon  style={crossIconStyle} />}
            <span style={strengthRuleStyle}>{formatMessage(messages.passwordStrengthMeterMinLength)}</span>
          </li>
          <li>
            {passwordStrengthRules.containsNumber ? <CheckIcon style={checkIconStyle} /> : <CloseIcon  style={crossIconStyle} />}
            <span style={strengthRuleStyle}>{formatMessage(messages.passwordStrengthMeterContainsNumber)}</span>
          </li>
          <li>
            {passwordStrengthRules.mixUpperAndLowerCase ? <CheckIcon style={checkIconStyle} /> : <CloseIcon  style={crossIconStyle} />}
            <span style={strengthRuleStyle}>{formatMessage(messages.passwordStrengthMeterMixUpperAndLowerCase)}</span>
          </li>
          <li>
            {passwordStrengthRules.containSpecialCharacter ? <CheckIcon style={checkIconStyle} /> : <CloseIcon  style={crossIconStyle} />}
            <span style={strengthRuleStyle}>{formatMessage(messages.passwordStrengthMeterContainsSpecialCharacter)}</span>
          </li>
        </ul>
      </Popover>
    </div>)
  }
}

const intlStrongPasswordInput = injectIntl(StrongPasswordInput)

const renderFormField = props => {
  const {name, label, fullWidth, disabled, maxLength, autoFocus} = props
  return <Field name={name} textFieldProps={{
    floatingLabelText: label,
    fullWidth: fullWidth,
    autoFocus: autoFocus,
    disabled: disabled,
    maxLength: maxLength,
    type: 'password'
  }} component={intlStrongPasswordInput} />
}

export default renderFormField
