import _ from 'lodash'
import subDays from 'date-fns/subDays'
import classnames from 'classnames/bind'
import React from 'react'
import { withStateHandlers } from 'recompose'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { Input } from 'react-toolbox/lib/input'
import { Button } from 'react-toolbox/lib/button'
import MdRefresh from 'react-icons/lib/md/refresh'
import TableBody from '@material-ui/core/TableBody'

import { Unit } from '../../../components/pureGrids'
import NotificationDetailBackBar from '../NotificationDetailBackBar'
import {
  NotificationDeliveryDataTable,
  NotificationDeliveryDataTableRow,
} from './NotificationDeliveryDataTable'

const cssClasses = classnames.bind(require('../NotificationDetail.css'))

// TODO: Switch back to just using Button directly. This is demo only
const MockTogglBtn = withStateHandlers(
  props => ({ inverse: !!props.inverse }),
  {
    onClick: ({ inverse }) => () => ({ inverse: !inverse }),
  }
)(Button)

const enhance = _.identity

const INPUT_THEME = {
  inputElement: cssClasses('Input__inputElement'),
}

const BUTTON_THEME = {
  primary: cssClasses('Button--primary'),
  raised: cssClasses('Button--raised'),
  inverse: cssClasses('Button--inverse'),
}

const now = new Date()

export const NotificationDetailView = ({
  intl,
  history,
  location,
  match,
  // --- injected by recompose ---
}) => (
  <div>
    <Helmet title="TB MTB+ Rif+ in Western Region" />
    <NotificationDetailBackBar
      intl={intl}
      history={history}
      location={location}
      match={match}
      title="TB MTB+ Rif+ in Western Region"
    />
    <section className={cssClasses('Section', 'Section--first')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Alerts title</h2>
        <div>
          <Input
            theme={INPUT_THEME}
            placeholder="TB MTB+ Rif+ in Western Region"
          />
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Alert type</h2>
        <div>
          {['Result', 'Calibration', 'Error', 'Reporting', 'Inventory'].map(
            label => (
              <MockTogglBtn
                key={label}
                className={cssClasses('Card__Button', 'Card__Button--inline')}
                primary
                raised
                inverse={label !== 'Result'}
                label={label}
                theme={BUTTON_THEME}
              />
            )
          )}
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Disease</h2>
        <div>
          {['TB', 'HIV', 'HCV', 'Any disease'].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              inverse={label !== 'TB'}
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Result</h2>
        <div>
          {[
            'MTB-',
            'MTB+',
            'MTB+ Rif-',
            'MTB+ Rif+',
            'MTB+ Rif?',
            'Invalid',
            'Error',
            'No result',
          ].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              inverse={label !== 'MTB+ Rif?'}
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Devices</h2>
        <div>
          {[
            'Any',
            'Choose by state',
            'Choose by county',
            'Choose by individual devices',
          ].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              inverse={label !== 'Choose by state'}
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
        <hr />
        <div>
          <Input
            theme={INPUT_THEME}
            placeholder="TB MTB+ Rif+ in Western Region"
          />
        </div>
        <div>
          {[
            'State name 1 (3 devices)',
            'State name 2 (0 devices)',
            'State name 3 (2 devices)',
          ].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Recipients</h2>
        <div>
          <Unit sm="1-2" md="1-3">
            {[
              'All national contacts',
              'State contacts (in same state as device)',
              'County contacts (in same county as device)',
              'Lab contacts for the device',
              'Users with same tag as result',
              'Patient',
              'Individual users',
            ].map(label => (
              <MockTogglBtn
                key={label}
                className={cssClasses('Card__Button', 'Card__Button--block')}
                primary
                raised
                inverse={
                  !_.includes(
                    [
                      'State contacts (in same state as device)',
                      'Lab contacts for the device',
                    ],
                    label
                  )
                }
                label={label}
                theme={BUTTON_THEME}
              />
            ))}
          </Unit>
          <Unit sm="1-2" md="2-3" className={cssClasses('Recipients__Right')}>
            <div>
              <Input theme={INPUT_THEME} defaultValue="Tag A" />
            </div>
            <div>
              <MockTogglBtn
                className={cssClasses('Card__Button', 'Card__Button--inline')}
                primary
                raised
                label="Tag name"
                theme={BUTTON_THEME}
              />
            </div>
          </Unit>
        </div>
        <hr />
        <div>
          Include data reported up to{' '}
          <Input
            theme={INPUT_THEME}
            className={cssClasses('Input--inline')}
            defaultValue="30"
          />{' '}
          days before
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Delivery</h2>
        <div>
          {['Web', 'Email', 'SMS', 'Web hook'].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              inverse={_.includes(['Web', 'Email'], label)}
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Summary</h2>
        <div>
          <span>If there is a</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="Result"
            theme={BUTTON_THEME}
          />
          <span>for</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="TB"
            theme={BUTTON_THEME}
          />
          <span>that is</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="MTB+ Rif+"
            theme={BUTTON_THEME}
          />
        </div>
        <hr />
        <div>
          <span>Coming from</span>
          {[
            'State name 1 (3 devices)',
            'State name 2 (0 devices)',
            'State name 3 (2 devices)',
          ].map(label => (
            <MockTogglBtn
              key={label}
              className={cssClasses('Card__Button', 'Card__Button--inline')}
              primary
              raised
              label={label}
              theme={BUTTON_THEME}
            />
          ))}
        </div>
        <hr />
        <div>
          <span>Alert people</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="State contacts (in same state as device)"
            theme={BUTTON_THEME}
          />
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="Lab contacts for the device"
            theme={BUTTON_THEME}
          />
          <span>tagged</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="tag name"
            theme={BUTTON_THEME}
          />
        </div>
        <hr />
        <div>
          <span>Send alert by</span>
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="Web"
            theme={BUTTON_THEME}
          />
          <MockTogglBtn
            className={cssClasses('Card__Button', 'Card__Button--inline')}
            primary
            raised
            label="Email"
            theme={BUTTON_THEME}
          />
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>
          <div>Result</div>
          <div>
            <MockTogglBtn className={cssClasses('Button--square')} raised>
              <MdRefresh />
            </MockTogglBtn>
          </div>
        </h2>
        <NotificationDeliveryDataTable
          selectable={false}
          className={cssClasses('NotificationDeliveryDataTable')}
        >
          <TableBody>
            {[
              {
                id: 1,
                topic: 'health',
                title: 'TB MTB+ Rif+ in Western Region',
                site: 'Fort Portal Lab',
                time: subDays(now, 2),
              },
              {
                id: 2,
                topic: 'health',
                title: 'TB MTB+ Rif+ in Western Region',
                site: 'Fort Portal Lab',
                time: subDays(now, 3),
              },
              {
                id: 3,
                topic: 'health',
                title: 'TB MTB+ Rif+ in Western Region',
                site: 'Jinja Lab',
                time: subDays(now, 5),
              },
              {
                id: 4,
                topic: 'health',
                title: 'TB MTB+ Rif+ in Western Region',
                site: 'Kampala Lab',
                time: subDays(now, 6),
              },
              {
                id: 5,
                topic: 'health',
                title: 'TB MTB+ Rif+ in Western Region',
                site: 'Fort Portal Lab',
                time: subDays(now, 7),
              },
            ].map(delivery => (
              <NotificationDeliveryDataTableRow
                key={delivery.id}
                intl={intl}
                delivery={delivery}
              />
            ))}
          </TableBody>
        </NotificationDeliveryDataTable>
        <p>Showing 5 sample alerts matching query</p>
      </Card>
    </section>
    <section className={cssClasses('Section', 'Section--last')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>Alerts title</h2>
        <div>
          <Input
            theme={INPUT_THEME}
            defaultValue="TB MTB+ Rif+ in Western Region"
          />
          <Input
            theme={INPUT_THEME}
            multiline
            rows={3}
            defaultValue="Hello [r"
          />
        </div>
      </Card>
    </section>
  </div>
)

export default enhance(NotificationDetailView)
