import { PricingTable } from "@clerk/react";
import { motion } from 'motion/react';

export default function PricingScreen() {
    return (
        <motion.div
            style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
            <PricingTable />
        </motion.div>
    )
}