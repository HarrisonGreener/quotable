import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClients } from "@/hooks/useClients";
import { AddEditClientDialog } from "@/components/AddEditClientDialog";
import { ClientDetailsDrawer } from "@/components/ClientDetailsDrawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Mail, Phone, Eye, Users, Download } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { EmptyState } from "@/components/EmptyState";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const demoClients = [
  {
    id: "demo-1",
    user_id: "demo",
    company_name: "Ashworth Construction Ltd",
    contact_name: "James Wilson",
    email: "james@ashworthconstruction.co.uk",
    phone: "07700 900123",
    address: "45 Station Road, Bromley, BR1 1AA",
    notes: "Preferred supplier for commercial projects. Net 30 payment terms.",
    created_at: "2025-01-15T09:00:00Z",
    updated_at: "2025-01-15T09:00:00Z",
  },
  {
    id: "demo-2",
    user_id: "demo",
    company_name: "Hollins & Webb Builders",
    contact_name: "Sarah Thompson",
    email: "sarah@hollinswebb.co.uk",
    phone: "07700 900456",
    address: "12 Mill Lane, Didsbury, Manchester, M20 1AA",
    notes: "Residential renovation specialist. Always requests detailed breakdowns.",
    created_at: "2025-01-12T10:00:00Z",
    updated_at: "2025-01-12T10:00:00Z",
  },
  {
    id: "demo-3",
    user_id: "demo",
    company_name: "Urban Renovations",
    contact_name: "Michael Hartley",
    email: "m.hartley@urbanreno.co.uk",
    phone: "07700 900789",
    address: "88 Church Street, Harborne, Birmingham, B17 1AA",
    notes: "High-end residential projects. Budget-conscious but values quality.",
    created_at: "2025-01-10T11:00:00Z",
    updated_at: "2025-01-10T11:00:00Z",
  },
  {
    id: "demo-4",
    user_id: "demo",
    company_name: "Green Spaces Ltd",
    contact_name: "Emma Roberts",
    email: "emma@greenspaces.co.uk",
    phone: "07700 900321",
    address: "23 Cotham Hill, Bristol, BS6 1AA",
    notes: "Landscaping and outdoor projects. Eco-friendly materials preferred.",
    created_at: "2025-01-05T14:00:00Z",
    updated_at: "2025-01-05T14:00:00Z",
  },
];

export default function Clients() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = searchParams.get("demo") === "true";
  const { clients, isLoading, createClient, updateClient, deleteClient, getUnsavedClients } = useClients(!isDemo);
  
  const displayClients = isDemo ? demoClients : clients;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [deletingClient, setDeletingClient] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unsavedClients, setUnsavedClients] = useState<any[]>([]);

  useEffect(() => {
    if (!isDemo) {
      loadUnsavedClients();
    }
  }, [isDemo]);

  const loadUnsavedClients = async () => {
    const unsaved = await getUnsavedClients();
    setUnsavedClients(unsaved);
  };

  const filteredClients = displayClients.filter((client) =>
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddClient = () => {
    if (isDemo) {
      toast.error("Cannot add clients in demo mode", {
        description: "Subscribe to Quotable Pro to manage your client contacts",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    setEditingClient(null);
    setShowAddDialog(true);
  };

  const handleEditClient = (client: any) => {
    if (isDemo) {
      toast.error("Cannot edit clients in demo mode", {
        description: "Subscribe to Quotable Pro to manage your client contacts",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    setEditingClient(client);
    setShowAddDialog(true);
  };

  const handleDeleteClient = (client: any) => {
    if (isDemo) {
      toast.error("Cannot delete clients in demo mode", {
        description: "Subscribe to Quotable Pro to manage your client contacts",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    setDeletingClient(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletingClient) {
      await deleteClient(deletingClient.id);
      setShowDeleteDialog(false);
      setDeletingClient(null);
    }
  };

  const handleSaveClient = async (clientData: any) => {
    if (editingClient?.id) {
      await updateClient(editingClient.id, clientData);
    } else {
      await createClient(clientData);
    }
    await loadUnsavedClients(); // Refresh unsaved clients list
  };

  const handleImportClient = (unsavedClient: any) => {
    setEditingClient({
      company_name: unsavedClient.name,
      address: unsavedClient.location || "",
      contact_name: "",
      email: "",
      phone: "",
      notes: "",
    });
    setShowAddDialog(true);
  };

  const handleViewDetails = (client: any) => {
    if (isDemo) {
      toast.error("Cannot view client details in demo mode", {
        description: "Subscribe to Quotable Pro to see client history",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    setSelectedClient(client);
    setShowDetailsDrawer(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-heading font-bold">Clients</h1>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {isDemo && <DemoModeNotice />}

          {/* Search and Add */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Client Contacts
                  </CardTitle>
                  <CardDescription>Manage your client contact information</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Import from Quotes Button */}
                  {!isDemo && unsavedClients.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="default" className="relative">
                          <Download className="w-4 h-4 mr-2" />
                          Import
                          <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                            {unsavedClients.length}
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Import from Quotes/Invoices</h4>
                            <p className="text-xs text-muted-foreground">
                              Clients that haven't been saved as contacts yet
                            </p>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {unsavedClients.map((unsaved, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-3 p-2 rounded-lg border bg-background/50 hover:border-primary/40 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{unsaved.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {unsaved.quoteCount > 0 && `${unsaved.quoteCount} quote${unsaved.quoteCount > 1 ? 's' : ''}`}
                                    {unsaved.quoteCount > 0 && unsaved.invoiceCount > 0 && ' • '}
                                    {unsaved.invoiceCount > 0 && `${unsaved.invoiceCount} invoice${unsaved.invoiceCount > 1 ? 's' : ''}`}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleImportClient(unsaved)}
                                  className="shrink-0 h-7 px-2"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button onClick={handleAddClient}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name, contact, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? "No clients found" : "No clients yet"}
              description={
                searchQuery
                  ? "Try adjusting your search terms"
                  : "Add your first client to get started"
              }
              primaryAction={
                !searchQuery ? {
                  label: "Add Your First Client",
                  onClick: handleAddClient
                } : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{client.company_name}</CardTitle>
                        {client.contact_name && (
                          <CardDescription className="truncate">{client.contact_name}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(client)}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClient(client)}
                          title="Edit client"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client)}
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0" />
                        <a
                          href={`mailto:${client.email}`}
                          className="truncate hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0" />
                        <a
                          href={`tel:${client.phone}`}
                          className="hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Footer compact />
      </main>

      <AddEditClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleSaveClient}
        client={editingClient}
      />

      <ClientDetailsDrawer
        open={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        client={selectedClient}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.company_name}? This action cannot be undone.
              Existing quotes and invoices will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
