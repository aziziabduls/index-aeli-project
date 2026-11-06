"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Award,
  Compass,
  Globe,
  Heart,
  Info,
  LayoutTemplate,
  Mail,
  Map,
  MapPin,
  Percent,
  Phone,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trees,
  Users
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie } from "@/lib/cookie.client";

import {
  type AppConfigAbout,
  type AppConfigBusinessHours,
  type AppConfigContact,
  type AppConfigCredentialItem,
  type AppConfigData,
  type AppConfigFooterLink,
  type AppConfigTeamMember,
  type AppConfigValueItem,
  DEFAULT_APP_CONFIG,
} from "./app-config-types";

export { DEFAULT_APP_CONFIG };
export type {
  AppConfigAbout,
  AppConfigBusinessHours,
  AppConfigContact,
  AppConfigCredentialItem,
  AppConfigData,
  AppConfigFooterLink,
  AppConfigTeamMember,
  AppConfigValueItem
};

const ICON_OPTIONS = [
  { value: "Map", label: "Map", Icon: Map },
  { value: "Compass", label: "Compass", Icon: Compass },
  { value: "Users", label: "Users / Community", Icon: Users },
  { value: "Trees", label: "Trees / Nature", Icon: Trees },
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "ShieldCheck", label: "Shield Check", Icon: ShieldCheck },
  { value: "Globe", label: "Globe", Icon: Globe },
  { value: "Heart", label: "Heart", Icon: Heart },
  { value: "Award", label: "Award", Icon: Award },
];

export function AppConfigClient({ initialConfig }: { initialConfig: AppConfigData }) {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfigData>(initialConfig);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const taxVal = Number(config.tax_percent);
    if (Number.isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
      toast.error("Tax percentage must be between 0 and 100");
      return;
    }

    const platformFeeVal = Number(config.platform_fee_percent ?? 5);
    if (Number.isNaN(platformFeeVal) || platformFeeVal < 0 || platformFeeVal > 100) {
      toast.error("Platform fee percentage must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
      const response = await fetch(`${apiUrl}/api/v1/admin/app-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || res.message || "Failed to update App Config");
      }

      toast.success("App Config updated successfully");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_APP_CONFIG);
    toast.info("Form reset to default values. Click Save Changes to apply.");
  };

  // Credentials helpers
  const updateCredentialItem = (
    index: number,
    field: keyof AppConfigCredentialItem,
    value: string
  ) => {
    setConfig((prev) => {
      const nextItems = [...prev.credentials.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return {
        ...prev,
        credentials: {
          ...prev.credentials,
          items: nextItems,
        },
      };
    });
  };

  const addCredentialItem = () => {
    setConfig((prev) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        items: [
          ...prev.credentials.items,
          {
            icon: "Compass",
            title: "New Credential Highlight",
            desc: "Describe this credential or value proposition.",
          },
        ],
      },
    }));
  };

  const removeCredentialItem = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        items: prev.credentials.items.filter((_, idx) => idx !== index),
      },
    }));
  };

  // About Values helpers
  const updateAboutValue = (index: number, field: keyof AppConfigValueItem, value: string) => {
    setConfig((prev) => {
      const nextValues = [...prev.about.values];
      nextValues[index] = { ...nextValues[index], [field]: value };
      return {
        ...prev,
        about: {
          ...prev.about,
          values: nextValues,
        },
      };
    });
  };

  const addAboutValue = () => {
    setConfig((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        values: [
          ...prev.about.values,
          {
            icon: "Compass",
            title: "New Value",
            desc: "Describe the core value.",
          },
        ],
      },
    }));
  };

  const removeAboutValue = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        values: prev.about.values.filter((_, idx) => idx !== index),
      },
    }));
  };

  // About Team Members helpers
  const updateTeamMember = (index: number, field: keyof AppConfigTeamMember, value: string) => {
    setConfig((prev) => {
      const nextMembers = [...prev.about.team_members];
      nextMembers[index] = { ...nextMembers[index], [field]: value };
      return {
        ...prev,
        about: {
          ...prev.about,
          team_members: nextMembers,
        },
      };
    });
  };

  const addTeamMember = () => {
    setConfig((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        team_members: [
          ...prev.about.team_members,
          {
            name: "New Leader",
            role: "Role / Position",
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
            bio: "Short biography of the team member.",
          },
        ],
      },
    }));
  };

  const removeTeamMember = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        team_members: prev.about.team_members.filter((_, idx) => idx !== index),
      },
    }));
  };

  // Footer link helpers
  const updateFooterLink = (
    listKey: "quick_links" | "support_links",
    index: number,
    field: keyof AppConfigFooterLink,
    value: string
  ) => {
    setConfig((prev) => {
      const nextLinks = [...prev.footer[listKey]];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return {
        ...prev,
        footer: {
          ...prev.footer,
          [listKey]: nextLinks,
        },
      };
    });
  };

  const addFooterLink = (listKey: "quick_links" | "support_links") => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [listKey]: [...prev.footer[listKey], { label: "New Menu Link", url: "#" }],
      },
    }));
  };

  const removeFooterLink = (listKey: "quick_links" | "support_links", index: number) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [listKey]: prev.footer[listKey].filter((_, idx) => idx !== index),
      },
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">App Config</h1>
            {/* <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Superadmin Only
            </Badge> */}
          </div>
          <p className="text-muted-foreground text-sm">
            Manage global website settings, booking taxes, credentials, About page, Contact page, and Footer content on{" "}
            <code>index-aeli-web</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} disabled={saving}>
            <RotateCcw className="mr-1.5 size-4" />
            Reset Defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tax" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="tax" className="gap-1.5 text-xs sm:text-sm">
            <Percent className="size-4" />
            Tax & Fees
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-1.5 text-xs sm:text-sm">
            <Award className="size-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5 text-xs sm:text-sm">
            <Info className="size-4" />
            About Page
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm">
            <Mail className="size-4" />
            Contact Page
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-1.5 text-xs sm:text-sm">
            <LayoutTemplate className="size-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TAX & BOOKING */}
        <TabsContent value="tax" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Tax & Platform Fees</CardTitle>
              <CardDescription>
                Configure the traveler tax rate applied at checkout and the platform fee deducted before paying tour operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid max-w-md gap-2">
                <Label htmlFor="tax-percent">Tax & Service Fee Percentage (%)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="tax-percent"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config.tax_percent}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tax_percent: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="w-36"
                  />
                  <span className="font-medium text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Applied to traveler booking subtotal. Example on Rp 1,000,000 tour price: Tax ={" "}
                  <strong>
                    Rp {Math.round(1000000 * ((config.tax_percent || 0) / 100)).toLocaleString("id-ID")}
                  </strong>{" "}
                  (Checkout Total:{" "}
                  <strong>
                    Rp{" "}
                    {(1000000 + Math.round(1000000 * ((config.tax_percent || 0) / 100))).toLocaleString(
                      "id-ID"
                    )}
                  </strong>
                  ).
                </p>
              </div>

              <div className="grid max-w-md gap-2 pt-4 border-t border-border">
                <Label htmlFor="platform-fee-percent">Operator Platform Fee Percentage (%)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="platform-fee-percent"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config.platform_fee_percent ?? 5}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        platform_fee_percent: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="w-36"
                  />
                  <span className="font-medium text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Fee deducted by the platform from gross bookings before crediting provider payout balances.
                  Example on Rp 1,000,000 booking: Platform Fee ={" "}
                  <strong>
                    Rp {Math.round(1000000 * ((config.platform_fee_percent ?? 5) / 100)).toLocaleString("id-ID")}
                  </strong>{" "}
                  (Net Provider Payout:{" "}
                  <strong>
                    Rp {(1000000 - Math.round(1000000 * ((config.platform_fee_percent ?? 5) / 100))).toLocaleString("id-ID")}
                  </strong>
                  ).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: OUR CREDENTIALS */}
        <TabsContent value="credentials" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Our Credentials Section Header</CardTitle>
              <CardDescription>
                Displayed in the <code>WhyChooseUsSection</code> component on the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cred-subtitle">Badge Subtitle</Label>
                <Input
                  id="cred-subtitle"
                  value={config.credentials.subtitle}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      credentials: { ...prev.credentials, subtitle: e.target.value },
                    }))
                  }
                  placeholder="Our Credentials"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cred-title">Main Section Heading</Label>
                <Input
                  id="cred-title"
                  value={config.credentials.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      credentials: { ...prev.credentials, title: e.target.value },
                    }))
                  }
                  placeholder="A World of Wonders Awaits"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Credential Cards ({config.credentials.items.length})</CardTitle>
                <CardDescription>
                  Manage the highlight cards displayed under Our Credentials.
                </CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addCredentialItem}>
                <Plus className="mr-1.5 size-4" />
                Add Card
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {config.credentials.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Card #{idx + 1}</Badge>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeCredentialItem(idx)}
                      disabled={config.credentials.items.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                    <div className="grid gap-1.5">
                      <Label>Icon</Label>
                      <Select
                        value={item.icon || "Compass"}
                        onValueChange={(val) => updateCredentialItem(idx, "icon", val || "Compass")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ICON_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <opt.Icon className="size-3.5" />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Card Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateCredentialItem(idx, "title", e.target.value)}
                        placeholder="Card title"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={item.desc}
                      onChange={(e) => updateCredentialItem(idx, "desc", e.target.value)}
                      placeholder="Card description..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ABOUT PAGE */}
        <TabsContent value="about" className="mt-4 space-y-6">
          {/* About Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>About Page Hero & Story</CardTitle>
              <CardDescription>
                Configure the top hero banner, headlines, and introductory story on <code>/about</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="about-badge">Badge Label</Label>
                  <Input
                    id="about-badge"
                    value={config.about.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, badge: e.target.value },
                      }))
                    }
                    placeholder="Who We Are"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="about-title">Main Page Heading</Label>
                  <Input
                    id="about-title"
                    value={config.about.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, title: e.target.value },
                      }))
                    }
                    placeholder="Indonesia Destination-Based Exploration"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="about-desc1">Description Paragraph 1</Label>
                <Textarea
                  id="about-desc1"
                  rows={3}
                  value={config.about.description_1}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, description_1: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="about-desc2">Description Paragraph 2</Label>
                <Textarea
                  id="about-desc2"
                  rows={2}
                  value={config.about.description_2}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, description_2: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="about-image">Hero Banner Image URL</Label>
                <Input
                  id="about-image"
                  value={config.about.image}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, image: e.target.value },
                    }))
                  }
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Vision & Mission */}
          <Card>
            <CardHeader>
              <CardTitle>Vision & Mission</CardTitle>
              <CardDescription>Configure the vision and mission statements.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="vision-title">Vision Title</Label>
                  <Input
                    id="vision-title"
                    value={config.about.vision_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, vision_title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="vision-desc">Vision Description</Label>
                  <Textarea
                    id="vision-desc"
                    rows={4}
                    value={config.about.vision_desc}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, vision_desc: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="mission-title">Mission Title</Label>
                  <Input
                    id="mission-title"
                    value={config.about.mission_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, mission_title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="mission-desc">Mission Description</Label>
                  <Textarea
                    id="mission-desc"
                    rows={4}
                    value={config.about.mission_desc}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, mission_desc: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Values */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Core Values ({config.about.values.length})</CardTitle>
                <CardDescription>Manage the value propositions displayed on About page.</CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addAboutValue}>
                <Plus className="mr-1.5 size-4" />
                Add Value
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Section Badge</Label>
                  <Input
                    value={config.about.values_badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, values_badge: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={config.about.values_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, values_title: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {config.about.values.map((val, idx) => (
                  <div key={idx} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Value #{idx + 1}</Badge>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeAboutValue(idx)}
                        disabled={config.about.values.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                      <div className="grid gap-1.5">
                        <Label>Icon</Label>
                        <Select
                          value={val.icon || "Compass"}
                          onValueChange={(icon) => updateAboutValue(idx, "icon", icon || "Compass")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {ICON_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    <opt.Icon className="size-3.5" />
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label>Title</Label>
                        <Input
                          value={val.title}
                          onChange={(e) => updateAboutValue(idx, "title", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Description</Label>
                      <Textarea
                        rows={2}
                        value={val.desc}
                        onChange={(e) => updateAboutValue(idx, "desc", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Leadership Team ({config.about.team_members.length})</CardTitle>
                <CardDescription>Manage team members and curators shown on About page.</CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addTeamMember}>
                <Plus className="mr-1.5 size-4" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Section Badge</Label>
                  <Input
                    value={config.about.team_badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, team_badge: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={config.about.team_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, team_title: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {config.about.team_members.map((member, idx) => (
                  <div key={idx} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Member #{idx + 1}</Badge>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeTeamMember(idx)}
                        disabled={config.about.team_members.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Full Name</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(idx, "name", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Role / Title</Label>
                      <Input
                        value={member.role}
                        onChange={(e) => updateTeamMember(idx, "role", e.target.value)}
                        placeholder="Co-Founder & CEO"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Photo URL</Label>
                      <Input
                        value={member.image}
                        onChange={(e) => updateTeamMember(idx, "image", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label>Short Bio</Label>
                      <Textarea
                        rows={3}
                        value={member.bio}
                        onChange={(e) => updateTeamMember(idx, "bio", e.target.value)}
                        placeholder="Bio description..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CONTACT PAGE */}
        <TabsContent value="contact" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Page Header</CardTitle>
              <CardDescription>
                Configure the top heading and introductory text displayed on <code>/contact</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contact-title">Heading Title</Label>
                <Input
                  id="contact-title"
                  value={config.contact.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, title: e.target.value },
                    }))
                  }
                  placeholder="Get in Touch"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact-desc">Introductory Description</Label>
                <Textarea
                  id="contact-desc"
                  rows={3}
                  value={config.contact.description}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, description: e.target.value },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Office Information</CardTitle>
              <CardDescription>
                Physical address, phone number, and support email displayed on the contact card.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contact-address" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Office Address
                </Label>
                <Textarea
                  id="contact-address"
                  rows={2}
                  value={config.contact.address}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: e.target.value },
                    }))
                  }
                  placeholder="Kuningan Cyber, Block C2-12, South Jakarta, Indonesia"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-phone" className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    Phone
                  </Label>
                  <Input
                    id="contact-phone"
                    value={config.contact.phone}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value },
                      }))
                    }
                    placeholder="+62 (21) 8000-AELI"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact-email" className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    value={config.contact.email}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value },
                      }))
                    }
                    placeholder="explore@index-aeli.id"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Operating hours displayed in the contact information panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="hours-weekday">Monday - Friday</Label>
                <Input
                  id="hours-weekday"
                  value={config.contact.business_hours.weekday}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        business_hours: {
                          ...prev.contact.business_hours,
                          weekday: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="09:00 - 18:00 (WIB)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours-sat">Saturday</Label>
                <Input
                  id="hours-sat"
                  value={config.contact.business_hours.saturday}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        business_hours: {
                          ...prev.contact.business_hours,
                          saturday: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="10:00 - 15:00 (WIB)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours-sun">Sunday</Label>
                <Input
                  id="hours-sun"
                  value={config.contact.business_hours.sunday}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        business_hours: {
                          ...prev.contact.business_hours,
                          sunday: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Closed"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: FOOTER & MENUS */}
        <TabsContent value="footer" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand & Headquarters Contact Information</CardTitle>
              <CardDescription>
                Manage the footer description, physical address, phone number, email, and copyright notice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="footer-desc">Brand Description</Label>
                <Textarea
                  id="footer-desc"
                  rows={3}
                  value={config.footer.brand_description}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, brand_description: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="footer-address" className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Headquarters Address
                  </Label>
                  <Input
                    id="footer-address"
                    value={config.footer.address}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, address: e.target.value },
                      }))
                    }
                    placeholder="Kuningan Cyber, Block C2-12, South Jakarta, Indonesia"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="footer-phone" className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="footer-phone"
                    value={config.footer.phone}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, phone: e.target.value },
                      }))
                    }
                    placeholder="+62 (21) 8000-AELI"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="footer-email" className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Contact Email
                  </Label>
                  <Input
                    id="footer-email"
                    value={config.footer.email}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, email: e.target.value },
                      }))
                    }
                    placeholder="explore@index-aeli.id"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="footer-copyright">Copyright Text</Label>
                <Input
                  id="footer-copyright"
                  value={config.footer.copyright_text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, copyright_text: e.target.value },
                    }))
                  }
                  placeholder="INDEX-AELI Indonesia. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Navigation Menu */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Quick Navigation Menu</CardTitle>
                  <CardDescription>First menu column in the website footer.</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addFooterLink("quick_links")}
                >
                  <Plus className="mr-1.5 size-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.footer.quick_links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Label (e.g. Popular Destinations)"
                      value={link.label}
                      onChange={(e) =>
                        updateFooterLink("quick_links", idx, "label", e.target.value)
                      }
                    />
                    <Input
                      placeholder="URL (e.g. /#destinations)"
                      value={link.url}
                      onChange={(e) =>
                        updateFooterLink("quick_links", idx, "url", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFooterLink("quick_links", idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Support & Trust Menu */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Support & Trust Menu</CardTitle>
                  <CardDescription>Second menu column in the website footer.</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addFooterLink("support_links")}
                >
                  <Plus className="mr-1.5 size-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.footer.support_links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Label (e.g. Help Center / FAQ)"
                      value={link.label}
                      onChange={(e) =>
                        updateFooterLink("support_links", idx, "label", e.target.value)
                      }
                    />
                    <Input
                      placeholder="URL (e.g. #)"
                      value={link.url}
                      onChange={(e) =>
                        updateFooterLink("support_links", idx, "url", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFooterLink("support_links", idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
