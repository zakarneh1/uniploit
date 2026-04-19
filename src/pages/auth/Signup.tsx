import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { initializeGoogleAuth, renderGoogleButton, decodeGoogleCredential, GoogleAuthResponse } from '@/lib/googleAuth';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    // Initialize Google Auth
    initializeGoogleAuth(handleGoogleSuccess);
    
    // Render Google button after initialization
    const timer = setTimeout(() => {
      renderGoogleButton('google-signup-button');
    }, 1000); // Wait for script to load

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (response: GoogleAuthResponse) => {
    try {
      const googleUser = decodeGoogleCredential(response.credential);

      // Try to login first (in case account already exists)
      try {
        const user = await api.auth.loginWithGoogle(
          googleUser.email,
          googleUser.sub,
          googleUser.name,
          googleUser.picture
        );
        login(user);
        toast.success('Welcome back!');
        navigate('/app');
      } catch (loginError: any) {
        // If login fails, create new account with Google OAuth
        try {
          const user = await api.auth.signupWithGoogle(
            googleUser.email,
            googleUser.sub,
            googleUser.name,
            googleUser.picture
          );
          login(user);
          toast.success('Account created successfully!');
          navigate('/app');
        } catch (signupError: any) {
          console.error('Google auth error:', signupError);
          toast.error(signupError?.message || 'Failed to sign up with Google. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error?.message || 'Failed to sign up with Google. Please try again.');
    }
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordStrength =
    Object.values(passwordChecks).filter(Boolean).length;

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      console.log('Attempting signup with:', { email: data.email, name: data.name });
      const user = await api.auth.signup(data.email, data.password, data.name);
      console.log('Signup successful, user:', user);
      login(user);
      toast.success('Account created successfully!');
      navigate('/app');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Form */}
      <div className="flex items-center justify-center p-8 order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Get started with UniPilot - completely free</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Alex Johnson"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-colors',
                              passwordStrength >= level
                                ? passwordStrength === 4
                                  ? 'bg-green-500'
                                  : passwordStrength === 3
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          {passwordChecks.length ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.uppercase ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>One uppercase letter</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.number ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>One number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div id="google-signup-button" className="w-full" />
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-primary to-purple-600 text-white order-1 lg:order-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold">UniPilot</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Start your journey to academic success</h1>
          <p className="text-lg text-white/90 mb-8">
            Join thousands of students using UniPilot to track their progress and achieve their goals.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-white/80">Active Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">4.9/5</div>
              <div className="text-white/80">User Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-white/80">Courses Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-white/80">Free Forever</div>
            </div>
          </div>
          <img
            src="/images/sign%20in%20page%20background.png"
            alt="Student using UniPilot"
            className="mt-8 rounded-xl shadow-2xl"
          />
        </motion.div>
      </div>
    </div>
  );
}