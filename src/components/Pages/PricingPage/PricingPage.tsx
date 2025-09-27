import { PricingTable } from '@clerk/clerk-react'

export default function PricingScreen() {
//     const freePlanFeatures = [
//     "Save unlimited articles",
//     "15 standard summaries / month",
//     "3 Pro summaries / month",
//     "Basic keyword search"
// ];

// const proPlanFeatures = [
//     "Everything in Free, plus:",
//     "<strong>Unlimited</strong> Pro summaries",
//     "Full-text semantic search",
//     "Personalized AI Summaries",
//     "<em>(Coming Soon)</em> Chat with your articles",
//     "<em>(Coming Soon)</em> Offline mode"
// ];
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
            <PricingTable />
        </div>
    )
}