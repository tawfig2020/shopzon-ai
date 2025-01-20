import { collection, addDoc, getDocs } from 'firebase/firestore';

import { db } from '../../config/firebase';
import { householdService } from '../../services/householdService';

jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe('householdService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHousehold', () => {
    it('creates a new household successfully', async () => {
      const mockHousehold = {
        name: 'Test Household',
        owner: 'user123',
        members: [{ user: 'user123', role: 'owner' }],
      };

      const mockAddDoc = jest.fn().mockResolvedValue({ id: 'household123' });
      collection.mockReturnValue({ addDoc: mockAddDoc });

      const result = await householdService.createHousehold(mockHousehold);

      expect(result.id).toBe('household123');
      expect(mockAddDoc).toHaveBeenCalledWith(expect.any(Object), mockHousehold);
    });
  });

  describe('getHouseholds', () => {
    it('retrieves households for a user', async () => {
      const mockHouseholds = [
        {
          id: 'household123',
          data: () => ({
            name: 'Test Household',
            owner: 'user123',
            members: [{ user: 'user123', role: 'owner' }],
          }),
        },
      ];

      const mockGetDocs = jest.fn().mockResolvedValue({
        docs: mockHouseholds,
      });
      collection.mockReturnValue({ getDocs: mockGetDocs });

      const result = await householdService.getHouseholds('user123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Household');
    });
  });
});
