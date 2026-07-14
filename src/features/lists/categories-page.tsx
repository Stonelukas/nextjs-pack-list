import { Folder, Package } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useListExportData } from "@/features/lists/hooks/use-lists";
import { summarizeCategories } from "@/features/lists/list-model";

export function CategoriesPage() {
  const { lists, loading } = useListExportData();
  const summaries = summarizeCategories(lists ?? []);
  if (loading) return <p className="py-20 text-center text-muted-foreground">Loading category registry…</p>;

  return (
    <div className="overview-frame py-6 md:py-10">
      <PageHeader eyebrow={`Category registry / ${String(summaries.length).padStart(2, "0")} groups`} title="Categories" description="See how operational groups repeat across your packing manifests." />
      {summaries.length === 0 ? (
        <EmptyState icon={Folder} title="No categories yet" description="Categories appear here after you add them to a packing list." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => {
            const progress = summary.itemCount ? Math.round((summary.packedCount / summary.itemCount) * 100) : 0;
            return (
              <Card key={summary.name} className="border-l-4 border-l-primary/60">
                <CardHeader><CardTitle as="h2">{summary.name}</CardTitle><CardDescription>{summary.itemCount} items across {summary.lists.length} lists</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} aria-label={`${summary.name} packing progress`} />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" aria-hidden="true" />{summary.packedCount} packed</div>
                  <div className="flex flex-wrap gap-2">{summary.lists.map((list) => <Badge key={list._id} variant="outline" asChild><Link to={`/lists/${list._id}`}>{list.name}</Link></Badge>)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
