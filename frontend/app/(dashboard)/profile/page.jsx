'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { apiMiddleware, routes } from '@/lib/apiMiddleware';
import { DIETARY_PREFERENCES, BUDGET_RANGES } from '@/lib/constants';
import { User, Camera, Pencil, Check, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils-cn';

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    household_size: user?.household_size || 1,
    dietary_preferences: user?.dietary_preferences || [],
    budget_range: user?.budget_range || '',
    location: user?.location || '',
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user?.full_name || '',
        household_size: user?.household_size || 1,
        dietary_preferences: user?.dietary_preferences || [],
        budget_range: user?.budget_range || '',
        location: user?.location || '',
      });
    }
  }, [user]);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDietaryPreference = (pref) => {
    setFormData((prev) => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(pref)
        ? prev.dietary_preferences.filter((p) => p !== pref)
        : [...prev.dietary_preferences, pref],
    }));
  };

  const handleCancel = () => {
    setEditing(false);
    setProfileImage(null);
    setImagePreview(null);
    // Reset form data to current user data
    setFormData({
      full_name: user?.full_name || '',
      household_size: user?.household_size || 1,
      dietary_preferences: user?.dietary_preferences || [],
      budget_range: user?.budget_range || '',
      location: user?.location || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting profile update...');
    console.log('Profile Image:', profileImage);
    console.log('Form Data:', formData);
    
    try {
      let response;
      // Check if we need to use FormData (for image upload)
      if (profileImage) {
        // Create FormData for file upload
        const submitData = new FormData();
        
        // Append all form fields
        submitData.append('full_name', formData.full_name);
        submitData.append('household_size', formData.household_size);
        submitData.append('budget_range', formData.budget_range || '');
        submitData.append('location', formData.location || '');
        submitData.append('dietary_preferences', JSON.stringify(formData.dietary_preferences));
        submitData.append('profile_image', profileImage);
        
        // Laravel expects _method for file uploads with PUT
        submitData.append('_method', 'PUT');
        
        console.log('Sending FormData with image...');
        // Use POST when sending FormData
        response = await api.updateProfileWithImage(submitData);
        console.log('Response:', response);
      } else {
        console.log('Sending JSON without image...');
        // Regular JSON update without image
        response = await api.updateProfile(formData);
        console.log('Response:', response);
      }
      
      // Update the user in context with the new data
      console.log('Full response:', response);
      console.log('Response structure:', JSON.stringify(response, null, 2));
      const updatedUser = response?.data || response;
      console.log('Updated user to save:', updatedUser);
      console.log('Updated user profile_image:', updatedUser?.profile_image);
      updateUser(updatedUser);
      
      setSuccess(true);
      setEditing(false);
      setProfileImage(null);
      setImagePreview(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <User className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Profile Settings</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-9">
              Manage your personal information and preferences
            </p>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="gap-2 py-3.5 px-5 text-sm font-medium bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 transition-all duration-300"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Card className="premium-card border-lime-500/50 bg-lime-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Profile updated successfully!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Image Section */}
      <div className="premium-card border-gray-800/50 rounded-xl p-8">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-teal-500/30">
              {imagePreview ? (
                <AvatarImage src={imagePreview} alt="Profile Preview" />
              ) : user?.profile_image ? (
                <AvatarImage 
                  src={`${process.env.NEXT_PUBLIC_API_URL}${user.profile_image}`} 
                  alt="Profile" 
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-3xl font-bold">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <label className="absolute bottom-0 right-0 p-2 bg-lime-500 rounded-full cursor-pointer hover:bg-lime-600 transition-all shadow-lg">
                <Camera className="w-5 h-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mt-4">{user?.full_name}</h2>
          <p className="text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="premium-card border-gray-800/50 rounded-xl p-6">
        {!editing ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-400">Full Name</label>
                <p className="text-white text-lg mt-1">{user?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Email</label>
                <p className="text-white text-lg mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Household Size</label>
                <p className="text-white text-lg mt-1">{user?.household_size} {user?.household_size === 1 ? 'person' : 'people'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Budget Range</label>
                <p className="text-white text-lg mt-1">{user?.budget_range || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Location</label>
                <p className="text-white text-lg mt-1">{user?.location || 'Not set'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-3">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {user?.dietary_preferences?.length > 0 ? (
                  user.dietary_preferences.map((pref) => (
                    <span key={pref} className="px-4 py-2 bg-lime-500/10 border border-lime-500/30 text-lime-400 rounded-lg text-sm font-medium">
                      {pref}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">None selected</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Household Size</label>
                <input
                  type="number"
                  min="1"
                  value={formData.household_size}
                  onChange={(e) => setFormData({ ...formData, household_size: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Budget Range</label>
                <select
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {BUDGET_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-3 text-foreground">Dietary Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                      formData.dietary_preferences.includes(pref)
                        ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white border-lime-500'
                        : 'bg-muted/50 text-foreground/80 border-border hover:border-lime-500/50 hover:bg-muted'
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 py-3.5 px-6 text-sm font-medium bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                className="py-3.5 px-6 text-sm font-medium border hover:bg-muted hover:border-lime-500/50 transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
