import React, { useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { useSelector, useDispatch } from 'react-redux';
import Helmet from 'react-helmet';
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux';
import { fetchAssays } from '../../assay/AssayRedux';
import messages from './messages';
import SummaryStatus from './SummaryStatus';
import InventoryStatus from './InventoryStatus';
import SiteStatus from './SiteStatus';
import ActionStatus from './ActionStatus';
import TargetStatus from './TargetStatus';
import Reports from './Reports';
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown';
import TreatmentStatus from './TreatmentStatus';
import ClinicalIndicators from './ClinicalIndicators/ClinicalIndicators';
import ColorDemo from './ColorDemo/ColorDemo';

const cssClasses = classnames.bind(require('./Status.css'));

const Status = ({ history, location, intl, colorDemo = false }) => {
  const [marginBottom, setMarginBottom] = useState(0);
  const dispatch = useDispatch();
  const userName = useSelector(({ user }) => user.jwt.name);
  const countryIsoAlpha2Code = useSelector(({ user }) =>
    user.culture.substring(3, 5)
  );
  const assays = useSelector(({ assay }) =>
    assay.items.toJS().filter(a => a.hasResults)
  );

  useEffect(() => {
    dispatch(fetchAssays(false));
  }, []);

  useEffect(() => {
    const { search } = location;
    const searchParams = new URLSearchParams(search);

    if (searchParams.has('fl')) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName }
      });
    }
  }, [userName, location]);

  return (
    <div className={cssClasses('Container')} style={{ marginBottom }}>
      <Helmet title="Status" />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown intl={intl} history={history} location={location} />
      </div>
      <SummaryStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--summary')}
      />
      {colorDemo && <ColorDemo vars={process.env} />}
      {assays && assays.length ? (
        <ClinicalIndicators
          intl={intl}
          history={history}
          location={location}
          assays={assays}
        />
      ) : null}
      <TreatmentStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.treatmentTitle)}
      />
      <TargetStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.targetsTitle)}
      />
      <ActionStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.actionTitle)}
        marginBottom={marginBottom}
        setMarginBottom={setMarginBottom}
      />
      <SiteStatus
        history={history}
        intl={intl}
        countryIsoAlpha2Code={countryIsoAlpha2Code}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.sitesTitle)}
      />
      <InventoryStatus
        history={history}
        intl={intl}
        countryIsoAlpha2Code={countryIsoAlpha2Code}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.consumableTitle)}
      />
      <Reports
        intl={intl}
        location={location}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.reportsTitle)}
      />
    </div>
  );
};

export default Status;
