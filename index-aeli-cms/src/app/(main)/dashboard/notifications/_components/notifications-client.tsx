"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  ShieldAlert,
  AlertTriangle,
  Settings,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  Mail,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientCookie } from "@/lib/cookie.client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  email: boolean;
  security: boolean;
  updates: boolean;
  marketing: boolean;
}

interface NotificationsData {
  notifications: NotificationItem[];
  unread_count: number;
  preferences: NotificationPreferences;
}

export function NotificationsClient({ initialData }: { readonly initialData: NotificationsData }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialData.notifications || []);
  const [unreadCount, setUnreadCount] = useState<number>(initialData.unread_count || 0);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Preferences Dialog
  const [isPrefOpen, setIsPrefOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialData.preferences || {
      email: true,
      security: true,
      updates: true,
      marketing: false,
    }
  );
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to mark as read");
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error(err.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to mark all as read");
      }

      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      toast.error(err.message || "Error updating notifications");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to dismiss notification");
      }

      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification dismissed");
    } catch (err: any) {
      toast.error(err.message || "Error dismissing notification");
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update preferences");
      }

      toast.success("Notification preferences saved");
      setIsPrefOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error saving preferences");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === "unread") return !item.is_read;
    if (filterTab === "security") return item.type === "security";
    if (filterTab === "system") return item.type === "info" || item.type === "success";
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "security":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-4" />
          </div>
        );
      case "success":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
        );
      case "warning":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="size-4" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="size-4" />
          </div>
        );
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Activity feed, security notices, and platform updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-1.5 size-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsPrefOpen(true)}>
            <SlidersHorizontal className="mr-1.5 size-4" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterTab} onValueChange={(val) => val && setFilterTab(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="security">
            Security
          </TabsTrigger>
          <TabsTrigger value="system">
            System
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-border/60">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-4 hover:bg-muted/40 ${
                    !item.is_read ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {getNotificationIcon(item.type)}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {item.title}
                        </span>
                        {!item.is_read && (
                          <span className="inline-block size-2 rounded-full bg-primary" />
                        )}
                        <span className="text-muted-foreground text-xs">
                          • {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">
                        {item.message}
                      </p>
                      {item.link && (
                        <div className="pt-1">
                          <Link
                            href={item.link}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                          >
                            View details
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-start">
                    {!item.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNotification(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Bell className="size-10 mb-3 opacity-30" />
              <p className="font-medium text-sm">No notifications in this view</p>
              <p className="text-xs">You're all caught up with recent activity!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Dialog */}
      <Dialog open={isPrefOpen} onOpenChange={setIsPrefOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Configure what types of events trigger alerts in your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between space-x-3 rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Mail className="size-3.5 text-primary" />
                  Email Notifications
                </div>
                <p className="text-muted-foreground text-xs">
                  Receive email alerts for bookings and inquiries.
                </p>
              </div>
              <Switch
                checked={preferences.email}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, email: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-3 rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Shield className="size-3.5 text-destructive" />
                  Security Alerts
                </div>
                <p className="text-muted-foreground text-xs">
                  Alerts for logins, role updates, and password changes.
                </p>
              </div>
              <Switch
                checked={preferences.security}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, security: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-3 rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Info className="size-3.5 text-blue-500" />
                  Content Updates
                </div>
                <p className="text-muted-foreground text-xs">
                  Notices when destinations, attractions or programs change.
                </p>
              </div>
              <Switch
                checked={preferences.updates}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, updates: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrefOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
              {isSavingPrefs ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

