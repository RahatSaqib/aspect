import { defineMessages } from 'react-intl'
import { consumableMessages, deviceStatusMessages, commonDefinitions } from '../../../../../messages'

const messages = {
  ...commonDefinitions,
  ...consumableMessages,
  ...deviceStatusMessages,
  ...defineMessages({
    XDRAssayResultsSummary: { id: 'pages.XDR.AssayResultsSummary', defaultMessage: 'XDR Assay Results Summary' },
    goTo: { id: 'pages.XDR.goTo', defaultMessage: 'Go to XDR assay result summary by device' },

    site: { id: 'pages.XDR.site', defaultMessage: 'Site' },
    totalPmdtSites: { id: 'pages.XDR.totalPmdtSites', defaultMessage: 'Number of PMDT Sites with 10 C GX' },
    totalXdrSites: { id: 'pages.XDR.totalXdrSites', defaultMessage: 'Number of sites tested MTB/XDR Assay' },
    totalConducted: { id: 'pages.XDR.totalConducted', defaultMessage: '# of sites tested MTB/XDR Assay' },
    cntAll: { id: 'pages.XDR.cntAll', defaultMessage: 'Total Tests' },
    cnt_mtb: { id: 'pages.XDR.cnt_mtb', defaultMessage: 'MTB+ R' },
    cnt_mtb_p: { id: 'pages.XDR.cnt_mtb_p', defaultMessage: 'MTB+ R %' },
    cnt_inh: { id: 'pages.XDR.cnt_inh', defaultMessage: 'INH R' },
    cnt_inh_p: { id: 'pages.XDR.cnt_inh_p', defaultMessage: 'INH R %' },
    cnt_flq: { id: 'pages.XDR.cnt_flq', defaultMessage: 'FQ R' },
    cnt_flq_p: { id: 'pages.XDR.cnt_flq_p', defaultMessage: 'FQ R %' },
    cnt_amk: { id: 'pages.XDR.cnt_amk', defaultMessage: 'AMK R' },
    cnt_amk_p: { id: 'pages.XDR.cnt_amk_p', defaultMessage: 'AMK R %' },
    cnt_eth: { id: 'pages.XDR.cnt_eth', defaultMessage: 'ETH R' },
    cnt_eth_p: { id: 'pages.XDR.cnt_eth_p', defaultMessage: 'ETH R %' },
    error: { id: 'pages.XDR.error', defaultMessage: 'Error #' },
    invalid: { id: 'pages.XDR.invalid', defaultMessage: 'Invalid #' },
    noResult: { id: 'pages.XDR.noResult', defaultMessage: 'No Result #' },
    paginatorStatus: {
      id: 'pages.XDR.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# result}
        other {# results}
      }`,
    },
  }),
}

export default messages
