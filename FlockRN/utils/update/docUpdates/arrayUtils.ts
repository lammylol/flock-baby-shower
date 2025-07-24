/**
 * Local utility to add or remove items from an array field in an object.
 * Handles both string and object (with id) values.
 *
 * @param existingData - The current object containing the array field.
 * @param field - The field name to update.
 * @param values - The values to add or remove (array of string or object).
 * @param action - 'add' to add values, 'remove' to remove values.
 * @returns An array with the updated field.
 */
function localUpdateArrayField(
  existingData: Record<string, unknown>,
  field: string,
  values: Array<string | Record<string, unknown>>,
  action: 'add' | 'remove',
) {
  const safeValues = Array.isArray(values) ? values : [];
  const existingArray = Array.isArray(existingData[field])
    ? (existingData[field] as unknown[])
    : [];

  // Determine if the field should store objects (with id) or raw strings
  const isObjectField = safeValues.some(
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      Object.prototype.hasOwnProperty.call(v, 'id'),
  );

  let updatedArray: unknown[];

  if (action === 'add') {
    if (isObjectField) {
      // Add objects (by id, avoid duplicates)
      const existingIds = new Set(
        existingArray
          .filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              Object.prototype.hasOwnProperty.call(item, 'id'),
          )
          .map((item) => (item as Record<string, unknown>).id),
      );
      const newObjects = safeValues.filter(
        (v) =>
          typeof v === 'object' &&
          v !== null &&
          !existingIds.has((v as Record<string, unknown>).id),
      );
      updatedArray = [...existingArray, ...newObjects];
    } else {
      // Add strings (avoid duplicates)
      const existingSet = new Set(
        existingArray.filter((item) => typeof item === 'string'),
      );
      const newStrings = safeValues.filter(
        (v) => typeof v === 'string' && !existingSet.has(v),
      );
      updatedArray = [...existingArray, ...newStrings];
    }
  } else if (action === 'remove') {
    if (isObjectField) {
      // Remove objects by id
      const removeIds = new Set(
        safeValues
          .filter((v) => typeof v === 'object' && v !== null)
          .map((v) => (v as Record<string, unknown>).id),
      );
      updatedArray = existingArray.filter(
        (item) =>
          !(
            typeof item === 'object' &&
            item !== null &&
            removeIds.has((item as Record<string, unknown>).id)
          ),
      );
    } else {
      // Remove strings
      const removeSet = new Set(
        safeValues.filter((v) => typeof v === 'string'),
      );
      updatedArray = existingArray.filter(
        (item) => !(typeof item === 'string' && removeSet.has(item)),
      );
    }
  } else {
    updatedArray = existingArray;
  }

  return updatedArray;
}

/**
 * Utility to perform local updates on an array field, handling both additions and removals.
 * @param field - The name of the array field to update.
 * @returns A function that takes the current object, items to add, and items to remove, and returns the updated object.
 */
export function localUpdateArrayFieldAddRemove(field: string) {
  return (
    obj: Record<string, unknown>,
    addItems: Array<string | Record<string, unknown>> = [],
    removeItems: Array<string | Record<string, unknown>> = [],
  ) => {
    let updatedArray = localUpdateArrayField(obj, field, removeItems, 'remove');
    updatedArray = localUpdateArrayField(
      { [field]: updatedArray },
      field,
      addItems,
      'add',
    );
    return updatedArray;
  };
}

export function getRemovedTopicIds(
  initial: string[],
  updated: string[],
): string[] {
  return initial.filter((id) => !updated.includes(id));
}
