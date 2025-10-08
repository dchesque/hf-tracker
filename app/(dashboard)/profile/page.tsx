'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    joinedDate: '',
    bio: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error('You need to be logged in');
          return;
        }

        setUserId(user.id);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        if (profileData) {
          setProfile({
            name: profileData.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: '',
            location: '',
            joinedDate: new Date(profileData.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
            bio: '',
          });
        } else {
          setProfile({
            name: user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: '',
            location: '',
            joinedDate: new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
            bio: '',
          });
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      toast.error('User not found');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Abstract blur backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">My</span>
              <span className="text-yellow-500"> Profile</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Manage your personal information and preferences
            </p>
          </div>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isLoading || isSaving}
            className={isEditing ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}
          >
            {isSaving ? (
              'Saving...'
            ) : isEditing ? (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            ) : (
              'Edit Profile'
            )}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                    <User size={64} className="text-white" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-black transition-colors">
                      <Camera size={18} />
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                  <p className="text-zinc-400">{profile.email}</p>
                </div>
                <div className="w-full pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Calendar size={16} />
                    <span>Joined {profile.joinedDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-yellow-500/50 focus:ring-yellow-500/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-400">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-yellow-500/50 focus:ring-yellow-500/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-zinc-400">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-yellow-500/50 focus:ring-yellow-500/20 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-zinc-400">Bio</Label>
                <textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 disabled:opacity-50 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-zinc-400">Total Trades</p>
                <p className="text-4xl font-bold mt-2 text-yellow-400">0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-zinc-400">Active Positions</p>
                <p className="text-4xl font-bold mt-2 text-yellow-400">0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-zinc-400">Win Rate</p>
                <p className="text-4xl font-bold mt-2 text-green-400">0%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
