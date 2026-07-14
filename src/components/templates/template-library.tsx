import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { useMemo, useRef, useState } from "react";
import { Grid3x3, List, Package, Search, X } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTemplateDetail,
  useTemplates,
  type TemplateSummary,
} from "@/features/templates/hooks/use-templates";
import { filterTemplates } from "@/features/templates/template-model";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./template-card";
import { TemplatePreviewer } from "./template-previewer";

interface TemplateLibraryProps {
  onTemplateCreated?: (listId: Id<"lists">) => void;
  className?: string;
}

export function TemplateLibrary({ onTemplateCreated, className }: TemplateLibraryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    applyTemplate,
    canLoadMore,
    loadMore,
    loading,
    loadingMore,
    templates,
  } = useTemplates();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [season, setSeason] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<TemplateSummary | null>(null);
  const { template: previewDetail, loading: previewLoading } = useTemplateDetail(
    preview?._id,
  );
  const previewTrigger = useRef<HTMLElement | null>(null);
  const filter = searchParams.get("filter") === "mine" || searchParams.get("filter") === "recent" ? searchParams.get("filter") as "mine" | "recent" : "all";
  const filtered = useMemo(
    () => filterTemplates(templates ?? [], { filter, search, category })
      .filter((template) => (difficulty === "all" || template.difficulty === difficulty) && (season === "all" || template.season === season || template.season === "all")),
    [category, difficulty, filter, search, season, templates],
  );

  const openPreview = (template: TemplateSummary) => {
    previewTrigger.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPreview(template);
  };
  const closePreview = () => {
    setPreview(null);
    window.requestAnimationFrame(() => previewTrigger.current?.focus());
  };
  const useTemplate = async (template: TemplateSummary, listName: string) => {
    if (!isSignedIn) {
      const returnUrl = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const listId = await applyTemplate({ templateId: template._id, listName }, { rethrow: true });
    if (!listId) return;
    toast.success(`Created “${listName}” from template`);
    if (onTemplateCreated) onTemplateCreated(listId);
    else navigate(`/lists/${listId}`);
  };
  const clear = () => {
    setSearch("");
    setCategory("all");
    setDifficulty("all");
    setSeason("all");
    setSearchParams({});
  };
  const active = Boolean(search || category !== "all" || difficulty !== "all" || season !== "all" || filter !== "all");

  if (loading) return <p className="py-20 text-center text-muted-foreground">Loading route templates…</p>;

  return (
    <div className={cn(className)}>
      <PageHeader
        eyebrow={`Template registry / ${String(templates?.length ?? 0).padStart(2, "0")} plans`}
        title="Template library"
        description="Start with a public route plan or one of your private reusable manifests."
        actions={
          <div className="flex rounded-md border bg-card p-0.5" role="group" aria-label="Template layout">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}><Grid3x3 /></Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}><List /></Button>
          </div>
        }
      />
      <Section title="Available route plans" description={`${filtered.length} ${filtered.length === 1 ? "template" : "templates"} match the current manifest filters.`}>
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" aria-label="Search templates" placeholder="Search route templates…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-40" aria-label="Template category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{["travel", "outdoor", "events", "business", "sports", "seasonal", "emergency", "custom"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
            <Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger className="w-40" aria-label="Template difficulty"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All levels</SelectItem><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select>
            <Select value={season} onValueChange={setSeason}><SelectTrigger className="w-40" aria-label="Template season"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All seasons</SelectItem><SelectItem value="spring">Spring</SelectItem><SelectItem value="summer">Summer</SelectItem><SelectItem value="fall">Fall</SelectItem><SelectItem value="winter">Winter</SelectItem></SelectContent></Select>
            <Button variant={filter === "mine" ? "default" : "outline"} size="sm" onClick={() => setSearchParams(filter === "mine" ? {} : { filter: "mine" })}>My templates</Button>
            <Button variant={filter === "recent" ? "default" : "outline"} size="sm" onClick={() => setSearchParams(filter === "recent" ? {} : { filter: "recent" })}>Recent</Button>
            {active ? <Button variant="ghost" size="sm" onClick={clear}><X aria-hidden="true" />Clear filters</Button> : null}
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No templates found" description="Adjust the filters or clear them to return to the full template registry." secondaryAction={active ? <Button variant="outline" onClick={clear}>Clear filters</Button> : undefined} />
        ) : (
          <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
            {filtered.map((template) => <TemplateCard key={template._id} template={template} onPreview={openPreview} onUse={openPreview} />)}
          </div>
        )}
        {canLoadMore ? (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              disabled={loadingMore}
              aria-busy={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? "Loading templates…" : "Load more templates"}
            </Button>
          </div>
        ) : null}
      </Section>
      <TemplatePreviewer
        template={previewDetail ?? null}
        summary={preview}
        loading={previewLoading}
        isOpen={Boolean(preview)}
        onClose={closePreview}
        onUse={useTemplate}
      />
    </div>
  );
}
