"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { LogOut, Sun, Moon, User, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { useUserProfile } from "@/contexts/profile-context";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";
import { toast } from "@/components/ui/use-toast";
import * as z from "zod";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { MeasurementsSettings } from "@/components/settings/MeasurementsSettings";
import type { Profile } from "@/types/workouts";

const settingsSchema = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(["male", "female", "other"]).nullable(),
  date_of_birth: z.date().nullable(),
  unit_preference: z.enum(["metric", "imperial"]),
  weight_kg: z.number().min(20).max(500).nullable(),
  height_cm: z.number().min(50).max(250).nullable(),
  body_fat_percentage: z.number().min(2).max(60).nullable(),
});

export default function Settings() {
  const { state: { profile }, updateProfile, clearProfile } = useUserProfile();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileState, setProfileState] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileState(profile);
      setTheme(profile.theme_preference);
    }
  }, [profile, setTheme]);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      gender: null,
      date_of_birth: null,
      unit_preference: "metric",
      weight_kg: null,
      height_cm: null,
      body_fat_percentage: null,
    },
  });

  useEffect(() => {
    if (profileState) {
      form.reset({
        name: profileState.name || "",
        gender: profileState.gender,
        date_of_birth: profileState.date_of_birth ? new Date(profileState.date_of_birth) : null,
        unit_preference: profileState.unit_preference || "metric",
        weight_kg: profileState.weight_kg,
        height_cm: profileState.height_cm,
        body_fat_percentage: profileState.body_fat_percentage,
      });
    }
  }, [profileState, form]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const updates = {
        name: data.name,
        gender: data.gender,
        date_of_birth: data.date_of_birth
          ? data.date_of_birth.toISOString().split("T")[0]
          : null,
        unit_preference: data.unit_preference,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage,
      };
      await updateProfile(updates);
      setProfileState((prev) => ({ ...prev!, ...updates }));
      toast({
        title: "Success",
        description: "Profile saved successfully.",
        variant: "default",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Logout failed");
      }
      clearProfile();
      toast({
        title: "Success",
        description: "You have been logged out.",
        variant: "default",
        duration: 2000,
      });
      router.push("/auth/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (!profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className={`min-h-screen bg-background pb-16 ${theme === "dark" ? "dark" : ""}`}>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg rounded-b-3xl">
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const newTheme: "light" | "dark" = theme === "dark" ? "light" : "dark";
              setTheme(newTheme);
              try {
                await updateProfile({ theme_preference: newTheme });
                setProfileState((prev) => ({ ...prev!, theme_preference: newTheme }));
              } catch (error) {
                console.error("Error updating theme:", error);
                toast({ title: "Error", description: "Failed to update theme." });
              }
            }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-full hover:bg-secondary"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full mx-auto"
        >
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs
                defaultValue="profile"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-6 glass rounded-xl p-1">
                  <TabsTrigger
                    value="profile"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="measurements"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Ruler className="h-4 w-4 mr-2" />
                    Measurements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-0">
                  <Card className="border glass shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="flex items-center text-xl">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <ProfileSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="measurements" className="space-y-6 mt-0">
                  <Card className="border glass shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="flex items-center text-xl">
                        <Ruler className="h-5 w-5 mr-2 text-primary" />
                        Body Measurements
                      </CardTitle>
                      <CardDescription>Track your physical measurements</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <MeasurementsSettings />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </FormProvider>
        </motion.div>
      </div>
    </div>
  );
}