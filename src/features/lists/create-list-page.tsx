import { useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ActionError } from "@/components/feedback/action-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function CreateListPage() {
  const navigate = useNavigate();
  const { createList, error, pending } = useListActions();
  const { online } = useOnlineStatus();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const submissionGuard = useRef(false);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    setTags((current) => [...current, tag]);
    setTagInput("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!online || submissionGuard.current) return;
    if (!name.trim()) {
      toast.error("List name is required");
      return;
    }

    submissionGuard.current = true;
    try {
      const listId = await createList({
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
      });
      if (listId) {
        toast.success("List created successfully");
        navigate(`/lists/${listId}`);
      }
    } finally {
      submissionGuard.current = false;
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-6 md:py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft aria-hidden="true" />Back</Button>
      <PageHeader compact eyebrow="New manifest / Draft" title="Create new list" description="Name the journey and add the context people need before packing begins." />

      <Card>
        <CardHeader>
          <CardTitle as="h2">List details</CardTitle>
          <CardDescription>Name the list and add optional context.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="list-name">List name</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-description">Description</Label>
              <Textarea
                id="list-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-tag">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="list-tag"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add tag</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-md bg-secondary px-2 py-1 text-sm"
                    onClick={() =>
                      setTags((current) => current.filter((value) => value !== tag))
                    }
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            </div>
            {error ? <ActionError error={error} id="create-list-error" /> : null}
            {!online ? (
              <p id="create-list-offline-reason" className="text-sm text-warning">
                Reconnect to create this list.
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={pending || !name.trim() || !online}
                aria-describedby={
                  !online
                    ? "create-list-offline-reason"
                    : error
                      ? "create-list-error"
                      : undefined
                }
              >
                {pending ? "Creating…" : "Create list"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
