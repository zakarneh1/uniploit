import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CheckCircle,
  Star,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { FAQ_ITEMS, TESTIMONIALS } from '@/lib/constants';
import { ScreenshotCarousel } from '@/components/shared/ScreenshotCarousel';

const features = [
  {
    icon: TrendingUp,
    title: 'GPA Tracking',
    description: 'Monitor your academic performance with real-time GPA calculations and predictions.',
  },
  {
    icon: BookOpen,
    title: 'Course Management',
    description: 'Organize all your courses, assignments, and grades in one centralized dashboard.',
  },
  {
    icon: Calendar,
    title: 'Study Planner',
    description: 'Plan your study sessions with a visual calendar and stay on top of deadlines.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Visualize your progress with detailed charts and performance insights.',
  },
];

const benefits = [
  'Track unlimited courses and grades',
  'Visual study planner with calendar',
  'Grade calculator with what-if scenarios',
  'Beautiful charts and analytics',
  'Dark mode support',
  'Secure cloud sync across devices',
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">UniPilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Create Account</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage: 'url(/images/StudyPlanner.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Plan your semester,
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {' '}
                track your grades
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Organize study sessions, monitor your GPA, and visualize your academic progress.
              All in one place, completely free.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign In to Use UniPilot
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" />
              We save your semester, grades, and planner securely.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <ScreenshotCarousel />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to succeed</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed to help you stay organized and achieve your academic goals.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                Why students choose UniPilot
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto">Create Account</Button>
                </Link>
                <Link to="/auth/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">Sign In</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-2xl blur-3xl" />
              <img
                src="/images/Dashboard.jpg"
                alt="Student Success"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Loved by students worldwide</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what students are saying about UniPilot
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-600">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center text-white">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Ready to transform your academic journey?
            </h2>
            <p className="text-lg mb-8 text-white/90">
              Join thousands of students who are already using UniPilot to achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto !bg-transparent !hover:bg-white/10 !text-white !border-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">UniPilot</span>
            </div>
            <p className="text-sm bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#64748B]">
              © 2025 Ahmad Salama. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}