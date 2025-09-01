import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const isCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const isShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const isAlt = shortcut.alt ? event.altKey : !event.altKey;
        const isMeta = shortcut.meta ? event.metaKey : true;
        
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          isCtrl &&
          isShift &&
          isAlt &&
          isMeta
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global keyboard shortcuts
export const globalShortcuts: ShortcutConfig[] = [
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Trigger new list creation
      const newListButton = document.querySelector('[data-shortcut="new-list"]') as HTMLElement;
      newListButton?.click();
    },
    description: 'Create new list',
  },
  {
    key: 'k',
    ctrl: true,
    action: () => {
      // Focus search
      const searchInput = document.getElementById('search-input') as HTMLInputElement;
      searchInput?.focus();
    },
    description: 'Focus search',
  },
  {
    key: '/',
    action: () => {
      // Focus search (alternative)
      const searchInput = document.getElementById('search-input') as HTMLInputElement;
      searchInput?.focus();
    },
    description: 'Focus search',
  },
  {
    key: 'Escape',
    action: () => {
      // Close modals/dialogs
      const closeButton = document.querySelector('[data-shortcut="close-modal"]') as HTMLElement;
      closeButton?.click();
    },
    description: 'Close modal',
  },
];

// List-specific shortcuts
export const listShortcuts: ShortcutConfig[] = [
  {
    key: 'a',
    action: () => {
      // Add new item
      const addButton = document.querySelector('[data-shortcut="add-item"]') as HTMLElement;
      addButton?.click();
    },
    description: 'Add new item',
  },
  {
    key: 'c',
    action: () => {
      // Add new category
      const addButton = document.querySelector('[data-shortcut="add-category"]') as HTMLElement;
      addButton?.click();
    },
    description: 'Add new category',
  },
  {
    key: 'e',
    ctrl: true,
    action: () => {
      // Export list
      const exportButton = document.querySelector('[data-shortcut="export"]') as HTMLElement;
      exportButton?.click();
    },
    description: 'Export list',
  },
  {
    key: 'p',
    ctrl: true,
    action: () => {
      // Print
      window.print();
    },
    description: 'Print list',
  },
];

export function KeyboardShortcutsHelp() {
  const allShortcuts = [...globalShortcuts, ...listShortcuts];
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Keyboard Shortcuts</h3>
      <div className="grid gap-2">
        {allShortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
              {shortcut.ctrl && 'Ctrl+'}
              {shortcut.shift && 'Shift+'}
              {shortcut.alt && 'Alt+'}
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}