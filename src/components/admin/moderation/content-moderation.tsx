
import { useState } from "react";
import { ModerationQueue } from "./moderation-queue";
import { ContentPreview, type ModerationItem } from "./content-preview";

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
