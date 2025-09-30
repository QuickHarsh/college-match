/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function useWallet(userId?: string) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<Array<{ id: string; amount: number; transaction_type: string; description: string | null; created_at: string }>>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const sb: any = supabase as any;
      const { data: coin } = await sb
        .from('user_coins')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      setBalance(coin?.balance || 0);

      const { data: transactions } = await sb
        .from('coin_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);
      setTx((transactions || []) as any);
    } catch (e) {
      // soft fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { balance, loading, tx, reload: load };
}

async function loadRazorpay(): Promise<boolean> {
  if (document.getElementById('razorpay-sdk')) return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.id = 'razorpay-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Wallet() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { balance, tx, reload } = useWallet(user?.id);
  const keyId = useMemo(() => (import.meta as any).env?.VITE_RAZORPAY_KEY_ID as string | undefined, []);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const buyWithRazorpay = async (amountCoins: number) => {
    if (!user) return;
    if (!keyId) {
      toast({ title: 'Payment key missing', description: 'Set VITE_RAZORPAY_KEY_ID to enable payments.', variant: 'destructive' });
      return;
    }
    const ok = await loadRazorpay();
    if (!ok) {
      toast({ title: 'Payment unavailable', description: 'Could not load Razorpay SDK', variant: 'destructive' });
      return;
    }
    const amountPaise = amountCoins * 100; // 1 coin = ₹1 (example). Adjust pricing as needed.
    const options: any = {
      key: keyId,
      amount: amountPaise,
      currency: 'INR',
      name: 'CollegeMatch',
      description: `${amountCoins} coins`,
      handler: async (response: any) => {
        try {
          // In production, verify on server then credit. Here we credit directly for demo.
          await (supabase as any).rpc('credit_coins', { p_user_id: user.id, p_amount: amountCoins, p_desc: `RZP ${response.razorpay_payment_id}` });
          toast({ title: 'Payment successful', description: `Credited ${amountCoins} coins.` });
          reload();
        } catch (e) {
          toast({ title: 'Credit failed', description: e instanceof Error ? e.message : 'Try contacting support', variant: 'destructive' });
        }
      },
      prefill: { name: '', email: user.email || '' },
      theme: { color: '#7c3aed' },
    };
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      toast({ title: 'Payment unavailable', description: 'Razorpay SDK not loaded', variant: 'destructive' });
    }
  };

  const packages = [
    { coins: 50, label: 'Starter', priceINR: 50 },
    { coins: 120, label: 'Value', priceINR: 100 },
    { coins: 300, label: 'Pro', priceINR: 240 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <div className="text-sm text-muted-foreground">Available coins: <span className="text-foreground font-semibold">{balance}</span></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add coins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {packages.map((p) => (
                <div key={p.coins} className="border rounded-md p-3">
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm text-muted-foreground mb-2">{p.coins} coins</div>
                  <div className="text-sm mb-2">₹{p.priceINR}</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => buyWithRazorpay(p.coins)}>Buy</Button>
                  </div>
                </div>
              ))}
            </div>
            {!keyId && (
              <div className="text-xs text-muted-foreground mt-3">Note: Set VITE_RAZORPAY_KEY_ID to enable the Buy flow.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {tx.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {tx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <div className="font-medium">{t.transaction_type}</div>
                      <div className="text-xs text-muted-foreground">{t.description || '—'}</div>
                    </div>
                    <div className={t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>{t.amount >= 0 ? "+" : ""}{t.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
