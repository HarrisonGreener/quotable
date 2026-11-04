import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Pencil, Trash2, Search } from "lucide-react";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { demoInventory } from "@/data/demoData";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Fixtures",
  "Tools",
  "Materials",
  "Hardware",
  "Other",
];

const UNITS = ["each", "metre", "box", "kg", "litre", "pack"];

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const isMobile = useIsMobile();
  const { inventory, addItem, updateItem, deleteItem } = useInventory(!isDemoMode);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    unit: "each",
    unit_price: "",
    sku: "",
  });

  const displayInventory = isDemoMode ? demoInventory : inventory;

  const filteredInventory = displayInventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemoMode) {
      alert("Demo mode: Cannot save items. Create an account to use this feature.");
      return;
    }

    const itemData = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      unit: formData.unit,
      unit_price: parseFloat(formData.unit_price),
      sku: formData.sku || undefined,
    };

    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...itemData });
      setEditingItem(null);
    } else {
      await addItem.mutateAsync(itemData);
      setIsAddDialogOpen(false);
    }

    // Reset form
    setFormData({
      name: "",
      description: "",
      category: "",
      unit: "each",
      unit_price: "",
      sku: "",
    });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      unit: item.unit,
      unit_price: item.unit_price.toString(),
      sku: item.sku || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      alert("Demo mode: Cannot delete items. Create an account to use this feature.");
      return;
    }

    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem.mutateAsync(id);
    }
  };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading ${isMobile ? 'text-xl' : 'text-2xl'}`}>Inventory</h1>
            </div>
          </header>

          <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
            {isDemoMode && (
              <div className="mb-6">
                <DemoModeBanner />
              </div>
            )}

            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-muted-foreground">
                    Manage your commonly used parts and materials
                  </p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>
                      Add a new part or material to your inventory with pricing
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Item Name *</Label>
                      <Input
                        id="add-name"
                        name="add-inventory-name"
                        autoComplete="off"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., 15mm Copper Pipe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-description">Description</Label>
                      <Textarea
                        id="add-description"
                        name="add-inventory-description"
                        autoComplete="off"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional details about this item"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="add-sku">SKU / Part Number</Label>
                        <Input
                          id="add-sku"
                          name="add-inventory-sku"
                          autoComplete="off"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-unit">Unit *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="add-price">Unit Price (£) *</Label>
                        <Input
                          id="add-price"
                          name="add-inventory-price"
                          type="number"
                          autoComplete="off"
                          step="0.01"
                          min="0"
                          value={formData.unit_price}
                          onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={addItem.isPending}>
                      Add Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredInventory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchQuery || categoryFilter !== "all" 
                      ? "No items match your search"
                      : "No inventory items yet. Add your first item to get started."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredInventory.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {item.category && (
                            <CardDescription className="mt-1">
                              {item.category}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          £{item.unit_price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          per {item.unit}
                        </span>
                      </div>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground mt-2">
                          SKU: {item.sku}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Inventory Item</DialogTitle>
                <DialogDescription>
                  Update the details of this inventory item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name *</Label>
                  <Input
                    id="edit-name"
                    name="edit-inventory-name"
                    autoComplete="off"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 15mm Copper Pipe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="edit-inventory-description"
                    autoComplete="off"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional details about this item"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU / Part Number</Label>
                    <Input
                      id="edit-sku"
                      name="edit-inventory-sku"
                      autoComplete="off"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Unit Price (£) *</Label>
                    <Input
                      id="edit-price"
                      name="edit-inventory-price"
                      type="number"
                      autoComplete="off"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={updateItem.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
