import type { Id } from "../../../convex/_generated/dataModel";
import { describe, expect, it } from "vitest";

import {
  getAddItemInput,
  getMoveItemInput,
  getUpdateItemAndMoveInput,
  getUpdateItemInput,
} from "./item-mutation-model";

const itemId = "item-source" as Id<"items">;
const sourceCategoryId = "category-source" as Id<"categories">;
const destinationCategoryId = "category-destination" as Id<"categories">;
const categories = [
  {
    _id: sourceCategoryId,
    items: [{ _id: itemId }],
  },
  {
    _id: destinationCategoryId,
    items: [
      { _id: "item-one" as Id<"items"> },
      { _id: "item-two" as Id<"items"> },
    ],
  },
] as const;

describe("item mutation adapters", () => {
  it("removes form-only packed state from updateItem arguments", () => {
    expect(
      getUpdateItemInput(itemId, {
        name: "Passport",
        description: "Keep accessible",
        quantity: 2,
        priority: "essential",
        packed: true,
        notes: "Front pocket",
        weight: 0.2,
        tags: ["documents"],
      }),
    ).toEqual({
      itemId: "item-source",
      name: "Passport",
      description: "Keep accessible",
      quantity: 2,
      priority: "essential",
      notes: "Front pocket",
      weight: 0.2,
      tags: ["documents"],
    });
  });

  it("builds one atomic item update and destination argument object", () => {
    expect(
      getUpdateItemAndMoveInput(
        itemId,
        {
          name: "Passport",
          description: "Keep accessible",
          quantity: 2,
          priority: "essential",
          packed: true,
          notes: "Front pocket",
          weight: 0.2,
          tags: ["documents"],
        },
        destinationCategoryId,
        categories,
      ),
    ).toEqual({
      itemId: "item-source",
      name: "Passport",
      description: "Keep accessible",
      quantity: 2,
      priority: "essential",
      notes: "Front pocket",
      weight: 0.2,
      tags: ["documents"],
      toCategoryId: "category-destination",
      toIndex: 2,
    });
  });

  it("omits the move fields when the item remains in its current category", () => {
    expect(
      getUpdateItemAndMoveInput(
        itemId,
        { name: "Updated passport" },
        sourceCategoryId,
        categories,
      ),
    ).toEqual({
      itemId: "item-source",
      name: "Updated passport",
    });
  });

  it("sends null when a full form explicitly clears an existing weight", () => {
    expect(
      getUpdateItemInput(itemId, {
        name: "Passport",
        weight: undefined,
      }),
    ).toEqual({
      itemId: "item-source",
      name: "Passport",
      weight: null,
    });
  });

  it("omits weight for partial edits that do not touch the field", () => {
    expect(getUpdateItemInput(itemId, { name: "Passport" })).toEqual({
      itemId: "item-source",
      name: "Passport",
    });
  });

  it("builds one complete addItem argument object", () => {
    expect(
      getAddItemInput(sourceCategoryId, {
        name: "Passport",
        description: "Keep accessible",
        quantity: 1,
        priority: "essential",
        packed: false,
        notes: "Front pocket",
        weight: 0.2,
        tags: ["documents"],
      }),
    ).toEqual({
      categoryId: "category-source",
      name: "Passport",
      description: "Keep accessible",
      quantity: 1,
      priority: "essential",
      packed: false,
      notes: "Front pocket",
      weight: 0.2,
      tags: ["documents"],
    });
  });

  it("moves an item to the end of the selected destination category", () => {
    expect(
      getMoveItemInput(itemId, destinationCategoryId, categories),
    ).toEqual({
      itemId: "item-source",
      toCategoryId: "category-destination",
      toIndex: 2,
    });
  });
});
