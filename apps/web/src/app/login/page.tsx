"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/loader";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const handleGoogleAuth = async () => {
    try {
      await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to authenticate");
          },
        }
      );
    } catch {
      toast.error("An error occurred during authentication");
    }
  };

  if (isPending) return <Loader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card className="p-8 border border-border shadow-sm rounded-2xl bg-card">
          <div className="space-y-8 text-center">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>
              <p className="text-muted-foreground text-sm">
                Continue to your workspace
              </p>
            </div>

            {/* Social login */}
            <Button
              onClick={handleGoogleAuth}
              variant="outline"
              className="w-full h-11 rounded-xl font-medium cursor-pointer"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition"
            >
              Back to home
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
