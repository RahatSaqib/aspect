import React from 'react'
import styles from '../../../../../components/shared/DataTableRow.module.css'
import { DataTableRow as Tr, DataTableCell as Td } from '../../../../../components/shared/tableBody'

const TableRow = ({ item, isDistrict }) => {
  return (
    <Tr className={styles.TableRow}>
      <Td className={styles.TableCell}>{item.locationName}</Td>
      {!isDistrict ? (
        <>
          <Td className={styles.TableCell}>{item.isPmdt}</Td>
          <Td className={styles.TableCell}>{item.hasPerformedXdr}</Td>
        </>
      ) : null}
      <Td className={styles.TableCell}>{item.cntAll}</Td>

      <Td className={styles.TableCell}>{item.cnt_mtb}</Td>
      <Td className={styles.TableCell}>{item.cnt_mtb === 0 ? 0 : ((item.cnt_mtb / item.cntAll) * 100).toFixed(2)}%</Td>
      <Td className={styles.TableCell}>{item.cnt_inh}</Td>
      <Td className={styles.TableCell}>{item.cnt_inh === 0 ? 0 : ((item.cnt_inh / item.cnt_mtb) * 100).toFixed(2)}%</Td>
      <Td className={styles.TableCell}>{item.cnt_flq}</Td>
      <Td className={styles.TableCell}>{item.cnt_flq === 0 ? 0 : ((item.cnt_flq / item.cnt_mtb) * 100).toFixed(2)}%</Td>
      <Td className={styles.TableCell}>{item.cnt_amk}</Td>
      <Td className={styles.TableCell}>{item.cnt_amk === 0 ? 0 : ((item.cnt_amk / item.cnt_mtb) * 100).toFixed(2)}%</Td>
      <Td className={styles.TableCell}>{item.cnt_eth}</Td>
      <Td className={styles.TableCell}>{item.cnt_eth === 0 ? 0 : ((item.cnt_eth / item.cnt_mtb) * 100).toFixed(2)}%</Td>

      <Td className={styles.TableCell}>{item.cnt_Error}</Td>
      <Td className={styles.TableCell}>{item.cnt_Invalid}</Td>
      <Td className={styles.TableCell}>{item.cnt_NoResult}</Td>
    </Tr>
  )
}

export default TableRow
