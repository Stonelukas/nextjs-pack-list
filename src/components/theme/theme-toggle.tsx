import { useId } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme, type Theme } from "@/providers/theme-provider";

interface ThemeToggleProps {
  mode?: "menu" | "select";
  value?: Theme;
  disabled?: boolean;
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeToggle({
  mode = "menu",
  onThemeChange,
  value,
  disabled = false,
}: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const id = useId();
  const current = value ?? theme;
  const chooseTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  if (mode === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Theme</Label>
        <Select
          value={current}
          disabled={disabled}
          onValueChange={(next) => chooseTheme(next as Theme)}
        >
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`Appearance: ${current}`}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-150 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-150 dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Choose appearance">
        <DropdownMenuItem onClick={() => chooseTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => chooseTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => chooseTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
