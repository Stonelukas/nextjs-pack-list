import { describe, expect, it } from "vitest";

import {
  calculateListProgress,
  filterAndSortLists,
  summarizeCategories,
  summarizeTags,
} from "./list-model";

const activeList = {
  _id: "list-active",
  _creationTime: 100,
  name: "Beach trip",
  description: "Summer coast",
  tags: ["summer", "travel"],
  categories: [
    {
      _id: "category-clothes",
      name: "Clothes",
      order: 0,
      items: [
        {
          _id: "item-shirt",
          name: "Shirt",
          quantity: 1,
          packed: true,
          priority: "high",
        },
        {
          _id: "item-shorts",
          name: "Shorts",
          quantity: 1,
          packed: false,
          priority: "medium",
        },
      ],
    },
  ],
};

const completedList = {
  _id: "list-complete",
  _creationTime: 200,
  name: "Conference",
  description: "Work travel",
  completedAt: 300,
  tags: ["work", "travel"],
  categories: [
    {
      _id: "category-documents",
      name: "Documents",
      order: 0,
      items: [
        {
          _id: "item-passport",
          name: "Passport",
          quantity: 1,
          packed: true,
          priority: "essential",
        },
      ],
    },
  ],
};

describe("list route model", () => {
  it("calculates progress from normalized Convex categories and items", () => {
    expect(calculateListProgress(activeList)).toEqual({
      totalItems: 2,
      packedItems: 1,
      completionPercentage: 50,
    });
  });

  it("preserves Convex _id values while filtering the active search route", () => {
    const result = filterAndSortLists(
      [activeList, completedList],
      { status: "active", search: "beach", sort: "date" },
    );

    expect(result.map((list) => list._id)).toEqual(["list-active"]);
  });

  it("sorts completion using live item progress", () => {
    const result = filterAndSortLists(
      [activeList, completedList],
      { status: null, search: "", sort: "completion" },
    );

    expect(result.map((list) => list._id)).toEqual([
      "list-complete",
      "list-active",
    ]);
  });

  it("sorts by creation date without promoting an older edited list", () => {
    const olderEditedList = {
      ...activeList,
      _creationTime: 100,
      createdAt: 100,
      updatedAt: 500,
    };
    const newerList = {
      ...completedList,
      _creationTime: 200,
      createdAt: 200,
      updatedAt: 200,
    };

    const result = filterAndSortLists(
      [olderEditedList, newerList],
      { status: null, search: "", sort: "date" },
    );

    expect(result.map((list) => list._id)).toEqual([
      "list-complete",
      "list-active",
    ]);
  });

  it("summarizes categories and tags across lists using _id links", () => {
    expect(summarizeCategories([activeList, completedList])).toEqual([
      {
        name: "Clothes",
        itemCount: 2,
        packedCount: 1,
        lists: [{ _id: "list-active", name: "Beach trip" }],
      },
      {
        name: "Documents",
        itemCount: 1,
        packedCount: 1,
        lists: [{ _id: "list-complete", name: "Conference" }],
      },
    ]);

    expect(summarizeTags([activeList, completedList])).toEqual([
      { name: "travel", listCount: 2, templateCount: 0 },
      { name: "summer", listCount: 1, templateCount: 0 },
      { name: "work", listCount: 1, templateCount: 0 },
    ]);
  });
});
