import React, { useState, useEffect } from 'react';

import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { householdService, ROLES } from '../../services/householdService';

import ActivityFeed from './ActivityFeed';

const HouseholdManager = () => {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.MEMBER);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const [userHouseholds, invites] = await Promise.all([
        householdService.getUserHouseholds(user.uid),
        householdService.getPendingInvites(user.email),
      ]);
      setHouseholds(userHouseholds);
      setPendingInvites(invites);
    } catch (err) {
      setError('Failed to fetch households');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    try {
      await householdService.createHousehold(user.uid, {
        name: householdName,
        ownerEmail: user.email,
      });
      setOpenNewDialog(false);
      setHouseholdName('');
      fetchHouseholds();
    } catch (err) {
      setError('Failed to create household');
    }
  };

  const handleInviteMember = async () => {
    try {
      await householdService.inviteMember(selectedHousehold.id, user.uid, inviteEmail, inviteRole);
      setOpenInviteDialog(false);
      setInviteEmail('');
      setInviteRole(ROLES.MEMBER);
      fetchHouseholds();
    } catch (err) {
      setError('Failed to invite member');
    }
  };

  const handleAcceptInvite = async (householdId) => {
    try {
      await householdService.acceptInvite(householdId, user.uid, user.email);
      fetchHouseholds();
    } catch (err) {
      setError('Failed to accept invite');
    }
  };

  const handleRemoveMember = async () => {
    try {
      setLoading(true);
      await householdService.removeMember(selectedHousehold.id, selectedMember.id);
      fetchHouseholds();
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    try {
      setLoading(true);
      await householdService.updateMemberRole(selectedHousehold.id, selectedMember.id, 'admin');
      fetchHouseholds();
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    try {
      setLoading(true);
      await householdService.deleteHousehold(selectedHousehold.id);
      fetchHouseholds();
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, household) => {
    setAnchorEl(event.currentTarget);
    setSelectedHousehold(household);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedHousehold(null);
  };

  const handleMemberClick = (member, event) => {
    setSelectedMember(member);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const canManageHousehold = (household) => {
    const userMember = household.members.find((m) => m.userId === user.uid);
    return householdService.hasPermission(userMember?.role, 'manage_household');
  };

  const canManageMembers = (household) => {
    const userMember = household.members.find((m) => m.userId === user.uid);
    return householdService.hasPermission(userMember?.role, 'manage_members');
  };

  return (
    <Box sx={{ mt: 4 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant='h4'>Households</Typography>
        <Button variant='contained' startIcon={<AddIcon />} onClick={() => setOpenNewDialog(true)}>
          Create Household
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Pending Invites
                  </Typography>
                  <List>
                    {pendingInvites.map((household) => (
                      <ListItem key={household.id}>
                        <ListItemText
                          primary={household.name}
                          secondary={`Invited by: ${household.invites.find((i) => i.email === user.email)?.invitedBy}`}
                        />
                        <Button variant='outlined' onClick={() => handleAcceptInvite(household.id)}>
                          Accept
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Households List */}
            {households.map((household) => (
              <Card key={household.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant='h6'>{household.name}</Typography>
                    <IconButton onClick={(e) => handleMenuOpen(e, household)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant='subtitle2' gutterBottom>
                    Members
                  </Typography>
                  <List>
                    {household.members.map((member) => (
                      <ListItem key={member.userId}>
                        <ListItemText
                          primary={member.email}
                          secondary={
                            <Chip
                              label={member.role}
                              size='small'
                              color={member.role === ROLES.OWNER ? 'primary' : 'default'}
                            />
                          }
                        />
                        {canManageMembers(household) && member.userId !== user.uid && (
                          <ListItemSecondaryAction>
                            <IconButton onClick={(e) => handleMemberClick(member, e)}>
                              <MoreVertIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>

                  {canManageMembers(household) && (
                    <Button
                      startIcon={<PersonAddIcon />}
                      onClick={() => {
                        setSelectedHousehold(household);
                        setOpenInviteDialog(true);
                      }}
                    >
                      Invite Member
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Grid>

          <Grid item xs={12} md={4}>
            {selectedHousehold && <ActivityFeed householdId={selectedHousehold.id} />}
          </Grid>
        </Grid>
      )}

      {/* Create Household Dialog */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)}>
        <DialogTitle>Create New Household</DialogTitle>
        <DialogContent>
          <TextField
            margin='normal'
            required
            fullWidth
            label='Household Name'
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            inputProps={{ 'aria-label': 'Household Name' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateHousehold} variant='contained'>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <TextField
            margin='normal'
            required
            fullWidth
            label='Email Address'
            type='email'
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            inputProps={{ 'aria-label': 'Member Email' }}
          />
          <TextField
            select
            margin='normal'
            label='Role'
            fullWidth
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {Object.values(ROLES).map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteMember} variant='contained'>
            Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Household Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedHousehold && canManageHousehold(selectedHousehold) && (
          <MenuItem
            onClick={() => {
              handleDeleteHousehold();
              handleMenuClose();
            }}
          >
            Delete Household
          </MenuItem>
        )}
        {selectedMember && <MenuItem onClick={handleRemoveMember}>Remove Member</MenuItem>}
        {selectedMember && <MenuItem onClick={handlePromoteToAdmin}>Promote to Admin</MenuItem>}
      </Menu>
    </Box>
  );
};

export default HouseholdManager;
