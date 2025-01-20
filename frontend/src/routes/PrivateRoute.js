import React from 'react';

import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { featureTracker } from '../services/monitoring/feature-tracker';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!currentUser) {
      featureTracker.trackFeatureUse('auth', 'private_route_redirect', {
        from: location.pathname,
      });
    }
  }, [currentUser, location]);

  return currentUser ? children : <Navigate to='/login' state={{ from: location }} />;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
