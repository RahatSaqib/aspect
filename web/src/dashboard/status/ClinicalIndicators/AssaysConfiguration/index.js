import { buildAssaysFromWhitelist } from '../Graphs/Helpers';
import {
  covidDailyConfirmedAssayConfig,
  covidDailyOutcomeAssayConfig,
  covidRecoveryByGenderAssayConfig,
  covidOutcomeDistributionAssayConfig
} from './Covid';

import messages from '../messages';

const {
  clinicalIndicatorsCovidDailyOutcomeTitle,
  clinicalIndicatorsCovidDailyConfirmedTitle,
  clinicalIndicatorsCovidDistributionByGenderTitle,
  clinicalIndicatorsCovidOutcomeDistributionTitle
} = messages;

const assaysConfiguration = (intl, assaysFromState) => {
  const buildAssays = [];
  covidDailyOutcomeAssayConfig.title = intl.formatMessage(
    clinicalIndicatorsCovidDailyOutcomeTitle
  );
  covidOutcomeDistributionAssayConfig.title = intl.formatMessage(
    clinicalIndicatorsCovidOutcomeDistributionTitle
  );
  covidDailyConfirmedAssayConfig.title = intl.formatMessage(
    clinicalIndicatorsCovidDailyConfirmedTitle
  );
  covidRecoveryByGenderAssayConfig.title = intl.formatMessage(
    clinicalIndicatorsCovidDistributionByGenderTitle
  );

  console.log(covidDailyConfirmedAssayConfig);

  const allowedAssays = buildAssaysFromWhitelist(assaysFromState, [
    // covidOutcomeDistributionAssayConfig,
    // covidDailyConfirmedAssayConfig,
    // covidDailyOutcomeAssayConfig
    // covidRecoveryByGenderAssayConfig
    // covidRecoveryByGenderAssayConfig,
  ]);

  allowedAssays.map(assay => {
    const {
      externalId: id,
      stateName,
      name,
      title = false,
      graphType,
      sectionGrid
    } = assay;
    return buildAssays.push({
      id,
      stateName,
      name: title || name,
      graphContainerClass: 'clinicalIndicator__graphs',
      graphType,
      sectionGrid,
      assayFromState: assay
    });
  });

  return buildAssays;
};

export default assaysConfiguration;
