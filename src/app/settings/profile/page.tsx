"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User,
  Camera,
  Globe,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  Save,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Profile form state
  const [profile, setProfile] = useState({
    bio: "",
    location: "",
    website: "",
    occupation: "",
    twitter: "",
    github: "",
    linkedin: "",
    interests: [] as string[],
  });

  const [newInterest, setNewInterest] = useState("");

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Please sign in to manage your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      // In a real app, this would save to backend
      localStorage.setItem("user-profile", JSON.stringify(profile));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((i) => i !== interest),
    });
  };

  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.firstName 
    ? user.firstName.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          ← Back to Settings
        </Link>
        <h1 className="text-3xl font-bold mt-2">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your public profile information
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Your profile picture is managed through your authentication provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {user.fullName || user.firstName || "User"}
                </h3>
                <p className="text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio and Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              About You
            </CardTitle>
            <CardDescription>
              Tell others about yourself
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Write a short bio about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {profile.bio.length}/500 characters
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Occupation
                </Label>
                <Input
                  id="occupation"
                  placeholder="Your profession"
                  value={profile.occupation}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                <Globe className="inline h-4 w-4 mr-1" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>
              Connect your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">
                <Twitter className="inline h-4 w-4 mr-1" />
                Twitter/X
              </Label>
              <Input
                id="twitter"
                placeholder="@username"
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">
                <Github className="inline h-4 w-4 mr-1" />
                GitHub
              </Label>
              <Input
                id="github"
                placeholder="username"
                value={profile.github}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">
                <Linkedin className="inline h-4 w-4 mr-1" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                placeholder="linkedin.com/in/username"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              Add topics and activities you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <Button onClick={handleAddInterest} variant="outline">
                Add
              </Button>
            </div>

            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveInterest(interest)}
                  >
                    {interest}
                    <span className="ml-2 text-xs">×</span>
                  </Badge>
                ))}
              </div>
            )}

            {profile.interests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No interests added yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Statistics</CardTitle>
            <CardDescription>
              Your Pack List activity summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Lists Created</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Templates Shared</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">89%</p>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSaveProfile} 
          disabled={isUpdating}
          className="w-full md:w-auto"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}