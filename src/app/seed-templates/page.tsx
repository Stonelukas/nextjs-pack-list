"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function SeedTemplatesPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const seedTemplates = useMutation(api.templates.seedTemplates);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedTemplates();
      toast.success(result.message);
    } catch (error) {
      toast.error("Error seeding templates: " + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Seed Templates</h1>
      <p className="mb-4">
        Click the button below to seed the default templates into the database.
        This only needs to be done once.
      </p>
      <Button onClick={handleSeed} disabled={isSeeding}>
        {isSeeding ? "Seeding..." : "Seed Templates"}
      </Button>
    </div>
  );
}