import React, { useState, useCallback } from "react";
import { LogIn, Mail, Lock, AlertCircle, Loader2, CheckCircle, Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        await login(email, password);
        setSuccess(true);
        setTimeout(() => navigate("/"), 3000); // Reduced to 3 seconds for better UX
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to login. Please check your credentials.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] light:bg-gray-50">
      {/* Logo */}
      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Code2 className="h-10 w-10 text-blue-500" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white dark:from-blue-500 dark:to-gray-100 [text-shadow:0_0_8px_rgba(59,130,246,0.5)]">
            Code Amplifier
          </h1>
        </div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border shadow-xl bg-[#1a1a1a] light:bg-white border-gray-800 light:border-gray-200">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-blue-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-200 light:text-gray-800">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-400 light:text-gray-600">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] light:bg-gray-50 text-gray-200 light:text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700 light:border-gray-300"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-lg border bg-[#121212] light:bg-gray-50 text-gray-200 light:text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-700 light:border-gray-300"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span id="error-message">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || success}
            className={`w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading || success ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
            aria-label="Sign in to your account"
            aria-describedby={error ? "error-message" : undefined}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </div>
            ) : success ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success! Redirecting...
              </div>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="text-center">
            <a
              href="/register"
              className="text-sm text-blue-400 hover:text-blue-500 transition-colors duration-200"
            >
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}