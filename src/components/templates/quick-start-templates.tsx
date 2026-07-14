import { useState } from "react";
import { ArrowRight, Clock, Package, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useTemplateDetail,
  useTemplates,
  type TemplateSummary,
} from "@/features/templates/hooks/use-templates";
import { cn } from "@/lib/utils";
import { TemplatePreviewer } from "./template-previewer";

interface QuickStartTemplatesProps {
  className?: string;
  maxTemplates?: number;
}

export function QuickStartTemplates({
  className,
  maxTemplates = 6,
}: QuickStartTemplatesProps) {
  const navigate = useNavigate();
  const { applyTemplate, publicTemplates } = useTemplates();
  const [preview, setPreview] = useState<TemplateSummary | null>(null);
  const { template: previewDetail, loading: previewLoading } = useTemplateDetail(
    preview?._id,
  );
  const featured = publicTemplates.slice(0, maxTemplates);

  const useTemplate = async (
    template: TemplateSummary,
    listName: string,
  ) => {
    const listId = await applyTemplate(
      { templateId: template._id, listName },
      { rethrow: true },
    );
    if (listId) {
      toast.success(`Created “${listName}” from template`);
      navigate(`/lists/${listId}`);
    }
  };

  if (!featured.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Quick start templates
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/templates")}>
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((template) => {
          return (
            <Card
              key={template._id}
              className="relative cursor-pointer transition-[border-color] duration-150 hover:border-primary"
            >
              <button
                type="button"
                aria-label={`Preview ${template.name} template`}
                className="absolute inset-0 z-0 rounded-lg"
                onClick={() => setPreview(template)}
              />
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {template.itemCount} items
                  </span>
                  {template.duration ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.duration}
                    </span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="relative z-10"
                  onClick={() => setPreview(template)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Use
                </Button>
                {template.difficulty ? (
                  <Badge variant="outline">{template.difficulty}</Badge>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <TemplatePreviewer
        template={previewDetail ?? null}
        summary={preview}
        loading={previewLoading}
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        onUse={useTemplate}
      />
    </div>
  );
}
