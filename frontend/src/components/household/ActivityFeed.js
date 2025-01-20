import React, { useState, useEffect } from 'react';

import { format } from 'date-fns';

import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';

import { householdService } from '../../services/householdService';

const activityIcons = {
  created_household: <PersonAddIcon />,
  invited_member: <PersonAddIcon />,
  joined_household: <PersonAddIcon />,
  updated_member_role: <EditIcon />,
  removed_member: <DeleteIcon />,
  created_list: <ShoppingCartIcon />,
  shared_list: <ShareIcon />,
};

const formatActivity = (activity) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'created_household':
        return `created the household "${activity.details.householdName}"`;
      case 'invited_member':
        return `invited ${activity.details.memberEmail} as ${activity.details.role}`;
      case 'joined_household':
        return `joined the household as ${activity.details.role}`;
      case 'updated_member_role':
        return `updated member role to ${activity.details.newRole}`;
      case 'removed_member':
        return 'removed a member';
      case 'created_list':
        return `created shopping list "${activity.details.listName}"`;
      case 'shared_list':
        return `shared a list with ${activity.details.sharedWith}`;
      default:
        return activity.type.replace(/_/g, ' ');
    }
  };

  return {
    icon: activityIcons[activity.type] || <EditIcon />,
    message: getActivityMessage(activity),
    time: formatTime(activity.timestamp),
  };
};

const ActivityFeed = ({ householdId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [householdId]);

  const fetchActivities = async () => {
    try {
      const fetchedActivities = await householdService.getActivities(householdId);
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Activity Feed
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {activities.map((activity, index) => {
              const { icon, message, time } = formatActivity(activity);
              return (
                <React.Fragment key={activity.id}>
                  <ListItem alignItems='flex-start'>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={message} secondary={time} />
                  </ListItem>
                  {index < activities.length - 1 && <Divider variant='inset' component='li' />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
