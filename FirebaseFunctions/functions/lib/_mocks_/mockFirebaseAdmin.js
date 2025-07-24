// __mocks__/mockFirebaseAdmin.js
import { jest } from '@jest/globals';
export const setupFirebaseAdminMock = () => {
    jest.unstable_mockModule('firebase-admin', () => ({
        firestore: jest.fn(() => ({
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    id: 'mock-id',
                    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
                    delete: jest.fn(() => Promise.resolve()),
                    path: 'mock-path',
                    ref: {},
                })),
            })),
            doc: jest.fn(),
            batch: jest.fn(() => ({
                set: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                commit: jest.fn(() => Promise.resolve()),
            })),
        })),
        initializeApp: jest.fn(),
        FieldValue: {
            serverTimestamp: jest.fn(() => 'mock-timestamp'),
            delete: jest.fn(() => 'mock-delete'),
        },
        credential: { applicationDefault: jest.fn() },
        apps: [],
        app: jest.fn(),
    }));
};
