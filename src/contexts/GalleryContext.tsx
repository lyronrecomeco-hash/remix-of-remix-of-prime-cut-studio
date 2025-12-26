import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  createdAt: string;
}

interface GalleryContextType {
  images: GalleryImage[];
  addImage: (image: Omit<GalleryImage, 'id' | 'createdAt'>) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, updates: Partial<GalleryImage>) => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const defaultImages: GalleryImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop',
    title: 'Corte Degradê',
    description: 'Degradê moderno com acabamento perfeito',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop',
    title: 'Barba Estilizada',
    description: 'Modelagem artesanal de barba',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=600&fit=crop',
    title: 'Corte Clássico',
    description: 'Estilo clássico atemporal',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=600&fit=crop',
    title: 'Navalhado',
    description: 'Acabamento com navalha',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop',
    title: 'Ambiente Premium',
    description: 'Nossa estrutura de qualidade',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=600&h=600&fit=crop',
    title: 'Detalhes',
    description: 'Atenção aos detalhes em cada corte',
    createdAt: new Date().toISOString(),
  },
];

export const GalleryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<GalleryImage[]>(() =>
    loadFromStorage('barbershop-gallery', defaultImages)
  );

  useEffect(() => {
    saveToStorage('barbershop-gallery', images);
  }, [images]);

  const addImage = useCallback((image: Omit<GalleryImage, 'id' | 'createdAt'>) => {
    const newImage: GalleryImage = {
      ...image,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setImages(prev => [...prev, newImage]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const updateImage = useCallback((id: string, updates: Partial<GalleryImage>) => {
    setImages(prev =>
      prev.map(img => (img.id === id ? { ...img, ...updates } : img))
    );
  }, []);

  return (
    <GalleryContext.Provider value={{ images, addImage, removeImage, updateImage }}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};
