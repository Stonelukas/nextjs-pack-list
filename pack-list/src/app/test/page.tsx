"use client"

import { useEffect } from "react";
import { usePackListStore } from "@/store/usePackListStore";
import { Priority } from "@/types";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const router = useRouter();
  const { createList, addCategory, addItem } = usePackListStore();

  // Redirect to home in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    // Create a test list with categories and items
    const listId = createList({
      name: "Weekend Camping Trip",
      description: "3-day camping trip to the mountains",
      isTemplate: false,
      categories: [],
      tags: ["camping", "outdoor", "weekend"],
      userId: "test-user",
    });

    // Add Clothing category
    const clothingId = addCategory(listId, {
      name: "Clothing",
      order: 0,
      collapsed: false,
    });

    // Add items to Clothing
    addItem(listId, clothingId, {
      name: "Hiking boots",
      description: "Waterproof hiking boots",
      quantity: 1,
      priority: Priority.ESSENTIAL,
      packed: false,
      categoryId: clothingId,
    });

    addItem(listId, clothingId, {
      name: "T-shirts",
      description: "Quick-dry t-shirts",
      quantity: 3,
      priority: Priority.HIGH,
      packed: false,
      categoryId: clothingId,
    });

    addItem(listId, clothingId, {
      name: "Rain jacket",
      description: "Waterproof jacket",
      quantity: 1,
      priority: Priority.ESSENTIAL,
      packed: false,
      categoryId: clothingId,
    });

    // Add Camping Gear category
    const gearId = addCategory(listId, {
      name: "Camping Gear",
      order: 1,
      collapsed: false,
    });

    // Add items to Camping Gear
    addItem(listId, gearId, {
      name: "Tent",
      description: "2-person tent",
      quantity: 1,
      priority: Priority.ESSENTIAL,
      packed: false,
      categoryId: gearId,
      weight: 2.5,
    });

    addItem(listId, gearId, {
      name: "Sleeping bag",
      description: "Warm sleeping bag rated for 0°C",
      quantity: 1,
      priority: Priority.ESSENTIAL,
      packed: false,
      categoryId: gearId,
      weight: 1.8,
    });

    addItem(listId, gearId, {
      name: "Flashlight",
      description: "LED flashlight with extra batteries",
      quantity: 2,
      priority: Priority.HIGH,
      packed: false,
      categoryId: gearId,
    });

    // Add Food & Cooking category
    const foodId = addCategory(listId, {
      name: "Food & Cooking",
      order: 2,
      collapsed: false,
    });

    // Add items to Food & Cooking
    addItem(listId, foodId, {
      name: "Water bottles",
      description: "Reusable water bottles",
      quantity: 2,
      priority: Priority.ESSENTIAL,
      packed: false,
      categoryId: foodId,
    });

    addItem(listId, foodId, {
      name: "Trail mix",
      description: "Energy snacks for hiking",
      quantity: 5,
      priority: Priority.MEDIUM,
      packed: false,
      categoryId: foodId,
      weight: 0.5,
    });

    addItem(listId, foodId, {
      name: "Camping stove",
      description: "Portable gas stove",
      quantity: 1,
      priority: Priority.HIGH,
      packed: false,
      categoryId: foodId,
      weight: 0.8,
    });

    // Navigate to the created list
    router.push(`/lists/${listId}`);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <p>Creating test list...</p>
    </div>
  );
}