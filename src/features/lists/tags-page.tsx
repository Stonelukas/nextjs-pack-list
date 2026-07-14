import { Tag } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLists } from "@/features/lists/hooks/use-lists";
import { summarizeTags } from "@/features/lists/list-model";
import { useTemplates } from "@/features/templates/hooks/use-templates";

export function TagsPage() {
  const { lists, loading: listsLoading } = useLists();
  const { templates, loading: templatesLoading } = useTemplates();
  const summaries = summarizeTags(lists ?? [], templates ?? []);
  if (listsLoading || templatesLoading) return <p className="py-20 text-center text-muted-foreground">Loading tag registry…</p>;

  return (
    <div className="overview-frame py-6 md:py-10">
      <PageHeader eyebrow={`Tag registry / ${String(summaries.length).padStart(2, "0")} labels`} title="Tags" description="Browse labels shared by your lists and visible route templates." actions={<><Button asChild variant="outline"><Link to="/lists">Browse lists</Link></Button><Button asChild variant="outline"><Link to="/templates">Browse templates</Link></Button></>} />
      {summaries.length === 0 ? (
        <EmptyState icon={Tag} title="No tags yet" description="Add a short label to a list or template to build this registry." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <Card key={summary.name}>
              <CardHeader><p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">Registry label</p><CardTitle as="h2">#{summary.name}</CardTitle><CardDescription>Used by {summary.listCount} lists and {summary.templateCount} templates</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-2 border-t pt-4 text-center"><div className="border-r"><p className="font-display text-2xl font-bold">{summary.listCount}</p><p className="font-mono text-[0.68rem] uppercase text-muted-foreground">Lists</p></div><div><p className="font-display text-2xl font-bold">{summary.templateCount}</p><p className="font-mono text-[0.68rem] uppercase text-muted-foreground">Templates</p></div></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
