"use client"

import { useEffect } from "react";
import { useConvexStore } from "@/hooks/use-convex-store";
import { Priority } from "@/types";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const router = useRouter();
  const { createList, addCategory, addItem } = useConvexStore();

  // Redirect to home in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    const setupTestData = async () => {
      // Create a test list with categories and items
      const listId = await createList(
        "Weekend Beach Trip",
        "3-day beach vacation",
        ["beach", "vacation", "weekend"]
      );

      if (!listId) {
        console.error("Failed to create test list");
        return;
      }

      // Add Clothing category
      const clothingId = await addCategory(listId, "Clothing", "#3B82F6", 0);

      if (clothingId) {
        // Add items to Clothing using the correct signature
        await addItem(clothingId, "T-shirts", 5, Priority.HIGH, "Light colors for hot weather");
        await addItem(clothingId, "Shorts", 3, Priority.MEDIUM);
        await addItem(clothingId, "Sandals", 1, Priority.ESSENTIAL, "Comfortable for walking");
      }

      // Add Beach Gear category
      const gearId = await addCategory(listId, "Beach Gear", "#10B981", 1);

      if (gearId) {
        // Add items to Beach Gear
        await addItem(gearId, "Beach Umbrella", 1, Priority.HIGH, "UV protection");
        await addItem(gearId, "Snorkeling Set", 2, Priority.MEDIUM);
        await addItem(gearId, "Beach Towels", 4, Priority.ESSENTIAL, "Quick-dry material");
      }

      // Add Food & Drinks category
      const foodId = await addCategory(listId, "Food & Drinks", "#F59E0B", 2);

      if (foodId) {
        // Add items to Food & Drinks
        await addItem(foodId, "Water Bottles", 6, Priority.ESSENTIAL);
        await addItem(foodId, "Snacks", 10, Priority.MEDIUM, "Trail mix, granola bars");
        await addItem(foodId, "Cooler", 1, Priority.HIGH, "With ice packs");
      }

      // Navigate to the created list
      router.push(`/lists/${listId}`);
    };

    setupTestData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto px-4 py-8">
      <p>Creating test list...</p>
    </div>
  );
}