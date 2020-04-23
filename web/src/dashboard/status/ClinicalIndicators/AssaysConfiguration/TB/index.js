import '../contstants';
import messages from '../../messages';

const tbAssayConfig = {
  id: ['GxMtbRif', 'GxMtbRifUltra'],
  period: MONTH.plural,
  title: intl.formatMessage(messages.clinicalIndicatorsTBTitle),
  graphType: [
    {
      dataKey: DATAKEYS.month,
      component: BarGraph,
      componentClass: BARCLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.result2,
      resultCategory1: 'Detected',
      indexBy: MONTH.single,
      groupBy: [MONTH.single, RESULT.result1, RESULT.result2],
      legend: true,
      formatDate: MONTH.format,
      minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd')
    },
    {
      dataKey: DATAKEYS.aggregate,
      component: PieGraph,
      componentClass: PIECLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.result2,
      resultCategory1: 'Detected',
      indexBy: PIEINDEX.count,
      groupBy: [RESULT.result1, RESULT.result2],
      legend: false,
      averages: {
        title: intl.formatMessage(messages.clinicalIndicatorsTBPieLegend),
        key: 'Detected'
      },
      minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd')
    }
  ]
};

export default tbAssayConfig;
