import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CreditCard, Check, Loader2, Clock, Calendar, AlertTriangle, Crown, Zap, Infinity } from 'lucide-react';

const PLAN_ICONS  = { free: '🎁', starter: '🚀', business: '💼', enterprise: '🏢' };
const PLAN_COLORS = { free: '#22c55e', starter: '#6366f1', business: '#8b5cf6', enterprise: '#f59e0b' };

function getBaseSlug(slug) {
  return slug.replace('-annual', '');
}

function PlanCard({ plan, currentPlanId, onSelect, loading }) {
  const isCurrent = plan._id === currentPlanId;
  const baseSlug = getBaseSlug(plan.slug);
  const color = PLAN_COLORS[baseSlug] || '#6366f1';
  const isPopular = baseSlug === 'business';
  const isAnnual = plan.billingCycle === 'annual';
  const savings = isAnnual && plan.originalPrice ? plan.originalPrice - plan.price : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl p-6 flex flex-col h-full"
      style={{
        background: isCurrent ? `${color}08` : 'rgba(15,15,35,0.85)',
        border: `1px solid ${isCurrent ? color + '50' : isPopular ? color + '30' : 'rgba(99,102,241,0.12)'}`,
        boxShadow: isCurrent ? `0 0 30px ${color}15` : isPopular ? `0 0 20px ${color}10` : 'none',
      }}
    >
      {/* Most Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          ⭐ Most Popular
        </div>
      )}

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${color}20`, color }}>
          <Check size={10} /> Current
        </div>
      )}

      {/* Savings badge for annual */}
      {isAnnual && savings > 0 && !isCurrent && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
          Save ₹{savings.toLocaleString('en-IN')}
        </div>
      )}

      {/* Plan icon & name */}
      <div className="mb-4 mt-1">
        <span className="text-3xl">{PLAN_ICONS[baseSlug] || '📦'}</span>
        <h3 className="text-lg font-bold text-white font-display mt-2">{plan.name}</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        {plan.price === 0 ? (
          <div className="text-3xl font-black text-white">Free</div>
        ) : (
          <div>
            {isAnnual && plan.originalPrice && (
              <p className="text-sm text-[var(--text-secondary)] line-through mb-0.5">
                ₹{plan.originalPrice.toLocaleString('en-IN')}
              </p>
            )}
            <div className="flex items-end gap-1">
              <span className="text-sm text-[var(--text-secondary)] mb-1">₹</span>
              <span className="text-4xl font-black text-white">{plan.price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-[var(--text-secondary)] mb-1">
                /{isAnnual ? 'yr' : 'mo'}
              </span>
            </div>
            {isAnnual && (
              <p className="text-xs mt-1" style={{ color: '#4ade80' }}>
                ≈ ₹{Math.round(plan.price / 12).toLocaleString('en-IN')}/mo · 10% off
              </p>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1 mb-5">
        {plan.features?.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}>
              <Check size={10} style={{ color }} />
            </div>
            <span className={`${f.includes('Discount') || f.includes('Onboarding') ? 'font-semibold' : ''} text-[var(--text-secondary)]`}>
              {f}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}20` }}>
            {plan.branchLimit === -1
              ? <Infinity size={8} style={{ color }} />
              : <Check size={10} style={{ color }} />}
          </div>
          <span className="text-[var(--text-secondary)]">
            {plan.branchLimit === -1 ? 'Unlimited Branches' : `${plan.branchLimit} Branch${plan.branchLimit !== 1 ? 'es' : ''}`}
          </span>
        </li>
      </ul>

      {/* CTA button */}
      <button
        onClick={() => !isCurrent && plan.price > 0 && onSelect(plan)}
        disabled={loading || isCurrent || plan.price === 0}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
          isCurrent ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
        }`}
        style={{
          background: plan.price === 0
            ? 'rgba(99,102,241,0.1)'
            : `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: plan.price === 0 && !isCurrent ? color : 'white',
          border: plan.price === 0 ? `1px solid ${color}30` : 'none',
          boxShadow: plan.price > 0 ? `0 4px 15px ${color}30` : 'none',
        }}
      >
        {loading
          ? <Loader2 size={16} className="animate-spin mx-auto" />
          : isCurrent ? 'Current Plan'
          : plan.price === 0 ? 'Free Plan'
          : isAnnual ? '🎉 Get Annual Deal →'
          : 'Upgrade Now →'}
      </button>
    </motion.div>
  );
}

export default function SubscriptionPage() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [allPlans, setAllPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  useEffect(() => {
    Promise.all([
      api.get('/plans'),
      api.get('/subscription/status'),
    ]).then(([plansRes, subRes]) => {
      setAllPlans(plansRes.data.plans);
      setSubscription(subRes.data.subscription);
    }).catch(() => toast.error('Failed to load subscription data'))
    .finally(() => setLoading(false));
  }, []);

  // Filter plans by selected billing cycle (keep Free always in monthly)
  const visiblePlans = allPlans.filter(p => {
    if (p.isFreePlan) return billingCycle === 'monthly';
    return (p.billingCycle || 'monthly') === billingCycle;
  });

  const CYCLE_META = {
    monthly:     { label: 'Monthly',  discount: null,   color: null },
    quarterly:   { label: '3 Months', discount: '3%',   color: '#06b6d4' },
    'semi-annual': { label: '6 Months', discount: '5%', color: '#8b5cf6' },
    annual:      { label: 'Annual',   discount: '10%',  color: '#22c55e' },
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan._id);
    const orgName = user?.organization?.name || user?.name || 'Organization';
    navigate('/dashboard/payment', {
      state: {
        planId: plan._id,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: plan.currency || 'INR',
        planDurationDays: plan.durationDays,
        orgName,
      },
    });
  };

  const daysLeft   = subscription?.daysLeft || 0;
  const isExpired  = !subscription?.isActive;
  const expiryDate = subscription?.subscriptionExpiry
    ? new Date(subscription.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-[#6366f1]" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Subscription</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage your plan and billing</p>
      </div>

      {/* Current Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{
          background: isExpired ? 'rgba(239,68,68,0.05)' : daysLeft <= 7 ? 'rgba(245,158,11,0.05)' : 'rgba(34,197,94,0.05)',
          border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : daysLeft <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}>
              {isExpired ? <AlertTriangle size={24} className="text-red-400" /> : <Crown size={24} className="text-green-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white">{subscription?.currentPlan?.name || 'Free'} Plan</h3>
                <span className={`badge text-xs ${isExpired ? 'badge-cancelled' : daysLeft <= 7 ? 'badge-follow_up' : 'badge-completed'}`}>
                  {isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                {expiryDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {isExpired ? 'Expired' : 'Expires'} {expiryDate}
                  </span>
                )}
                {!isExpired && daysLeft > 0 && (
                  <span className="flex items-center gap-1.5" style={{ color: daysLeft <= 7 ? '#fbbf24' : '#4ade80' }}>
                    <Clock size={13} />
                    {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-secondary)]">Branch Limit</p>
            <p className="text-2xl font-bold text-white">
              {subscription?.currentPlan?.branchLimit === -1 ? '∞' : subscription?.currentPlan?.branchLimit || 1}
            </p>
          </div>
        </div>

        {daysLeft <= 7 && !isExpired && (
          <div className="mt-4 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
            <AlertTriangle size={14} />
            Your subscription expires soon. Renew now to avoid service interruption.
          </div>
        )}
        {isExpired && (
          <div className="mt-4 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <AlertTriangle size={14} />
            Your subscription has expired. Please select a plan to restore access.
          </div>
        )}
      </motion.div>

      {/* Plans Section */}
      <div>
        {/* Section header + Billing Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-white font-display">Available Plans</h2>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center p-1 rounded-xl gap-1"
              style={{ background: 'rgba(15,15,35,0.9)', border: '1px solid rgba(99,102,241,0.15)' }}>
              {['monthly', 'quarterly', 'semi-annual', 'annual'].map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap relative"
                  style={billingCycle === cycle
                    ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  {CYCLE_META[cycle].label}
                  {CYCLE_META[cycle].discount && (
                    <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1 rounded-full"
                      style={{ background: CYCLE_META[cycle].color, color: 'white' }}>
                      -{CYCLE_META[cycle].discount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Discount pill */}
            <AnimatePresence>
              {billingCycle !== 'monthly' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: `${CYCLE_META[billingCycle].color}22`,
                    color: CYCLE_META[billingCycle].color,
                    border: `1px solid ${CYCLE_META[billingCycle].color}44`
                  }}
                >
                  <Zap size={11} />
                  Save {CYCLE_META[billingCycle].discount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Discount banner */}
        <AnimatePresence>
          {billingCycle !== 'monthly' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: `${CYCLE_META[billingCycle].color}10`,
                  border: `1px solid ${CYCLE_META[billingCycle].color}35`
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${CYCLE_META[billingCycle].color}20` }}>
                  <Zap size={16} style={{ color: CYCLE_META[billingCycle].color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {CYCLE_META[billingCycle].label} Billing — {CYCLE_META[billingCycle].discount} Discount Applied
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {billingCycle === 'quarterly' && 'Pay once for 90 days and save 3% compared to monthly billing.'}
                    {billingCycle === 'semi-annual' && 'Pay once for 180 days and save 5% compared to monthly billing.'}
                    {billingCycle === 'annual' && 'Pay once for 365 days and save 10% compared to monthly billing.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Cards */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {visiblePlans.map((plan, i) => (
              <motion.div
                key={plan._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.06 }}
              >
                <PlanCard
                  plan={plan}
                  currentPlanId={subscription?.currentPlan?._id}
                  onSelect={handleSelectPlan}
                  loading={selectedPlanId === plan._id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No plans hint */}
          {billingCycle !== 'monthly' && visiblePlans.length === 0 && (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <p className="text-lg mb-1">Plans not yet available for this cycle</p>
              <p className="text-sm">Run the seeder to add these plans to the database.</p>
              <code className="block mt-3 text-xs bg-white/5 rounded-lg px-4 py-2 w-fit mx-auto font-mono">
                node backend/utils/seedMultiCyclePlans.js
              </code>
            </div>
          )}
      </div>

      {/* Billing History */}
      {subscription?.history?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white font-display mb-4">Billing History</h2>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
            {subscription.history.map((sub, i) => (
              <div key={sub._id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/3"
                style={{ borderBottom: i < subscription.history.length - 1 ? '1px solid rgba(99,102,241,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <CreditCard size={16} className="text-[#6366f1]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{sub.plan?.name || 'Plan'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${sub.status === 'active' ? 'badge-completed' : 'badge-cancelled'}`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
