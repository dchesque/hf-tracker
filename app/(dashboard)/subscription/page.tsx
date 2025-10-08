'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Perfect for getting started',
    icon: Star,
    features: [
      'Up to 3 active positions',
      'Basic funding rate tracking',
      'Email notifications',
      'Community support',
    ],
    limitations: [
      'Limited historical data (7 days)',
      'No advanced analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    description: 'For serious traders',
    icon: Zap,
    popular: true,
    features: [
      'Unlimited active positions',
      'Real-time funding rate alerts',
      'Advanced analytics & charts',
      'Full historical data',
      'Priority email support',
      'API access',
      'Custom alert thresholds',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    description: 'For professional teams',
    icon: Crown,
    features: [
      'Everything in Pro',
      'Multi-user accounts',
      'White-label options',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'Advanced API features',
      'SLA guarantee',
    ],
  },
];

export default function SubscriptionPage() {
  const [currentPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = (planId: string) => {
    toast.success(`Upgrading to ${planId} plan...`, {
      description: 'You will be redirected to checkout',
    });
  };

  const handleManageBilling = () => {
    toast.info('Opening billing portal...');
  };

  return (
    <div className="relative min-h-screen">
      {/* Abstract blur backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">My</span>
              <span className="text-yellow-500"> Subscription</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Manage your plan and billing information
            </p>
          </div>
        </div>

        {/* Current Plan */}
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Current Plan
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {currentPlan.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-2">
                  You are currently on the Free plan
                </CardDescription>
              </div>
              <Button
                onClick={handleManageBilling}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30"
              >
                <CreditCard size={18} className="mr-2" />
                Manage Billing
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Billing Cycle</p>
                  <p className="text-white font-semibold">-</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Next Payment</p>
                  <p className="text-white font-semibold">-</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Status</p>
                  <p className="text-white font-semibold">Active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 p-1 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-400">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const displayPrice = billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price;

            return (
              <Card
                key={plan.id}
                className={`backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300 relative ${
                  plan.popular ? 'ring-2 ring-yellow-500/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-black border-none">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      plan.id === 'free' ? 'bg-blue-500/10' :
                      plan.id === 'pro' ? 'bg-yellow-500/10' :
                      'bg-purple-500/10'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plan.id === 'free' ? 'text-blue-400' :
                        plan.id === 'pro' ? 'text-yellow-400' :
                        'text-purple-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-zinc-400">
                        {plan.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${displayPrice}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-zinc-400">/{billingCycle === 'yearly' ? 'year' : plan.interval}</span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        Save ${(plan.price - displayPrice) * 12}/year
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, index) => (
                      <li key={`limit-${index}`} className="flex items-start gap-3 opacity-50">
                        <AlertCircle size={18} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
