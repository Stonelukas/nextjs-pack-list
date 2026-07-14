import { useRef, useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ActionError } from "@/components/feedback/action-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import { useRouteList } from "@/features/lists/hooks/use-list";
import type { ListDocument } from "@/features/lists/types";

export function EditListPage() {
  const { id } = useParams<{ id: string }>();
  const { list, loading } = useRouteList(id);
  if (loading) return <p className="p-8 text-muted-foreground">Loading list…</p>;
  if (!list) return <p className="p-8 text-muted-foreground">List not found.</p>;
  return <EditListForm key={list._id} list={list} />;
}

function EditListForm({ list }: { list: ListDocument }) {
  const navigate = useNavigate();
  const { error, pending, updateList } = useListActions();
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description ?? "");
  const [tags, setTags] = useState(list.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const submissionGuard = useRef(false);
  const addTag = () => { const tag = tagInput.trim(); if (tag && !tags.includes(tag)) { setTags((current) => [...current, tag]); setTagInput(""); } };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionGuard.current) return;
    if (!name.trim()) { toast.error("List name is required"); return; }
    submissionGuard.current = true;
    try {
      const updatedId = await updateList({ listId: list._id, name: name.trim(), description: description.trim(), tags });
      if (updatedId) { toast.success("List updated successfully"); navigate(`/lists/${updatedId}`); }
    } finally {
      submissionGuard.current = false;
    }
  };
  return <div className="mx-auto max-w-3xl py-6 md:py-10"><Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft aria-hidden="true" />Back</Button><PageHeader compact eyebrow="Manifest metadata / Edit" title="Edit list" description="Update the route name, operating notes, and search labels." /><Card><CardHeader><CardTitle as="h2">List details</CardTitle><CardDescription>Changes are stored in Convex.</CardDescription></CardHeader><CardContent><form className="space-y-6" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="edit-list-name">List name</Label><Input id="edit-list-name" value={name} onChange={(event) => setName(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="edit-list-description">Description</Label><Textarea id="edit-list-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></div><div className="space-y-2"><Label htmlFor="edit-list-tag">Tags</Label><div className="flex gap-2"><Input id="edit-list-tag" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><Button type="button" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /><span className="sr-only">Add tag</span></Button></div><div className="flex flex-wrap gap-2">{tags.map((tag) => <button key={tag} type="button" className="rounded-md bg-secondary px-2 py-1 text-sm" onClick={() => setTags((current) => current.filter((value) => value !== tag))}>{tag} ×</button>)}</div></div>{error ? <ActionError error={error} id="edit-list-error" /> : null}<div className="flex gap-3"><Button type="submit" disabled={pending || !name.trim()} aria-describedby={error ? "edit-list-error" : undefined}><Save className="mr-2 h-4 w-4" />{pending ? "Saving…" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => navigate(`/lists/${list._id}`)}>Cancel</Button></div></form></CardContent></Card></div>;
}
