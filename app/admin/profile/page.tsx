"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    currentPassword: "",
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleChangeField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    try {
      await authClient.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.password,
        revokeOtherSessions: true,
      });
      toast({
        title: "Password updated successfully",
        description: "Your password has been updated.",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
    <form onSubmit={handleChangePassword}>
      <div className="px-4 space-y-6 sm:px-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="space-y-8">
          <Card>
            <CardContent className="space-y-6 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="E.g. Jane Doe"
                  defaultValue={session?.user.name}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="E.g. jane@example.com"
                  defaultValue={session?.user.email}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <p className="text-sm text-muted-foreground">
                For your security, please do not share your password with
                others.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  type="password"
                  id="current-password"
                  name="currentPassword"
                  onChange={handleChangeField}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  type="password"
                  id="new-password"
                  name="password"
                  onChange={handleChangeField}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirm-password"
                  name="confirmPassword"
                  onChange={handleChangeField}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
