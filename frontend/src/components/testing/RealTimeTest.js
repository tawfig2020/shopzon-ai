import React, { useState, useEffect } from 'react';

import { Container, Grid, Paper, Typography, Button, Box, Alert } from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { shoppingListService } from '../../services/shoppingListService';
import ShoppingListItems from '../shopping/ShoppingListItems';

const testUsers = [
  { email: 'test1@example.com', displayName: 'Test User 1' },
  { email: 'test2@example.com', displayName: 'Test User 2' },
];

const testItems = [
  { name: 'Milk', category: 'groceries', quantity: 1, price: 3.99 },
  { name: 'Bread', category: 'groceries', quantity: 2, price: 2.49 },
  { name: 'Eggs', category: 'groceries', quantity: 12, price: 4.99 },
];

const RealTimeTest = () => {
  const { user } = useAuth();
  const [testListId, setTestListId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      // Cleanup test data when component unmounts
      if (testListId) {
        cleanupTestData();
      }
    };
  }, [testListId]);

  const createTestList = async () => {
    try {
      // Create a new test shopping list
      const listData = {
        name: 'Test Shopping List',
        shared: testUsers.map((u) => u.email),
      };

      const list = await shoppingListService.createList(user.uid, listData);
      setTestListId(list.id);

      // Add test items
      for (const item of testItems) {
        await shoppingListService.addItem(list.id, {
          ...item,
          userId: user.uid,
          completed: false,
        });
      }

      setMessage('Test list created successfully! List ID: ' + list.id);
    } catch (err) {
      setError('Failed to create test list: ' + err.message);
    }
  };

  const cleanupTestData = async () => {
    try {
      if (testListId) {
        await shoppingListService.deleteList(testListId);
        setTestListId(null);
        setMessage('Test data cleaned up successfully!');
      }
    } catch (err) {
      setError('Failed to cleanup test data: ' + err.message);
    }
  };

  const simulateUserEdit = async (userIndex) => {
    try {
      const testItem = {
        name: `Item from ${testUsers[userIndex].displayName}`,
        category: 'groceries',
        quantity: Math.floor(Math.random() * 5) + 1,
        price: (Math.random() * 10).toFixed(2),
        userId: user.uid,
        completed: false,
      };

      await shoppingListService.addItem(testListId, testItem);
      setMessage(`${testUsers[userIndex].displayName} added a new item!`);
    } catch (err) {
      setError(`Failed to simulate user edit: ${err.message}`);
    }
  };

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Typography variant='h4' gutterBottom>
        Real-Time Updates Test
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity='success' sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Button
              variant='contained'
              color='primary'
              onClick={createTestList}
              disabled={!!testListId}
            >
              Create Test List
            </Button>
            <Button
              variant='contained'
              color='error'
              onClick={cleanupTestData}
              disabled={!testListId}
            >
              Cleanup Test Data
            </Button>
          </Paper>
        </Grid>

        {testListId && (
          <>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Simulate User Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {testUsers.map((testUser, index) => (
                    <Button
                      key={testUser.email}
                      variant='outlined'
                      onClick={() => simulateUserEdit(index)}
                    >
                      Add Item as {testUser.displayName}
                    </Button>
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Shopping List (Real-time Updates)
                </Typography>
                <ShoppingListItems listId={testListId} />
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default RealTimeTest;
