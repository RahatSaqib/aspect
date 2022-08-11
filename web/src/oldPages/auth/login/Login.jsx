import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import get from 'lodash/get'
import classnames from 'classnames/bind'
import React, { useState } from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'

import { Unit } from '../../../oldComponents/pureGrids'
import recomposeForm, { errorProps } from '../../../oldComponents/recomposeForm'
import { loginStart } from '../../../store/AuthRedux'
import Reason from './Reason'
import { reasonTypes } from '../loggedOutReasons'

import messages from './messages'
import styles from './Login.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  injectIntl,
  connect(
    state => ({
      loggedOutReason: state.user.loggedOutReason,
    }),
    {
      loginStart,
    }
  ),
  WrappedComponent => props => {
    const navigate = useNavigate()
    const location = useLocation()
    const [state, setState] = useState({
      values: {
        user: '',
        password: '',
      },
    })

    const onSubmit = data => {
      const { loginStart, loggedOutReason } = props
      loginStart(data).then(() => {
        const referrer = flowRight(
          x => omit(x, 'search'),
          x =>
            get(x, 'state.referrer', {
              pathname: '/',
            })
        )(location)
        if (loggedOutReason === reasonTypes.idle) {
          navigate(referrer, { replace: true })
        } else if (loggedOutReason === reasonTypes.userRequested) {
          navigate('/', { replace: true })
        } else {
          navigate(referrer)
        }
      })
    }

    const onChange = nextValues => {
      setState({ values: nextValues })
    }

    return <WrappedComponent {...props} {...state} onSubmit={onSubmit} onChange={onChange} />
  },
  recomposeForm({
    fields: [
      {
        fieldName: 'user',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'password',
        valueFromChangeEvent: it => it.target.value,
      },
    ],
    validate(values) {
      const errors = {}
      if (values) {
        if (!values.user) {
          errors.user = 'Please enter your username'
        }
        if (!values.password) {
          errors.password = 'Please enter your password'
        }
      }
      return errors
    },
  })
)

const AspectLogo = () => (
  <img className={cssClasses('Logo__Image')} src={require('../../../assets/logo_aspect.png')} alt="Aspect" />
)

export const Login = ({ intl, location, form, meta, values, onUserChange, onPasswordChange, handleSubmit }) => (
  <div className={cssClasses('Background')}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <div>
      <Unit sm="1-24" md="1-6" lg="1-3" xl="1-3" />
      <Unit sm="11-12" md="2-3" lg="1-3" xl="1-3">
        <Card>
          <div className={cssClasses('Logo__Container')}>
            <AspectLogo />
          </div>
          <form onSubmit={handleSubmit} className={cssClasses('Form')}>
            <Reason intl={intl} location={location} className={cssClasses('Form__Info')} />
            <TextField
              autoFocus
              fullWidth
              name="user"
              label={intl.formatMessage(messages.user)}
              value={values.user}
              onChange={onUserChange}
              {...errorProps(meta.user)}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <TextField
              fullWidth
              type="password"
              name="password"
              label={intl.formatMessage(messages.password)}
              value={values.password}
              onChange={onPasswordChange}
              {...errorProps(meta.password)}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <div className={cssClasses('Form__ActionRow')}>
              <Button
                type="submit"
                variant="contained"
                data-test="loginSubmit"
                color="primary"
                className={cssClasses('Button')}
                disabled={!form.valid}
              >
                {intl.formatMessage(messages.login)}
              </Button>
              <Link className={cssClasses('Right_Align')} to="/reset-password">
                {intl.formatMessage(messages.resetPasswordLink)}
              </Link>
            </div>
          </form>
          {form.submitting && <LinearProgress className={cssClasses('Progress')} />}
        </Card>
      </Unit>
    </div>
  </div>
)

export default enhance(Login)
