"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Download,
  Eye,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
  Users,
  Wallet
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientCookie } from "@/lib/cookie.client";
import { formatIDR } from "@/lib/currency";

interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  branch?: string;
  is_primary: boolean;
  verified?: boolean;
}

interface PurchaseItem {
  id: string;
  booking_code: string;
  program_name: string;
  provider_name?: string;
  location_name?: string;
  experience_name?: string;
  customer_name: string;
  customer_email: string;
  pax: number;
  gross_amount: number;
  platform_fee: number;
  net_payout: number;
  payment_method: string;
  date: string;
  status: string;
}

interface PayoutRecord {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  amount: number;
  transfer_fee: number;
  reference_code: string;
  status: string;
  type: string;
  processed_at: string;
}

interface PayoutData {
  id?: string;
  available_balance: number;
  pending_balance: number;
  total_paid_out: number;
  auto_payout_enabled: boolean;
  auto_payout_schedule: string;
  bank_accounts: BankAccount[];
  recent_purchases: PurchaseItem[];
  payout_history: PayoutRecord[];
}

export function PayoutClient({ initialData }: { readonly initialData: PayoutData }) {
  const router = useRouter();
  const [data, setData] = useState<PayoutData>(initialData);

  // Auto-payout state
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(initialData.auto_payout_enabled);
  const [autoSchedule, setAutoSchedule] = useState(initialData.auto_payout_schedule || "daily");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Add Bank Modal State
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [bankName, setBankName] = useState("Bank Central Asia (BCA)");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [branch, setBranch] = useState("");
  const [isAddingBank, setIsAddingBank] = useState(false);

  // Instant Withdraw Modal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(initialData.available_balance.toString());
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Simulate Program Purchase Modal State
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseItem | null>(null);
  const [isPurchaseDrawerOpen, setIsPurchaseDrawerOpen] = useState(false);
  const [simProgramName, setSimProgramName] = useState("Komodo Dragons Expeditions & Padar Sunrise");
  const [simCustomerName, setSimCustomerName] = useState("Michael Tan");
  const [simGrossAmount, setSimGrossAmount] = useState("12000000");
  const [simPax, setSimPax] = useState("3");
  const [simPaymentMethod, setSimPaymentMethod] = useState("BCA Virtual Account");
  const [isSimulating, setIsSimulating] = useState(false);

  // Provider Filter State
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  const uniqueProviders = Array.from(
    new Set(
      data.recent_purchases
        .map((p) => p.provider_name)
        .filter((name): name is string => Boolean(name))
    )
  );

  const filteredPurchases =
    selectedProvider === "all"
      ? data.recent_purchases
      : data.recent_purchases.filter((p) => p.provider_name === selectedProvider);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  const primaryBank = data.bank_accounts.find((b) => b.is_primary) || data.bank_accounts[0];

  const handleToggleAutoPayout = async (checked: boolean) => {
    setAutoPayoutEnabled(checked);
    setIsUpdatingSettings(true);

    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auto_payout_enabled: checked,
          auto_payout_schedule: autoSchedule,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update auto-payout settings");
      }

      toast.success(
        checked
          ? "Auto-Payout enabled! Tour program revenues will be transferred automatically to your primary bank account."
          : "Auto-Payout disabled. You can initiate manual withdrawals anytime."
      );
      setData((prev) => ({ ...prev, auto_payout_enabled: checked }));
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
      setAutoPayoutEnabled(!checked);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleChangeSchedule = async (schedule: string) => {
    setAutoSchedule(schedule);
    try {
      const token = getClientCookie("session_token");
      await fetch(`${apiUrl}/api/v1/payout/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auto_payout_enabled: autoPayoutEnabled,
          auto_payout_schedule: schedule,
        }),
      });
      toast.success(
        `Auto-payout schedule updated to: ${schedule === "daily" ? "Daily" : schedule === "weekly" ? "Weekly" : "Monthly"
        }`
      );
      setData((prev) => ({ ...prev, auto_payout_schedule: schedule }));
    } catch (_err) {
      toast.error("Failed to update schedule");
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !accountHolder) {
      toast.error("Please provide account number and account holder name");
      return;
    }

    setIsAddingBank(true);
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/bank-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim(),
          branch: branch.trim() || "Main Branch",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add bank account");
      }

      toast.success("Bank account added successfully!");
      setIsAddBankOpen(false);
      setAccountNumber("");
      setAccountHolder("");
      setBranch("");

      setData((prev) => ({
        ...prev,
        bank_accounts: [...prev.bank_accounts, json.data],
      }));
    } catch (err: any) {
      toast.error(err.message || "Error adding bank account");
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleSetPrimary = async (bankId: string) => {
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/bank-accounts/${bankId}/primary`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to update primary bank account");
      }

      toast.success("Primary bank account updated for auto-disbursement");
      setData((prev) => ({
        ...prev,
        bank_accounts: prev.bank_accounts.map((b) => ({
          ...b,
          is_primary: b.id === bankId,
        })),
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to update primary account");
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/bank-accounts/${bankId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to remove bank account");
      }

      toast.success("Bank account removed");
      setData((prev) => ({
        ...prev,
        bank_accounts: prev.bank_accounts.filter((b) => b.id !== bankId),
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to remove bank account");
    }
  };

  const handleInstantWithdraw = async () => {
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }
    if (amountNum > data.available_balance) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    setIsWithdrawing(true);
    try {
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Withdrawal failed");
      }

      toast.success(
        `Withdrawal of ${formatIDR(amountNum)} successfully transferred to ${json.data.payout.bank_name}!`
      );
      setIsWithdrawOpen(false);

      setData((prev) => ({
        ...prev,
        available_balance: json.data.new_balance,
        total_paid_out: prev.total_paid_out + amountNum,
        payout_history: [json.data.payout, ...prev.payout_history],
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to process withdrawal");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);

    try {
      const gross = parseFloat(simGrossAmount);
      const token = getClientCookie("session_token");
      const res = await fetch(`${apiUrl}/api/v1/payout/simulate-purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_code: `BK-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
          program_name: simProgramName,
          customer_name: simCustomerName,
          customer_email: `${simCustomerName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
          pax: parseInt(simPax, 10),
          gross_amount: gross,
          payment_method: simPaymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Simulation failed");
      }

      const net = json.data.purchase.net_payout;
      if (json.data.auto_payout_disbursed) {
        toast.success(
          `Program "${simProgramName}" purchased! Net revenue ${formatIDR(net)} automatically transferred to ${json.data.auto_payout_disbursed.bank_name}.`
        );
      } else {
        toast.success(
          `Program "${simProgramName}" purchased! Payout balance increased by ${formatIDR(net)}.`
        );
      }

      setIsSimulateOpen(false);

      // Refresh overview
      const refreshRes = await fetch(`${apiUrl}/api/v1/payout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshJson = await refreshRes.json();
      if (refreshJson.success && refreshJson.data) {
        setData(refreshJson.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute simulation");
    } finally {
      setIsSimulating(false);
    }
  };

  const printReceipt = (payout: PayoutRecord) => {
    const html = `
      <html>
        <head>
          <title>Disbursement Receipt - ${payout.reference_code}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 650px; margin: auto; }
            .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 99px; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 22px; font-weight: bold; margin-top: 24px; color: #0f766e; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin:0;">INDEX-AELI DISBURSEMENT RECEIPT</h2>
              <p style="color:#666; margin:4px 0;">Official Tour Program Revenue Settlement</p>
            </div>
            <div>
              <span class="badge">TRANSFER COMPLETED</span>
            </div>
          </div>
          <table>
            <tr><td><strong>Reference Code:</strong></td><td style="text-align:right;">${payout.reference_code}</td></tr>
            <tr><td><strong>Payout ID:</strong></td><td style="text-align:right;">${payout.id}</td></tr>
            <tr><td><strong>Destination Account:</strong></td><td style="text-align:right;">${payout.bank_name} - ${payout.account_number}</td></tr>
            <tr><td><strong>Account Holder:</strong></td><td style="text-align:right;">${payout.account_holder}</td></tr>
            <tr><td><strong>Processed At:</strong></td><td style="text-align:right;">${new Date(payout.processed_at).toLocaleString("en-US")}</td></tr>
            <tr><td><strong>Payout Type:</strong></td><td style="text-align:right;">${payout.type === "automatic" ? "Automatic (Auto-Payout)" : "Instant Withdrawal"}</td></tr>
            <tr><td><strong>Transfer Fee:</strong></td><td style="text-align:right;">Rp 0 (Platform Sponsored)</td></tr>
          </table>
          <div class="total">Total Disbursed: ${formatIDR(payout.amount)}</div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">Payout & Revenue</h1>
            {/* <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Auto-Disbursement
            </Badge> */}
          </div>
          <p className="text-muted-foreground text-sm">
            Revenues from tour program bookings flow into this balance and are automatically transferred to your registered bank account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulateOpen(true)}
            className="border-dashed"
          >
            <Sparkles className="mr-1.5 size-4 text-amber-500" />
            Simulate Tour Purchase
          </Button> */}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddBankOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Add Bank Account
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setWithdrawAmount(data.available_balance.toString());
              setIsWithdrawOpen(true);
            }}
            disabled={data.available_balance <= 0}
          >
            <ArrowUpRight className="mr-1.5 size-4" />
            Withdraw Funds Now
          </Button>
        </div>
      </div>

      {/* 3 Metric Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Available Balance */}
        <Card className="border-emerald-500/20 bg-gradient-to-b from-card to-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Available for Payout</CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-bold text-2xl tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatIDR(data.available_balance)}
            </div>
            <p className="text-muted-foreground text-xs">
              Net tour program earnings ready to be withdrawn or automatically transferred
            </p>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="border-amber-500/20 bg-gradient-to-b from-card to-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Pending Clearance</CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-bold text-2xl tracking-tight text-amber-700 dark:text-amber-400">
              {formatIDR(data.pending_balance)}
            </div>
            <p className="text-muted-foreground text-xs">
              Program bookings in progress or undergoing payment gateway verification
            </p>
          </CardContent>
        </Card>

        {/* Total Paid Out */}
        <Card className="border-primary/20 bg-gradient-to-b from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Disbursed to Bank</CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-bold text-2xl tracking-tight text-foreground">
              {formatIDR(data.total_paid_out)}
            </div>
            <p className="text-muted-foreground text-xs">
              Cumulative earnings successfully settled and transferred to your bank accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Payout Setting Banner */}
      <Card className="border-primary/30 bg-primary/[0.02]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RefreshCw className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">Automatic Payout (Auto-Payout)</span>
                <Badge
                  variant="outline"
                  className={
                    autoPayoutEnabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {autoPayoutEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs max-w-2xl leading-relaxed">
                Whenever a tour program is purchased and cleared, the platform will automatically transfer your earnings to your primary bank account:{" "}
                <strong className="text-foreground">
                  {primaryBank ? `${primaryBank.bank_name} (•••• ${primaryBank.account_number.slice(-4)})` : "No bank account registered"}
                </strong>
                . Zero transfer fee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            {autoPayoutEnabled && (
              <select
                value={autoSchedule}
                onChange={(e) => handleChangeSchedule(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="daily">Schedule: Daily (23:59)</option>
                <option value="weekly">Schedule: Weekly (Monday)</option>
                <option value="monthly">Schedule: Monthly (1st)</option>
              </select>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={autoPayoutEnabled}
                onCheckedChange={handleToggleAutoPayout}
                disabled={isUpdatingSettings || data.bank_accounts.length === 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Payout Bank Accounts
            </CardTitle>
            <CardDescription>
              Registered banking accounts configured to receive tour program revenue settlements.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsAddBankOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.bank_accounts.map((bank) => (
              <div
                key={bank.id}
                className={`relative flex flex-col justify-between rounded-xl border p-4.5 transition-all ${bank.is_primary
                  ? "border-primary bg-primary/[0.02] shadow-xs ring-1 ring-primary/40"
                  : "hover:border-primary/40 bg-card"
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted font-bold text-foreground">
                      <Landmark className="size-5 text-primary" />
                    </div>
                    {bank.is_primary ? (
                      <Badge variant="default" className="text-[10px] gap-1">
                        <Star className="size-3 fill-current" />
                        Primary Account
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Secondary
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-foreground">{bank.bank_name}</p>
                    <p className="font-mono text-base font-bold tracking-wider text-foreground pt-0.5">
                      {bank.account_number}
                    </p>
                    <p className="text-muted-foreground text-xs uppercase pt-1">
                      a.n {bank.account_holder}
                    </p>
                    {bank.branch && (
                      <p className="text-muted-foreground/80 text-[11px] pt-0.5">
                        {bank.branch}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  {!bank.is_primary ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary/80 px-2"
                      onClick={() => handleSetPrimary(bank.id)}
                    >
                      Set as Primary
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3" />
                      Auto-Payout Target
                    </span>
                  )}

                  {data.bank_accounts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Program Purchases Revenue vs Payout Disbursements */}
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList>
          <TabsTrigger
            value="purchases"

          >
            <ArrowDownLeft className="size-4 text-emerald-500" />
            Tour Program Purchases ({data.recent_purchases.length})
          </TabsTrigger>
          <TabsTrigger
            value="disbursements"

          >
            <ArrowUpRight className="size-4 text-primary" />
            Disbursement History ({data.payout_history.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Program Purchases Revenue */}
        <TabsContent value="purchases" className="pt-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-500" />
                  Program Booking Revenue
                </CardTitle>
                <CardDescription>
                  List of traveler booking transactions and net revenue distribution into provider payout balance.
                </CardDescription>
              </div>

              {uniqueProviders.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Filter Provider:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="all">All Providers ({data.recent_purchases.length})</option>
                    {uniqueProviders.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                  <TableHeader className="bg-muted/15">
                    <TableRow>
                      <TableHead className="h-11 p-3 font-medium">Provider</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Tour Program</TableHead>
                      {/* <TableHead className="h-11 p-3 font-medium">Location & Experience</TableHead> */}
                      <TableHead className="h-11 p-3 font-medium">Booking Ref</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Gross Revenue</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Fee (5%)</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Net Payout (95%)</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Settlement Date</TableHead>
                      <TableHead className="h-11 p-3 font-medium text-center">Payout Status</TableHead>
                      <TableHead className="h-11 p-3 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.length > 0 ? (
                      filteredPurchases.map((pur) => (
                        <TableRow key={pur.id}>
                          <TableCell className="p-3 align-middle max-w-[200px]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPurchase(pur);
                                setIsPurchaseDrawerOpen(true);
                              }}
                              className="font-semibold text-xs text-foreground flex items-center gap-1.5 truncate text-left group hover:text-primary cursor-pointer focus:outline-hidden"
                              title="Click to view payout revenue detail"
                            >
                              <Building2 className="size-3.5 text-primary shrink-0" />
                              <span className="truncate group-hover:underline">{pur.provider_name || "AELI Certified Provider"}</span>
                            </button>
                          </TableCell>
                          <TableCell className="p-3 align-middle max-w-[220px]">
                            <div className="font-medium text-xs text-foreground truncate">{pur.program_name}</div>
                          </TableCell>
                          {/* <TableCell className="p-3 align-middle max-w-[180px]">
                            <div className="text-xs font-medium text-foreground flex items-center gap-1 truncate">
                              <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{pur.location_name || "Indonesia"}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Compass className="size-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{pur.experience_name || "Scenic Experience"}</span>
                            </div>
                          </TableCell> */}
                          <TableCell className="p-3 align-middle font-mono text-xs font-semibold text-muted-foreground">
                            {pur.booking_code}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs font-medium text-foreground">
                            {formatIDR(pur.gross_amount)}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs text-rose-600 dark:text-rose-400">
                            -{formatIDR(pur.platform_fee)}
                          </TableCell>
                          <TableCell className="p-3 align-middle font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            +{formatIDR(pur.net_payout)}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(pur.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-center">
                            <Badge
                              variant="outline"
                              className={
                                pur.status === "cleared"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px]"
                              }
                            >
                              {pur.status === "cleared" ? "Available" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="View Revenue Detail"
                              onClick={() => {
                                setSelectedPurchase(pur);
                                setIsPurchaseDrawerOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-sm">
                          No tour program booking transactions recorded for this provider.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Payout Disbursements */}
        <TabsContent value="disbursements" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Bank Disbursement History
              </CardTitle>
              <CardDescription>
                Historical transfer records settled automatically or manually to your registered bank account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                  <TableHeader className="bg-muted/15">
                    <TableRow>
                      <TableHead className="h-11 p-3 font-medium">Reference Code</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Destination Bank Account</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Payout Type</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Disbursed Amount</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Transfer Fee</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Settlement Time</TableHead>
                      <TableHead className="h-11 p-3 font-medium">Status</TableHead>
                      <TableHead className="h-11 p-3 font-medium text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payout_history.length > 0 ? (
                      data.payout_history.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="p-3 align-middle font-mono font-medium text-xs">
                            {po.reference_code}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs">
                            <div className="font-medium">{po.bank_name}</div>
                            <div className="font-mono text-muted-foreground text-[11px]">
                              {po.account_number} (a.n {po.account_holder})
                            </div>
                          </TableCell>
                          <TableCell className="p-3 align-middle">
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {po.type === "automatic" ? "Automatic" : "Instant"}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 align-middle font-bold text-xs text-foreground">
                            {formatIDR(po.amount)}
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs text-emerald-600 dark:text-emerald-400">
                            Rp 0 (Free)
                          </TableCell>
                          <TableCell className="p-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(po.processed_at).toLocaleString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="p-3 align-middle">
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] capitalize"
                            >
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => printReceipt(po)}
                            >
                              <Download className="size-3.5" />
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                          No payout disbursement records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Add Bank Account */}
      <Dialog open={isAddBankOpen} onOpenChange={setIsAddBankOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payout Bank Account</DialogTitle>
            <DialogDescription>
              Enter Indonesian local bank details to receive automated tour program revenue disbursements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBank} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="bank-select">Select Bank</Label>
              <select
                id="bank-select"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</option>
                <option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
                <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                <option value="Bank Permata">Bank Permata</option>
                <option value="Bank Jago">Bank Jago</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-num">Account Number</Label>
              <Input
                id="acc-num"
                type="text"
                placeholder="e.g. 8830192841"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Account Holder Name (As in bank book)</Label>
              <Input
                id="acc-name"
                type="text"
                placeholder="e.g. PT INDEX AELI / JOHN DOE"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-branch">Branch Office (Optional)</Label>
              <Input
                id="acc-branch"
                type="text"
                placeholder="e.g. Thamrin Branch Jakarta"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddBankOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingBank}>
                {isAddingBank ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Bank Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Instant Withdraw */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instant Payout Withdrawal</DialogTitle>
            <DialogDescription>
              Funds will be transferred immediately to your primary bank account without waiting for the automatic schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5">
              <div className="text-xs text-muted-foreground">Destination Account:</div>
              <div className="font-semibold text-sm">
                {primaryBank ? `${primaryBank.bank_name} - ${primaryBank.account_number}` : "No bank account registered"}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                a.n {primaryBank?.account_holder}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="wd-amount">Withdrawal Amount (Rp)</Label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(data.available_balance.toString())}
                  className="text-xs text-primary hover:underline"
                >
                  Withdraw Full Balance
                </button>
              </div>
              <Input
                id="wd-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={data.available_balance}
              />
              <p className="text-[11px] text-muted-foreground">
                Current available balance: <strong>{formatIDR(data.available_balance)}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstantWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Simulate Tour Purchase */}
      <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              Simulate Tour Program Purchase
            </DialogTitle>
            <DialogDescription>
              Test how booking revenue from travelers flows into your Payout balance and triggers automatic bank disbursement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSimulatePurchase} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tour Program Name</Label>
              <select
                value={simProgramName}
                onChange={(e) => setSimProgramName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Komodo Dragons Expeditions & Padar Sunrise">Komodo Dragons Expeditions & Padar Sunrise</option>
                <option value="Raja Ampat Coral Triangle Liveaboard">Raja Ampat Coral Triangle Liveaboard</option>
                <option value="Bromo Midnight Milky Way & Jeep Safari">Bromo Midnight Milky Way & Jeep Safari</option>
                <option value="Ubud Rainforest Culinary & Yoga Retreat">Ubud Rainforest Culinary & Yoga Retreat</option>
                <option value="Derawan Archipelago Sea Turtle Conservation">Derawan Archipelago Sea Turtle Conservation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Traveler Name</Label>
                <Input
                  value={simCustomerName}
                  onChange={(e) => setSimCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pax Count</Label>
                <Input
                  type="number"
                  value={simPax}
                  onChange={(e) => setSimPax(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Package Gross Price (Rp)</Label>
                <Input
                  type="number"
                  value={simGrossAmount}
                  onChange={(e) => setSimGrossAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <select
                  value={simPaymentMethod}
                  onChange={(e) => setSimPaymentMethod(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="BCA Virtual Account">BCA Virtual Account</option>
                  <option value="Mandiri VA">Mandiri VA</option>
                  <option value="Credit Card (Visa/Mastercard)">Credit Card</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Gross Total:</span>
                <span className="font-medium text-foreground">{formatIDR(parseFloat(simGrossAmount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (5%):</span>
                <span className="text-destructive">-{formatIDR(Math.round((parseFloat(simGrossAmount) || 0) * 0.05))}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Net Earnings to Payout:</span>
                <span>+{formatIDR((parseFloat(simGrossAmount) || 0) * 0.95)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSimulateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSimulating} className="gap-1.5">
                {isSimulating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Execute Simulated Purchase
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Program Booking Revenue Detail Drawer */}
      <Drawer direction="right" open={isPurchaseDrawerOpen} onOpenChange={setIsPurchaseDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedPurchase && (() => {
            const isCleared = selectedPurchase.status === "cleared";
            const copyBooking = () => {
              navigator.clipboard.writeText(selectedPurchase.booking_code);
              toast.success("Booking reference copied");
            };

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                        isCleared
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${isCleared ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {isCleared ? "Payout available" : "In clearance"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(selectedPurchase.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedPurchase.provider_name || "AELI Certified Provider"}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>Booking reference {selectedPurchase.booking_code}</span>
                      </DrawerDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={copyBooking}
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </Button>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Program Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Program
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs shrink-0">Name</span>
                        <span className="font-medium text-foreground text-right text-xs">{selectedPurchase.program_name}</span>
                      </div>
                      {selectedPurchase.experience_name && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Experience</span>
                          <span className="text-foreground text-xs">{selectedPurchase.experience_name}</span>
                        </div>
                      )}
                      {selectedPurchase.location_name && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Location</span>
                          <span className="text-foreground text-xs">{selectedPurchase.location_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  {(selectedPurchase.customer_name || selectedPurchase.customer_email) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Customer
                      </h4>
                      <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                        {selectedPurchase.customer_name && (
                          <div className="flex items-center justify-between px-3.5 py-2.5">
                            <span className="text-muted-foreground text-xs">Name</span>
                            <span className="font-medium text-foreground text-xs">{selectedPurchase.customer_name}</span>
                          </div>
                        )}
                        {selectedPurchase.customer_email && (
                          <div className="flex items-center justify-between px-3.5 py-2.5">
                            <span className="text-muted-foreground text-xs">Email</span>
                            <span className="font-mono text-xs text-foreground">{selectedPurchase.customer_email}</span>
                          </div>
                        )}
                        {selectedPurchase.pax && (
                          <div className="flex items-center justify-between px-3.5 py-2.5">
                            <span className="text-muted-foreground text-xs">Party size</span>
                            <span className="text-xs font-medium text-foreground tabular-nums">
                              {selectedPurchase.pax} traveler{selectedPurchase.pax > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Revenue Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Settlement
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Payment method</span>
                        <span className="text-foreground text-xs">{selectedPurchase.payment_method || "Online Payment"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Gross revenue</span>
                        <span className="font-medium text-foreground tabular-nums text-xs">
                          {formatIDR(selectedPurchase.gross_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Platform fee (5%)</span>
                        <span className="text-muted-foreground tabular-nums text-xs">
                          -{formatIDR(selectedPurchase.platform_fee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/20">
                        <span className="font-medium text-foreground text-xs">Net provider payout</span>
                        <span className="font-semibold text-foreground tabular-nums text-xs">
                          +{formatIDR(selectedPurchase.net_payout)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full h-9 text-xs">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
