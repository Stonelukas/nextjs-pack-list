import { describe, expect, it } from "vitest";

import { filterTemplates } from "./template-model";

const templates = [
  {
    _id: "template-owned",
    _creationTime: 300,
    name: "My trip",
    description: "Private checklist",
    category: "travel",
    season: "all",
    difficulty: "beginner",
    isPublic: false,
    isOwned: true,
    tags: ["personal"],
    categories: [],
  },
  {
    _id: "template-public",
    _creationTime: 200,
    name: "Beach holiday",
    description: "Sunny weather",
    category: "travel",
    season: "summer",
    difficulty: "beginner",
    isPublic: true,
    isOwned: false,
    tags: ["beach"],
    categories: [],
  },
];

describe("template route model", () => {
  it("filters owned templates without assuming an id property", () => {
    const result = filterTemplates(templates, {
      filter: "mine",
      search: "",
      category: "all",
    });

    expect(result.map((template) => template._id)).toEqual(["template-owned"]);
  });

  it("searches names, descriptions, and optional tags", () => {
    const result = filterTemplates(templates, {
      filter: "all",
      search: "beach",
      category: "all",
    });

    expect(result.map((template) => template._id)).toEqual([
      "template-public",
    ]);
  });
});
