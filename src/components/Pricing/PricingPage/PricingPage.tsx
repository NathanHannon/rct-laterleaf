import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import './PricingPage.scss'; // Assuming you have styles for this page

// --- Font Awesome Icons ---
// Make sure you have @fortawesome/react-fontawesome and the necessary icon packs installed
// npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faStar } from '@fortawesome/free-solid-svg-icons';


// --- Dynamic Feature Lists ---
// You can easily manage your features here without touching the JSX.
const freePlanFeatures = [
    "Save unlimited articles",
    "15 standard summaries / month",
    "3 Pro summaries / month",
    "Basic keyword search"
];

const proPlanFeatures = [
    "Everything in Free, plus:",
    "<strong>Unlimited</strong> Pro summaries",
    "Full-text semantic search",
    "Personalized AI Summaries",
    "<em>(Coming Soon)</em> Chat with your articles",
    "<em>(Coming Soon)</em> Offline mode"
];


const PricingPage: React.FC = () => {
    const { isSignedIn } = useUser();

    // This function handles the redirect to Clerk's billing portal.
    const handleUpgradeClick = async () => {
        try {
            // Replace with your actual billing URL or Clerk's recommended billing flow.
            window.location.href = '/billing'; // Update this path as needed for your billing page
        } catch (error) {
            console.error("Error redirecting to billing:", error);
        }
    };

    return (
        <div className="pricing-page-container">
            <header className="pricing-header">
                <h1>Choose the Plan That's Right for You</h1>
                <p>Start for free, and upgrade to Pro to unlock unlimited powerful features. Cancel anytime.</p>
            </header>

            <main className="pricing-cards-wrapper">
                {/* Free Plan Card */}
                <div className="pricing-card">
                    <h2>Free</h2>
                    <p className="price-tag">
                        <span className="price-amount">$0</span>/ month
                    </p>
                    <p className="card-description">Perfect for getting started and casual reading.</p>
                    <ul className="features-list">
                        {freePlanFeatures.map((feature, index) => (
                            <li key={index}>
                                <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/sign-up" className="pricing-button secondary">
                        Get Started
                    </Link>
                </div>

                {/* Pro Plan Card */}
                <div className="pricing-card pro">
                    <div className="pro-badge">
                        <FontAwesomeIcon icon={faStar} />
                        <span>Most Popular</span>
                    </div>
                    <h2>Pro</h2>
                    <p className="price-tag">
                        <span className="price-amount">$9</span>/ month
                    </p>
                    <p className="card-description">For power users, researchers, and lifelong learners.</p>
                    <ul className="features-list">
                        {proPlanFeatures.map((feature, index) => (
                            <li key={index}>
                                <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                {/* Use dangerouslySetInnerHTML to render bold/italic tags */}
                                <span dangerouslySetInnerHTML={{ __html: feature }} />
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleUpgradeClick} className="pricing-button primary">
                        {isSignedIn ? 'Upgrade to Pro' : 'Sign Up for Pro'}
                    </button>
                </div>
            </main>

            <footer className="pricing-footer">
                <p>
                    By purchasing a subscription, you agree to our{' '}
                    <Link to="/terms">Terms of Service</Link> and{' '}
                    <Link to="/privacy">Privacy Policy</Link>.
                </p>
            </footer>
        </div>
    );
};

export default PricingPage;
