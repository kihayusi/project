import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Smartphone, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatusBadge } from "@/components/GCashPayment";

const GCASH_BLUE = "#007DFE";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  gcash_number: string | null;
  status: string;
  created_at: string;
  notes: string | null;
  request_id: string | null;
}

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not fetch payments:", error);
      }
      setPayments((data as unknown as Payment[]) || []);
      setLoading(false);
    };

    fetchPayments();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-civic-gray-dark flex items-center gap-2">
              <Smartphone className="h-6 w-6" style={{ color: GCASH_BLUE }} />
              Payment History
            </h1>
            <p className="text-sm text-muted-foreground">Track all your GCash payments</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No payments yet.</p>
              <p className="text-sm mt-1">Payments will appear here after you submit a service request with GCash.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg" style={{ color: GCASH_BLUE }}>
                        ₱{Number(p.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ref: <span className="font-mono">{p.reference_number || "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">Admin note: {p.notes}</p>
                      )}
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PaymentHistory;
