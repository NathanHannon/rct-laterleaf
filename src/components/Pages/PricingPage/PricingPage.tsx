import { PricingTable } from "@clerk/react";
import { motion } from 'motion/react';

export default function PricingScreen() {
    const billingReturnUrl = `${window.location.origin}/billing/return?source=checkout`;

    return (
        <motion.div
            className="pricing-page-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
            <header className="plan-page-header">
                <p className="page-eyebrow">A little more room</p>
                <h1>Make room for good reads.</h1>
                <p>Choose the plan that fits the way you save, read, and explore.</p>
            </header>
            <PricingTable newSubscriptionRedirectUrl={billingReturnUrl} />
        </motion.div>
    )
}
