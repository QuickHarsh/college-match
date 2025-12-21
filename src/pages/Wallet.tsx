/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Coins, History, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TiltedCard from '@/reactbits/TiltedCard';
import StarBorder from '@/reactbits/StarBorder';
import ShinyText from '@/reactbits/ShinyText';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

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

  /* Custom amount state */
  const [customAmount, setCustomAmount] = useState<number | ''>(10);

  const buyWithRazorpay = async (amountCoins: number, priceINR?: number) => {
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

    // Use provided price or default to 1 Coin = ₹1
    const finalPriceINR = priceINR || amountCoins;
    const amountPaise = finalPriceINR * 100;

    const options: any = {
      key: keyId,
      amount: amountPaise,
      currency: 'INR',
      name: 'KeenQ',
      description: `${amountCoins} coins`,
      handler: async (response: any) => {
        try {
          // In production, verify on server then credit.
          // Note: The RPC might need to know the price paid for auditing, but here we just credit coins.
          await (supabase as any).rpc('credit_coins', { p_user_id: user.id, p_amount: amountCoins, p_desc: `RZP ${response.razorpay_payment_id} (₹${finalPriceINR})` });
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
    { coins: 60, label: 'Starter Deal', priceINR: 50, color: 'from-blue-500 to-cyan-500' },
    { coins: 120, label: 'Value Pack', priceINR: 100, color: 'from-purple-500 to-pink-500' },
    { coins: 300, label: 'Pro Bundle', priceINR: 240, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-4 md:px-8 md:pb-8">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">
              <ShinyText text="My Wallet" disabled={false} speed={3} className="inline-block" />
            </h1>
            <p className="text-muted-foreground">Manage your coins and transactions</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-card border rounded-2xl shadow-sm">
            <div className="p-2 bg-yellow-500/10 rounded-full">
              <Coins className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-2xl font-bold">{balance} <span className="text-sm font-normal text-muted-foreground">coins</span></div>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Top Up Coins</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((p, i) => (
              <motion.div
                key={p.coins}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-center"
              >
                <TiltedCard
                  imageSrc="https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=1000&auto=format&fit=crop"
                  altText={`${p.label} Package`}
                  captionText={`${p.coins} Coins`}
                  containerHeight="300px"
                  containerWidth="100%"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-br from-black/60 to-black/30 text-white h-full">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{p.label}</h3>
                        <p className="text-white/80 text-sm">Get {p.coins} coins</p>
                        {p.coins > p.priceINR && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-500 text-xs font-bold rounded-full">
                            {(100 * (p.coins - p.priceINR) / p.coins).toFixed(0)}% Extra
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-4">₹{p.priceINR}</div>
                        <StarBorder as="button" className="w-full cursor-pointer" color="white" speed="4s" onClick={() => buyWithRazorpay(p.coins, p.priceINR)}>
                          <span className="font-bold text-sm">Buy Now</span>
                        </StarBorder>
                      </div>
                    </div>
                  }
                />
              </motion.div>
            ))}
          </div>

          {/* Custom Amount Section */}
          <Card className="border-muted/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Buy Custom Amount</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:max-w-xs space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Coins (Min 10)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={10}
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!customAmount || Number(customAmount) < 10}
                  onClick={() => buyWithRazorpay(Number(customAmount))}
                >
                  Pay ₹{Number(customAmount) || 0}
                </Button>
              </div>
            </CardContent>
          </Card>

          {!keyId && (
            <div className="text-center text-xs text-muted-foreground mt-2">Note: Set VITE_RAZORPAY_KEY_ID to enable the Buy flow.</div>
          )}
        </section>

        <Card className="border-muted/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tx.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No transactions yet. Start by adding some coins!</div>
            ) : (
              <div className="space-y-3">
                {tx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.amount >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.amount >= 0 ? <Coins className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{t.transaction_type}</div>
                        <div className="text-xs text-muted-foreground">{t.description || '—'}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.amount >= 0 ? "+" : ""}{t.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
