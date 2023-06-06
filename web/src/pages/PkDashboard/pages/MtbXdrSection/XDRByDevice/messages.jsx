import { defineMessages } from 'react-intl'
import { consumableMessages, deviceStatusMessages, commonDefinitions } from '../../../../../messages'

const messages = {
  ...commonDefinitions,
  ...consumableMessages,
  ...deviceStatusMessages,
  ...defineMessages({
    XDRAssayResultsSummary: { id: 'pages.XDR.AssayResultsSummary', defaultMessage: 'XDR Assay Results Summary' },

    site: { id: 'pages.XDR.site', defaultMessage: 'Site' },
    totalPmdtSites: { id: 'pages.XDR.totalPmdtSites', defaultMessage: 'Number of PMDT Sites with 10 C GX' },
    totalXdrSites: { id: 'pages.XDR.totalXdrSites', defaultMessage: 'Number of sites tested MTB/XDR Assay' },
    totalConducted: { id: 'pages.XDR.totalConducted', defaultMessage: 'XDR Tests Conducted' },
    cntAll: { id: 'pages.XDR.cntAll', defaultMessage: 'Total Tests' },
    cnt_mtb: { id: 'pages.XDR.cnt_mtb', defaultMessage: 'MTB+ #' },
    cnt_mtb_p: { id: 'pages.XDR.cnt_mtb_p', defaultMessage: 'MTB+ %' },
    cnt_inh: { id: 'pages.XDR.cnt_inh', defaultMessage: 'INH #' },
    cnt_inh_p: { id: 'pages.XDR.cnt_inh_p', defaultMessage: 'INH %' },
    cnt_flq: { id: 'pages.XDR.cnt_flq', defaultMessage: 'FQ #' },
    cnt_flq_p: { id: 'pages.XDR.cnt_flq_p', defaultMessage: 'FQ %' },
    cnt_amk: { id: 'pages.XDR.cnt_amk', defaultMessage: 'AMK #' },
    cnt_amk_p: { id: 'pages.XDR.cnt_amk_p', defaultMessage: 'AMK %' },
    cnt_eth: { id: 'pages.XDR.cnt_eth', defaultMessage: 'ETH #' },
    cnt_eth_p: { id: 'pages.XDR.cnt_eth_p', defaultMessage: 'ETH %' },
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
