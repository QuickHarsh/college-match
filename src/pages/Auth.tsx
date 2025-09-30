import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Users, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateCollegeEmail = (email: string) => {
    return email.includes('.edu') || email.includes('.ac.') || email.includes('university') || email.includes('college');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateCollegeEmail(email)) {
      alert('Please use your college email address (must contain .edu, .ac., university, or college)');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          alert('Please enter your full name');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f472b6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Floating Elements */}
      {/* Placeholder for floating logo (intentionally empty). Replace with your custom logo when ready. */}
      <motion.div
        className="absolute top-20 left-10 opacity-60"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-8 h-8" aria-hidden />
      </motion.div>
      <motion.div
        className="absolute top-40 right-16 text-purple-400 opacity-60"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-20 text-indigo-400 opacity-60"
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <Users className="w-7 h-7" />
      </motion.div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                {/* Placeholder for main logo (intentionally empty). Replace with your custom logo when ready. */}
                <div className="relative h-16 w-16" aria-hidden />
              </motion.div>
            </div>
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              CollegeMatch
            </motion.h1>
            <motion.p
              className="text-gray-600 dark:text-gray-300 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Connect with fellow students ✨
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-2xl">
              <CardHeader className="text-center space-y-2">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {isLogin ? 'Welcome Back! 💕' : 'Join the Fun! 🎉'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {isLogin 
                      ? 'Sign in to your account to start connecting' 
                      : 'Create your account with your college email'
                    }
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.form
                    key={isLogin ? 'login-form' : 'signup-form'}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="fullName" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <User className="w-4 h-4 text-pink-500" />
                          Full Name
                        </Label>
                        <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-pink-400/50 border-gray-200 dark:border-gray-700"
                            required
                          />
                        </motion.div>
                      </motion.div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <Mail className="w-4 h-4 text-purple-500" />
                        College Email
                      </Label>
                      <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.name@college.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="transition-all duration-300 focus:ring-2 focus:ring-purple-400/50 border-gray-200 dark:border-gray-700"
                          required
                        />
                      </motion.div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Use your official college email address for verification
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <Lock className="w-4 h-4 text-indigo-500" />
                        Password
                      </Label>
                      <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="transition-all duration-300 focus:ring-2 focus:ring-indigo-400/50 border-gray-200 dark:border-gray-700"
                          required
                          minLength={6}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-2"
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <span className="flex items-center gap-2">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </AnimatePresence>

                <div className="mt-6 text-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-200"
                    >
                      {isLogin
                        ? "Don't have an account? Sign up 🚀"
                        : 'Already have an account? Sign in 👋'
                      }
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-center text-gray-500 dark:text-gray-400 px-4"
          >
            By continuing, you agree to our{' '}
            <span className="text-pink-500 hover:underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-purple-500 hover:underline cursor-pointer">Privacy Policy</span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}