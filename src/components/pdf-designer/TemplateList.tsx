import { PDFTemplateConfig } from '@/types/pdfTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Trash2, Star, Edit2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateListProps {
  templates: PDFTemplateConfig[];
  selectedId?: string;
  onSelect: (template: PDFTemplateConfig) => void;
  onDuplicate: (template: PDFTemplateConfig) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
  onCreateNew: () => void;
}

export function TemplateList({
  templates,
  selectedId,
  onSelect,
  onDuplicate,
  onDelete,
  onSetDefault,
  onCreateNew,
}: TemplateListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Your Templates</h3>
        <Button variant="outline" size="sm" onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No templates yet. Create your first custom template.
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedId === template.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(template)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Color preview */}
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: template.primary_colour }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: template.secondary_colour }}
                      />
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {template.name}
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs py-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {template.header_style} • {template.font_family}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(template); }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(template); }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetDefault(template.id!); }}>
                          <Star className="w-4 h-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(template.id!); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
