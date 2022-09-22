import React, { useState, useEffect } from 'react'

import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import StartTime from './ChooseTime'
import Card from './Card'



const Daily = ({cronExpression, onChange}) => {
    const [every, setEvery] = useState(false)
    


    useEffect(() => {
        if (cronExpression[3] === '?') {
            setEvery(false)
        } else {
            setEvery(true)
        }
        console.log('re render',cronExpression)
    }, [cronExpression])

    const onDayChange = (e) => {
        if ((e.target.value > 0 && e.target.value < 32) || e.target.value === '') {
            let val = ['0', cronExpression[1] === '*' ? '0' : cronExpression[1], cronExpression[2] === '*' ? '0' : cronExpression[2], '*', '*', '?', '*'];
            if (e.target.value === '') {
                val[3] = '';
            } else {
                val[3] = `1/${e.target.value}`;
            }

            onChange(val)
        }

    }
    const onAtHourChange = (e) => {
        let val = cronExpression;
        val[2] = `${e.target.value}`;
        onChange(val)
    }
    const onAtMinuteChange = (e) => {
        let val = cronExpression;
        val[1] = `${e.target.value}`;
        onChange(val)
    }

    return (
        <div>
            <Paper >
                <Radio
                    
                    checked={every ? true : false}
                    onClick={(e) => { setEvery(true) }}
                    value="1"
                    name="DailyRadio"
                    inputProps={{ 'aria-label': 'DailyRadio' }}
                />
                <TextField
                    id="outlined-number"
                    label="Every day(s)"
                    value={cronExpression[3].split('/')[1] ? cronExpression[3].split('/')[1] : ''}
                    onChange={onDayChange}
                    type="number"
                    InputLabelProps={{
                        disabled: every ? false : true,
                        shrink: true,
                    }}
                    margin="normal"
                    variant="outlined"
                />
            </Paper>
            <Paper>
                <FormControlLabel
                    value="top"
                    control={<Radio
                        onClick={(e) => { setEvery(false); onChange(['0', cronExpression[1], cronExpression[2], '?', '*', 'MON-FRI', '*']) }}
                        value="2"
                        name="DailyRadio"
                        checked={every ? false : true}
                        inputProps={{ 'aria-label': 'DailyRadio' }}
                    />}
                    label="Every week day"
                    
                />

            </Paper>
        
            <Card label="Start time">
                <StartTime hour={cronExpression[2]} minute={cronExpression[1]} onAtMinuteChange={onAtMinuteChange} onAtHourChange={onAtHourChange} />
            </Card>
        </div>
    )
}

export default Daily
