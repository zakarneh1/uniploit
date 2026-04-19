import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const screenshots = [
  {
    title: 'Academic Workspace',
    description: 'Stay focused with a clean, organized study overview',
    image: '/images/landing%20page%20background.png',
  },
  {
    title: 'Sign In Experience',
    description: 'A welcoming authentication flow built for students',
    image: '/images/sign%20in%20page%20background.png',
  },
];

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main Image */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <img
              src={screenshots[currentIndex].image}
              alt={screenshots[currentIndex].title}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
          onClick={goToNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Title and Description */}
      <div className="mt-4 text-center">
        <h3 className="text-xl font-semibold">{screenshots[currentIndex].title}</h3>
        <p className="text-muted-foreground">{screenshots[currentIndex].description}</p>
      </div>

      {/* Dots Navigation */}
      <div className="mt-6 flex justify-center gap-2">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}