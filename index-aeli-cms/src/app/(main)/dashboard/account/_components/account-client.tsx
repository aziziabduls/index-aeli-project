"use client";

import {
  Activity,
  Calendar,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Key,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie, setClientCookie } from "@/lib/cookie.client";
import { getInitials } from "@/lib/utils";

interface UserProfileData {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  bio?: string | null;
  role: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  stats?: {
    destinations: number;
    attractions: number;
    programs: number;
  };
  recent_activities?: Array<{
    id: string;
    entity_type: string;
    action: string;
    created_at: string;
  }>;
}

export function AccountClient({ initialUser }: { readonly initialUser: UserProfileData | null }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileData | null>(initialUser);

  // Profile Form States
  const [name, setName] = useState(initialUser?.name || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [bio, setBio] = useState(initialUser?.bio || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "default";
      case "admin":
        return "secondary";
      case "content_editor":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "content_editor":
        return "Content Editor";
      case "viewer":
        return "Viewer";
      default:
        return role;
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setUser((prev) => (prev ? { ...prev, ...json.data } : json.data));

      // Update client user cookie so navbar and header sync
      const currentCookie = getClientCookie("user");
      if (currentCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(currentCookie));
          const updatedCookie = {
            ...parsed,
            name: json.data.name || name,
            email: json.data.email || email,
          };
          setClientCookie("user", encodeURIComponent(JSON.stringify(updatedCookie)), 7);
        } catch (_err) {
          // ignore
        }
      }

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setIsSavingPassword(true);

    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to update password");
      }

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const userInitials = getInitials(displayName);
  const memberDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "Active Member";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Account Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal profile, credentials, and view your platform contributions.
        </p>
      </div>

      {/* User Hero Profile Card */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-r from-card to-muted/20">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-2xl border-2 border-primary/20 shadow-xs ring-2 ring-background">
              <AvatarFallback className="rounded-2xl bg-primary/10 font-bold text-lg text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-lg text-foreground md:text-xl">{displayName}</span>
                <Badge variant={getRoleBadgeVariant(user?.role || "")}>
                  {getRoleLabel(user?.role || "")}
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="mr-1 size-3" />
                  Active
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs md:text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-muted-foreground/80" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground/80" />
                  Joined {memberDate}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authoring Contribution Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Destinations Created</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl tracking-tight">{user?.stats?.destinations ?? 0}</div>
            <p className="text-muted-foreground text-xs">Authored regional travel destinations</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Attractions Created</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Compass className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl tracking-tight">{user?.stats?.attractions ?? 0}</div>
            <p className="text-muted-foreground text-xs">Authored travel spots & points of interest</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Tour Programs Created</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <FileText className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl tracking-tight">{user?.stats?.programs ?? 0}</div>
            <p className="text-muted-foreground text-xs">Packages, itineraries & rundown schedules</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList variant="line"
          className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none">
          <TabsTrigger
            value="profile"

          >
            <UserIcon className="size-4" />
            Profile Details
          </TabsTrigger>
          <TabsTrigger
            value="security"

          >
            <Key className="size-4" />
            Security & Password
          </TabsTrigger>
          <TabsTrigger
            value="activity"

          >
            <Activity className="size-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Details */}
        <TabsContent value="profile" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your display name, contact phone number, and brief description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name">Full / Display Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="display-name"
                      placeholder="e.g. John Doe"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+62 812-3456-7890"
                      className="pl-9"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio & Responsibilities</Label>
                  <Textarea
                    id="bio"
                    placeholder="Brief description about your role or notes..."
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Password */}
        <TabsContent value="security" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is protected with a secure and unique password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pass">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="current-pass"
                      type={showCurrentPass ? "text" : "password"}
                      placeholder="Enter your current password"
                      className="pl-9 pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="new-pass"
                      type={showNewPass ? "text" : "password"}
                      placeholder="At least 6 characters"
                      className="pl-9 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass">Confirm New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="confirm-pass"
                      type={showNewPass ? "text" : "password"}
                      placeholder="Re-type your new password"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 size-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Recent Activity */}
        <TabsContent value="activity" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Trail</CardTitle>
              <CardDescription>
                Activity log recorded when modifying content or settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.recent_activities && user.recent_activities.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {user.recent_activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Activity className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {act.action} {act.entity_type}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(act.created_at).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {act.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Sparkles className="size-8 mb-2 opacity-40" />
                  <p className="text-sm">No recent activity recorded for this session yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

