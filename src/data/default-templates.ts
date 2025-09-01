import { Template, Priority, TemplateCategory, Item, Category } from '@/types';

// Helper to create template items
const createTemplateItem = (
  name: string,
  categoryId: string,
  priority: Priority = Priority.MEDIUM,
  quantity: number = 1,
  notes?: string
): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> => ({
  name,
  quantity,
  packed: false,
  priority,
  categoryId,
  notes,
});

// Helper to create template categories with items
const createTemplateCategory = (
  name: string,
  order: number,
  items: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'categoryId'>[]
): Omit<Category, 'id' | 'createdAt' | 'updatedAt'> => {
  const categoryId = `cat-${name.toLowerCase().replace(/\s+/g, '-')}`;
  return {
    name,
    order,
    collapsed: false,
    items: items.map(item => ({
      ...item,
      categoryId,
      id: `item-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
};

export const defaultTemplates: Template[] = [
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    description: 'Essential items for a relaxing beach getaway',
    icon: '🏖️',
    tags: [TemplateCategory.TRAVEL, TemplateCategory.SEASONAL],
    duration: '1 week',
    difficulty: 'beginner',
    season: 'summer',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Clothing', 0, [
        createTemplateItem('Swimsuits', '', Priority.ESSENTIAL, 2, 'At least 2 for rotation'),
        createTemplateItem('Beach Cover-up', '', Priority.HIGH, 1),
        createTemplateItem('Shorts', '', Priority.HIGH, 3),
        createTemplateItem('T-shirts', '', Priority.HIGH, 5),
        createTemplateItem('Light Dress/Outfit', '', Priority.MEDIUM, 2, 'For evening dining'),
        createTemplateItem('Underwear', '', Priority.ESSENTIAL, 7),
        createTemplateItem('Sandals/Flip-flops', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Sun Hat', '', Priority.HIGH, 1),
        createTemplateItem('Sunglasses', '', Priority.ESSENTIAL, 1),
      ]),
      createTemplateCategory('Beach Essentials', 1, [
        createTemplateItem('Sunscreen SPF 50+', '', Priority.ESSENTIAL, 2, 'Reef-safe if possible'),
        createTemplateItem('Beach Towels', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Beach Bag', '', Priority.HIGH, 1),
        createTemplateItem('Waterproof Phone Case', '', Priority.HIGH, 1),
        createTemplateItem('Snorkel Gear', '', Priority.LOW, 1, 'Optional - can often rent'),
        createTemplateItem('Beach Umbrella', '', Priority.MEDIUM, 1),
        createTemplateItem('Cooler Bag', '', Priority.MEDIUM, 1),
      ]),
      createTemplateCategory('Toiletries', 2, [
        createTemplateItem('After-sun Lotion', '', Priority.HIGH, 1),
        createTemplateItem('Shampoo/Conditioner', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Body Wash', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Toothbrush & Toothpaste', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Deodorant', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Razor', '', Priority.MEDIUM, 1),
        createTemplateItem('Moisturizer', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Documents & Electronics', 3, [
        createTemplateItem('Passport/ID', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Travel Insurance', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Hotel Confirmation', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Phone Charger', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Power Bank', '', Priority.MEDIUM, 1),
        createTemplateItem('Camera', '', Priority.LOW, 1),
        createTemplateItem('E-reader/Book', '', Priority.LOW, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'business-trip',
    name: 'Business Trip',
    description: 'Professional essentials for a successful business trip',
    icon: '💼',
    tags: [TemplateCategory.BUSINESS, TemplateCategory.TRAVEL],
    duration: '3 days',
    difficulty: 'intermediate',
    season: 'all',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Professional Attire', 0, [
        createTemplateItem('Business Suits', '', Priority.ESSENTIAL, 2, 'One per day plus backup'),
        createTemplateItem('Dress Shirts', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Ties', '', Priority.HIGH, 3),
        createTemplateItem('Dress Shoes', '', Priority.ESSENTIAL, 2, 'Brown and black'),
        createTemplateItem('Belt', '', Priority.HIGH, 2),
        createTemplateItem('Dress Socks', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Underwear', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Casual Outfit', '', Priority.MEDIUM, 1, 'For downtime'),
      ]),
      createTemplateCategory('Work Essentials', 1, [
        createTemplateItem('Laptop', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Laptop Charger', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Business Cards', '', Priority.HIGH, 50),
        createTemplateItem('Notebook & Pens', '', Priority.HIGH, 1),
        createTemplateItem('Presentation Materials', '', Priority.ESSENTIAL, 1),
        createTemplateItem('USB Drive', '', Priority.MEDIUM, 1),
        createTemplateItem('Portable Mouse', '', Priority.LOW, 1),
        createTemplateItem('HDMI Adapter', '', Priority.MEDIUM, 1),
      ]),
      createTemplateCategory('Documents', 2, [
        createTemplateItem('ID/Passport', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Boarding Passes', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Hotel Confirmation', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Meeting Agenda', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Corporate Credit Card', '', Priority.HIGH, 1),
        createTemplateItem('Expense Receipt Folder', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Personal Care', 3, [
        createTemplateItem('Toiletry Bag', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Medications', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Phone Charger', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Watch', '', Priority.MEDIUM, 1),
        createTemplateItem('Grooming Kit', '', Priority.HIGH, 1),
        createTemplateItem('Breath Mints', '', Priority.MEDIUM, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'camping-adventure',
    name: 'Camping Adventure',
    description: 'Complete gear list for a camping trip in nature',
    icon: '⛺',
    tags: [TemplateCategory.OUTDOOR, TemplateCategory.SPORTS],
    duration: '3-5 days',
    difficulty: 'advanced',
    season: 'summer',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Shelter & Sleep', 0, [
        createTemplateItem('Tent', '', Priority.ESSENTIAL, 1, 'Check all poles and stakes'),
        createTemplateItem('Sleeping Bag', '', Priority.ESSENTIAL, 1, 'Check temperature rating'),
        createTemplateItem('Sleeping Pad', '', Priority.HIGH, 1),
        createTemplateItem('Pillow', '', Priority.MEDIUM, 1, 'Inflatable recommended'),
        createTemplateItem('Tarp/Footprint', '', Priority.HIGH, 1),
        createTemplateItem('Rope/Paracord', '', Priority.HIGH, 50, 'feet'),
        createTemplateItem('Camping Chair', '', Priority.LOW, 1),
      ]),
      createTemplateCategory('Cooking & Food', 1, [
        createTemplateItem('Camping Stove', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Fuel Canisters', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Lighter/Matches', '', Priority.ESSENTIAL, 2, 'Waterproof'),
        createTemplateItem('Cookset', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Utensils', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Water Filter', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Water Bottles', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Food (per day)', '', Priority.ESSENTIAL, 5, 'Plan meals'),
        createTemplateItem('Bear Canister', '', Priority.HIGH, 1, 'If required'),
        createTemplateItem('Cooler', '', Priority.MEDIUM, 1),
      ]),
      createTemplateCategory('Clothing', 2, [
        createTemplateItem('Moisture-wicking Shirts', '', Priority.HIGH, 3),
        createTemplateItem('Hiking Pants/Shorts', '', Priority.HIGH, 2),
        createTemplateItem('Rain Jacket', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Insulation Layer', '', Priority.HIGH, 1),
        createTemplateItem('Underwear', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Hiking Socks', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Hiking Boots', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Camp Shoes', '', Priority.MEDIUM, 1),
        createTemplateItem('Hat', '', Priority.HIGH, 1),
        createTemplateItem('Gloves', '', Priority.MEDIUM, 1),
      ]),
      createTemplateCategory('Navigation & Safety', 3, [
        createTemplateItem('Map & Compass', '', Priority.ESSENTIAL, 1),
        createTemplateItem('GPS Device', '', Priority.HIGH, 1),
        createTemplateItem('First Aid Kit', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Emergency Whistle', '', Priority.HIGH, 1),
        createTemplateItem('Headlamp', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Flashlight (backup)', '', Priority.HIGH, 1),
        createTemplateItem('Extra Batteries', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Multi-tool/Knife', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Emergency Shelter', '', Priority.MEDIUM, 1, 'Space blanket'),
      ]),
      createTemplateCategory('Personal Care', 4, [
        createTemplateItem('Biodegradable Soap', '', Priority.HIGH, 1),
        createTemplateItem('Toilet Paper', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Trowel', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Sunscreen', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Bug Spray', '', Priority.HIGH, 1),
        createTemplateItem('Personal Medications', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Toothbrush & Paste', '', Priority.HIGH, 1),
        createTemplateItem('Quick-dry Towel', '', Priority.MEDIUM, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wedding-guest',
    name: 'Wedding Guest',
    description: 'Everything you need as a wedding guest',
    icon: '💒',
    tags: [TemplateCategory.EVENTS],
    duration: '2-3 days',
    difficulty: 'beginner',
    season: 'all',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Formal Attire', 0, [
        createTemplateItem('Formal Outfit', '', Priority.ESSENTIAL, 1, 'Check dress code'),
        createTemplateItem('Formal Shoes', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Accessories', '', Priority.HIGH, 1, 'Tie/jewelry/clutch'),
        createTemplateItem('Backup Outfit', '', Priority.MEDIUM, 1),
        createTemplateItem('Undergarments', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Shawl/Jacket', '', Priority.HIGH, 1, 'For evening'),
      ]),
      createTemplateCategory('Gift & Cards', 1, [
        createTemplateItem('Wedding Gift', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Card', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Gift Receipt', '', Priority.HIGH, 1),
        createTemplateItem('Cash/Check', '', Priority.HIGH, 1, 'If giving money'),
      ]),
      createTemplateCategory('Essentials', 2, [
        createTemplateItem('Invitation', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Hotel Confirmation', '', Priority.ESSENTIAL, 1),
        createTemplateItem('ID', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Phone Charger', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Camera', '', Priority.MEDIUM, 1),
        createTemplateItem('Tissues', '', Priority.HIGH, 1, 'For happy tears'),
        createTemplateItem('Pain Relievers', '', Priority.MEDIUM, 1),
        createTemplateItem('Band-aids', '', Priority.MEDIUM, 1, 'For shoe blisters'),
      ]),
      createTemplateCategory('Personal Care', 3, [
        createTemplateItem('Makeup/Grooming', '', Priority.HIGH, 1),
        createTemplateItem('Hair Styling Tools', '', Priority.HIGH, 1),
        createTemplateItem('Perfume/Cologne', '', Priority.MEDIUM, 1),
        createTemplateItem('Deodorant', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Breath Mints', '', Priority.MEDIUM, 1),
        createTemplateItem('Safety Pins', '', Priority.LOW, 1, 'Emergency fixes'),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ski-trip',
    name: 'Ski/Snowboard Trip',
    description: 'Complete packing list for hitting the slopes',
    icon: '⛷️',
    tags: [TemplateCategory.SPORTS, TemplateCategory.SEASONAL],
    duration: '1 week',
    difficulty: 'intermediate',
    season: 'winter',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Ski/Snowboard Gear', 0, [
        createTemplateItem('Skis/Snowboard', '', Priority.ESSENTIAL, 1, 'Or rent at resort'),
        createTemplateItem('Boots', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Poles', '', Priority.ESSENTIAL, 1, 'For skiing'),
        createTemplateItem('Helmet', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Goggles', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Ski Pass/Lift Tickets', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Equipment Bag', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Clothing Layers', 1, [
        createTemplateItem('Base Layers Top', '', Priority.ESSENTIAL, 3, 'Thermal underwear'),
        createTemplateItem('Base Layers Bottom', '', Priority.ESSENTIAL, 3),
        createTemplateItem('Ski Jacket', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Ski Pants', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Mid-layer Fleece', '', Priority.HIGH, 2),
        createTemplateItem('Ski Socks', '', Priority.ESSENTIAL, 5, 'Avoid cotton'),
        createTemplateItem('Gloves/Mittens', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Neck Warmer/Balaclava', '', Priority.HIGH, 1),
        createTemplateItem('Warm Hat', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Après-Ski', 2, [
        createTemplateItem('Casual Clothes', '', Priority.HIGH, 3),
        createTemplateItem('Jeans/Pants', '', Priority.HIGH, 2),
        createTemplateItem('Warm Boots', '', Priority.HIGH, 1),
        createTemplateItem('Sweater/Hoodie', '', Priority.HIGH, 2),
        createTemplateItem('Pajamas', '', Priority.MEDIUM, 2),
        createTemplateItem('Slippers', '', Priority.LOW, 1),
      ]),
      createTemplateCategory('Protection & Care', 3, [
        createTemplateItem('Sunscreen (high SPF)', '', Priority.ESSENTIAL, 1, 'Strong UV at altitude'),
        createTemplateItem('Lip Balm with SPF', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Moisturizer', '', Priority.HIGH, 1),
        createTemplateItem('Hand Warmers', '', Priority.MEDIUM, 10),
        createTemplateItem('First Aid Kit', '', Priority.HIGH, 1),
        createTemplateItem('Pain Relievers', '', Priority.HIGH, 1),
        createTemplateItem('Muscle Balm', '', Priority.MEDIUM, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'baby-travel',
    name: 'Traveling with Baby',
    description: 'Essential items for traveling with an infant',
    icon: '👶',
    tags: [TemplateCategory.TRAVEL],
    duration: '3-5 days',
    difficulty: 'advanced',
    season: 'all',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Baby Essentials', 0, [
        createTemplateItem('Diapers', '', Priority.ESSENTIAL, 30, 'Extra for delays'),
        createTemplateItem('Wipes', '', Priority.ESSENTIAL, 2, 'Travel packs'),
        createTemplateItem('Diaper Cream', '', Priority.HIGH, 1),
        createTemplateItem('Changing Pad', '', Priority.ESSENTIAL, 1, 'Portable'),
        createTemplateItem('Plastic Bags', '', Priority.HIGH, 10, 'For dirty diapers'),
        createTemplateItem('Hand Sanitizer', '', Priority.ESSENTIAL, 2),
      ]),
      createTemplateCategory('Feeding', 1, [
        createTemplateItem('Formula/Breast Milk', '', Priority.ESSENTIAL, 1, 'Plan for trip duration'),
        createTemplateItem('Bottles', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Bottle Brush', '', Priority.HIGH, 1),
        createTemplateItem('Bibs', '', Priority.HIGH, 5),
        createTemplateItem('Burp Cloths', '', Priority.HIGH, 4),
        createTemplateItem('Baby Food', '', Priority.ESSENTIAL, 10, 'If eating solids'),
        createTemplateItem('Spoons', '', Priority.HIGH, 3),
        createTemplateItem('Sippy Cup', '', Priority.MEDIUM, 1),
        createTemplateItem('Snacks', '', Priority.MEDIUM, 1, 'Age appropriate'),
      ]),
      createTemplateCategory('Clothing', 2, [
        createTemplateItem('Onesies', '', Priority.ESSENTIAL, 8, '2 per day plus extras'),
        createTemplateItem('Sleepers', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Pants/Shorts', '', Priority.HIGH, 4),
        createTemplateItem('Socks', '', Priority.HIGH, 6),
        createTemplateItem('Jacket', '', Priority.HIGH, 1),
        createTemplateItem('Hat', '', Priority.MEDIUM, 1),
        createTemplateItem('Extra Outfit', '', Priority.ESSENTIAL, 2, 'In carry-on'),
      ]),
      createTemplateCategory('Sleep & Comfort', 3, [
        createTemplateItem('Travel Crib', '', Priority.HIGH, 1, 'Or confirm with hotel'),
        createTemplateItem('Sleep Sack', '', Priority.HIGH, 2),
        createTemplateItem('White Noise Machine', '', Priority.MEDIUM, 1),
        createTemplateItem('Favorite Toy/Lovey', '', Priority.HIGH, 2),
        createTemplateItem('Pacifiers', '', Priority.HIGH, 4),
        createTemplateItem('Swaddle Blankets', '', Priority.MEDIUM, 2),
        createTemplateItem('Monitor', '', Priority.LOW, 1),
      ]),
      createTemplateCategory('Health & Safety', 4, [
        createTemplateItem('Medications', '', Priority.ESSENTIAL, 1, 'Fever reducer, etc.'),
        createTemplateItem('Thermometer', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Nasal Aspirator', '', Priority.HIGH, 1),
        createTemplateItem('Sunscreen (baby-safe)', '', Priority.HIGH, 1),
        createTemplateItem('First Aid Kit', '', Priority.HIGH, 1),
        createTemplateItem('Insurance Cards', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Pediatrician Contact', '', Priority.ESSENTIAL, 1),
      ]),
      createTemplateCategory('Travel Gear', 5, [
        createTemplateItem('Car Seat', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Stroller', '', Priority.HIGH, 1),
        createTemplateItem('Baby Carrier', '', Priority.HIGH, 1),
        createTemplateItem('Diaper Bag', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Stroller Rain Cover', '', Priority.LOW, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'road-trip',
    name: 'Road Trip Essentials',
    description: 'Everything needed for an epic road trip adventure',
    icon: '🚗',
    tags: [TemplateCategory.TRAVEL],
    duration: '1 week+',
    difficulty: 'intermediate',
    season: 'all',
    isPublic: true,
    usageCount: 0,
    createdBy: 'system',
    categories: [
      createTemplateCategory('Vehicle Essentials', 0, [
        createTemplateItem('Driver License', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Registration & Insurance', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Spare Tire (checked)', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Jumper Cables', '', Priority.HIGH, 1),
        createTemplateItem('Emergency Kit', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Motor Oil', '', Priority.HIGH, 1),
        createTemplateItem('Coolant', '', Priority.HIGH, 1),
        createTemplateItem('Paper Towels', '', Priority.MEDIUM, 1),
        createTemplateItem('Trash Bags', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Navigation & Entertainment', 1, [
        createTemplateItem('Phone Mount', '', Priority.HIGH, 1),
        createTemplateItem('Car Charger', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Aux Cable/Bluetooth', '', Priority.HIGH, 1),
        createTemplateItem('Road Atlas', '', Priority.MEDIUM, 1, 'Backup for GPS'),
        createTemplateItem('Downloaded Music/Podcasts', '', Priority.HIGH, 1),
        createTemplateItem('Games/Activities', '', Priority.MEDIUM, 1),
      ]),
      createTemplateCategory('Snacks & Drinks', 2, [
        createTemplateItem('Water Bottles', '', Priority.ESSENTIAL, 4),
        createTemplateItem('Cooler', '', Priority.HIGH, 1),
        createTemplateItem('Ice Packs', '', Priority.HIGH, 4),
        createTemplateItem('Non-perishable Snacks', '', Priority.HIGH, 10),
        createTemplateItem('Fresh Fruit', '', Priority.MEDIUM, 1),
        createTemplateItem('Coffee/Energy Drinks', '', Priority.MEDIUM, 1),
        createTemplateItem('Napkins', '', Priority.HIGH, 1),
        createTemplateItem('Wet Wipes', '', Priority.HIGH, 1),
      ]),
      createTemplateCategory('Comfort Items', 3, [
        createTemplateItem('Pillows', '', Priority.HIGH, 2),
        createTemplateItem('Blankets', '', Priority.MEDIUM, 2),
        createTemplateItem('Sunglasses', '', Priority.ESSENTIAL, 2),
        createTemplateItem('Sunshades', '', Priority.MEDIUM, 2),
        createTemplateItem('Travel Cushion', '', Priority.LOW, 1),
        createTemplateItem('Air Freshener', '', Priority.LOW, 1),
      ]),
      createTemplateCategory('Emergency Supplies', 4, [
        createTemplateItem('First Aid Kit', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Flashlight', '', Priority.ESSENTIAL, 1),
        createTemplateItem('Multi-tool', '', Priority.HIGH, 1),
        createTemplateItem('Duct Tape', '', Priority.MEDIUM, 1),
        createTemplateItem('Emergency Cash', '', Priority.HIGH, 200),
        createTemplateItem('Phone Numbers (written)', '', Priority.HIGH, 1),
        createTemplateItem('Roadside Assistance Info', '', Priority.ESSENTIAL, 1),
      ]),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Template utility functions
export const getTemplatesByCategory = (category: TemplateCategory): Template[] => {
  return defaultTemplates.filter(template => 
    template.tags.includes(category)
  );
};

export const getTemplatesBySeason = (season: string): Template[] => {
  return defaultTemplates.filter(template => 
    template.season === season || template.season === 'all'
  );
};

export const getTemplatesByDifficulty = (difficulty: string): Template[] => {
  return defaultTemplates.filter(template => 
    template.difficulty === difficulty
  );
};

export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return defaultTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Function to create a list from a template
export const createListFromTemplate = (
  template: Template,
  listName: string,
  userId: string
): Omit<List, 'id' | 'createdAt' | 'updatedAt'> => {
  const now = new Date();
  
  // Generate unique IDs for categories and their items
  const categoriesWithIds = template.categories.map((category, index) => {
    const categoryId = `cat-${Date.now()}-${index}`;
    return {
      ...category,
      id: categoryId,
      items: category.items.map((item, itemIndex) => ({
        ...item,
        id: `item-${Date.now()}-${index}-${itemIndex}`,
        categoryId,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    name: listName,
    description: `Created from template: ${template.name}`,
    categories: categoriesWithIds,
    tags: template.tags,
    isTemplate: false,
    templateId: template.id,
    userId,
    sharedWith: [],
  };
};