import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useCallback } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  useAsyncActionState,
  type AsyncActionOptions,
} from "@/features/shared/async-action-state";

export type CreateListInput = FunctionArgs<typeof api.lists.createList>;
export type UpdateListInput = FunctionArgs<typeof api.lists.updateList>;
export type ListIdInput = FunctionArgs<typeof api.lists.deleteList>;
export type DuplicateListInput = FunctionArgs<typeof api.lists.duplicateList>;
export type AddCategoryInput = FunctionArgs<typeof api.lists.addCategory>;
export type UpdateCategoryInput = FunctionArgs<typeof api.lists.updateCategory>;
export type CategoryIdInput = FunctionArgs<typeof api.lists.deleteCategory>;
export type ReorderCategoriesInput = FunctionArgs<
  typeof api.lists.reorderCategories
>;
export type AddItemInput = FunctionArgs<typeof api.lists.addItem>;
export type UpdateItemInput = FunctionArgs<typeof api.lists.updateItem>;
export type UpdateItemAndMoveInput = FunctionArgs<
  typeof api.lists.updateItemAndMove
>;
export type AdjustItemQuantityInput = FunctionArgs<
  typeof api.lists.adjustItemQuantity
>;
export type ItemIdInput = FunctionArgs<typeof api.lists.deleteItem>;
export type ReorderItemsInput = FunctionArgs<typeof api.lists.reorderItems>;
export type MoveItemInput = FunctionArgs<typeof api.lists.moveItem>;
export type ImportListInput = FunctionArgs<typeof api.lists.importList>;

export function useListActions() {
  const createListMutation = useMutation(api.lists.createList);
  const updateListMutation = useMutation(api.lists.updateList);
  const markListCompletedMutation = useMutation(api.lists.markListCompleted);
  const markListIncompleteMutation = useMutation(api.lists.markListIncomplete);
  const deleteListMutation = useMutation(api.lists.deleteList);
  const duplicateListMutation = useMutation(api.lists.duplicateList);
  const addCategoryMutation = useMutation(api.lists.addCategory);
  const updateCategoryMutation = useMutation(api.lists.updateCategory);
  const deleteCategoryMutation = useMutation(api.lists.deleteCategory);
  const toggleCategoryCollapseMutation = useMutation(
    api.lists.toggleCategoryCollapse,
  );
  const reorderCategoriesMutation = useMutation(api.lists.reorderCategories);
  const addItemMutation = useMutation(api.lists.addItem);
  const updateItemMutation = useMutation(api.lists.updateItem);
  const updateItemAndMoveMutation = useMutation(api.lists.updateItemAndMove);
  const adjustItemQuantityMutation = useMutation(api.lists.adjustItemQuantity);
  const deleteItemMutation = useMutation(api.lists.deleteItem);
  const toggleItemPackedMutation = useMutation(api.lists.toggleItemPacked);
  const reorderItemsMutation = useMutation(api.lists.reorderItems);
  const moveItemMutation = useMutation(api.lists.moveItem);
  const importListMutation = useMutation(api.lists.importList);
  const { pending, error, resetError, runAction } = useAsyncActionState();

  const runVoidAction = useCallback(
    (action: () => Promise<unknown>, options?: AsyncActionOptions) =>
      runAction(async () => {
        await action();
        return true as const;
      }, options),
    [runAction],
  );

  const createList = useCallback(
    (input: CreateListInput, options?: AsyncActionOptions) =>
      runAction(() => createListMutation(input), options),
    [createListMutation, runAction],
  );
  const updateList = useCallback(
    (input: UpdateListInput, options?: AsyncActionOptions) =>
      runAction(() => updateListMutation(input), options),
    [runAction, updateListMutation],
  );
  const markListCompleted = useCallback(
    (input: ListIdInput, options?: AsyncActionOptions) =>
      runAction(() => markListCompletedMutation(input), options),
    [markListCompletedMutation, runAction],
  );
  const markListIncomplete = useCallback(
    (input: ListIdInput, options?: AsyncActionOptions) =>
      runAction(() => markListIncompleteMutation(input), options),
    [markListIncompleteMutation, runAction],
  );
  const deleteList = useCallback(
    (input: ListIdInput, options?: AsyncActionOptions) =>
      runVoidAction(() => deleteListMutation(input), options),
    [deleteListMutation, runVoidAction],
  );
  const duplicateList = useCallback(
    (input: DuplicateListInput, options?: AsyncActionOptions) =>
      runAction(() => duplicateListMutation(input), options),
    [duplicateListMutation, runAction],
  );
  const addCategory = useCallback(
    (input: AddCategoryInput, options?: AsyncActionOptions) =>
      runAction(() => addCategoryMutation(input), options),
    [addCategoryMutation, runAction],
  );
  const updateCategory = useCallback(
    (input: UpdateCategoryInput, options?: AsyncActionOptions) =>
      runAction(() => updateCategoryMutation(input), options),
    [runAction, updateCategoryMutation],
  );
  const deleteCategory = useCallback(
    (input: CategoryIdInput, options?: AsyncActionOptions) =>
      runVoidAction(() => deleteCategoryMutation(input), options),
    [deleteCategoryMutation, runVoidAction],
  );
  const toggleCategoryCollapse = useCallback(
    (input: CategoryIdInput, options?: AsyncActionOptions) =>
      runVoidAction(() => toggleCategoryCollapseMutation(input), options),
    [runVoidAction, toggleCategoryCollapseMutation],
  );
  const reorderCategories = useCallback(
    (input: ReorderCategoriesInput, options?: AsyncActionOptions) =>
      runVoidAction(() => reorderCategoriesMutation(input), options),
    [reorderCategoriesMutation, runVoidAction],
  );
  const addItem = useCallback(
    (input: AddItemInput, options?: AsyncActionOptions) =>
      runAction(() => addItemMutation(input), options),
    [addItemMutation, runAction],
  );
  const updateItem = useCallback(
    (input: UpdateItemInput, options?: AsyncActionOptions) =>
      runAction(() => updateItemMutation(input), options),
    [runAction, updateItemMutation],
  );
  const updateItemAndMove = useCallback(
    (input: UpdateItemAndMoveInput, options?: AsyncActionOptions) =>
      runAction(() => updateItemAndMoveMutation(input), options),
    [runAction, updateItemAndMoveMutation],
  );
  const adjustItemQuantity = useCallback(
    (input: AdjustItemQuantityInput, options?: AsyncActionOptions) =>
      runAction(() => adjustItemQuantityMutation(input), options),
    [adjustItemQuantityMutation, runAction],
  );
  const deleteItem = useCallback(
    (input: ItemIdInput, options?: AsyncActionOptions) =>
      runVoidAction(() => deleteItemMutation(input), options),
    [deleteItemMutation, runVoidAction],
  );
  const toggleItemPacked = useCallback(
    (input: ItemIdInput, options?: AsyncActionOptions) =>
      runVoidAction(() => toggleItemPackedMutation(input), options),
    [runVoidAction, toggleItemPackedMutation],
  );
  const reorderItems = useCallback(
    (input: ReorderItemsInput, options?: AsyncActionOptions) =>
      runVoidAction(() => reorderItemsMutation(input), options),
    [reorderItemsMutation, runVoidAction],
  );
  const moveItem = useCallback(
    (input: MoveItemInput, options?: AsyncActionOptions) =>
      runVoidAction(() => moveItemMutation(input), options),
    [moveItemMutation, runVoidAction],
  );
  const importList = useCallback(
    (input: ImportListInput, options?: AsyncActionOptions) =>
      runAction(() => importListMutation(input), options),
    [importListMutation, runAction],
  );

  return {
    pending,
    error,
    resetError,
    createList,
    updateList,
    markListCompleted,
    markListIncomplete,
    deleteList,
    duplicateList,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryCollapse,
    reorderCategories,
    addItem,
    updateItem,
    updateItemAndMove,
    adjustItemQuantity,
    deleteItem,
    toggleItemPacked,
    reorderItems,
    moveItem,
    importList,
  };
}
