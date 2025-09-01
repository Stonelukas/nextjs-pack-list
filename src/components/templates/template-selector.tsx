'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePackListStore } from '@/store/usePackListStore';
import { defaultTemplates, Template } from '@/data/templates';
import { List, Category, Item } from '@/types';
import { toast } from 'sonner';
import { Package, Plus, Sparkles, Save } from 'lucide-react';

export function TemplateSelector() {
  const router = useRouter();
  const { addList, lists } = usePackListStore();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState('');

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !listName.trim()) {
      toast.error('Please select a template and enter a list name');
      return;
    }

    setIsCreating(true);

    // Create categories and items from template
    const categories: Category[] = selectedTemplate.categories.map((cat, catIndex) => ({
      id: `cat-${Date.now()}-${catIndex}`,
      name: cat.name,
      listId: '', // Will be set when list is created
      order: catIndex,
      items: cat.items.map((item, itemIndex) => ({
        id: `item-${Date.now()}-${catIndex}-${itemIndex}`,
        name: item.name,
        quantity: item.quantity,
        categoryId: `cat-${Date.now()}-${catIndex}`,
        priority: item.priority,
        weight: item.weight,
        checked: false,
        order: itemIndex,
      })),
    }));

    // Create the new list
    const newList: Omit<List, 'id' | 'createdAt' | 'updatedAt'> = {
      name: listName,
      description: listDescription || `Created from ${selectedTemplate.name} template`,
      categories,
      isTemplate: false,
    };

    const listId = addList(newList);
    toast.success('List created from template!');
    
    // Navigate to the new list
    router.push(`/lists/${listId}`);
  };

  const handleSaveAsTemplate = () => {
    if (!selectedListId || !templateName.trim()) {
      toast.error('Please select a list and enter a template name');
      return;
    }

    const selectedList = lists.find(l => l.id === selectedListId);
    if (!selectedList) {
      toast.error('Selected list not found');
      return;
    }

    // Create a template from the list
    const template: Template = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: templateDescription || `Custom template from ${selectedList.name}`,
      icon: '📋',
      categories: selectedList.categories.map(cat => ({
        name: cat.name,
        items: cat.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          priority: item.priority,
          weight: item.weight,
        })),
      })),
    };

    // Save to localStorage (in a real app, this would go to a database)
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    customTemplates.push(template);
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));

    toast.success('Template saved successfully!');
    setShowSaveTemplate(false);
    setTemplateName('');
    setTemplateDescription('');
    setSelectedListId('');
  };

  // Get custom templates from localStorage
  const customTemplates: Template[] = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('customTemplates') || '[]')
    : [];

  const allTemplates = [...defaultTemplates, ...customTemplates];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Start Templates</h2>
          <p className="text-muted-foreground">
            Choose a template to quickly create a packing list
          </p>
        </div>
        <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save List as Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Create a reusable template from one of your existing lists
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list-select">Select List</Label>
                <select
                  id="list-select"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                >
                  <option value="">Choose a list...</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Family Beach Trip"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Describe what this template is for..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsTemplate}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{template.icon}</span>
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{template.categories.length} categories</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.categories.slice(0, 3).map((cat) => (
                    <Badge key={cat.name} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))}
                  {template.categories.length > 3 && (
                    <Badge variant="outline">+{template.categories.length - 3} more</Badge>
                  )}
                </div>
                {template.id.startsWith('custom-') && (
                  <Badge className="mt-2" variant="default">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Custom Template
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                Create List from {selectedTemplate.name}
              </DialogTitle>
              <DialogDescription>
                Customize your new list based on this template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  placeholder="e.g., Summer Vacation 2024"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-description">Description (Optional)</Label>
                <Textarea
                  id="list-description"
                  placeholder="Add any notes about this trip..."
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Template Preview</Label>
                <ScrollArea className="h-48 rounded-md border p-4">
                  <div className="space-y-3">
                    {selectedTemplate.categories.map((cat) => (
                      <div key={cat.name}>
                        <h4 className="font-semibold">{cat.name}</h4>
                        <ul className="ml-4 mt-1 space-y-1 text-sm text-muted-foreground">
                          {cat.items.map((item) => (
                            <li key={item.name}>
                              • {item.name} ({item.quantity}x) - 
                              <Badge variant="outline" className="ml-1">
                                {item.priority}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFromTemplate} disabled={isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}