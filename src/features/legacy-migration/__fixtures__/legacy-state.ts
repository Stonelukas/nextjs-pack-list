export const LEGACY_STORAGE_KEY = "pack-list-storage";

export const legacyZustandEnvelope = {
  state: {
    user: {
      id: "legacy-user",
      name: "Legacy User",
      email: "legacy@example.com",
      preferences: {
        theme: "dark",
        defaultPriority: "high",
        autoSave: false,
      },
      createdAt: "2022-04-05T10:30:00.000Z",
      updatedAt: "2023-05-06T11:45:00.000Z",
    },
    lists: [
      {
        id: "legacy-list-1",
        name: "  Alpine weekend  ",
        description: "Cold-weather trip",
        tags: ["mountains", " winter ", ""],
        isTemplate: false,
        userId: "legacy-user",
        completedAt: "2024-01-02T03:04:05.000Z",
        createdAt: "2020-01-02T03:04:05.000Z",
        updatedAt: 1_704_164_645_000,
        categories: [
          {
            id: "legacy-category-1",
            name: " Clothing ",
            color: "#334455",
            icon: "shirt",
            order: 4,
            collapsed: true,
            createdAt: "2020-01-02T03:04:05.000Z",
            updatedAt: "2020-01-03T03:04:05.000Z",
            items: [
              {
                id: "legacy-item-1",
                name: " Wool socks ",
                quantity: 3,
                packed: true,
                priority: "HIGH",
                notes: "Two hiking pairs",
                description: "Warm merino socks",
                weight: 0.2,
                tags: ["warm", " feet "],
                categoryId: "legacy-category-1",
                createdAt: "2020-01-02T03:04:05.000Z",
                updatedAt: "2020-01-03T03:04:05.000Z",
              },
              {
                id: "broken-item",
                name: "",
                quantity: 1,
                priority: "medium",
                categoryId: "legacy-category-1",
              },
            ],
          },
        ],
      },
      {
        id: "broken-list",
        name: "",
        categories: [],
        createdAt: "not-a-date",
      },
    ],
    currentListId: "legacy-list-1",
    templates: [
      {
        id: "legacy-template-1",
        name: "  Custom conference  ",
        description: "A personal event template",
        categories: [
          {
            name: "Work",
            order: 0,
            items: [
              {
                name: "Laptop",
                quantity: 1,
                packed: true,
                priority: "essential",
                categoryId: "",
              },
            ],
          },
        ],
        tags: ["business"],
        isPublic: false,
        usageCount: 2,
        createdBy: "legacy-user",
        icon: "briefcase-business",
        duration: "3 days",
        difficulty: "intermediate",
        season: "all",
        createdAt: "2021-06-07T08:09:10.000Z",
        updatedAt: "2021-06-08T08:09:10.000Z",
      },
      {
        id: "broken-template",
        name: 42,
        description: "Invalid sibling",
        categories: [],
      },
    ],
  },
  version: 0,
} as const;

export const legacyZustandJson = JSON.stringify(legacyZustandEnvelope);

export const malformedLegacyJson = '{"state":{"lists":[';
