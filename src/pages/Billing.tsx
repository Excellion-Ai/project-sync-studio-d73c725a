import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Zap, ArrowRight, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format } from "date-fns";

const Billing = () => {
  const navigate = useNavigate();
  const {
    subscribed,
    status,
    priceId,
    subscriptionEnd,
    cancelAtPeriodEnd,
    loading,
    openPortal,
    startCheckout,
  } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openPortal();
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout("monthly");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setCheckoutLoading(false);
    }
  };

  const getPlanLabel = () => {
    if (!subscribed) return "Free";
    if (priceId === "price_1T1YjxPCTHzXvqDg3Plq3gtT") return "Annual";
    if (priceId === "price_1TF4uLPCTHzXvqDgXzsHLUoV") return "Pro (Waitlist)";
    return "Pro";
  };

  const getStatusBadge = () => {
    if (!subscribed) return <Badge variant="outline">Free</Badge>;
    if (cancelAtPeriodEnd) return <Badge variant="destructive">Canceling</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/30">{status === "trialing" ? "Trial" : "Active"}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/secret-builder-hub")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-muted-foreground">Manage your subscription and payments.</p>
          </div>
        </div>
        <Separator className="mb-6" />

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Current Plan</CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription>
                {loading ? "Loading..." : subscribed ? `You're on the ${getPlanLabel()} plan.` : "You're on the free tier."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : subscribed ? (
                <>
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span>{getPlanLabel()}</span>
                  </div>
                  {subscriptionEnd && (
                    <div className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-muted-foreground">
                        {cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
                      </span>
                      <span>{format(new Date(subscriptionEnd), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  <Button onClick={handleOpenPortal} disabled={portalLoading} className="w-full gap-2 mt-2" variant="outline">
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <>
                  {[
                    { label: "Courses", value: "1 course included" },
                    { label: "Students", value: "Unlimited" },
                    { label: "AI generations", value: "5 per month" },
                    { label: "Custom domain", value: "Not available" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                  <Button onClick={handleUpgrade} disabled={checkoutLoading} className="w-full gap-2 mt-2">
                    {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Upgrade to Pro <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {subscribed && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Invoices & Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  View invoices, update your payment method, or cancel your subscription through the Stripe portal.
                </p>
                <Button onClick={handleOpenPortal} disabled={portalLoading} variant="outline" size="sm">
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Open Billing Portal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Billing;
