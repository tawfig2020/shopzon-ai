import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import ShoppingListItem from '../../components/shopping/ShoppingListItem';

const mockStore = configureStore([]);

describe('ShoppingListItem Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      lists: {
        currentList: {
          id: '1',
          items: [],
        },
      },
    });
  });

  it('renders item details correctly', () => {
    const item = {
      id: '1',
      name: 'Milk',
      quantity: 2,
      completed: false,
    };

    render(
      <Provider store={store}>
        <ShoppingListItem item={item} />
      </Provider>
    );

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('toggles completion status when checkbox is clicked', () => {
    const item = {
      id: '1',
      name: 'Milk',
      quantity: 2,
      completed: false,
    };

    render(
      <Provider store={store}>
        <ShoppingListItem item={item} />
      </Provider>
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: 'lists/toggleItemCompletion',
      payload: { itemId: '1' },
    });
  });
});
