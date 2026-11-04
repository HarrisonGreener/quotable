import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Shield, Database, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PricingCrawlPanel } from "@/components/admin/PricingCrawlPanel";

interface TermsAcceptance {
  id: string;
  user_id: string;
  terms_version: string;
  privacy_accepted: boolean;
  privacy_version: string;
  accepted_at: string;
  privacy_accepted_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  email: string | null;
}

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [acceptances, setAcceptances] = useState<TermsAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAcceptances();
    }
  }, [isAdmin]);

  const fetchAcceptances = async () => {
    try {
      const { data, error } = await supabase
        .from("terms_acceptances_with_emails")
        .select("*")
        .order("accepted_at", { ascending: false });
      
      if (error) throw error;
      
      setAcceptances(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load terms acceptances.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Email",
      "User ID",
      "Terms Version",
      "Privacy Accepted",
      "Privacy Version",
      "Accepted At",
      "Privacy Accepted At",
      "IP Address",
      "User Agent",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAcceptances.map((a) =>
        [
          a.email || "N/A",
          a.user_id,
          a.terms_version,
          a.privacy_accepted,
          a.privacy_version,
          a.accepted_at,
          a.privacy_accepted_at || "",
          a.ip_address || "",
          `"${a.user_agent || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terms-acceptances-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Terms acceptances exported to CSV.",
    });
  };

  const filteredAcceptances = acceptances.filter((a) =>
    a.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <Tabs defaultValue="pricing" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="pricing" className="gap-2">
                    <Database className="h-4 w-4" />
                    Pricing Engine
                  </TabsTrigger>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="h-4 w-4" />
                    User Compliance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pricing">
                  <PricingCrawlPanel />
                </TabsContent>

                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <CardTitle>Terms Acceptances ({filteredAcceptances.length})</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                          <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by Email or User ID..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          <Button onClick={exportToCSV} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>Terms Version</TableHead>
                              <TableHead>Privacy</TableHead>
                              <TableHead>Privacy Version</TableHead>
                              <TableHead>Accepted At</TableHead>
                              <TableHead>IP Address</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAcceptances.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                  No records found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredAcceptances.map((acceptance) => (
                                <TableRow key={acceptance.id}>
                                  <TableCell className="font-medium">
                                    {acceptance.email || "N/A"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {acceptance.user_id.substring(0, 8)}...
                                  </TableCell>
                                  <TableCell>{acceptance.terms_version}</TableCell>
                                  <TableCell>
                                    <span
                                      className={
                                        acceptance.privacy_accepted
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-red-600 dark:text-red-400"
                                      }
                                    >
                                      {acceptance.privacy_accepted ? "✓ Yes" : "✗ No"}
                                    </span>
                                  </TableCell>
                                  <TableCell>{acceptance.privacy_version}</TableCell>
                                  <TableCell>
                                    {new Date(acceptance.accepted_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {acceptance.ip_address || "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
