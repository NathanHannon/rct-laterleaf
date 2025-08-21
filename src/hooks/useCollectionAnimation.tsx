import { useContext } from 'react';
import { CollectionAnimationContext } from '../context/collectionAnimationContext';

export const useCollectionAnimation = () => {
  const context = useContext(CollectionAnimationContext);
  if (!context) {
    throw new Error('useCollectionAnimation must be used within a CollectionAnimationProvider');
  }
  return context;
};
