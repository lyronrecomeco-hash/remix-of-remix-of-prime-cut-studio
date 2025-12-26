import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryImage } from '@/contexts/GalleryContext';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GalleryImage | null;
  images: GalleryImage[];
  onNavigate: (direction: 'prev' | 'next') => void;
}

const GalleryModal = ({ isOpen, onClose, image, images, onNavigate }: GalleryModalProps) => {
  if (!image) return null;

  const currentIndex = images.findIndex(img => img.id === image.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Buttons */}
            {hasPrev && (
              <button
                onClick={() => onNavigate('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={() => onNavigate('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="rounded-2xl overflow-hidden">
              <motion.img
                key={image.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={image.url}
                alt={image.title || 'Galeria'}
                className="w-full aspect-square md:aspect-video object-cover"
              />
            </div>

            {/* Image Info */}
            {(image.title || image.description) && (
              <div className="mt-4 text-center">
                {image.title && (
                  <h3 className="text-xl font-semibold mb-1">{image.title}</h3>
                )}
                {image.description && (
                  <p className="text-muted-foreground">{image.description}</p>
                )}
              </div>
            )}

            {/* Thumbnails */}
            <div className="mt-6 flex justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => {
                    const diff = index - currentIndex;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) onNavigate('next');
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) onNavigate('prev');
                    }
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all ${
                    img.id === image.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GalleryModal;
