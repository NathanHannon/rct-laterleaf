import React from 'react';
import './FallingLeaves.scss';

const FallingLeaves: React.FC = () => {
    // Create an array to render multiple leaf elements
    const leaves = Array.from({ length: 20 }); // 20 leaves

    return (
        <div className="falling-leaves">
            {leaves.map((_, i) => (
                <div key={i} className="leaf-container" style={{ left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 10}s`, animationDuration: `${5 + Math.random() * 10}s` }}>
                    <div className="leaf"></div>
                </div>
            ))}
        </div>
    );
};

export default FallingLeaves;
