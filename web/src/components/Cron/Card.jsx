import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// const useStyles = makeStyles(theme => ({
//     card: {
//         display: 'flex',
//         marginTop: '20px'
//     },
//     details: {
//         display: 'flex',
//         flexDirection: 'column',
//     },
//     content: {
//         flex: '1 0 auto',
//     },
// }))

export default function DisplayCard({label,children}) {

    return (
        <Card >
            <div >
                <CardContent>
                    {label && <Typography variant="subtitle2">
                        {label}
                    </Typography>}
                    {children}
                </CardContent>
            </div>
        </Card>
    );
}