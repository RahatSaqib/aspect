import '../contstants';

const hivAssayConfig = {
  id: hivAssayResultCategory1Config,
  assays: [
    'abbottM2000DBSHivVL',
    'abbottM2000PlasmaHivVL',
    'assayAlereQHiv12Detect',
    'assayAlereQHiv12VLPlasma',
    'assayCobasHivVl',
    'GxHiv1Vl',
    'QHivVL',
    'ReporterHivVL'
  ],
  endpoint: 'clinical-indicator-aggregations',
  groupBy: ['month', 'resultCategory1'],
  description: 'Result catogory results by month for all HIV assays'
};

export default hivAssayConfig;
