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

type Item = { title: string; url: string; icon: typeof FileText };
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Work",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Quotes", url: "/quotes", icon: FileText },
      { title: "Invoices", url: "/invoices", icon: Receipt },
      { title: "Scheduling", url: "/scheduling", icon: Calendar },
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Inventory", url: "/inventory", icon: Package },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
      { title: "Tax & Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Set-up",
    items: [
      { title: "Account", url: "/account", icon: User },
      { title: "PDF templates", url: "/templates", icon: Palette },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Help", url: "/help", icon: HelpCircle },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
    isActive
      ? "bg-sidebar-accent text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-sidebar-primary"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
  }`;

export function AppSidebar() {
  const [searchParams] = useSearchParams();
  const demoParam = searchParams.get("demo") === "true" ? "?demo=true" : "";
  const isMobile = useIsMobile();
  const { isAdmin } = useIsAdmin();
  const groups = isAdmin
    ? GROUPS.map((g) => (g.label === "Set-up" ? { ...g, items: [...g.items, { title: "Admin", url: "/admin", icon: Shield }] } : g))
    : GROUPS;

  return (
    <Sidebar className={isMobile ? "w-64" : ""}>
      <SidebarHeader className="px-5 pt-6 pb-5">
        <Logo inverted size="md" />
      </SidebarHeader>
      <SidebarContent className="px-2 pb-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="px-3 text-xs font-medium text-sidebar-foreground/50">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-11 md:h-10 hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent">
                      <NavLink to={item.url === "/admin" ? item.url : `${item.url}${demoParam}`} className={linkClass}>
                        <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                        <span className="text-[0.95rem]">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
