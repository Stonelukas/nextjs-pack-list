import type { FunctionArgs } from "convex/server";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ItemFormValue } from "./types";

type AddItemInput = FunctionArgs<typeof api.lists.addItem>;
type UpdateItemInput = FunctionArgs<typeof api.lists.updateItem>;
type UpdateItemAndMoveInput = FunctionArgs<
  typeof api.lists.updateItemAndMove
>;
type MoveItemInput = FunctionArgs<typeof api.lists.moveItem>;

type CategoryMoveTarget = {
  _id: Id<"categories">;
  items: readonly { _id: Id<"items"> }[];
};

export function getUpdateItemInput(
  itemId: Id<"items">,
  updates: Partial<ItemFormValue>,
): UpdateItemInput {
  const input: UpdateItemInput = { itemId };

  if (updates.name !== undefined) input.name = updates.name;
  if (updates.quantity !== undefined) input.quantity = updates.quantity;
  if (updates.priority !== undefined) input.priority = updates.priority;
  if (updates.notes !== undefined) input.notes = updates.notes;
  if (updates.description !== undefined) input.description = updates.description;
  if (Object.prototype.hasOwnProperty.call(updates, "weight")) {
    input.weight = updates.weight ?? null;
  }
  if (updates.tags !== undefined) input.tags = updates.tags;

  return input;
}

export function getUpdateItemAndMoveInput(
  itemId: Id<"items">,
  updates: Partial<ItemFormValue>,
  toCategoryId: Id<"categories">,
  categories: readonly CategoryMoveTarget[],
): UpdateItemAndMoveInput {
  const destination = categories.find(
    (category) => category._id === toCategoryId,
  );
  if (!destination) {
    throw new Error("Destination category is unavailable");
  }
  const updateInput = getUpdateItemInput(itemId, updates);
  const source = categories.find((category) =>
    category.items.some((item) => item._id === itemId),
  );
  if (source?._id === toCategoryId) return updateInput;

  return {
    ...updateInput,
    toCategoryId,
    toIndex: destination.items.length,
  };
}

export function getAddItemInput(
  categoryId: Id<"categories">,
  value: ItemFormValue,
): AddItemInput {
  return {
    categoryId,
    name: value.name,
    description: value.description || undefined,
    quantity: value.quantity,
    priority: value.priority,
    packed: value.packed,
    notes: value.notes || undefined,
    weight: value.weight,
    tags: value.tags,
  };
}

export function getMoveItemInput(
  itemId: Id<"items">,
  toCategoryId: Id<"categories">,
  categories: readonly CategoryMoveTarget[],
): MoveItemInput {
  const destination = categories.find(
    (category) => category._id === toCategoryId,
  );

  if (!destination) {
    throw new Error("Destination category is unavailable");
  }

  return {
    itemId,
    toCategoryId,
    toIndex: destination.items.length,
  };
}
