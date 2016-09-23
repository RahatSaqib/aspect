// Imports from packages
import React from 'react'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

const VALUE_LOAD_MORE = 'VALUE_LOAD_MORE'
const VALUE_LOADING_MORE = 'VALUE_LOADING_MORE'

export default class PageableSelectField extends React.PureComponent {
  // http://www.material-ui.com/#/components/select-field

  static propTypes = {
    onLoadMoreClick: React.PropTypes.func.isRequired,
    isLoadingMore: React.PropTypes.bool.isRequired,
    loadMoreText: React.PropTypes.string.isRequired,
    loadingMoreText: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func.isRequired
  }

  handleChange = (event, index, value) => {
    switch (value) {
    case VALUE_LOAD_MORE:
      this.props.onLoadMoreClick()
      break
    case VALUE_LOADING_MORE:
      break
    default:
      this.props.onChange(event, index, value)
    }
  }

  render() {
    const {
      children,
      onLoadMoreClick, // eslint-disable-line no-unused-vars
      isLoadingMore,
      loadMoreText,
      loadingMoreText,
      ...restProps
    } = this.props

    return (
      <SelectField
        {...restProps}
        onChange={this.handleChange}
      >
        {children}
        {isLoadingMore ?
        <MenuItem key={VALUE_LOADING_MORE} value={VALUE_LOADING_MORE} primaryText={loadingMoreText} /> :
        <MenuItem key={VALUE_LOAD_MORE} value={VALUE_LOAD_MORE} primaryText={loadMoreText} />}
      </SelectField>
    )
  }
}
