import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/Add';
import MicIcon from '@mui/icons-material/Mic';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
} from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { shoppingListService } from '../../services/shoppingListService';

const ShoppingRecommendations = ({ listId }) => {
  const { user } = useAuth();
  const [predictiveItems, setPredictiveItems] = useState([]);
  const [priceOptimizations, setPriceOptimizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openVoiceDialog, setOpenVoiceDialog] = useState(false);
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [processedItems, setProcessedItems] = useState([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [user.uid]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const [items, optimizations] = await Promise.all([
        aiService.getPredictiveItems(user.uid),
        aiService.getPriceOptimizations(user.uid),
      ]);
      setPredictiveItems(items);
      setPriceOptimizations(optimizations);
    } catch (err) {
      setError('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setVoiceInput(text);
        try {
          const items = await aiService.processVoiceInput(text);
          setProcessedItems(items);
        } catch (err) {
          setError('Failed to process voice input');
        }
      };

      recognition.onerror = (event) => {
        setError('Voice recognition error: ' + event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      setError('Voice recognition is not supported in your browser');
    }
  };

  const handleRecipeInput = async () => {
    try {
      const items = await aiService.generateListFromRecipe(recipeText);
      setProcessedItems(items);
    } catch (err) {
      setError('Failed to process recipe');
    }
  };

  const addToList = async (item) => {
    try {
      await shoppingListService.addItem(listId, {
        name: item.name,
        category: item.category,
        quantity: item.quantity || 1,
        userId: user.uid,
        completed: false,
      });
    } catch (err) {
      setError('Failed to add item to list');
    }
  };

  const addProcessedItems = async () => {
    try {
      await Promise.all(processedItems.map((item) => addToList(item)));
      setProcessedItems([]);
      setVoiceInput('');
      setRecipeText('');
      setOpenVoiceDialog(false);
      setOpenRecipeDialog(false);
    } catch (err) {
      setError('Failed to add items to list');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant='outlined' startIcon={<MicIcon />} onClick={() => setOpenVoiceDialog(true)}>
          Voice Input
        </Button>
        <Button
          variant='outlined'
          startIcon={<RestaurantIcon />}
          onClick={() => setOpenRecipeDialog(true)}
        >
          Add from Recipe
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Predicted Items
              </Typography>
              <List>
                {predictiveItems.map((item) => (
                  <ListItem key={item.name}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Confidence: ${Math.round(item.confidence * 100)}%`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge='end' onClick={() => addToList(item)}>
                        <AddIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Price Optimizations
              </Typography>
              <List>
                {priceOptimizations.map((opt) => (
                  <ListItem key={opt.name}>
                    <ListItemText
                      primary={opt.name}
                      secondary={
                        <>
                          <Typography variant='body2' component='span'>
                            {opt.recommendation}
                          </Typography>
                          <br />
                          <Chip
                            icon={<TrendingUpIcon />}
                            label={`Save $${opt.potentialSavings.toFixed(2)}`}
                            size='small'
                            color='success'
                            sx={{ mt: 1 }}
                          />
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {/* Voice Input Dialog */}
      <Dialog
        open={openVoiceDialog}
        onClose={() => setOpenVoiceDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Voice Input</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant='contained'
              startIcon={<MicIcon />}
              onClick={handleVoiceInput}
              disabled={isListening}
            >
              {isListening ? 'Listening...' : 'Start Speaking'}
            </Button>

            <TextField
              fullWidth
              multiline
              rows={4}
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              sx={{ mt: 2 }}
              label='Recognized Text'
            />

            {processedItems.length > 0 && (
              <List>
                {processedItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity}, Category: ${item.category}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVoiceDialog(false)}>Cancel</Button>
          <Button
            onClick={addProcessedItems}
            disabled={processedItems.length === 0}
            variant='contained'
          >
            Add to List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recipe Dialog */}
      <Dialog
        open={openRecipeDialog}
        onClose={() => setOpenRecipeDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add from Recipe</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            sx={{ mt: 2 }}
            label='Paste Recipe'
            placeholder='Paste your recipe here...'
          />

          <Button
            variant='contained'
            onClick={handleRecipeInput}
            sx={{ mt: 2 }}
            disabled={!recipeText}
          >
            Process Recipe
          </Button>

          {processedItems.length > 0 && (
            <List>
              {processedItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={item.name}
                    secondary={`Quantity: ${item.quantity}${item.unit ? ` ${item.unit}` : ''}, Category: ${item.category}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecipeDialog(false)}>Cancel</Button>
          <Button
            onClick={addProcessedItems}
            disabled={processedItems.length === 0}
            variant='contained'
          >
            Add to List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ShoppingRecommendations.propTypes = {
  listId: PropTypes.string.isRequired,
};

export default ShoppingRecommendations;
