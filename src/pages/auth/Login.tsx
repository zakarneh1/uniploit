import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { initializeGoogleAuth, renderGoogleButton, decodeGoogleCredential, GoogleAuthResponse } from '@/lib/googleAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Initialize Google Auth
    initializeGoogleAuth(handleGoogleSuccess);
    
    // Render Google button after initialization
    const timer = setTimeout(() => {
      renderGoogleButton('google-signin-button');
    }, 1000); // Wait for script to load

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (response: GoogleAuthResponse) => {
    try {
      const googleUser = decodeGoogleCredential(response.credential);

      // Try to login with Google OAuth
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
        // If login fails, try to create new account with Google OAuth
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
          toast.error(signupError?.message || 'Failed to sign in with Google. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error?.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const user = await api.auth.login(data.email, data.password);
      login(user);
      toast.success('Welcome back!');
      navigate('/app');
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-primary to-purple-600 text-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold">UniPilot</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
          <p className="text-lg text-white/90 mb-8">
            Continue tracking your academic progress and managing your study schedule.
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl">
            <img
              src="/images/sign%20in%20page%20background.png"
              alt="UniPilot Dashboard"
              className="h-80 w-full object-cover object-center"
            />
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>Sign in to your account</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  <Input id="password" type="password" {...register('password')} />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
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

                <div id="google-signin-button" className="w-full" />
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-primary hover:underline">
                  Create account
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}