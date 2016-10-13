import React, {PropTypes} from 'react'
import _ from 'lodash'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import CountrySelect from './CountrySelect'
import styles from './Shared.css'

class PhoneInput extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    input: PropTypes.object.isRequired,
    meta: PropTypes.object.isRequired,
    textFieldProps: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      selectedIsoAlpha2Code: 'US',
      number: ''
    }

    this.onCountryChanged = this.onCountryChanged.bind(this)
    this.selectCountry = this.selectCountry.bind(this)
    this.onNumberChanged = this.onNumberChanged.bind(this)
    this.changeNumber = this.changeNumber.bind(this)
    this.getPhoneNumber = this.getPhoneNumber.bind(this)
  }

  componentDidMount() {
    if(!this.state.number) {
      this.changeNumber(this.props.input.value)
    }
  }

  onCountryChanged(event, index, value) {
    this.selectCountry(value)
    this.props.onChange(this.getPhoneNumber(value, this.state.number))
  }

  selectCountry(isoAlpha2Code) {
    this.setState({
      selectedIsoAlpha2Code: isoAlpha2Code
    })
  }

  onNumberChanged(event) {
    this.changeNumber(event.target.value)
    this.props.onChange(this.getPhoneNumber(this.state.selectedIsoAlpha2Code, event.target.value))
  }

  changeNumber(number) {
    let trimmedNumber = ''
    if(number) {
      trimmedNumber = number.replace(/^\s+/,'')

      //Get the trimmed first portion of the number (up until the first char which isn't '+' or [0-9]
      const firstPortionDividerMatch = /\s|\(|\)|-/.exec(trimmedNumber)
      const firstIndexOfSectionDivider = firstPortionDividerMatch ? firstPortionDividerMatch.index : -1
      const firstPortionOfNumber = firstIndexOfSectionDivider > -1 ?
        trimmedNumber.substr(0, firstIndexOfSectionDivider) : trimmedNumber
      const matchingDialingCodes = _.filter(dialingCodes, {dial_code: firstPortionOfNumber})
      if(matchingDialingCodes.length === 1){
        this.selectCountry(matchingDialingCodes[0].iso_alpha2_code)
        trimmedNumber = trimmedNumber.substr(matchingDialingCodes[0].dial_code.length)
      }
      if(!/^[\s()+-]*([0-9][\s()+-]*){0,17}$/.test(trimmedNumber)) {
        return
      }
      trimmedNumber = trimmedNumber.replace(/^\s+/,'')
    }
    this.setState({
      number: trimmedNumber
    })
  }

  getPhoneNumber(isoAlpha2Code, number) {
    const dialingCode = _.find(dialingCodes, {iso_alpha2_code: isoAlpha2Code})
    if(dialingCode) {
      if(number.startsWith(dialingCode)) {
        number = number.substr(dialingCode.length)
      }
      return dialingCode.dial_code + (number ? ' ' + number.trim() : '')
    }
  }

  render() {
    const {meta, textFieldProps} = this.props,
      {touched, error} = meta,
      {selectedIsoAlpha2Code, number} = this.state

    return (
      <div style={{display: 'inline-block', position: 'relative'}}>
        <div style={{position: 'absolute', left: '0', bottom: '0'}}>
          <CountrySelect value={selectedIsoAlpha2Code} dataSource={dialingCodes}
                         dataSourceConfig={{
                           selectedItemTextPredicate: country => country.dial_code,
                           menuItemTextPredicate: country => country.name + ' (' + country.dial_code + ')'
                         }}
                         selectFieldStyle={{verticalAlign: 'bottom', width: '5.5em'}}
                         onChange={this.onCountryChanged} selectedItemStyle={{width: '4.5em'}}
                         underlineStyle={{display: 'none'}} />
        </div>
        <div style={{float: 'left'}}>
          <TextField name="test" errorStyle={{ float: 'left' }} errorText={touched && error}
                     {...textFieldProps} style={{marginLeft: '5.5em', width: '10.5em'}}
                     floatingLabelFocusStyle={{marginLeft: '-5.5em'}}
                     underlineStyle={{marginLeft: '-5.5em', width: '16em'}} onChange={this.onNumberChanged}
                     value={number} className={styles.Form__Field} />
        </div>
      </div>
    )
  }
}

const renderPhoneField = props =>
  <PhoneInput {...props} onChange={phoneNumber => props.input.onChange(phoneNumber)}/>

const renderFormField = props => {
  const {name, label, disabled, maxLength} = props
  return <Field name={name} textFieldProps={{
    floatingLabelText: label,
    disabled: disabled,
    maxLength: maxLength
  }} component={renderPhoneField} />
}

export default renderFormField

const dialingCodes = [{dial_code: '+93', iso_alpha2_code: 'AF'},
  {dial_code: '+355', iso_alpha2_code: 'AL'},
  {dial_code: '+213', iso_alpha2_code: 'DZ'},
  {dial_code: '+1684', iso_alpha2_code: 'AS'},
  {dial_code: '+376', iso_alpha2_code: 'AD'},
  {dial_code: '+244', iso_alpha2_code: 'AO'},
  {dial_code: '+1264', iso_alpha2_code: 'AI'},
  {dial_code: '+1268', iso_alpha2_code: 'AG'},
  {dial_code: '+54', iso_alpha2_code: 'AR'},
  {dial_code: '+374', iso_alpha2_code: 'AM'},
  {dial_code: '+297', iso_alpha2_code: 'AW'},
  {dial_code: '+61', iso_alpha2_code: 'AU'},
  {dial_code: '+43', iso_alpha2_code: 'AT'},
  {dial_code: '+994', iso_alpha2_code: 'AZ'},
  {dial_code: '+1242', iso_alpha2_code: 'BS'},
  {dial_code: '+973', iso_alpha2_code: 'BH'},
  {dial_code: '+880', iso_alpha2_code: 'BD'},
  {dial_code: '+1246', iso_alpha2_code: 'BB'},
  {dial_code: '+375', iso_alpha2_code: 'BY'},
  {dial_code: '+32', iso_alpha2_code: 'BE'},
  {dial_code: '+501', iso_alpha2_code: 'BZ'},
  {dial_code: '+229', iso_alpha2_code: 'BJ'},
  {dial_code: '+1441', iso_alpha2_code: 'BM'},
  {dial_code: '+975', iso_alpha2_code: 'BT'},
  {dial_code: '+591', iso_alpha2_code: 'BO'},
  {dial_code: '+387', iso_alpha2_code: 'BA'},
  {dial_code: '+267', iso_alpha2_code: 'BW'},
  {dial_code: '+55', iso_alpha2_code: 'BR'},
  {dial_code: '+246', iso_alpha2_code: 'IO'},
  {dial_code: '+673', iso_alpha2_code: 'BN'},
  {dial_code: '+359', iso_alpha2_code: 'BG'},
  {dial_code: '+226', iso_alpha2_code: 'BF'},
  {dial_code: '+257', iso_alpha2_code: 'BI'},
  {dial_code: '+855', iso_alpha2_code: 'KH'},
  {dial_code: '+237', iso_alpha2_code: 'CM'},
  {dial_code: '+238', iso_alpha2_code: 'CV'},
  {dial_code: '+345', iso_alpha2_code: 'KY'},
  {dial_code: '+236', iso_alpha2_code: 'CF'},
  {dial_code: '+235', iso_alpha2_code: 'TD'},
  {dial_code: '+56', iso_alpha2_code: 'CL'},
  {dial_code: '+86', iso_alpha2_code: 'CN'},
  {dial_code: '+57', iso_alpha2_code: 'CO'},
  {dial_code: '+269', iso_alpha2_code: 'KM'},
  {dial_code: '+242', iso_alpha2_code: 'CG'},
  {dial_code: '+243', iso_alpha2_code: 'CD'},
  {dial_code: '+682', iso_alpha2_code: 'CK'},
  {dial_code: '+506', iso_alpha2_code: 'CR'},
  {dial_code: '+225', iso_alpha2_code: 'CI'},
  {dial_code: '+385', iso_alpha2_code: 'HR'},
  {dial_code: '+53', iso_alpha2_code: 'CU'},
  {dial_code: '+357', iso_alpha2_code: 'CY'},
  {dial_code: '+420', iso_alpha2_code: 'CZ'},
  {dial_code: '+45', iso_alpha2_code: 'DK'},
  {dial_code: '+253', iso_alpha2_code: 'DJ'},
  {dial_code: '+1767', iso_alpha2_code: 'DM'},
  {dial_code: '+1849', iso_alpha2_code: 'DO'},
  {dial_code: '+593', iso_alpha2_code: 'EC'},
  {dial_code: '+20', iso_alpha2_code: 'EG'},
  {dial_code: '+503', iso_alpha2_code: 'SV'},
  {dial_code: '+240', iso_alpha2_code: 'GQ'},
  {dial_code: '+291', iso_alpha2_code: 'ER'},
  {dial_code: '+372', iso_alpha2_code: 'EE'},
  {dial_code: '+251', iso_alpha2_code: 'ET'},
  {dial_code: '+500', iso_alpha2_code: 'FK'},
  {dial_code: '+298', iso_alpha2_code: 'FO'},
  {dial_code: '+679', iso_alpha2_code: 'FJ'},
  {dial_code: '+358', iso_alpha2_code: 'FI'},
  {dial_code: '+33', iso_alpha2_code: 'FR'},
  {dial_code: '+594', iso_alpha2_code: 'GF'},
  {dial_code: '+689', iso_alpha2_code: 'PF'},
  {dial_code: '+241', iso_alpha2_code: 'GA'},
  {dial_code: '+220', iso_alpha2_code: 'GM'},
  {dial_code: '+995', iso_alpha2_code: 'GE'},
  {dial_code: '+49', iso_alpha2_code: 'DE'},
  {dial_code: '+233', iso_alpha2_code: 'GH'},
  {dial_code: '+350', iso_alpha2_code: 'GI'},
  {dial_code: '+30', iso_alpha2_code: 'GR'},
  {dial_code: '+299', iso_alpha2_code: 'GL'},
  {dial_code: '+1473', iso_alpha2_code: 'GD'},
  {dial_code: '+590', iso_alpha2_code: 'GP'},
  {dial_code: '+1671', iso_alpha2_code: 'GU'},
  {dial_code: '+502', iso_alpha2_code: 'GT'},
  {dial_code: '+224', iso_alpha2_code: 'GN'},
  {dial_code: '+245', iso_alpha2_code: 'GW'},
  {dial_code: '+509', iso_alpha2_code: 'HT'},
  {dial_code: '+379', iso_alpha2_code: 'VA'},
  {dial_code: '+504', iso_alpha2_code: 'HN'},
  {dial_code: '+852', iso_alpha2_code: 'HK'},
  {dial_code: '+36', iso_alpha2_code: 'HU'},
  {dial_code: '+354', iso_alpha2_code: 'IS'},
  {dial_code: '+91', iso_alpha2_code: 'IN'},
  {dial_code: '+62', iso_alpha2_code: 'ID'},
  {dial_code: '+98', iso_alpha2_code: 'IR'},
  {dial_code: '+964', iso_alpha2_code: 'IQ'},
  {dial_code: '+353', iso_alpha2_code: 'IE'},
  {dial_code: '+972', iso_alpha2_code: 'IL'},
  {dial_code: '+39', iso_alpha2_code: 'IT'},
  {dial_code: '+1876', iso_alpha2_code: 'JM'},
  {dial_code: '+81', iso_alpha2_code: 'JP'},
  {dial_code: '+962', iso_alpha2_code: 'JO'},
  {dial_code: '+77', iso_alpha2_code: 'KZ'},
  {dial_code: '+254', iso_alpha2_code: 'KE'},
  {dial_code: '+686', iso_alpha2_code: 'KI'},
  {dial_code: '+850', iso_alpha2_code: 'KP'},
  {dial_code: '+82', iso_alpha2_code: 'KR'},
  {dial_code: '+965', iso_alpha2_code: 'KW'},
  {dial_code: '+996', iso_alpha2_code: 'KG'},
  {dial_code: '+856', iso_alpha2_code: 'LA'},
  {dial_code: '+371', iso_alpha2_code: 'LV'},
  {dial_code: '+961', iso_alpha2_code: 'LB'},
  {dial_code: '+266', iso_alpha2_code: 'LS'},
  {dial_code: '+231', iso_alpha2_code: 'LR'},
  {dial_code: '+218', iso_alpha2_code: 'LY'},
  {dial_code: '+423', iso_alpha2_code: 'LI'},
  {dial_code: '+370', iso_alpha2_code: 'LT'},
  {dial_code: '+352', iso_alpha2_code: 'LU'},
  {dial_code: '+853', iso_alpha2_code: 'MO'},
  {dial_code: '+389', iso_alpha2_code: 'MK'},
  {dial_code: '+261', iso_alpha2_code: 'MG'},
  {dial_code: '+265', iso_alpha2_code: 'MW'},
  {dial_code: '+60', iso_alpha2_code: 'MY'},
  {dial_code: '+960', iso_alpha2_code: 'MV'},
  {dial_code: '+223', iso_alpha2_code: 'ML'},
  {dial_code: '+356', iso_alpha2_code: 'MT'},
  {dial_code: '+692', iso_alpha2_code: 'MH'},
  {dial_code: '+596', iso_alpha2_code: 'MQ'},
  {dial_code: '+222', iso_alpha2_code: 'MR'},
  {dial_code: '+230', iso_alpha2_code: 'MU'},
  {dial_code: '+52', iso_alpha2_code: 'MX'},
  {dial_code: '+691', iso_alpha2_code: 'FM'},
  {dial_code: '+373', iso_alpha2_code: 'MD'},
  {dial_code: '+377', iso_alpha2_code: 'MC'},
  {dial_code: '+976', iso_alpha2_code: 'MN'},
  {dial_code: '+382', iso_alpha2_code: 'ME'},
  {dial_code: '+1664', iso_alpha2_code: 'MS'},
  {dial_code: '+212', iso_alpha2_code: 'MA'},
  {dial_code: '+258', iso_alpha2_code: 'MZ'},
  {dial_code: '+95', iso_alpha2_code: 'MM'},
  {dial_code: '+264', iso_alpha2_code: 'NA'},
  {dial_code: '+674', iso_alpha2_code: 'NR'},
  {dial_code: '+977', iso_alpha2_code: 'NP'},
  {dial_code: '+31', iso_alpha2_code: 'NL'},
  {dial_code: '+599', iso_alpha2_code: 'AN'},
  {dial_code: '+687', iso_alpha2_code: 'NC'},
  {dial_code: '+64', iso_alpha2_code: 'NZ'},
  {dial_code: '+505', iso_alpha2_code: 'NI'},
  {dial_code: '+227', iso_alpha2_code: 'NE'},
  {dial_code: '+234', iso_alpha2_code: 'NG'},
  {dial_code: '+683', iso_alpha2_code: 'NU'},
  {dial_code: '+672', iso_alpha2_code: 'NF'},
  {dial_code: '+1670', iso_alpha2_code: 'MP'},
  {dial_code: '+47', iso_alpha2_code: 'NO'},
  {dial_code: '+968', iso_alpha2_code: 'OM'},
  {dial_code: '+92', iso_alpha2_code: 'PK'},
  {dial_code: '+680', iso_alpha2_code: 'PW'},
  {dial_code: '+970', iso_alpha2_code: 'PS'},
  {dial_code: '+507', iso_alpha2_code: 'PA'},
  {dial_code: '+675', iso_alpha2_code: 'PG'},
  {dial_code: '+595', iso_alpha2_code: 'PY'},
  {dial_code: '+51', iso_alpha2_code: 'PE'},
  {dial_code: '+63', iso_alpha2_code: 'PH'},
  {dial_code: '+872', iso_alpha2_code: 'PN'},
  {dial_code: '+48', iso_alpha2_code: 'PL'},
  {dial_code: '+351', iso_alpha2_code: 'PT'},
  {dial_code: '+1939', iso_alpha2_code: 'PR'},
  {dial_code: '+974', iso_alpha2_code: 'QA'},
  {dial_code: '+40', iso_alpha2_code: 'RO'},
  {dial_code: '+7', iso_alpha2_code: 'RU'},
  {dial_code: '+250', iso_alpha2_code: 'RW'},
  {dial_code: '+262', iso_alpha2_code: 'RE'},
  {dial_code: '+290', iso_alpha2_code: 'SH'},
  {dial_code: '+1869', iso_alpha2_code: 'KN'},
  {dial_code: '+1758', iso_alpha2_code: 'LC'},
  {dial_code: '+508', iso_alpha2_code: 'PM'},
  {dial_code: '+1784', iso_alpha2_code: 'VC'},
  {dial_code: '+685', iso_alpha2_code: 'WS'},
  {dial_code: '+378', iso_alpha2_code: 'SM'},
  {dial_code: '+239', iso_alpha2_code: 'ST'},
  {dial_code: '+966', iso_alpha2_code: 'SA'},
  {dial_code: '+221', iso_alpha2_code: 'SN'},
  {dial_code: '+381', iso_alpha2_code: 'RS'},
  {dial_code: '+248', iso_alpha2_code: 'SC'},
  {dial_code: '+232', iso_alpha2_code: 'SL'},
  {dial_code: '+65', iso_alpha2_code: 'SG'},
  {dial_code: '+421', iso_alpha2_code: 'SK'},
  {dial_code: '+386', iso_alpha2_code: 'SI'},
  {dial_code: '+677', iso_alpha2_code: 'SB'},
  {dial_code: '+252', iso_alpha2_code: 'SO'},
  {dial_code: '+27', iso_alpha2_code: 'ZA'},
  {dial_code: '+211', iso_alpha2_code: 'SS'},
  {dial_code: '+34', iso_alpha2_code: 'ES'},
  {dial_code: '+94', iso_alpha2_code: 'LK'},
  {dial_code: '+249', iso_alpha2_code: 'SD'},
  {dial_code: '+597', iso_alpha2_code: 'SR'},
  {dial_code: '+268', iso_alpha2_code: 'SZ'},
  {dial_code: '+46', iso_alpha2_code: 'SE'},
  {dial_code: '+41', iso_alpha2_code: 'CH'},
  {dial_code: '+963', iso_alpha2_code: 'SY'},
  {dial_code: '+886', iso_alpha2_code: 'TW'},
  {dial_code: '+992', iso_alpha2_code: 'TJ'},
  {dial_code: '+255', iso_alpha2_code: 'TZ'},
  {dial_code: '+66', iso_alpha2_code: 'TH'},
  {dial_code: '+670', iso_alpha2_code: 'TL'},
  {dial_code: '+228', iso_alpha2_code: 'TG'},
  {dial_code: '+690', iso_alpha2_code: 'TK'},
  {dial_code: '+676', iso_alpha2_code: 'TO'},
  {dial_code: '+1868', iso_alpha2_code: 'TT'},
  {dial_code: '+216', iso_alpha2_code: 'TN'},
  {dial_code: '+90', iso_alpha2_code: 'TR'},
  {dial_code: '+993', iso_alpha2_code: 'TM'},
  {dial_code: '+1649', iso_alpha2_code: 'TC'},
  {dial_code: '+688', iso_alpha2_code: 'TV'},
  {dial_code: '+256', iso_alpha2_code: 'UG'},
  {dial_code: '+380', iso_alpha2_code: 'UA'},
  {dial_code: '+971', iso_alpha2_code: 'AE'},
  {dial_code: '+44', iso_alpha2_code: 'GB'},
  {dial_code: '+1', iso_alpha2_code: 'US'},
  {dial_code: '+598', iso_alpha2_code: 'UY'},
  {dial_code: '+998', iso_alpha2_code: 'UZ'},
  {dial_code: '+678', iso_alpha2_code: 'VU'},
  {dial_code: '+58', iso_alpha2_code: 'VE'},
  {dial_code: '+84', iso_alpha2_code: 'VN'},
  {dial_code: '+1284', iso_alpha2_code: 'VG'},
  {dial_code: '+1340', iso_alpha2_code: 'VI'},
  {dial_code: '+681', iso_alpha2_code: 'WF'},
  {dial_code: '+967', iso_alpha2_code: 'YE'},
  {dial_code: '+260', iso_alpha2_code: 'ZM'},
  {dial_code: '+263', iso_alpha2_code: 'ZW'}]

