import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem } from '@fortawesome/free-solid-svg-icons';
import './UpgradeButton.scss';

const UpgradeButton: React.FC = () => {
    const { openUserProfile } = useClerk();

    const handleUpgrade = () => {
        // This opens the Clerk User Profile component, which has a "Manage Account"
        // section that can link to your billing portal (configured in Clerk dashboard).
        // For a direct link, you would use window.location.href = 'YOUR_CLERK_BILLING_URL';
        openUserProfile();
    };

    return (
        <button className="upgrade-button" onClick={handleUpgrade}>
            <FontAwesomeIcon icon={faGem} />
            <span>Upgrade to Pro</span>
        </button>
    );
};

export default UpgradeButton;