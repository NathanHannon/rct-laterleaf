import React, { createContext, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';

interface CollectionAnimationState {
  isTransitioning: boolean;
}

interface CollectionAnimationContextType {
  animationState: CollectionAnimationState;
  setAnimationState: React.Dispatch<React.SetStateAction<CollectionAnimationState>>;
  triggerExplode: () => void;
  triggerImplode: () => void;
}

const CollectionAnimationContext = createContext<CollectionAnimationContextType | undefined>(undefined);

export { CollectionAnimationContext };

interface CollectionAnimationProviderProps {
  children: ReactNode;
}

export const CollectionAnimationProvider: React.FC<CollectionAnimationProviderProps> = ({ children }) => {
  const [animationState, setAnimationState] = useState<CollectionAnimationState>({
    isTransitioning: false
  });

  const triggerExplode = () => {
    setAnimationState({
      isTransitioning: true
    });
    
    // Reset after a short fade
    setTimeout(() => {
      setAnimationState({
        isTransitioning: false
      });
    }, 300);
  };

  const triggerImplode = () => {
    // Not needed for simple fade, but keeping for compatibility
    setAnimationState({
      isTransitioning: false
    });
  };

  return (
    <CollectionAnimationContext.Provider 
      value={{ 
        animationState, 
        setAnimationState, 
        triggerExplode, 
        triggerImplode 
      }}
    >
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </CollectionAnimationContext.Provider>
  );
};
