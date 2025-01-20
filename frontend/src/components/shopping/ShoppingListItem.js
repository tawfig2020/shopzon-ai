import React from 'react';

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Checkbox,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';

const ShoppingListItem = ({ item, onToggle, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <ListItem
        sx={{
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Checkbox checked={item.completed} onChange={() => onToggle(item)} edge='start' />
        <ListItemText
          primary={
            <Typography
              variant='body1'
              sx={{
                textDecoration: item.completed ? 'line-through' : 'none',
                color: item.completed ? 'text.secondary' : 'text.primary',
              }}
            >
              {item.name}
            </Typography>
          }
          secondary={
            <Typography variant='caption' color='text.secondary'>
              {item.category} {item.quantity && `• Qty: ${item.quantity}`}
              {item.price && ` • $${item.price}`}
            </Typography>
          }
        />
        <ListItemSecondaryAction>
          <IconButton edge='end' aria-label='edit' onClick={() => onEdit(item)} sx={{ mr: 1 }}>
            <EditIcon />
          </IconButton>
          <IconButton edge='end' aria-label='delete' onClick={() => onDelete(item.id)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </motion.div>
  );
};

ShoppingListItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    quantity: PropTypes.number,
    price: PropTypes.number,
    completed: PropTypes.bool,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ShoppingListItem;
