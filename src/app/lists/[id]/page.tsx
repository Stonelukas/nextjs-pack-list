"use client"

import { useParams, useRouter } from "next/navigation";
import { ListDetail } from "@/components/lists/list-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/lists">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Lists
          </Button>
        </Link>
      </div>
      
      <ListDetail listId={listId} />
    </div>
  );
}