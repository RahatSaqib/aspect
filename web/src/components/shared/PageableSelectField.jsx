import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

const VALUE_LOAD_MORE = 'VALUE_LOAD_MORE'
const VALUE_LOADING_MORE = 'VALUE_LOADING_MORE'

export default class PageableSelectField extends PureComponent {
  // http://www.material-ui.com/#/components/select-field

  static propTypes = {
    onLoadMoreClick: PropTypes.func.isRequired,
    isLoadingMore: PropTypes.bool.isRequired,
    loadMoreText: PropTypes.string.isRequired,
    loadingMoreText: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
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
      <SelectField {...restProps} onChange={this.handleChange}>
        {children}
        {isLoadingMore
          ? <MenuItem
              key={VALUE_LOADING_MORE}
              value={VALUE_LOADING_MORE}
              primaryText={loadingMoreText}
            />
          : <MenuItem
              key={VALUE_LOAD_MORE}
              value={VALUE_LOAD_MORE}
              primaryText={loadMoreText}
            />}
      </SelectField>
    )
  }
}
