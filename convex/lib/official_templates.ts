export type OfficialTemplatePriority =
  | "low"
  | "medium"
  | "high"
  | "essential";

export interface OfficialTemplateItem {
  name: string;
  quantity: number;
  priority: OfficialTemplatePriority;
  notes?: string;
  description?: string;
  weight?: number;
  tags?: string[];
  order: number;
}

export interface OfficialTemplateCategory {
  name: string;
  color?: string;
  icon?: string;
  order: number;
  collapsed: boolean;
  items: OfficialTemplateItem[];
}

export interface OfficialTemplateDefinition {
  key: string;
  name: string;
  description: string;
  category?: string;
  difficulty?: string;
  season?: string;
  duration?: string;
  icon?: string;
  tags?: string[];
  categories: OfficialTemplateCategory[];
}

export const OFFICIAL_TEMPLATES: readonly OfficialTemplateDefinition[] = [
  {
    "key": "beach-vacation",
    "name": "Beach Vacation",
    "description": "Essential items for a relaxing beach getaway",
    "category": "travel",
    "difficulty": "beginner",
    "season": "summer",
    "duration": "1 week",
    "icon": "🏖️",
    "tags": [
      "travel",
      "seasonal"
    ],
    "categories": [
      {
        "name": "Clothing",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Swimsuits",
            "quantity": 2,
            "priority": "essential",
            "notes": "At least 2 for rotation",
            "order": 0
          },
          {
            "name": "Beach Cover-up",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Shorts",
            "quantity": 3,
            "priority": "high",
            "order": 2
          },
          {
            "name": "T-shirts",
            "quantity": 5,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Light Dress/Outfit",
            "quantity": 2,
            "priority": "medium",
            "notes": "For evening dining",
            "order": 4
          },
          {
            "name": "Underwear",
            "quantity": 7,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Sandals/Flip-flops",
            "quantity": 2,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Sun Hat",
            "quantity": 1,
            "priority": "high",
            "order": 7
          },
          {
            "name": "Sunglasses",
            "quantity": 1,
            "priority": "essential",
            "order": 8
          }
        ]
      },
      {
        "name": "Beach Essentials",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Sunscreen SPF 50+",
            "quantity": 2,
            "priority": "essential",
            "notes": "Reef-safe if possible",
            "order": 0
          },
          {
            "name": "Beach Towels",
            "quantity": 2,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Beach Bag",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Waterproof Phone Case",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Snorkel Gear",
            "quantity": 1,
            "priority": "low",
            "notes": "Optional - can often rent",
            "order": 4
          },
          {
            "name": "Beach Umbrella",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Cooler Bag",
            "quantity": 1,
            "priority": "medium",
            "order": 6
          }
        ]
      },
      {
        "name": "Toiletries",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "After-sun Lotion",
            "quantity": 1,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Shampoo/Conditioner",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Body Wash",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Toothbrush & Toothpaste",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Deodorant",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Razor",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Moisturizer",
            "quantity": 1,
            "priority": "high",
            "order": 6
          }
        ]
      },
      {
        "name": "Documents & Electronics",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Passport/ID",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Travel Insurance",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Hotel Confirmation",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Phone Charger",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Power Bank",
            "quantity": 1,
            "priority": "medium",
            "order": 4
          },
          {
            "name": "Camera",
            "quantity": 1,
            "priority": "low",
            "order": 5
          },
          {
            "name": "E-reader/Book",
            "quantity": 1,
            "priority": "low",
            "order": 6
          }
        ]
      }
    ]
  },
  {
    "key": "business-trip",
    "name": "Business Trip",
    "description": "Professional essentials for a successful business trip",
    "category": "business",
    "difficulty": "intermediate",
    "season": "all",
    "duration": "3 days",
    "icon": "💼",
    "tags": [
      "business",
      "travel"
    ],
    "categories": [
      {
        "name": "Professional Attire",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Business Suits",
            "quantity": 2,
            "priority": "essential",
            "notes": "One per day plus backup",
            "order": 0
          },
          {
            "name": "Dress Shirts",
            "quantity": 4,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Ties",
            "quantity": 3,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Dress Shoes",
            "quantity": 2,
            "priority": "essential",
            "notes": "Brown and black",
            "order": 3
          },
          {
            "name": "Belt",
            "quantity": 2,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Dress Socks",
            "quantity": 4,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Underwear",
            "quantity": 4,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Casual Outfit",
            "quantity": 1,
            "priority": "medium",
            "notes": "For downtime",
            "order": 7
          }
        ]
      },
      {
        "name": "Work Essentials",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Laptop",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Laptop Charger",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Business Cards",
            "quantity": 50,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Notebook & Pens",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Presentation Materials",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "USB Drive",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Portable Mouse",
            "quantity": 1,
            "priority": "low",
            "order": 6
          },
          {
            "name": "HDMI Adapter",
            "quantity": 1,
            "priority": "medium",
            "order": 7
          }
        ]
      },
      {
        "name": "Documents",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "ID/Passport",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Boarding Passes",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Hotel Confirmation",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Meeting Agenda",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Corporate Credit Card",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Expense Receipt Folder",
            "quantity": 1,
            "priority": "high",
            "order": 5
          }
        ]
      },
      {
        "name": "Personal Care",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Toiletry Bag",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Medications",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Phone Charger",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Watch",
            "quantity": 1,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "Grooming Kit",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Breath Mints",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          }
        ]
      }
    ]
  },
  {
    "key": "camping-adventure",
    "name": "Camping Adventure",
    "description": "Complete gear list for a camping trip in nature",
    "category": "outdoor",
    "difficulty": "advanced",
    "season": "summer",
    "duration": "3-5 days",
    "icon": "⛺",
    "tags": [
      "outdoor",
      "sports"
    ],
    "categories": [
      {
        "name": "Shelter & Sleep",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Tent",
            "quantity": 1,
            "priority": "essential",
            "notes": "Check all poles and stakes",
            "order": 0
          },
          {
            "name": "Sleeping Bag",
            "quantity": 1,
            "priority": "essential",
            "notes": "Check temperature rating",
            "order": 1
          },
          {
            "name": "Sleeping Pad",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Pillow",
            "quantity": 1,
            "priority": "medium",
            "notes": "Inflatable recommended",
            "order": 3
          },
          {
            "name": "Tarp/Footprint",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Rope/Paracord",
            "quantity": 50,
            "priority": "high",
            "notes": "feet",
            "order": 5
          },
          {
            "name": "Camping Chair",
            "quantity": 1,
            "priority": "low",
            "order": 6
          }
        ]
      },
      {
        "name": "Cooking & Food",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Camping Stove",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Fuel Canisters",
            "quantity": 2,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Lighter/Matches",
            "quantity": 2,
            "priority": "essential",
            "notes": "Waterproof",
            "order": 2
          },
          {
            "name": "Cookset",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Utensils",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Water Filter",
            "quantity": 1,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Water Bottles",
            "quantity": 2,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Food (per day)",
            "quantity": 5,
            "priority": "essential",
            "notes": "Plan meals",
            "order": 7
          },
          {
            "name": "Bear Canister",
            "quantity": 1,
            "priority": "high",
            "notes": "If required",
            "order": 8
          },
          {
            "name": "Cooler",
            "quantity": 1,
            "priority": "medium",
            "order": 9
          }
        ]
      },
      {
        "name": "Clothing",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Moisture-wicking Shirts",
            "quantity": 3,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Hiking Pants/Shorts",
            "quantity": 2,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Rain Jacket",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Insulation Layer",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Underwear",
            "quantity": 4,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Hiking Socks",
            "quantity": 4,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Hiking Boots",
            "quantity": 1,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Camp Shoes",
            "quantity": 1,
            "priority": "medium",
            "order": 7
          },
          {
            "name": "Hat",
            "quantity": 1,
            "priority": "high",
            "order": 8
          },
          {
            "name": "Gloves",
            "quantity": 1,
            "priority": "medium",
            "order": 9
          }
        ]
      },
      {
        "name": "Navigation & Safety",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Map & Compass",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "GPS Device",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "First Aid Kit",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Emergency Whistle",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Headlamp",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Flashlight (backup)",
            "quantity": 1,
            "priority": "high",
            "order": 5
          },
          {
            "name": "Extra Batteries",
            "quantity": 1,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Multi-tool/Knife",
            "quantity": 1,
            "priority": "essential",
            "order": 7
          },
          {
            "name": "Emergency Shelter",
            "quantity": 1,
            "priority": "medium",
            "notes": "Space blanket",
            "order": 8
          }
        ]
      },
      {
        "name": "Personal Care",
        "order": 4,
        "collapsed": false,
        "items": [
          {
            "name": "Biodegradable Soap",
            "quantity": 1,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Toilet Paper",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Trowel",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Sunscreen",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Bug Spray",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Personal Medications",
            "quantity": 1,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Toothbrush & Paste",
            "quantity": 1,
            "priority": "high",
            "order": 6
          },
          {
            "name": "Quick-dry Towel",
            "quantity": 1,
            "priority": "medium",
            "order": 7
          }
        ]
      }
    ]
  },
  {
    "key": "wedding-guest",
    "name": "Wedding Guest",
    "description": "Everything you need as a wedding guest",
    "category": "events",
    "difficulty": "beginner",
    "season": "all",
    "duration": "2-3 days",
    "icon": "💒",
    "tags": [
      "events"
    ],
    "categories": [
      {
        "name": "Formal Attire",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Formal Outfit",
            "quantity": 1,
            "priority": "essential",
            "notes": "Check dress code",
            "order": 0
          },
          {
            "name": "Formal Shoes",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Accessories",
            "quantity": 1,
            "priority": "high",
            "notes": "Tie/jewelry/clutch",
            "order": 2
          },
          {
            "name": "Backup Outfit",
            "quantity": 1,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "Undergarments",
            "quantity": 2,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Shawl/Jacket",
            "quantity": 1,
            "priority": "high",
            "notes": "For evening",
            "order": 5
          }
        ]
      },
      {
        "name": "Gift & Cards",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Wedding Gift",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Card",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Gift Receipt",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Cash/Check",
            "quantity": 1,
            "priority": "high",
            "notes": "If giving money",
            "order": 3
          }
        ]
      },
      {
        "name": "Essentials",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Invitation",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Hotel Confirmation",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "ID",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Phone Charger",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Camera",
            "quantity": 1,
            "priority": "medium",
            "order": 4
          },
          {
            "name": "Tissues",
            "quantity": 1,
            "priority": "high",
            "notes": "For happy tears",
            "order": 5
          },
          {
            "name": "Pain Relievers",
            "quantity": 1,
            "priority": "medium",
            "order": 6
          },
          {
            "name": "Band-aids",
            "quantity": 1,
            "priority": "medium",
            "notes": "For shoe blisters",
            "order": 7
          }
        ]
      },
      {
        "name": "Personal Care",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Makeup/Grooming",
            "quantity": 1,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Hair Styling Tools",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Perfume/Cologne",
            "quantity": 1,
            "priority": "medium",
            "order": 2
          },
          {
            "name": "Deodorant",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Breath Mints",
            "quantity": 1,
            "priority": "medium",
            "order": 4
          },
          {
            "name": "Safety Pins",
            "quantity": 1,
            "priority": "low",
            "notes": "Emergency fixes",
            "order": 5
          }
        ]
      }
    ]
  },
  {
    "key": "ski-trip",
    "name": "Ski/Snowboard Trip",
    "description": "Complete packing list for hitting the slopes",
    "category": "sports",
    "difficulty": "intermediate",
    "season": "winter",
    "duration": "1 week",
    "icon": "⛷️",
    "tags": [
      "sports",
      "seasonal"
    ],
    "categories": [
      {
        "name": "Ski/Snowboard Gear",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Skis/Snowboard",
            "quantity": 1,
            "priority": "essential",
            "notes": "Or rent at resort",
            "order": 0
          },
          {
            "name": "Boots",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Poles",
            "quantity": 1,
            "priority": "essential",
            "notes": "For skiing",
            "order": 2
          },
          {
            "name": "Helmet",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Goggles",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Ski Pass/Lift Tickets",
            "quantity": 1,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Equipment Bag",
            "quantity": 1,
            "priority": "high",
            "order": 6
          }
        ]
      },
      {
        "name": "Clothing Layers",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Base Layers Top",
            "quantity": 3,
            "priority": "essential",
            "notes": "Thermal underwear",
            "order": 0
          },
          {
            "name": "Base Layers Bottom",
            "quantity": 3,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Ski Jacket",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Ski Pants",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Mid-layer Fleece",
            "quantity": 2,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Ski Socks",
            "quantity": 5,
            "priority": "essential",
            "notes": "Avoid cotton",
            "order": 5
          },
          {
            "name": "Gloves/Mittens",
            "quantity": 2,
            "priority": "essential",
            "order": 6
          },
          {
            "name": "Neck Warmer/Balaclava",
            "quantity": 1,
            "priority": "high",
            "order": 7
          },
          {
            "name": "Warm Hat",
            "quantity": 1,
            "priority": "high",
            "order": 8
          }
        ]
      },
      {
        "name": "Après-Ski",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Casual Clothes",
            "quantity": 3,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Jeans/Pants",
            "quantity": 2,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Warm Boots",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Sweater/Hoodie",
            "quantity": 2,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Pajamas",
            "quantity": 2,
            "priority": "medium",
            "order": 4
          },
          {
            "name": "Slippers",
            "quantity": 1,
            "priority": "low",
            "order": 5
          }
        ]
      },
      {
        "name": "Protection & Care",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Sunscreen (high SPF)",
            "quantity": 1,
            "priority": "essential",
            "notes": "Strong UV at altitude",
            "order": 0
          },
          {
            "name": "Lip Balm with SPF",
            "quantity": 2,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Moisturizer",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Hand Warmers",
            "quantity": 10,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "First Aid Kit",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Pain Relievers",
            "quantity": 1,
            "priority": "high",
            "order": 5
          },
          {
            "name": "Muscle Balm",
            "quantity": 1,
            "priority": "medium",
            "order": 6
          }
        ]
      }
    ]
  },
  {
    "key": "baby-travel",
    "name": "Traveling with Baby",
    "description": "Essential items for traveling with an infant",
    "category": "travel",
    "difficulty": "advanced",
    "season": "all",
    "duration": "3-5 days",
    "icon": "👶",
    "tags": [
      "travel"
    ],
    "categories": [
      {
        "name": "Baby Essentials",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Diapers",
            "quantity": 30,
            "priority": "essential",
            "notes": "Extra for delays",
            "order": 0
          },
          {
            "name": "Wipes",
            "quantity": 2,
            "priority": "essential",
            "notes": "Travel packs",
            "order": 1
          },
          {
            "name": "Diaper Cream",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Changing Pad",
            "quantity": 1,
            "priority": "essential",
            "notes": "Portable",
            "order": 3
          },
          {
            "name": "Plastic Bags",
            "quantity": 10,
            "priority": "high",
            "notes": "For dirty diapers",
            "order": 4
          },
          {
            "name": "Hand Sanitizer",
            "quantity": 2,
            "priority": "essential",
            "order": 5
          }
        ]
      },
      {
        "name": "Feeding",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Formula/Breast Milk",
            "quantity": 1,
            "priority": "essential",
            "notes": "Plan for trip duration",
            "order": 0
          },
          {
            "name": "Bottles",
            "quantity": 4,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Bottle Brush",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Bibs",
            "quantity": 5,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Burp Cloths",
            "quantity": 4,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Baby Food",
            "quantity": 10,
            "priority": "essential",
            "notes": "If eating solids",
            "order": 5
          },
          {
            "name": "Spoons",
            "quantity": 3,
            "priority": "high",
            "order": 6
          },
          {
            "name": "Sippy Cup",
            "quantity": 1,
            "priority": "medium",
            "order": 7
          },
          {
            "name": "Snacks",
            "quantity": 1,
            "priority": "medium",
            "notes": "Age appropriate",
            "order": 8
          }
        ]
      },
      {
        "name": "Clothing",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Onesies",
            "quantity": 8,
            "priority": "essential",
            "notes": "2 per day plus extras",
            "order": 0
          },
          {
            "name": "Sleepers",
            "quantity": 4,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Pants/Shorts",
            "quantity": 4,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Socks",
            "quantity": 6,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Jacket",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Hat",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Extra Outfit",
            "quantity": 2,
            "priority": "essential",
            "notes": "In carry-on",
            "order": 6
          }
        ]
      },
      {
        "name": "Sleep & Comfort",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Travel Crib",
            "quantity": 1,
            "priority": "high",
            "notes": "Or confirm with hotel",
            "order": 0
          },
          {
            "name": "Sleep Sack",
            "quantity": 2,
            "priority": "high",
            "order": 1
          },
          {
            "name": "White Noise Machine",
            "quantity": 1,
            "priority": "medium",
            "order": 2
          },
          {
            "name": "Favorite Toy/Lovey",
            "quantity": 2,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Pacifiers",
            "quantity": 4,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Swaddle Blankets",
            "quantity": 2,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Monitor",
            "quantity": 1,
            "priority": "low",
            "order": 6
          }
        ]
      },
      {
        "name": "Health & Safety",
        "order": 4,
        "collapsed": false,
        "items": [
          {
            "name": "Medications",
            "quantity": 1,
            "priority": "essential",
            "notes": "Fever reducer, etc.",
            "order": 0
          },
          {
            "name": "Thermometer",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Nasal Aspirator",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Sunscreen (baby-safe)",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "First Aid Kit",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Insurance Cards",
            "quantity": 1,
            "priority": "essential",
            "order": 5
          },
          {
            "name": "Pediatrician Contact",
            "quantity": 1,
            "priority": "essential",
            "order": 6
          }
        ]
      },
      {
        "name": "Travel Gear",
        "order": 5,
        "collapsed": false,
        "items": [
          {
            "name": "Car Seat",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Stroller",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Baby Carrier",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Diaper Bag",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          },
          {
            "name": "Stroller Rain Cover",
            "quantity": 1,
            "priority": "low",
            "order": 4
          }
        ]
      }
    ]
  },
  {
    "key": "road-trip",
    "name": "Road Trip Essentials",
    "description": "Everything needed for an epic road trip adventure",
    "category": "travel",
    "difficulty": "intermediate",
    "season": "all",
    "duration": "1 week+",
    "icon": "🚗",
    "tags": [
      "travel"
    ],
    "categories": [
      {
        "name": "Vehicle Essentials",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Driver License",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Registration & Insurance",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Spare Tire (checked)",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Jumper Cables",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Emergency Kit",
            "quantity": 1,
            "priority": "essential",
            "order": 4
          },
          {
            "name": "Motor Oil",
            "quantity": 1,
            "priority": "high",
            "order": 5
          },
          {
            "name": "Coolant",
            "quantity": 1,
            "priority": "high",
            "order": 6
          },
          {
            "name": "Paper Towels",
            "quantity": 1,
            "priority": "medium",
            "order": 7
          },
          {
            "name": "Trash Bags",
            "quantity": 1,
            "priority": "high",
            "order": 8
          }
        ]
      },
      {
        "name": "Navigation & Entertainment",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Phone Mount",
            "quantity": 1,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Car Charger",
            "quantity": 2,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Aux Cable/Bluetooth",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Road Atlas",
            "quantity": 1,
            "priority": "medium",
            "notes": "Backup for GPS",
            "order": 3
          },
          {
            "name": "Downloaded Music/Podcasts",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Games/Activities",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          }
        ]
      },
      {
        "name": "Snacks & Drinks",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Water Bottles",
            "quantity": 4,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Cooler",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Ice Packs",
            "quantity": 4,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Non-perishable Snacks",
            "quantity": 10,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Fresh Fruit",
            "quantity": 1,
            "priority": "medium",
            "order": 4
          },
          {
            "name": "Coffee/Energy Drinks",
            "quantity": 1,
            "priority": "medium",
            "order": 5
          },
          {
            "name": "Napkins",
            "quantity": 1,
            "priority": "high",
            "order": 6
          },
          {
            "name": "Wet Wipes",
            "quantity": 1,
            "priority": "high",
            "order": 7
          }
        ]
      },
      {
        "name": "Comfort Items",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Pillows",
            "quantity": 2,
            "priority": "high",
            "order": 0
          },
          {
            "name": "Blankets",
            "quantity": 2,
            "priority": "medium",
            "order": 1
          },
          {
            "name": "Sunglasses",
            "quantity": 2,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Sunshades",
            "quantity": 2,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "Travel Cushion",
            "quantity": 1,
            "priority": "low",
            "order": 4
          },
          {
            "name": "Air Freshener",
            "quantity": 1,
            "priority": "low",
            "order": 5
          }
        ]
      },
      {
        "name": "Emergency Supplies",
        "order": 4,
        "collapsed": false,
        "items": [
          {
            "name": "First Aid Kit",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Flashlight",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Multi-tool",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Duct Tape",
            "quantity": 1,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "Emergency Cash",
            "quantity": 200,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Phone Numbers (written)",
            "quantity": 1,
            "priority": "high",
            "order": 5
          },
          {
            "name": "Roadside Assistance Info",
            "quantity": 1,
            "priority": "essential",
            "order": 6
          }
        ]
      }
    ]
  },
  {
    "key": "weekend-getaway",
    "name": "Weekend Getaway",
    "description": "Light packing for a quick weekend trip",
    "icon": "🎒",
    "categories": [
      {
        "name": "Essentials",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "ID/Wallet",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Phone charger",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Keys",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Medication",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          }
        ]
      },
      {
        "name": "Clothing",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Outfits",
            "quantity": 2,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Underwear",
            "quantity": 3,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Pajamas",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Comfortable shoes",
            "quantity": 1,
            "priority": "essential",
            "order": 3
          }
        ]
      },
      {
        "name": "Toiletries",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Toothbrush & toothpaste",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Deodorant",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Face wash",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Moisturizer",
            "quantity": 1,
            "priority": "medium",
            "order": 3
          }
        ]
      }
    ]
  },
  {
    "key": "international-travel",
    "name": "International Travel",
    "description": "Comprehensive list for traveling abroad",
    "icon": "✈️",
    "categories": [
      {
        "name": "Documents",
        "order": 0,
        "collapsed": false,
        "items": [
          {
            "name": "Passport",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Visa",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Travel insurance",
            "quantity": 1,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Itinerary",
            "quantity": 1,
            "priority": "high",
            "order": 3
          },
          {
            "name": "Emergency contacts",
            "quantity": 1,
            "priority": "high",
            "order": 4
          },
          {
            "name": "Copies of documents",
            "quantity": 1,
            "priority": "high",
            "order": 5
          }
        ]
      },
      {
        "name": "Money & Cards",
        "order": 1,
        "collapsed": false,
        "items": [
          {
            "name": "Credit cards",
            "quantity": 2,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Debit card",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Local currency",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Money belt",
            "quantity": 1,
            "priority": "medium",
            "order": 3
          }
        ]
      },
      {
        "name": "Electronics",
        "order": 2,
        "collapsed": false,
        "items": [
          {
            "name": "Universal adapter",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "Phone",
            "quantity": 1,
            "priority": "essential",
            "order": 1
          },
          {
            "name": "Chargers",
            "quantity": 2,
            "priority": "essential",
            "order": 2
          },
          {
            "name": "Power bank",
            "quantity": 1,
            "priority": "high",
            "weight": 300,
            "order": 3
          },
          {
            "name": "Headphones",
            "quantity": 1,
            "priority": "medium",
            "order": 4
          }
        ]
      },
      {
        "name": "Health",
        "order": 3,
        "collapsed": false,
        "items": [
          {
            "name": "Prescription medications",
            "quantity": 1,
            "priority": "essential",
            "order": 0
          },
          {
            "name": "First aid kit",
            "quantity": 1,
            "priority": "high",
            "order": 1
          },
          {
            "name": "Hand sanitizer",
            "quantity": 1,
            "priority": "high",
            "order": 2
          },
          {
            "name": "Face masks",
            "quantity": 5,
            "priority": "medium",
            "order": 3
          },
          {
            "name": "Vitamins",
            "quantity": 1,
            "priority": "low",
            "order": 4
          }
        ]
      }
    ]
  }
];
