import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import GalleryModal from './GalleryModal';

const Gallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { images } = useGallery();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    } else if (direction === 'next' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <>
      <section id="galeria" className="section-padding bg-background" ref={ref}>
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase">
              Galeria
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Nossos trabalhos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Confira alguns dos nossos cortes e transformações realizadas por nossa equipe.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={image.url}
                  alt={image.title || `Corte ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div 
                  className={`absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-300 ${
                    hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div 
                  className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${
                    hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {image.title || 'Ver detalhes'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <GalleryModal
        isOpen={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
        image={selectedImageIndex !== null ? images[selectedImageIndex] : null}
        images={images}
        onNavigate={handleNavigate}
      />
    </>
  );
};

export default Gallery;
