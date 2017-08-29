import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, pure, lifecycle } from 'recompose'
import { Mercator } from '@vx/geo'
import { Group } from '@vx/group'
import MdCloudDownload from 'react-icons/lib/md/cloud-download'
import { feature } from 'topojson-client'

const cssClasses = classnames.bind(require('./CountryMap.css'))

const propTypes = {
  /**
ISO Alpha-2 Country Code. Eg. "US"
  */
  countryIsoAlpha2Code: PropTypes.string.isRequired,
  /**
extent is an array that'll be passed into d3-geo/projection.fitExtent method.
Usually it's an array like this:

```js
[
  [margin.left, margin.top],
  [clientWidth - margin.right, clientHeight - margin.bottom],
]
```

@see See [d3-geo/projection.fitExtent](https://github.com/d3/d3-geo#projection_fitExtent)
   */
  extent: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
}

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      this.handleLoad(this.props.countryIsoAlpha2Code)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.countryIsoAlpha2Code === nextProps.countryIsoAlpha2Code) {
        return
      }
      this.handleLoad(nextProps.countryIsoAlpha2Code)
    },

    handleLoad(countryIsoAlpha2Code) {
      this.setState({ loading: true, countryIsoAlpha2Code })
      import(`../../../map/topo/${countryIsoAlpha2Code}.json`)
        .then(topojson => state => {
          if (state.countryIsoAlpha2Code === countryIsoAlpha2Code) {
            return {
              loading: false,
              topojson,
            }
          }
        })
        .then(_.bind(this.setState, this))
    },
  })
)

/**
Renders a country map with internal borders specified by `countryIsoAlpha2Code`
 and fit with `extent`. The country data is asynchronously loaded and it shows a
 download icon when loading.
 All other props are delegated to the underlying `@vx/geo/Mercator` component.

@see [@vx/geo/Mercator](https://vx-demo.now.sh/static/docs/vx-geo.html)
*/
const CountryMap = ({
  countryIsoAlpha2Code,
  extent,
  loading, // eslint-disable-line react/prop-types
  topojson, // eslint-disable-line react/prop-types
  ...restProps
}) => {
  if (loading) {
    return (
      <Group className={cssClasses('Loading')}>
        <MdCloudDownload x="50%" y="50%" />
      </Group>
    )
  }

  const geojson = feature(topojson, topojson.objects[countryIsoAlpha2Code])

  return (
    <Mercator
      data={geojson.features}
      fitExtent={[extent, geojson]}
      {...restProps}
    />
  )
}

CountryMap.propTypes = propTypes

export default enhance(CountryMap)
