import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem } from '@fortawesome/free-solid-svg-icons';
import './UpgradeButton.scss';
import { useNavigate } from 'react-router-dom';

const UpgradeButton: React.FC = () => {
    const { isSignedIn, isLoaded } = useUser();
    const navigate = useNavigate();

    const handleUpgrade = () => {
        // This logic is now much simpler.
        // The PricingPage will handle the redirect to the sign-up page or the paywall.
        console.log('🚀 Upgrade button clicked, navigating to pricing page...');
        navigate('/pricing');
    };

    // If Clerk hasn't loaded yet, show a generic disabled state.
    if (!isLoaded) {
        return (
            <button className="upgrade-button" disabled>
                <FontAwesomeIcon icon={faGem} />
                <span>Loading...</span>
            </button>
        );
    }

    return (
        <button
            className="upgrade-button"
            onClick={handleUpgrade}
        // The button is always active now; the pricing page handles the auth check.
        >
            <FontAwesomeIcon icon={faGem} />
            <span>{isSignedIn ? 'Upgrade to Pro' : 'View Plans'}</span>
        </button>
    );
};

export default UpgradeButton;