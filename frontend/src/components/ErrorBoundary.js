import React, { Component } from 'react';

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { ErrorOutline } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { errorTracker } from '../services/monitoring/error-tracker';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const StyledErrorIcon = styled(ErrorOutline)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    errorTracker.trackError('ErrorBoundary', {
      errorMessage: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StyledBox>
              <StyledErrorIcon />
              <Typography variant='h4' gutterBottom>
                Oops! Something went wrong.
              </Typography>
              <Typography variant='body1' color='textSecondary' paragraph>
                We apologize for the inconvenience. Our team has been notified.
              </Typography>
              <Button variant='contained' color='primary' onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </StyledBox>
          </motion.div>
        </Container>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
