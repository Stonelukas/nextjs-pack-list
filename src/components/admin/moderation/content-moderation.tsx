"use client";

import { useState } from "react";
import { ModerationQueue } from "./moderation-queue";
import { ContentPreview } from "./content-preview";

interface ModerationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  author: string;
  authorId: string | null;
  createdAt: number;
  status: string;
  flaggedReason: string;
}

export function ContentModeration() {
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreviewItem = (item: ModerationItem) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <ModerationQueue onPreviewItem={handlePreviewItem} />
      <ContentPreview
        item={selectedItem}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
