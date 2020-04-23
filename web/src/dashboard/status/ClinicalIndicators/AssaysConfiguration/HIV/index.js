import '../contstants';
import messages from '../../messages';

const hivAssayConfig = {
  id: [
    'abbottM2000DBSHivVL',
    'abbottM2000PlasmaHivVL',
    'assayAlereQHiv12Detect',
    'assayAlereQHiv12VLPlasma',
    'assayCobasHivVl',
    'GxHiv1Vl',
    'QHivVL',
    'ReporterHivVL'
  ],
  period: MONTH.plural,
  title: intl.formatMessage(messages.clinicalIndicatorsVLTitle),
  graphType: [
    {
      dataKey: DATAKEYS.month,
      component: BarGraph,
      componentClass: BARCLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.result1,
      indexBy: MONTH.single,
      groupBy: [MONTH.single, RESULT.result1],
      legend: true,
      formatDate: MONTH.format,
      minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd')
    },
    {
      dataKey: DATAKEYS.aggregate,
      component: PieGraph,
      componentClass: PIECLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.result1,
      indexBy: PIEINDEX.count,
      groupBy: [RESULT.result1],
      legend: false,
      averages: {
        title: intl.formatMessage(messages.clinicalIndicatorsPieLegend),
        key: ['Not Detected', '< 1000']
      },
      minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd')
    }
  ]
};

export default hivAssayConfig;
