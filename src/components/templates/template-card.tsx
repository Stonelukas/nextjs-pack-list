import { Clock, Eye, Layers, Package, Plus, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TemplateSummary } from "@/features/templates/hooks/use-templates";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: TemplateSummary;
  onPreview: (template: TemplateSummary) => void;
  onUse: (template: TemplateSummary) => void;
  className?: string;
}

export function TemplateCard({
  template,
  onPreview,
  onUse,
  className,
}: TemplateCardProps) {
  return (
    <Card
      data-testid="template-card"
      className={cn(
        "h-full overflow-hidden transition-[border-color] duration-150 hover:border-primary",
        className,
      )}
    >
      <CardHeader>
        <div className="flex min-h-16 items-start gap-3">
          <div
            data-testid="template-icon"
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xl leading-none"
          >
            {template.icon ? (
              <span>{template.icon}</span>
            ) : (
              <Package
                data-testid="template-icon-fallback"
                className="size-5 text-muted-foreground"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle as="h3" className="pt-0.5 text-base leading-tight">
                {template.name}
              </CardTitle>
              {template.isPublic ? (
                <Badge variant="secondary" className="shrink-0">
                  <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  Private
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1 min-h-10 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex min-h-6 flex-wrap gap-1">
          {(template.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="grid min-h-14 grid-cols-2 content-start gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4" aria-hidden="true" />
            {template.categoryCount} categories
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" aria-hidden="true" />
            {template.itemCount} items
          </span>
          {template.duration ? (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {template.duration}
            </span>
          ) : null}
          {template.usageCount ? (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden="true" />
              {template.usageCount} uses
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-auto gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onPreview(template)}
        >
          <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
          Preview
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onUse(template)}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Use template
        </Button>
      </CardFooter>
    </Card>
  );
}
