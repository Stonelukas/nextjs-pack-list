import { Globe, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TemplateWithCategories } from "@/features/templates/hooks/use-templates";

interface TemplateManagerProps {
  template: TemplateWithCategories;
  onClose?: () => void;
}

export function TemplateManager({ template }: TemplateManagerProps) {
  return template.isPublic ? <Badge variant="secondary"><Globe className="mr-1 h-3 w-3" />Public template</Badge> : <Badge variant="outline"><Lock className="mr-1 h-3 w-3" />Private template</Badge>;
}
