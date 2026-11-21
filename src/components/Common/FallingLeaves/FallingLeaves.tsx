import React, { useMemo } from 'react';
import './FallingLeaves.scss';

const LEAF_COUNT = 20;

const FallingLeaves: React.FC = () => {
    const leaves = useMemo(
        () =>
            Array.from({ length: LEAF_COUNT }, (_, i) => ({
                id: i,
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
            })),
        [],
    );

    return (
        <div className="falling-leaves" aria-hidden="true">
            {leaves.map((leaf) => (
                <div
                    key={leaf.id}
                    className="leaf-container"
                    style={{
                        left: leaf.left,
                        animationDelay: leaf.animationDelay,
                        animationDuration: leaf.animationDuration,
                    }}
                >
                    <div className="leaf"></div>
                </div>
            ))}
        </div>
    );
};

export default FallingLeaves;
