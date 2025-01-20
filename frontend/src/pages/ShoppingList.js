import React from 'react';

import { useParams } from 'react-router-dom';

import { Container, Typography } from '@mui/material';

import ShoppingListItems from '../components/shopping/ShoppingListItems';

const ShoppingList = () => {
  const { listId } = useParams();

  return (
    <Container maxWidth='md'>
      <Typography variant='h4' gutterBottom>
        Shopping List
      </Typography>
      <ShoppingListItems listId={listId} />
    </Container>
  );
};

export default ShoppingList;
