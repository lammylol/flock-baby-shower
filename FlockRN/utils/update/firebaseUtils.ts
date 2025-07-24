// firebase/callable.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/firebaseConfig';
import { deleteField } from 'firebase/firestore';

export async function callFirebaseFunction<TRequest, TResponse>(
  functionName: string,
  data: TRequest,
): Promise<TResponse> {
  try {
    const callable = httpsCallable<TRequest, TResponse>(
      functions,
      functionName,
    );

    console.log(`Calling Firebase function: ${functionName}`, data);

    const result = await callable(data);

    console.log(`Firebase function ${functionName} response:`, result.data);

    return result.data;
  } catch (error) {
    console.error(`Firebase function ${functionName} error:`, {
      functionName,
      data: JSON.stringify(data, null, 2),
      error,
      errorCode: (error as unknown as { code: string })?.code,
      errorMessage: (error as unknown as { message: string })?.message,
      errorDetails: (error as unknown as { details: string })?.details,
    });

    // Re-throw the error with more context
    if (error && typeof error === 'object' && 'code' in error) {
      throw error; // Firebase already provides good error info
    }

    throw new Error(
      `Failed to call Firebase function ${functionName}: ${error}`,
    );
  }
}

export function includeIfDefined(
  key: string,
  value: unknown,
): Record<string, unknown> {
  return value !== undefined ? { [key]: value } : {};
}

// Utility to remove undefined fields from the DTO.
// Especially fields like contextAsEmbeddings, which will cause all search to fail if an empty array is sent to firebase.
export const removeUndefinedFields = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
};

// Utility to remove empty arrays from the DTO. Only used for updates, since deleteField() is not supported in create.
export const removeEmptyArrays = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length === 0) {
          return [key, deleteField()];
        }
        if (value !== undefined) {
          return [key, value];
        }
        // If value is undefined, filter it out by returning undefined
        return undefined as unknown as [string, unknown];
      })
      .filter(Boolean),
  ) as Partial<T>;
};

// Utility to remove undefined fields and empty arrays from the DTO.
// Used for updates to firestore. Not used for create.
export const cleanFirestoreUpdate = <T extends object>(obj: T): Partial<T> => {
  const noUndefined = removeUndefinedFields(obj);
  const noEmptyArrays = removeEmptyArrays(noUndefined);
  return noEmptyArrays;
};
