import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Current Plan</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={loading}
            title="Refresh"
          >
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
                Update payment method, view invoices, or cancel your plan via
                Stripe's secure portal.
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
    </div>
  );
};

export default BillingSettings;
