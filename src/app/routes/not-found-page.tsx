import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="app-frame py-10 md:py-16">
      <div className="overview-frame">
        <PageHeader
          eyebrow="Route lookup / 404"
          title="This route is not on the itinerary"
          description="Check the address or return to your packing workspace."
          actions={
            <Button asChild>
              <Link to="/">Return to Route Ledger</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
