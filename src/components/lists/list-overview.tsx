import { useMemo, useState } from "react";
import { Grid3x3, List as ListIcon, Package, SortAsc } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ImportDialog } from "@/components/export/import-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SearchBar } from "@/components/search/search-bar";
import { QuickStartTemplates } from "@/components/templates/quick-start-templates";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLists } from "@/features/lists/hooks/use-lists";
import { cn } from "@/lib/utils";
import {
  calculateListProgress,
  filterAndSortLists,
  type ListSort,
  type ListStatus,
} from "@/features/lists/list-model";
import { CreateListForm } from "./create-list-form";
import { ListCard } from "./list-card";

type ViewMode = "grid" | "list";

export function ListOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasMore, lists, loadMore, loading } = useLists();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ListSort>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const requestedStatus = searchParams.get("status");
  const status: ListStatus =
    requestedStatus === "active" || requestedStatus === "completed"
      ? requestedStatus
      : null;
  const visibleLists = useMemo(
    () => filterAndSortLists(lists ?? [], { status, search, sort }),
    [lists, search, sort, status],
  );
  const allLists = lists ?? [];
  const progressValues = allLists.map(calculateListProgress);
  const totalItems = progressValues.reduce(
    (total, progress) => total + progress.totalItems,
    0,
  );
  const averageCompletion = progressValues.length
    ? Math.round(
        progressValues.reduce(
          (total, progress) => total + progress.completionPercentage,
          0,
        ) / progressValues.length,
      )
    : 0;

  if (loading) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Loading your packing lists…
      </p>
    );
  }

  const collectionTitle =
    status === "active"
      ? "Active lists"
      : status === "completed"
        ? "Completed lists"
        : "Packing lists";
  const stats = [
    { label: "Packing lists", value: allLists.length },
    {
      label: "Completed",
      value: allLists.filter((list) => list.completedAt).length,
    },
    { label: "Items", value: totalItems },
    { label: "Average packed", value: `${averageCompletion}%` },
  ];

  return (
    <div>
      <PageHeader
        title="My packing lists"
        description="Keep every trip clear, from the first idea to the final check."
        spine="none"
      />

      <QuickStartTemplates className="mb-8" maxTemplates={3} />

      <dl
        aria-label="Packing list statistics"
        className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:grid-cols-4"
        role="group"
      >
        {stats.map(({ label, value }, index) => (
          <div
            key={label}
            className={cn(
              "border-border px-5 py-5 sm:border-r sm:border-b-0",
              index < 2 && "border-b",
              index % 2 === 0 && "border-r",
              index === stats.length - 1 && "sm:border-r-0",
            )}
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <Section
        title={collectionTitle}
        description={`${visibleLists.length} loaded ${visibleLists.length === 1 ? "list" : "lists"} in this view${hasMore ? "; more lists are available" : ""}.`}
      >
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] lg:flex-row lg:items-center">
          <SearchBar
            placeholder="Search packing lists…"
            onSearch={setSearch}
            className="min-w-0 flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sort}
              onValueChange={(value: ListSort) => setSort(value)}
            >
              <SelectTrigger
                className="w-full sm:w-[168px]"
                aria-label="Sort packing lists"
              >
                <SortAsc aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>
            <div
              className="flex rounded-xl border bg-surface-muted p-0.5"
              role="group"
              aria-label="List layout"
            >
              <Button
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <Grid3x3 />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListIcon />
              </Button>
            </div>
            <ImportDialog />
            <CreateListForm
              onSuccess={(listId) => navigate(`/lists/${listId}`)}
            />
          </div>
        </div>

        {visibleLists.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No packing lists found"
            description={
              search
                ? "No match exists in the loaded lists yet. Load more or try a different trip name."
                : "Create a list or start from a useful template."
            }
            primaryAction={
              !search ? (
                <CreateListForm
                  onSuccess={(listId) => navigate(`/lists/${listId}`)}
                />
              ) : undefined
            }
            secondaryAction={
              !search ? (
                <Button variant="outline" onClick={() => navigate("/templates")}>
                  Browse templates
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-3"
            }
          >
            {visibleLists.map((list) => (
              <ListCard
                key={list._id}
                list={list}
                onEdit={() => navigate(`/lists/${list._id}/edit`)}
              />
            ))}
          </div>
        )}
        {hasMore ? (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={loadMore}>
              Load more lists
            </Button>
          </div>
        ) : null}
      </Section>
    </div>
  );
}
