'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { DIETARY_PREFERENCES, BUDGET_RANGES } from '@/lib/constants';
import { User, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    household_size: user?.household_size || 1,
    dietary_preferences: user?.dietary_preferences || [],
    budget_range: user?.budget_range || '',
    location: user?.location || '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting profile update...');
    console.log('Profile Image:', profileImage);
    console.log('Form Data:', formData);
    
    try {
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
        const response = await api.updateProfileWithImage(submitData);
        console.log('Response:', response);
      } else {
        console.log('Sending JSON without image...');
        // Regular JSON update without image
        const response = await api.updateProfile(formData);
        console.log('Response:', response);
      }
      
      alert('Profile updated successfully!');
      setEditing(false);
      setProfileImage(null);
      setImagePreview(null);
      window.location.reload();
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold gradient-text">Profile Settings</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-xl transition-all font-semibold"
          >
            Edit Profile
          </button>
        )}
      </div>

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
              <label className="absolute bottom-0 right-0 p-2 bg-teal-500 rounded-full cursor-pointer hover:bg-teal-600 transition-all shadow-lg">
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
                    <span key={pref} className="px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg text-sm font-medium">
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
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Household Size</label>
                <input
                  type="number"
                  min="1"
                  value={formData.household_size}
                  onChange={(e) => setFormData({ ...formData, household_size: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Budget Range</label>
                <select
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.dietary_preferences.includes(pref)
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all font-semibold"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-700/50 text-gray-300 px-8 py-3 rounded-xl hover:bg-gray-600/50 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
