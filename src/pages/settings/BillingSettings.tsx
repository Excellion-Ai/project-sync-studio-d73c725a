import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ExternalLink, RefreshCw, Link2, CheckCircle2, Loader2 } from "lucide-react";

function statusBadge(status: string | null, cancelAtPeriodEnd: boolean) {
  if (!status) return <Badge variant="secondary">No plan</Badge>;
  if (cancelAtPeriodEnd) return <Badge variant="destructive">Canceling</Badge>;
  switch (status) {
    case "active":
      return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
    case "trialing":
      return <Badge className="bg-blue-600 hover:bg-blue-700">Trial</Badge>;
    case "past_due":
      return <Badge variant="destructive">Past due</Badge>;
    case "canceled":
      return <Badge variant="secondary">Canceled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const BillingSettings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    subscribed,
    status,
    priceId,
    subscriptionEnd,
    cancelAtPeriodEnd,
    loading,
    refresh,
    openPortal,
  } = useSubscription();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);

  // Stripe Connect state
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_connected" | "pending" | "active">("loading");
  const [connectLoading, setConnectLoading] = useState(false);

  // Load connect status
  useEffect(() => {
    if (!user) return;
    const loadConnectStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("stripe_account_id, stripe_onboarding_complete, stripe_account_status")
        .eq("id", user.id)
        .single();

      if (!data?.stripe_account_id) {
        setConnectStatus("not_connected");
      } else if (data.stripe_onboarding_complete) {
        setConnectStatus("active");
      } else {
        setConnectStatus("pending");
      }
    };
    loadConnectStatus();
  }, [user]);

  // Handle return from Stripe Connect onboarding
  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (connectParam === "complete" && user) {
      const verifyConnect = async () => {
        setConnectLoading(true);
        const { data, error } = await supabase.functions.invoke("connect-account-callback");
        setConnectLoading(false);
        if (data?.connected) {
          setConnectStatus("active");
          toast({ title: "Stripe Connected!", description: "You can now receive payments for your courses." });
        } else if (data?.charges_enabled === false) {
          setConnectStatus("pending");
          toast({ title: "Almost there", description: "Stripe needs more info. Try connecting again.", variant: "destructive" });
        } else if (error || data?.error) {
          toast({ title: "Connection failed", description: data?.error || error?.message, variant: "destructive" });
        }
      };
      verifyConnect();
    }
  }, [searchParams, user, toast]);

  const getPlanLabel = () => {
    if (!priceId) return "Excellion Plan";
    if (priceId === "price_1T1YjxPCTHzXvqDg3Plq3gtT") return "Annual";
    if (priceId === "price_1TF4uLPCTHzXvqDgXzsHLUoV") return "Pro (Waitlist)";
    return "Pro";
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openPortal();
    } catch (err: unknown) {
      toast({
        title: "Could not open billing portal",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");
      if (error || data?.error) {
        toast({ title: "Failed to start Stripe Connect", description: data?.error || error?.message, variant: "destructive" });
        setConnectLoading(false);
        return;
      }
      if (data?.already_connected) {
        setConnectStatus("active");
        toast({ title: "Already connected", description: "Your Stripe account is active." });
        setConnectLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setConnectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Platform Subscription */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Current Plan</CardTitle>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : subscribed || status ? (
            <>
              <div className="flex items-center gap-3">
                {statusBadge(status, cancelAtPeriodEnd)}
                <span className="font-medium">{getPlanLabel()}</span>
              </div>
              {subscriptionEnd && (
                <p className="text-sm text-muted-foreground">
                  {cancelAtPeriodEnd
                    ? `Access until ${new Date(subscriptionEnd).toLocaleDateString()}`
                    : `Renews ${new Date(subscriptionEnd).toLocaleDateString()}`}
                </p>
              )}
              <Separator />
              <Button onClick={handleOpenPortal} disabled={portalLoading}>
                <CreditCard className="h-4 w-4 mr-2" />
                {portalLoading ? "Opening…" : "Manage Subscription"}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Update payment method, view invoices, or cancel your plan via Stripe's secure portal.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You don't have an active subscription yet.
              </p>
              <Button variant="default" asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stripe Connect for Course Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Course Payments</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments when students buy your courses. Excellion takes a 2% platform fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectStatus === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : connectStatus === "active" ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Stripe Connected</span>
            </div>
          ) : connectStatus === "pending" ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Pending</Badge>
                <span className="text-sm text-muted-foreground">Onboarding incomplete</span>
              </div>
              <Button onClick={handleConnectStripe} disabled={connectLoading} variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                {connectLoading ? "Redirecting…" : "Complete Stripe Setup"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Not connected yet. Connect Stripe to start selling courses.
              </p>
              <Button onClick={handleConnectStripe} disabled={connectLoading}>
                <Link2 className="h-4 w-4 mr-2" />
                {connectLoading ? "Redirecting…" : "Connect Stripe Account"}
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            When a student purchases your course, Stripe processes the payment. 98% goes to you, 2% to Excellion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSettings;
