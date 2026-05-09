import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  ShieldCheck, CreditCard, CheckCircle, Loader2,
  ArrowLeft, Calendar, Tag, Building2, Zap, Lock
} from 'lucide-react';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const state = location.state;
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if no plan data
  useEffect(() => {
    if (!state?.planId) {
      toast.error('No plan selected. Redirecting…');
      navigate('/dashboard/subscription', { replace: true });
    }
  }, [state]);

  if (!state?.planId) return null;

  const { planId, planName, planPrice, planCurrency, planDurationDays, orgName } = state;
  const displayOrgName = orgName || user?.organization?.name || user?.name || 'Your Organization';
  const gst = Math.round(planPrice * 0.18);
  const total = planPrice + gst;

  const handlePayNow = async () => {
    setProcessing(true);
    try {
      // 1. Create order
      const orderRes = await api.post('/subscription/order', { planId });
      const { order, key, transaction } = orderRes.data;

      // 2. Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        setProcessing(false);
        return;
      }

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'UEMS',
        description: `${planName} Plan — ${planDurationDays} Days`,
        order_id: order.id,
        prefill: {
          name: displayOrgName,
          email: user?.email || '',
        },
        notes: { planId, orgName: displayOrgName },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await api.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId: transaction,
              planId,
            });
            setSuccess(true);
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
              toast.success(`🎉 Subscription upgraded! Welcome to ${planName}.`, { duration: 6000 });
            }, 2000);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed. Contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
          >
            <CheckCircle size={48} className="text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-[var(--text-secondary)]">Redirecting to your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--surface-0)' }}>
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Plans
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 rounded-2xl p-6 space-y-5 self-start"
            style={{ background: 'rgba(15,15,35,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {/* Header */}
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Zap size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white font-display">Order Summary</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Review your plan details</p>
            </div>

            <div className="h-px" style={{ background: 'rgba(99,102,241,0.15)' }} />

            {/* Organization */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Building2 size={16} className="text-[#6366f1]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Organization</p>
                <p className="text-sm font-semibold text-white">{displayOrgName}</p>
              </div>
            </div>

            {/* Plan */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Tag size={16} className="text-[#6366f1]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Plan</p>
                <p className="text-sm font-semibold text-white">{planName}</p>
              </div>
            </div>

            {/* Validity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Calendar size={16} className="text-[#6366f1]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Validity</p>
                <p className="text-sm font-semibold text-white">{planDurationDays} Days</p>
              </div>
            </div>

            <div className="h-px" style={{ background: 'rgba(99,102,241,0.15)' }} />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Plan Price</span>
                <span className="text-white">₹{planPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">GST (18%)</span>
                <span className="text-white">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
              <div className="flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-xl" style={{ color: '#6366f1' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Payment Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-2xl p-8 flex flex-col justify-between"
            style={{ background: 'rgba(15,15,35,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <CreditCard size={20} className="text-[#6366f1]" />
                <h2 className="text-xl font-bold text-white font-display">Secure Payment</h2>
              </div>

              {/* Razorpay Info */}
              <div className="rounded-xl p-5 mb-6"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <p className="text-sm font-semibold text-white mb-2">Pay via Razorpay</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  You'll be redirected to Razorpay's secure checkout to complete your payment. We accept UPI, Net Banking, Credit/Debit Cards, and Wallets.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['UPI', 'Net Banking', 'Cards', 'Wallets'].map(m => (
                    <span key={m} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#a5bafd', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* What you get */}
              <div className="space-y-3 mb-6">
                {[
                  'Instant plan activation after payment',
                  'Receipt sent to your registered email',
                  'Cancel or upgrade anytime',
                ].map((point, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {/* Pay Button */}
              <button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                }}
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Opening Payment Gateway…
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay ₹{total.toLocaleString('en-IN')} via Razorpay
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[var(--text-secondary)]">
                <ShieldCheck size={14} className="text-green-400" />
                256-bit SSL Secured · Powered by Razorpay
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
