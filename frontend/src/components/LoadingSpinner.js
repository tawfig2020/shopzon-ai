import React from 'react';

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingSpinner = ({ message }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: [0, 0.71, 0.2, 1.01],
        }}
      >
        <CircularProgress size={60} />
      </motion.div>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Typography
            variant='h6'
            sx={{
              mt: 2,
              color: 'text.secondary',
            }}
          >
            {message}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  message: '',
};

export default LoadingSpinner;
