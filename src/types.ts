/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  code: string; // login password/code string (uppercase)
  picks: { [matchId: string]: 'A' | 'B' | 'Tie' }; // predictions dict
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string; // "1" to "104"
  a: string; // Team A
  b: string; // Team B
  v: string; // Venue
  c: string; // City
  t: string; // Kickoff time
  type: 'Group' | 'Playoff';
  res?: 'A' | 'B' | 'Tie'; // Official result
}

export interface SystemState {
  id: string;
  systemName: string;
  isContestActive: boolean;
  adminHash: string; // SHA-256 password hash for administrator
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
