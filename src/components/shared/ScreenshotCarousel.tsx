import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const screenshots = [
  {
    title: 'Dashboard',
    description: 'Track your GPA and academic progress at a glance',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/11a2c743-095d-4b8c-b6e4-9bfa213a4e62.png',
  },
  {
    title: 'Courses',
    description: 'Manage all your courses and grades in one place',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/0cbd2332-8ebb-475d-b3cf-c86711a0abc0.png',
  },
  {
    title: 'Course Details',
    description: 'Deep dive into individual course performance',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/059e4f67-b04d-4fd1-b307-502dcbfdc627.png',
  },
  {
    title: 'Study Planner',
    description: 'Organize your study sessions with visual calendar',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/480af878-bb05-41cf-8f6d-a068d0650caf.png',
  },
  {
    title: 'Analytics',
    description: 'Visualize your academic trends with detailed charts',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/f60ec6bf-1d4c-41bb-ae1d-30fde2b04795.png',
  },
  {
    title: 'Settings',
    description: 'Customize your experience and preferences',
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/747203/2025-12-29/4011f25f-1c86-48a2-87ba-5be85697633b.png',
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