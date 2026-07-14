import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ListDetail } from "@/components/lists/list-detail";
import { Button } from "@/components/ui/button";
import { useRouteList } from "@/features/lists/hooks/use-list";

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { list, loading } = useRouteList(id);
  if (loading) return <p className="py-12 text-muted-foreground">Loading list…</p>;
  if (!list) return <p className="py-12 text-muted-foreground">List not found.</p>;

  return (
    <div className="manifest-frame py-5 md:py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/lists"><ArrowLeft aria-hidden="true" />Back to route ledger</Link>
      </Button>
      <ListDetail list={list} />
    </div>
  );
}
