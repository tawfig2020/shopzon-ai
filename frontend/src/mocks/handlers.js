import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    );
  }),

  rest.get('/api/households', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          name: 'Test Household',
          members: ['user1', 'user2'],
        },
      ])
    );
  }),

  rest.get('/api/lists', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          name: 'Groceries',
          items: [{ id: '1', name: 'Milk', quantity: 1 }],
        },
      ])
    );
  }),
];
