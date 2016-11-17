// Imports from packages
import classnames from 'classnames/bind'
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form/immutable'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import AutoComplete from 'material-ui/AutoComplete'
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app'

// Our own imports
import { fetchSites } from '../../site/SiteRedux'

// use classnames module to handle style classes
import styles from './DeviceDetail.css'

const cssClasses = classnames.bind(styles)

const renderTextField = ({ input, meta, ...restProps }) => (
  <TextField
    {...restProps}
    {...input}
    fullWidth
    errorStyle={{ float: 'left' }}
    errorText={meta.touched && meta.error}
  />
)

const renderGoToSiteField = ({ input }) => (
  <Link title="Go to site" to={`/site/${input.value}`} >
    <ExitToApp className={cssClasses('GoToSite')} />
  </Link>
  )

const handleAutoCompleteChange = (chosenRequest, index, input, allSites) => {
  let value = input.value

  // if user typed text and pressed Enter, then index=-1 - and chosenRequest is string value (see API doc - http://www.material-ui.com/#/components/auto-complete)
  if (index === -1) {
    const textLo = chosenRequest.toLowerCase().trim()
    const site = allSites.find(o => o.text.toLowerCase() === textLo)
    if (site) {
      value = site.value
    }
  } else {
    // if user selected item from the list then index>=0 and chosenRequest
    // is object literal of default format {text:'', value:''}
    value = chosenRequest.value
  }

  // set value - AutoComplete handles new/changed value by itself
  input.onChange(value)
}

// --------------------------
// on bluring - check if actual visual site name is correct (exists in datasource)
// and is equal siteId value stored in props
// --------------------------
const handleAutoCompleteBlur = (textValue, input, siteCurrent, allSites) => {
  const textLo = textValue.toLowerCase().trim()
  const siteNew = allSites.find(o => o.text.toLowerCase() === textLo)

  // site with this name exists
  if (siteNew) {
    // if visual site name differs from currently stored in props - change it
    if (siteNew.value !== siteCurrent.value) {
      input.onChange(siteNew.value)
    }
  } else {
    // if no site found with this name - empty field
    input.onChange(null)
  }

  // push upper onBlur to run form validation
  input.onBlur()
}

const renderAutoCompleteField = ({ input, meta, ...restProps }) => {
  const allSites = restProps.dataSource
  const site = allSites.find(o => o.value === input.value.trim())

  return (
    <AutoComplete
      hintText="Enter site name"
      {...restProps}
      {...input}
      searchText={site ? site.text : ''}
      onNewRequest={(chosenRequest, index) =>
        handleAutoCompleteChange(chosenRequest, index, input, allSites)}
      onBlur={ev => handleAutoCompleteBlur(ev.target.value, input, site, allSites)}
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

export class Form extends PureComponent {

  static propTypes = {
    labels: PropTypes.object.isRequired,
    fetchSites: PropTypes.func.isRequired,
    items: PropTypes.object.isRequired,
    table: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    valid: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired
  }

  // TODO: if site_id is set to one not present in client redux store,
  // the SelectField cannot match the item for display and it'll be blank
  // So, load the sigle site resource in cDM
  //
  componentDidMount() {
    this.props.fetchSites({}, undefined, undefined, 0, 99999)
  }

  render() {
    const { labels, items, table, handleSubmit, pristine, submitting, valid } = this.props

    // all sites for dataSource property of 'Site' AutoComplete component
    const allSites = items.byId.valueSeq().map(item => ({ value: item.get('id'), text: item.get('name') })).toJS()

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" floatingLabelText={labels.name} component={renderTextField} />
        <Field name="shortName" floatingLabelText={labels.shortName} component={renderTextField} />
        <Field name="notes" multiLine floatingLabelText={labels.notes} component={renderTextField} />

        <table className={cssClasses('pure-table', 'SelectSiteRow')}>
          <tbody>
            <tr>
              <td>
                <Field
                  dataSource={allSites}
                  name="site"
                  floatingLabelText={labels.site}
                  component={renderAutoCompleteField}
                  filter={AutoComplete.caseInsensitiveFilter}
                />
              </td>
              <td>
                <Field name="site" component={renderGoToSiteField} />
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <RaisedButton disabled={pristine || !valid || submitting} onClick={handleSubmit} type="button" label="Update" secondary />
        {submitting && <LinearProgress />}
      </form>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.site.items,
    table: state.site.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSites
  }, dispatch)
}

function validate(values) {
  const errors = {}

  if (values) {
    if (!values.get('name')) {
      errors.name = 'Required'
    }
    if (!values.get('shortName')) {
      errors.shortName = 'Required'
    }
    if (!values.get('site')) {
      errors.site = 'Required'
    }
  }

  return errors
}

export const FormContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'deviceDetail',
    validate
  })
)(Form)
