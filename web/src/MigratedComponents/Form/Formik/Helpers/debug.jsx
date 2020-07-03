import React from 'react'
import omit from 'lodash/omit'

const DisplayFormikState = props => (
  <div style={{ margin: '1rem 0' }}>
    <pre
      style={{
        background: '#f6f8fa',
        fontSize: '.85rem',
        padding: '1.5rem',
      }}
    >
      const <strong>formik</strong> =&nbsp;
      {JSON.stringify(omit(props, ['formConfig', 'wizard']), null, 2)}
    </pre>
  </div>
)

export default DisplayFormikState
