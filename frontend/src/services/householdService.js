import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';

import { db } from '../config/firebase';

import { analyticsService } from './analyticsService';

const HOUSEHOLDS_COLLECTION = 'households';
const ACTIVITIES_COLLECTION = 'activities';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

const PERMISSIONS = {
  [ROLES.OWNER]: ['manage_household', 'manage_members', 'manage_lists', 'edit_lists', 'view_lists'],
  [ROLES.ADMIN]: ['manage_lists', 'edit_lists', 'view_lists'],
  [ROLES.MEMBER]: ['edit_lists', 'view_lists'],
};

export const householdService = {
  // Household Management
  createHousehold: async (userId, householdData) => {
    try {
      const newHousehold = {
        ...householdData,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        members: [
          {
            userId,
            role: ROLES.OWNER,
            email: householdData.ownerEmail,
            joinedAt: serverTimestamp(),
          },
        ],
      };

      const docRef = await addDoc(collection(db, HOUSEHOLDS_COLLECTION), newHousehold);
      await householdService.logActivity(docRef.id, userId, 'created_household', {
        householdName: householdData.name,
      });

      analyticsService.trackEvent('household_created');
      return { id: docRef.id, ...newHousehold };
    } catch (error) {
      console.error('Error creating household:', error);
      throw error;
    }
  },

  updateHousehold: async (householdId, updates) => {
    try {
      const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
      await updateDoc(householdRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      analyticsService.trackEvent('household_updated');
    } catch (error) {
      console.error('Error updating household:', error);
      throw error;
    }
  },

  deleteHousehold: async (householdId) => {
    try {
      await deleteDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId));
      analyticsService.trackEvent('household_deleted');
    } catch (error) {
      console.error('Error deleting household:', error);
      throw error;
    }
  },

  // Member Management
  inviteMember: async (householdId, inviterUserId, memberEmail, role = ROLES.MEMBER) => {
    try {
      const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
      await updateDoc(householdRef, {
        invites: arrayUnion({
          email: memberEmail,
          role,
          invitedBy: inviterUserId,
          invitedAt: serverTimestamp(),
        }),
      });

      await householdService.logActivity(householdId, inviterUserId, 'invited_member', {
        memberEmail,
        role,
      });

      analyticsService.trackEvent('member_invited');
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  },

  acceptInvite: async (householdId, userId, userEmail) => {
    try {
      const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
      const householdDoc = await getDoc(householdRef);
      const householdData = householdDoc.data();

      const invite = householdData.invites.find((inv) => inv.email === userEmail);
      if (!invite) throw new Error('Invite not found');

      await updateDoc(householdRef, {
        members: arrayUnion({
          userId,
          email: userEmail,
          role: invite.role,
          joinedAt: serverTimestamp(),
        }),
        invites: arrayRemove(invite),
      });

      await householdService.logActivity(householdId, userId, 'joined_household', {
        role: invite.role,
      });

      analyticsService.trackEvent('invite_accepted');
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  },

  updateMemberRole: async (householdId, updaterUserId, memberUserId, newRole) => {
    try {
      const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
      const householdDoc = await getDoc(householdRef);
      const householdData = householdDoc.data();

      const updatedMembers = householdData.members.map((member) => {
        if (member.userId === memberUserId) {
          return { ...member, role: newRole };
        }
        return member;
      });

      await updateDoc(householdRef, { members: updatedMembers });

      await householdService.logActivity(householdId, updaterUserId, 'updated_member_role', {
        memberUserId,
        newRole,
      });

      analyticsService.trackEvent('member_role_updated');
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  removeMember: async (householdId, removerUserId, memberUserId) => {
    try {
      const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
      const householdDoc = await getDoc(householdRef);
      const householdData = householdDoc.data();

      const memberToRemove = householdData.members.find((m) => m.userId === memberUserId);
      if (!memberToRemove) throw new Error('Member not found');

      await updateDoc(householdRef, {
        members: arrayRemove(memberToRemove),
      });

      await householdService.logActivity(householdId, removerUserId, 'removed_member', {
        memberUserId,
      });

      analyticsService.trackEvent('member_removed');
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  // Queries
  getUserHouseholds: async (userId) => {
    try {
      const q = query(
        collection(db, HOUSEHOLDS_COLLECTION),
        where('members', 'array-contains', { userId })
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting user households:', error);
      throw error;
    }
  },

  getPendingInvites: async (userEmail) => {
    try {
      const q = query(
        collection(db, HOUSEHOLDS_COLLECTION),
        where('invites', 'array-contains', { email: userEmail })
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting pending invites:', error);
      throw error;
    }
  },

  // Activity Feed
  logActivity: async (householdId, userId, activityType, details = {}) => {
    try {
      await addDoc(collection(db, ACTIVITIES_COLLECTION), {
        householdId,
        userId,
        type: activityType,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for activity logging
    }
  },

  getActivities: async (householdId, limit = 20) => {
    try {
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('householdId', '==', householdId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  },

  // Permission Checking
  hasPermission: (memberRole, permission) => {
    return PERMISSIONS[memberRole]?.includes(permission) || false;
  },
};

export { ROLES, PERMISSIONS };
export default householdService;
