import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings,
  User,
  Calendar,
  HelpCircle,
  TrendingUp,
  Shield,
  Users,
  Package,
  Palette
} from "lucide-react";
import { NavLink, useSearchParams } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Scheduling", url: "/scheduling", icon: Calendar },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Tax & Reports", url: "/reports", icon: BarChart3 },
  { title: "Account", url: "/account", icon: User },
  { title: "Templates", url: "/templates", icon: Palette },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const [searchParams] = useSearchParams();
  const demoParam = searchParams.get("demo") === "true" ? "?demo=true" : "";
  const isMobile = useIsMobile();
  const { isAdmin } = useIsAdmin();

  return (
    <Sidebar className={isMobile ? "w-64" : ""}>
      <SidebarHeader className="border-b border-sidebar-border p-4 md:p-6">
        <Logo inverted size="md" />
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm md:text-base px-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 md:h-10">
                    <NavLink 
                      to={`${item.url}${demoParam}`}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                          isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 md:w-4 md:h-4" />
                      <span className="text-base md:text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-12 md:h-10">
                    <NavLink 
                      to="/admin"
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                          isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <Shield className="w-5 h-5 md:w-4 md:h-4" />
                      <span className="text-base md:text-sm">Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
