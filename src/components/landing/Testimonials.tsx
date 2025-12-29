import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Star, Quote, User, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Feedback {
  id: string;
  name: string;
  rating: number;
  text: string;
  avatar_type: string;
  avatar_url?: string;
  is_anonymous: boolean;
}

const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [publishedFeedbacks, setPublishedFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    const fetchPublishedFeedbacks = async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('id, name, rating, text, avatar_type, avatar_url, is_anonymous')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setPublishedFeedbacks(data);
      }
    };

    fetchPublishedFeedbacks();
  }, []);

  if (publishedFeedbacks.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30" ref={ref}>
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
            Quem conhece,
            <br />
            <span className="text-gradient">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A opinião de quem já viveu a experiência é a melhor forma de conhecer nosso trabalho.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {publishedFeedbacks.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              <div className="flex gap-1 mb-4">
                {[...Array(feedback.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "{feedback.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {feedback.avatar_url ? (
                    <img
                      src={feedback.avatar_url}
                      alt={feedback.name}
                      className="w-full h-full object-cover"
                    />
                  ) : feedback.avatar_type === 'female' ? (
                    <UserCircle className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {feedback.is_anonymous ? 'Cliente anônimo' : feedback.name}
                  </div>
                  <div className="text-sm text-muted-foreground">Cliente</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
