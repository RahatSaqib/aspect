import React, { useState } from 'react'
import cronstrue from 'cronstrue'
import AppBar from '@mui/material/AppBar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Grid from '@mui/material/Grid'
import Daily from './Daily'
import Weekly from './Weekly'
import Monthly from './Monthly'
import DisplayCard from './DisplayCard'
const tabs = ['Daily', 'Weekly', 'Monthly']



const Cron = ({showResultText, showResultCron, onChange}) => {
    const [cronExpression, setCronExpression] = useState(['0', '0', '00', '1/1', '*', '?', '*'])
    const [selectedTab, setSelectedTab] = useState(tabs[0])
    const [selectedTabValue, setSelectedTabValue] = useState(0)

    const getVal =() => {
      let val = cronstrue.toString(cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ','))
      console.log("🚀 ~ file: cron.jsx ~ line 116 ~ getVal ~ val", val)
      if (val.search('undefined') === -1) {
          return val;
      }
      return '-'
    }
    const parentChange = (val) => {
      let newVal = ''
      newVal = val.toString().replace(/,/g, ' ')
      newVal = newVal.replace(/!/g, ',')
      onChange(newVal,getVal())
  }

  
  const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}
    const defaultValue = (tab) => {
        switch (tab) {
            case tabs[0]:
                return ['0', '0', '00', '1/1', '*', '?', '*']
            case tabs[1]:
                return ['0', '0', '00', '?', '*', '*', '*']
            case tabs[2]:
                return ['0', '0', '00', '1', '1/1', '?', '*']
            case tabs[3]:
                return ['0', '0', '00', '1', '1/1', '?', '*']
            default:
                return
        }
    }
    const tabChanged = ({ tab, index }) => {
      console.log('tab,index',tab,index)
      setSelectedTab(tab)
      setSelectedTabValue(index)
      setCronExpression(defaultValue(tab))
      parentChange(defaultValue(tab))
  }

    const onValueChange = (val) => {
        console.log('val', val)
        if (val && val.length) {
            setCronExpression(val)
        } else {
            setCronExpression(['0', '0', '00', '1/1', '*', '?', '*'])
            val = ['0', '0', '00', '1/1', '*', '?', '*'];
        }
        parentChange(val)
    }

    


    const getComponent = (tab) => {
        switch (tab) {
            case tabs[0]:
                return <Daily cronExpression={cronExpression} onChange={onValueChange} />
            case tabs[1]:
                return <Weekly cronExpression={cronExpression} value={cronExpression} onChange={onValueChange} />
            case tabs[2]:
                return <Monthly cronExpression={cronExpression} onChange={onValueChange} />
            default:
              return <Daily cronExpression={cronExpression} onChange={onValueChange} />
        }
    }
    return( <>
        <Grid container>
            <Grid item xs={12}>
                <div>
                <AppBar position="static">
                <Tabs value={selectedTabValue} aria-label="simple tabs example">
                    {tabs.map((tab, index) =>
                        <Tab key={index} label={tab} {...a11yProps(index)} onClick={() => tabChanged({ tab, index })} />
                    )}
                </Tabs>
            </AppBar>
                </div>
                <div className="">{getComponent(selectedTab)}</div>
            </Grid>
        </Grid>
        {(showResultText || showResultCron) &&
            <Grid container justifyContent="center">
                <Grid item xs={8} sm={7} lg={4}>
                    <DisplayCard
                        textResult={showResultText && getVal()}
                        cronResult={showResultCron && cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ',')}
                    />
                </Grid>
            </Grid>
        }
    </>)
}

export default Cron
