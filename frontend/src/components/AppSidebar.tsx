import {
  LayoutDashboard, CheckSquare, MessageSquare, FileText,
  BarChart3, Trophy, MessageCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "To-Do List", url: "/todo", icon: CheckSquare },
  { title: "AI Interview", url: "/interview", icon: MessageSquare },
  { title: "Assessments", url: "/assessments", icon: FileText },
];

const trackingItems = [
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Daily Feedback", url: "/feedback", icon: MessageCircle },
];

function SidebarSection({ label, items }: { label: string; items: typeof mainItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <NavLink to={item.url}>
                  <item.icon className="h-5 w-5" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground">NexusAI</span>
          )}
        </div>
        <SidebarSection label="Main" items={mainItems} />
        <SidebarSection label="Tracking" items={trackingItems} />
      </SidebarContent>
    </Sidebar>
  );
}
