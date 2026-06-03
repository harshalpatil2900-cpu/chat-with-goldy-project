import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthBox() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(isLogin ? "Login successful!" : "Signup successful!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-center">
          {isLogin ? "Login to Goldy AI" : "Create Account"}
        </h1>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>

          {message && (
            <p className="text-center text-sm text-muted-foreground">
              {message}
            </p>
          )}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-sm text-primary hover:underline"
          >
            {isLogin ? "Create new account" : "Already have account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}