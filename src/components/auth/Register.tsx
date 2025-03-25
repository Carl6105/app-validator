import React, { useState, useCallback, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  CheckCircle,
  Loader2,
  Code,
  ShieldCheck,
  FileCode,
  BarChart,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Validation functions (moved outside for reusability)
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username: string) => /^[a-zA-Z0-9_]{3,20}$/.test(username);

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  // Redirect to login after successful registration
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => navigate("/login"), 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, navigate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      // Validation checks
      if (password !== confirmPassword) return setError("Passwords do not match");
      if (password.length < 8) return setError("Password must be at least 8 characters long");
      if (!validateEmail(email)) return setError("Please enter a valid email address");
      if (!validateUsername(username))
        return setError("Username must be 3-20 characters and contain only letters, numbers, and underscores");

      setIsLoading(true);
      try {
        await register(username, email, password);
        setRegistrationSuccess(true);
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Registration failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [username, email, password, confirmPassword, register]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-black via-gray-900 to-gray-800">
      <div className="flex w-full max-w-6xl rounded-2xl border shadow-xl overflow-hidden bg-[#1a1a1a] border-gray-800">
        {/* Left Section - Registration Form */}
        <div className="w-1/2 p-8">
          {registrationSuccess ? (
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
              <h2 className="mt-6 text-2xl font-bold text-gray-200">Registration Successful!</h2>
              <p className="mt-4 text-gray-400">
                We've sent a verification email to <span className="text-blue-400">{email}</span>.
                <br />
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <UserPlus className="mx-auto h-12 w-12 text-blue-400" />
                <h2 className="mt-6 text-3xl font-bold text-gray-200">Create an account</h2>
                <p className="mt-2 text-sm text-gray-400">Join Code Amplifier today</p>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center mt-4" role="alert" id="error-message">
                  {error}
                </p>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {/* Username */}
                <div className="relative">
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700"
                    placeholder="Username"
                    required
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700"
                    placeholder="Email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700"
                    placeholder="Password"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm Password
                  </label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700"
                    placeholder="Confirm Password"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white transition-all flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  aria-label="Sign up for a new account"
                  aria-describedby={error ? "error-message" : undefined}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Signing Up...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>

                {/* Login Redirect */}
                <p className="text-center text-gray-400 mt-4">
                  Already registered?{" "}
                  <a
                    href="/login"
                    className="text-blue-400 hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Login here
                  </a>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Right Section - App Information */}
        <div className="w-1/2 p-8 flex flex-col justify-center text-gray-200 bg-gray-900">
          <div className="text-center">
            <Code className="h-12 w-12 text-blue-400 mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold mt-4">Code Amplifier</h2>
            <p className="mt-2 text-lg text-gray-400">Your AI-powered coding assistant.</p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-center space-x-3">
              <FileCode className="h-10 w-10 text-blue-400" />
              <p className="text-lg">Analyze your code for errors & best practices.</p>
            </div>

            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-10 w-10 text-green-400" />
              <p className="text-lg">Enhanced security & performance checks.</p>
            </div>

            <div className="flex items-center space-x-3">
              <BarChart className="h-10 w-10 text-yellow-400" />
              <p className="text-lg">Get AI-driven quality scores (0-100).</p>
            </div>

            <div className="flex items-center space-x-3">
              <Zap className="h-10 w-10 text-purple-400" />
              <p className="text-lg">Fully offline processing with AI models.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}