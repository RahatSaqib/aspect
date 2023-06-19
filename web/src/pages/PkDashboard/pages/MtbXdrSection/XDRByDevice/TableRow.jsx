import React from 'react'
import classnames from 'classnames/bind'
import styles from '../../../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../../../oldComponents/shared/tableBody'

const cssClasses = classnames.bind(styles)

const TableRow = ({ item, isDistrict }) => {
  return (
    <Tr className={cssClasses('TableRow')}>
      <Td className={cssClasses('TableCell')}>{item.locationName}</Td>
      {!isDistrict ? (
        <>
          <Td className={cssClasses('TableCell')}>{item.totalPmdtSites}</Td>
          <Td className={cssClasses('TableCell')}>{item.totalXdrSites}</Td>
        </>
      ) : null}
      <Td className={cssClasses('TableCell')}>{item.cntAll}</Td>

      <Td className={cssClasses('TableCell')}>{item.cnt_mtb}</Td>
      <Td className={cssClasses('TableCell')}>
        {item.cnt_mtb === 0 ? 0 : ((item.cnt_mtb / item.cntAll) * 100).toFixed(2)}%
      </Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_inh}</Td>
      <Td className={cssClasses('TableCell')}>
        {item.cnt_inh === 0 ? 0 : ((item.cnt_inh / item.cnt_mtb) * 100).toFixed(2)}%
      </Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_flq}</Td>
      <Td className={cssClasses('TableCell')}>
        {item.cnt_flq === 0 ? 0 : ((item.cnt_flq / item.cnt_mtb) * 100).toFixed(2)}%
      </Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_amk}</Td>
      <Td className={cssClasses('TableCell')}>
        {item.cnt_amk === 0 ? 0 : ((item.cnt_amk / item.cnt_mtb) * 100).toFixed(2)}%
      </Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_eth}</Td>
      <Td className={cssClasses('TableCell')}>
        {item.cnt_eth === 0 ? 0 : ((item.cnt_eth / item.cnt_mtb) * 100).toFixed(2)}%
      </Td>

      <Td className={cssClasses('TableCell')}>{item.cnt_Error}</Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_Invalid}</Td>
      <Td className={cssClasses('TableCell')}>{item.cnt_NoResult}</Td>
    </Tr>
  )
}

export default TableRow
