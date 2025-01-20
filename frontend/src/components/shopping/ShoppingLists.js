import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { shoppingListService } from '../../services/shoppingListService';

const ShoppingLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [listName, setListName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLists();
  }, [user]);

  const fetchLists = async () => {
    try {
      const userLists = await shoppingListService.getUserLists(user.uid);
      setLists(userLists);
    } catch (err) {
      setError('Failed to fetch shopping lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    try {
      await shoppingListService.createList(user.uid, { name: listName });
      setOpenDialog(false);
      setListName('');
      fetchLists();
    } catch (err) {
      setError('Failed to create list');
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await shoppingListService.deleteList(listId);
      fetchLists();
    } catch (err) {
      setError('Failed to delete list');
    }
  };

  const handleShareList = async () => {
    try {
      await shoppingListService.shareList(selectedList.id, shareEmail);
      setOpenShareDialog(false);
      setShareEmail('');
      setSelectedList(null);
    } catch (err) {
      setError('Failed to share list');
    }
  };

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant='h4' component='h1'>
          Shopping Lists
        </Typography>
        <Fab color='primary' aria-label='add' onClick={() => setOpenDialog(true)}>
          <AddIcon />
        </Fab>
      </Box>

      <Grid container spacing={3}>
        {lists.map((list) => (
          <Grid item xs={12} sm={6} md={4} key={list.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant='h6'>{list.name}</Typography>
                    <Box>
                      <IconButton
                        size='small'
                        onClick={() => {
                          setSelectedList(list);
                          setOpenShareDialog(true);
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDeleteList(list.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  {list.shared && list.shared.length > 0 && (
                    <Typography variant='caption' color='textSecondary'>
                      Shared with: {list.shared.join(', ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Create List Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Shopping List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='List Name'
            fullWidth
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateList} variant='contained'>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share List Dialog */}
      <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)}>
        <DialogTitle>Share List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Email Address'
            type='email'
            fullWidth
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareDialog(false)}>Cancel</Button>
          <Button onClick={handleShareList} variant='contained'>
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ShoppingLists;
