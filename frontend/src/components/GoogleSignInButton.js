import React from 'react';

import PropTypes from 'prop-types';

import { Google as GoogleIcon } from '@mui/icons-material';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  textTransform: 'none',
  padding: '10px 16px',
  borderRadius: '4px',
  border: `1px solid ${theme.palette.grey[300]}`,
  boxShadow: theme.shadows[1],
  '&:hover': {
    backgroundColor: '#f8f8f8',
    boxShadow: theme.shadows[2],
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const GoogleSignInButton = ({ onClick, disabled }) => {
  return (
    <StyledButton
      variant='contained'
      startIcon={<GoogleIcon />}
      onClick={onClick}
      disabled={disabled}
      fullWidth
    >
      Sign in with Google
    </StyledButton>
  );
};

GoogleSignInButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

GoogleSignInButton.defaultProps = {
  disabled: false,
};

export default GoogleSignInButton;
