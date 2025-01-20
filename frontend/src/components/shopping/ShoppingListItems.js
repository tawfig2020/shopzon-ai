import React, { useState, useEffect } from 'react';

import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  List,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Autocomplete,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { shoppingListService } from '../../services/shoppingListService';
import { suggestionService } from '../../services/suggestionService';
import ShoppingRecommendations from '../ai/ShoppingRecommendations';

import ShoppingListItem from './ShoppingListItem';

const categories = ['groceries', 'household', 'electronics', 'clothing', 'other'];

const ShoppingListItems = ({ listId }) => {
  if (!listId) {
    throw new Error('listId is required');
  }

  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    const unsubscribe = shoppingListService.subscribeToListItems(listId, (updatedItems) => {
      setItems(updatedItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [listId]);

  useEffect(() => {
    if (itemName.length >= 2) {
      fetchSuggestions(itemName);
    }
  }, [itemName]);

  const fetchSuggestions = async (searchTerm) => {
    const results = await suggestionService.getSuggestions(user.uid, searchTerm);
    setSuggestions(results);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: itemName.trim(),
        category: itemCategory || 'other',
        quantity: itemQuantity ? parseInt(itemQuantity, 10) : null,
        price: itemPrice ? parseFloat(itemPrice) : null,
        completed: false,
        userId: user.uid,
      };

      if (selectedItem) {
        await shoppingListService.updateItem(selectedItem.id, itemData);
      } else {
        await shoppingListService.addItem(listId, itemData);
      }

      resetForm();
    } catch (err) {
      setError('Failed to save item');
    }
  };

  const handleToggleItem = async (item) => {
    try {
      await shoppingListService.updateItem(item.id, {
        completed: !item.completed,
      });
    } catch (err) {
      setError('Failed to update item');
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQuantity(item.quantity?.toString() || '');
    setItemPrice(item.price?.toString() || '');
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await shoppingListService.deleteItem(itemId);
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setItemName('');
    setItemCategory('');
    setItemQuantity('');
    setItemPrice('');
    setOpenDialog(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='h6'>Shopping List</Typography>
            <Button
              variant='contained'
              color='primary'
              onClick={() => setOpenDialog(true)}
              disabled={isLoading}
            >
              Add Item
            </Button>
          </Box>

          {isLoading ? (
            <Box display='flex' justifyContent='center' p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper elevation={2} sx={{ p: 2 }}>
              <List>
                <AnimatePresence>
                  {items.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </AnimatePresence>
              </List>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <ShoppingRecommendations listId={listId} />
        </Grid>
      </Grid>
      <Dialog open={openDialog} onClose={resetForm} maxWidth='sm' fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Autocomplete
              freeSolo
              options={suggestions}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              value={itemName}
              onChange={(_, newValue) => {
                setItemName(typeof newValue === 'string' ? newValue : newValue?.name || '');
                if (newValue && typeof newValue !== 'string') {
                  setItemCategory(newValue.category);
                }
              }}
              onInputChange={(_, newValue) => setItemName(newValue)}
              renderInput={(params) => (
                <TextField {...params} label='Item Name' required fullWidth margin='normal' />
              )}
            />

            <FormControl fullWidth margin='normal'>
              <InputLabel>Category</InputLabel>
              <Select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                label='Category'
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label='Quantity'
              type='number'
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              fullWidth
              margin='normal'
            />

            <TextField
              label='Price'
              type='number'
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              fullWidth
              margin='normal'
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSubmit} variant='contained' color='primary'>
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ShoppingListItems.propTypes = {
  listId: PropTypes.string.isRequired,
};

export default ShoppingListItems;
