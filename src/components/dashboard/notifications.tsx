
"use client"

import * as React from "react"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationsProps {
  count: number;
  onClear: () => void;
}

export function Notifications({ count, onClear }: NotificationsProps) {
  const hasNotifications = count > 0;

  const handleOpenChange = (open: boolean) => {
    if (open && hasNotifications) {
      onClear();
    }
  };
  
  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasNotifications ? (
            <DropdownMenuItem className="focus:bg-transparent cursor-default">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}</span>
                    <span>new trade{count > 1 ? 's' : ''} completed.</span>
                </div>
            </DropdownMenuItem>
        ) : (
            <DropdownMenuItem className="focus:bg-transparent cursor-default">
                You have no new notifications.
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
