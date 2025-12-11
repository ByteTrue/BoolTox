"use client";

import * as React from "react";
import { LayoutDashboard, Compass, Boxes, Settings, User, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SidebarNotification } from "@/components/sidebar-notification";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "BoolTox",
    email: "you@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Workspace",
      items: [
        {
          title: "Home",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "资源导航",
          url: "/dashboard/resources",
          icon: Compass,
        },
        {
          title: "Toolbox",
          url: "/dashboard/tools",
          icon: Boxes,
          items: [
            {
              title: "已安装工具",
              url: "/dashboard/tools/installed",
            },
            {
              title: "工具市场",
              url: "/dashboard/tools/market",
            },
          ],
        },
        {
          title: "Account",
          url: "/settings/account",
          icon: User,
        },
      ],
    },
    {
      label: "Public",
      items: [
        {
          title: "Landing",
          url: "/landing",
          target: "_blank",
          icon: LayoutTemplate,
        },
        {
          title: "Appearance",
          url: "/settings/appearance",
          icon: Settings,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ShadcnStore</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
