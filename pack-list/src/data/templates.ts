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
          { name: 'Passport/ID', quantity: 1, priority: 'essential' },
          { name: 'Boarding passes', quantity: 1, priority: 'essential' },
          { name: 'Business cards', quantity: 50, priority: 'high' },
          { name: 'Meeting agenda', quantity: 1, priority: 'high' },
        ],
      },
      {
        name: 'Electronics',
        items: [
          { name: 'Laptop', quantity: 1, priority: 'essential', weight: 2000 },
          { name: 'Phone charger', quantity: 1, priority: 'essential' },
          { name: 'Laptop charger', quantity: 1, priority: 'essential' },
          { name: 'Power bank', quantity: 1, priority: 'high', weight: 300 },
          { name: 'USB cables', quantity: 2, priority: 'medium' },
          { name: 'Adapter', quantity: 1, priority: 'high' },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Business suits', quantity: 2, priority: 'essential' },
          { name: 'Dress shirts', quantity: 3, priority: 'essential' },
          { name: 'Ties', quantity: 2, priority: 'high' },
          { name: 'Dress shoes', quantity: 1, priority: 'essential' },
          { name: 'Belt', quantity: 1, priority: 'high' },
          { name: 'Socks', quantity: 4, priority: 'essential' },
          { name: 'Underwear', quantity: 4, priority: 'essential' },
        ],
      },
      {
        name: 'Toiletries',
        items: [
          { name: 'Toothbrush', quantity: 1, priority: 'essential' },
          { name: 'Toothpaste', quantity: 1, priority: 'essential' },
          { name: 'Deodorant', quantity: 1, priority: 'essential' },
          { name: 'Shampoo', quantity: 1, priority: 'high' },
          { name: 'Razor', quantity: 1, priority: 'high' },
          { name: 'Cologne/Perfume', quantity: 1, priority: 'medium' },
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
          { name: 'Swimsuit', quantity: 2, priority: 'essential' },
          { name: 'Beach towel', quantity: 2, priority: 'essential' },
          { name: 'Sunscreen', quantity: 1, priority: 'essential' },
          { name: 'Sunglasses', quantity: 1, priority: 'essential' },
          { name: 'Beach bag', quantity: 1, priority: 'high' },
          { name: 'Flip flops', quantity: 1, priority: 'essential' },
          { name: 'Hat/Cap', quantity: 1, priority: 'high' },
          { name: 'Beach umbrella', quantity: 1, priority: 'medium', weight: 1000 },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'T-shirts', quantity: 5, priority: 'essential' },
          { name: 'Shorts', quantity: 3, priority: 'essential' },
          { name: 'Light dress/outfit', quantity: 2, priority: 'high' },
          { name: 'Underwear', quantity: 7, priority: 'essential' },
          { name: 'Pajamas', quantity: 2, priority: 'medium' },
        ],
      },
      {
        name: 'Entertainment',
        items: [
          { name: 'Book/E-reader', quantity: 1, priority: 'medium' },
          { name: 'Headphones', quantity: 1, priority: 'medium' },
          { name: 'Camera', quantity: 1, priority: 'high', weight: 500 },
          { name: 'Snorkeling gear', quantity: 1, priority: 'low', weight: 800 },
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
          { name: 'Tent', quantity: 1, priority: 'essential', weight: 3000 },
          { name: 'Sleeping bag', quantity: 1, priority: 'essential', weight: 1500 },
          { name: 'Sleeping pad', quantity: 1, priority: 'high', weight: 500 },
          { name: 'Pillow', quantity: 1, priority: 'medium', weight: 200 },
          { name: 'Tarp', quantity: 1, priority: 'medium', weight: 500 },
        ],
      },
      {
        name: 'Cooking',
        items: [
          { name: 'Camping stove', quantity: 1, priority: 'essential', weight: 500 },
          { name: 'Fuel', quantity: 2, priority: 'essential', weight: 400 },
          { name: 'Cookware', quantity: 1, priority: 'essential', weight: 300 },
          { name: 'Utensils', quantity: 1, priority: 'essential' },
          { name: 'Water filter', quantity: 1, priority: 'essential', weight: 100 },
          { name: 'Water bottles', quantity: 2, priority: 'essential', weight: 200 },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Hiking boots', quantity: 1, priority: 'essential', weight: 800 },
          { name: 'Rain jacket', quantity: 1, priority: 'essential', weight: 300 },
          { name: 'Warm layers', quantity: 2, priority: 'essential' },
          { name: 'Quick-dry pants', quantity: 2, priority: 'high' },
          { name: 'T-shirts', quantity: 3, priority: 'high' },
        ],
      },
      {
        name: 'Safety & Navigation',
        items: [
          { name: 'First aid kit', quantity: 1, priority: 'essential', weight: 300 },
          { name: 'Map & compass', quantity: 1, priority: 'essential' },
          { name: 'Flashlight', quantity: 1, priority: 'essential', weight: 100 },
          { name: 'Extra batteries', quantity: 1, priority: 'high' },
          { name: 'Whistle', quantity: 1, priority: 'high' },
          { name: 'Multi-tool', quantity: 1, priority: 'high', weight: 100 },
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
          { name: 'ID/Wallet', quantity: 1, priority: 'essential' },
          { name: 'Phone charger', quantity: 1, priority: 'essential' },
          { name: 'Keys', quantity: 1, priority: 'essential' },
          { name: 'Medication', quantity: 1, priority: 'essential' },
        ],
      },
      {
        name: 'Clothing',
        items: [
          { name: 'Outfits', quantity: 2, priority: 'essential' },
          { name: 'Underwear', quantity: 3, priority: 'essential' },
          { name: 'Pajamas', quantity: 1, priority: 'high' },
          { name: 'Comfortable shoes', quantity: 1, priority: 'essential' },
        ],
      },
      {
        name: 'Toiletries',
        items: [
          { name: 'Toothbrush & toothpaste', quantity: 1, priority: 'essential' },
          { name: 'Deodorant', quantity: 1, priority: 'essential' },
          { name: 'Face wash', quantity: 1, priority: 'high' },
          { name: 'Moisturizer', quantity: 1, priority: 'medium' },
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
          { name: 'Passport', quantity: 1, priority: 'essential' },
          { name: 'Visa', quantity: 1, priority: 'essential' },
          { name: 'Travel insurance', quantity: 1, priority: 'essential' },
          { name: 'Itinerary', quantity: 1, priority: 'high' },
          { name: 'Emergency contacts', quantity: 1, priority: 'high' },
          { name: 'Copies of documents', quantity: 1, priority: 'high' },
        ],
      },
      {
        name: 'Money & Cards',
        items: [
          { name: 'Credit cards', quantity: 2, priority: 'essential' },
          { name: 'Debit card', quantity: 1, priority: 'essential' },
          { name: 'Local currency', quantity: 1, priority: 'high' },
          { name: 'Money belt', quantity: 1, priority: 'medium' },
        ],
      },
      {
        name: 'Electronics',
        items: [
          { name: 'Universal adapter', quantity: 1, priority: 'essential' },
          { name: 'Phone', quantity: 1, priority: 'essential' },
          { name: 'Chargers', quantity: 2, priority: 'essential' },
          { name: 'Power bank', quantity: 1, priority: 'high', weight: 300 },
          { name: 'Headphones', quantity: 1, priority: 'medium' },
        ],
      },
      {
        name: 'Health',
        items: [
          { name: 'Prescription medications', quantity: 1, priority: 'essential' },
          { name: 'First aid kit', quantity: 1, priority: 'high' },
          { name: 'Hand sanitizer', quantity: 1, priority: 'high' },
          { name: 'Face masks', quantity: 5, priority: 'medium' },
          { name: 'Vitamins', quantity: 1, priority: 'low' },
        ],
      },
    ],
  },
];