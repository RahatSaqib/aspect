// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form/immutable'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import MenuItem from 'material-ui/MenuItem'

// Our own imports
import { fetchSites } from '../../site/SiteRedux'
import PageableSelectField from '../../components/shared/PageableSelectField'

const renderTextField = ({ input, meta, ...restProps }) => {
  return (
    <TextField
      {...restProps}
      {...input}
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

const renderPageableSelectField = ({ input, meta, ...restProps }) => {
  return (
    <PageableSelectField
      {...restProps}
      {...input}
      onChange={(event, index, value) => input.onChange(value)}
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

export class Form extends PureComponent {

  static propTypes = {
    labels: PropTypes.object.isRequired
  }

  handleLoadMoreClick = () => {
    const { table } = this.props

    this.props.fetchSites(this.props.table.filters, undefined, undefined, table.page + 1)
  }

  // TODO: if site_id is set to one not present in client redux store,
  // the SelectField cannot match the item for display and it'll be blank
  // So, load the sigle site resource in cDM
  //
  componentDidMount() {
    this.props.fetchSites(this.props.table.filters)
  }

  render() {
    const { labels, items, table, handleSubmit, pristine, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" floatingLabelText={labels.name} component={renderTextField} />
        <Field name="shortName" floatingLabelText={labels.shortName} component={renderTextField} />
        <Field name="notes" multiLine floatingLabelText={labels.notes} component={renderTextField} />
        <Field
          onLoadMoreClick={this.handleLoadMoreClick}
          isLoadingMore={table.loading}
          loadMoreText={labels.loadMoreText}
          loadingMoreText={labels.loadingMoreText}
          name="site"
          floatingLabelText={labels.site}
          component={renderPageableSelectField}
        >
          {items.byId.valueSeq().map(item => (
            <MenuItem key={item.get('id')} value={item.get('id')} primaryText={item.get('name')} />
          ))}
        </Field>
        <RaisedButton disabled={pristine || submitting} type="submit" label="Update" secondary />
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

  if (!values.get('name')) {
    errors.name = 'Required'
  }
  if (!values.get('shortName')) {
    errors.shortName = 'Required'
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
