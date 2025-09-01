import { List, Category, Item, Priority } from '@/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      quantity: number;
      priority: Priority;
      weight?: number;
    }>;
  }>;
}

export const defaultTemplates: Template[] = [
  {
    id: 'business-trip',
    name: 'Business Trip',
    description: 'Essential items for a professional business trip',
    icon: '💼',
    categories: [
      {
        name: 'Documents',
        items: [
          { name: 'Passport/ID', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Boarding passes', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Business cards', quantity: 50, priority: Priority.HIGH },
          { name: 'Meeting agenda', quantity: 1, priority: Priority.HIGH },
        ],
      },
      {
        name: 'Electronics',
        items: [
          { name: 'Laptop', quantity: 1, priority: Priority.ESSENTIAL, weight: 2000 },
          { name: 'Phone charger', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Laptop charger', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Power bank', quantity: 1, priority: Priority.HIGH, weight: 300 },
          { name: 'USB cables', quantity: 2, priority: Priority.MEDIUM },
          { name: 'Adapter', quantity: 1, priority: Priority.HIGH },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Business suits', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Dress shirts', quantity: 3, priority: Priority.ESSENTIAL },
          { name: 'Ties', quantity: 2, priority: Priority.HIGH },
          { name: 'Dress shoes', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Belt', quantity: 1, priority: Priority.HIGH },
          { name: 'Socks', quantity: 4, priority: Priority.ESSENTIAL },
          { name: 'Underwear', quantity: 4, priority: Priority.ESSENTIAL },
        ],
      },
      {
        name: 'Toiletries',
        items: [
          { name: 'Toothbrush', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Toothpaste', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Deodorant', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Shampoo', quantity: 1, priority: Priority.HIGH },
          { name: 'Razor', quantity: 1, priority: Priority.HIGH },
          { name: 'Cologne/Perfume', quantity: 1, priority: Priority.MEDIUM },
        ],
      },
    ],
  },
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    description: 'Everything you need for a relaxing beach getaway',
    icon: '🏖️',
    categories: [
      {
        name: 'Beach Essentials',
        items: [
          { name: 'Swimsuit', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Beach towel', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Sunscreen', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Sunglasses', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Beach bag', quantity: 1, priority: Priority.HIGH },
          { name: 'Flip flops', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Hat/Cap', quantity: 1, priority: Priority.HIGH },
          { name: 'Beach umbrella', quantity: 1, priority: Priority.MEDIUM, weight: 1000 },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'T-shirts', quantity: 5, priority: Priority.ESSENTIAL },
          { name: 'Shorts', quantity: 3, priority: Priority.ESSENTIAL },
          { name: 'Light dress/outfit', quantity: 2, priority: Priority.HIGH },
          { name: 'Underwear', quantity: 7, priority: Priority.ESSENTIAL },
          { name: 'Pajamas', quantity: 2, priority: Priority.MEDIUM },
        ],
      },
      {
        name: 'Entertainment',
        items: [
          { name: 'Book/E-reader', quantity: 1, priority: Priority.MEDIUM },
          { name: 'Headphones', quantity: 1, priority: Priority.MEDIUM },
          { name: 'Camera', quantity: 1, priority: Priority.HIGH, weight: 500 },
          { name: 'Snorkeling gear', quantity: 1, priority: Priority.LOW, weight: 800 },
        ],
      },
    ],
  },
  {
    id: 'camping',
    name: 'Camping Adventure',
    description: 'Complete gear list for camping in the great outdoors',
    icon: '⛺',
    categories: [
      {
        name: 'Shelter',
        items: [
          { name: 'Tent', quantity: 1, priority: Priority.ESSENTIAL, weight: 3000 },
          { name: 'Sleeping bag', quantity: 1, priority: Priority.ESSENTIAL, weight: 1500 },
          { name: 'Sleeping pad', quantity: 1, priority: Priority.HIGH, weight: 500 },
          { name: 'Pillow', quantity: 1, priority: Priority.MEDIUM, weight: 200 },
          { name: 'Tarp', quantity: 1, priority: Priority.MEDIUM, weight: 500 },
        ],
      },
      {
        name: 'Cooking',
        items: [
          { name: 'Camping stove', quantity: 1, priority: Priority.ESSENTIAL, weight: 500 },
          { name: 'Fuel', quantity: 2, priority: Priority.ESSENTIAL, weight: 400 },
          { name: 'Cookware', quantity: 1, priority: Priority.ESSENTIAL, weight: 300 },
          { name: 'Utensils', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Water filter', quantity: 1, priority: Priority.ESSENTIAL, weight: 100 },
          { name: 'Water bottles', quantity: 2, priority: Priority.ESSENTIAL, weight: 200 },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Hiking boots', quantity: 1, priority: Priority.ESSENTIAL, weight: 800 },
          { name: 'Rain jacket', quantity: 1, priority: Priority.ESSENTIAL, weight: 300 },
          { name: 'Warm layers', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Quick-dry pants', quantity: 2, priority: Priority.HIGH },
          { name: 'T-shirts', quantity: 3, priority: Priority.HIGH },
        ],
      },
      {
        name: 'Safety & Navigation',
        items: [
          { name: 'First aid kit', quantity: 1, priority: Priority.ESSENTIAL, weight: 300 },
          { name: 'Map & compass', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Flashlight', quantity: 1, priority: Priority.ESSENTIAL, weight: 100 },
          { name: 'Extra batteries', quantity: 1, priority: Priority.HIGH },
          { name: 'Whistle', quantity: 1, priority: Priority.HIGH },
          { name: 'Multi-tool', quantity: 1, priority: Priority.HIGH, weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'weekend-getaway',
    name: 'Weekend Getaway',
    description: 'Light packing for a quick weekend trip',
    icon: '🎒',
    categories: [
      {
        name: 'Essentials',
        items: [
          { name: 'ID/Wallet', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Phone charger', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Keys', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Medication', quantity: 1, priority: Priority.ESSENTIAL },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Outfits', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Underwear', quantity: 3, priority: Priority.ESSENTIAL },
          { name: 'Pajamas', quantity: 1, priority: Priority.HIGH },
          { name: 'Comfortable shoes', quantity: 1, priority: Priority.ESSENTIAL },
        ],
      },
      {
        name: 'Toiletries',
        items: [
          { name: 'Toothbrush & toothpaste', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Deodorant', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Face wash', quantity: 1, priority: Priority.HIGH },
          { name: 'Moisturizer', quantity: 1, priority: Priority.MEDIUM },
        ],
      },
    ],
  },
  {
    id: 'international-travel',
    name: 'International Travel',
    description: 'Comprehensive list for traveling abroad',
    icon: '✈️',
    categories: [
      {
        name: 'Documents',
        items: [
          { name: 'Passport', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Visa', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Travel insurance', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Itinerary', quantity: 1, priority: Priority.HIGH },
          { name: 'Emergency contacts', quantity: 1, priority: Priority.HIGH },
          { name: 'Copies of documents', quantity: 1, priority: Priority.HIGH },
        ],
      },
      {
        name: 'Money & Cards',
        items: [
          { name: 'Credit cards', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Debit card', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Local currency', quantity: 1, priority: Priority.HIGH },
          { name: 'Money belt', quantity: 1, priority: Priority.MEDIUM },
        ],
      },
      {
        name: 'Electronics',
        items: [
          { name: 'Universal adapter', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Phone', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'Chargers', quantity: 2, priority: Priority.ESSENTIAL },
          { name: 'Power bank', quantity: 1, priority: Priority.HIGH, weight: 300 },
          { name: 'Headphones', quantity: 1, priority: Priority.MEDIUM },
        ],
      },
      {
        name: 'Health',
        items: [
          { name: 'Prescription medications', quantity: 1, priority: Priority.ESSENTIAL },
          { name: 'First aid kit', quantity: 1, priority: Priority.HIGH },
          { name: 'Hand sanitizer', quantity: 1, priority: Priority.HIGH },
          { name: 'Face masks', quantity: 5, priority: Priority.MEDIUM },
          { name: 'Vitamins', quantity: 1, priority: Priority.LOW },
        ],
      },
    ],
  },
];