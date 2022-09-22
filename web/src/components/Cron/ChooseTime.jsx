import React from 'react'

import { range } from 'ramda'
import { MenuItem, Select } from '@mui/material'



const ChooseTime = ({hour,onAtHourChange,disabled,minute,onAtMinuteChange}) => {
    console.log("🚀 ~ file: chooseTime.jsx ~ line 9 ~ ChooseTime ~ hour", hour)
    console.log("🚀 ~ file: chooseTime.jsx ~ line 9 ~ ChooseTime ~ minute", minute)

    return (
        <>
            <Select
                value={parseInt(hour||0)}
                onChange={onAtHourChange}
                disabled={disabled}
                margin="none"
            >
                {range(0, 24).map(m => <MenuItem key={m} id={m} value={m}>{m.toString().length < 2 ? `0${m}` : m}</MenuItem>)}
            </Select>
            <Select
                value={parseInt(minute||0)}                
                onChange={onAtMinuteChange}
                margin="none"
                disabled={disabled}
            >
                {range(0, 60).map(m => <MenuItem key={m} id={m} value={m}>{m.toString().length < 2 ? `0${m}` : m}</MenuItem>)}
            </Select>
        </>
    )
}

export default ChooseTime
