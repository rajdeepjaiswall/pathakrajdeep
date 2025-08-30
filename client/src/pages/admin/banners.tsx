import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Upload, Video, Image, VolumeX, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { ObjectUploader } from '@/components/ObjectUploader';

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminBanners() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 1
  });
  const [bannerType, setBannerType] = useState<'image' | 'video'>('image');

  // Redirect if not admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['/api/banners'],
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      return await apiRequest('/api/admin/banners', 'POST', bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      setIsCreating(false);
      setNewBanner({
        title: '',
        description: '',
        imageUrl: '',
        videoUrl: '',
        linkUrl: '',
        isActive: true,
        displayOrder: 1
      });
      toast({
        title: "Banner created",
        description: "The new banner has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...bannerData }: any) => {
      return await apiRequest(`/api/admin/banners/${id}`, 'PATCH', bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      setEditingBanner(null);
      toast({
        title: "Banner updated",
        description: "The banner has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/banners/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      toast({
        title: "Banner deleted",
        description: "The banner has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMediaUpload = async (uploadedUrls: string[], mediaType: 'image' | 'video', isNew = false) => {
    console.log('Media upload completed:', { uploadedUrls, mediaType, isNew });
    
    if (uploadedUrls.length === 0) {
      toast({
        title: "Upload Error",
        description: "No file was uploaded successfully. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    let mediaUrl = uploadedUrls[0];
    
    // For object storage, we need to convert the GCS URL to our object endpoint
    if (mediaUrl.includes('storage.googleapis.com')) {
      // Extract the bucket and object path
      const url = new URL(mediaUrl);
      const pathParts = url.pathname.split('/');
      const bucketName = pathParts[1];
      const objectPath = pathParts.slice(2).join('/');
      
      // Convert to our object endpoint format
      mediaUrl = `/objects/uploads/${objectPath.split('/').pop()}`;
      console.log('Converted URL to object endpoint:', mediaUrl);
    }
    
    if (isNew) {
      if (mediaType === 'image') {
        setNewBanner(prev => ({ ...prev, imageUrl: mediaUrl, videoUrl: '' }));
      } else {
        setNewBanner(prev => ({ ...prev, videoUrl: mediaUrl, imageUrl: '' }));
      }
    } else if (editingBanner) {
      if (mediaType === 'image') {
        setEditingBanner(prev => prev ? { ...prev, imageUrl: mediaUrl, videoUrl: '' } : null);
      } else {
        setEditingBanner(prev => prev ? { ...prev, videoUrl: mediaUrl, imageUrl: '' } : null);
      }
    }
    
    toast({
      title: `${mediaType === 'image' ? 'Image' : 'Video'} uploaded`,
      description: `Banner ${mediaType} has been uploaded successfully. URL: ${mediaUrl}`,
    });
  };

  const getUploadParameters = async () => {
    try {
      console.log('Requesting upload URL...');
      const response = await apiRequest('/api/objects/upload', 'POST');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload URL request failed:', response.status, errorData);
        throw new Error(`Failed to get upload URL: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload URL response:', data);
      
      if (!data.uploadURL) {
        throw new Error('No upload URL in response');
      }
      
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      toast({
        title: "Upload Error",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateBanner = () => {
    if (!newBanner.title.trim() || !newBanner.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the title and description",
        variant: "destructive",
      });
      return;
    }
    createBannerMutation.mutate(newBanner);
  };

  const handleUpdateBanner = () => {
    if (!editingBanner) return;
    updateBannerMutation.mutate(editingBanner);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Banner Management</h1>
            <p className="text-gray-600">Manage home page banners and promotional content</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-champagne text-navy hover:bg-champagne/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>

        {/* Create Banner Form */}
        {isCreating && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Banner title"
                  />
                </div>
                <div>
                  <Label htmlFor="new-link">Link URL (optional)</Label>
                  <Input
                    id="new-link"
                    value={newBanner.linkUrl}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newBanner.description}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Banner description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Banner Media</Label>
                <div className="mt-2 space-y-4">
                  <RadioGroup value={bannerType} onValueChange={(value: 'image' | 'video') => setBannerType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" />
                      <Label htmlFor="image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Image Banner
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Banner
                      </Label>
                    </div>
                  </RadioGroup>

                  {bannerType === 'image' ? (
                    newBanner.imageUrl ? (
                      <div className="relative">
                        <img
                          src={newBanner.imageUrl}
                          alt="Banner preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => setNewBanner(prev => ({ ...prev, imageUrl: '' }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        uploadType="image"
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(urls) => handleMediaUpload(urls, 'image', true)}
                        buttonClassName="w-full h-32 border-2 border-dashed border-gray-300 hover:border-champagne"
                      >
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload Banner Image</span>
                        </div>
                      </ObjectUploader>
                    )
                  ) : (
                    newBanner.videoUrl ? (
                      <div className="relative">
                        <video
                          src={newBanner.videoUrl}
                          className="w-full h-48 object-cover rounded-lg"
                          autoPlay
                          muted
                          loop
                          controls
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => setNewBanner(prev => ({ ...prev, videoUrl: '' }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={100 * 1024 * 1024} // 100MB for videos
                        uploadType="video"
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(urls) => handleMediaUpload(urls, 'video', true)}
                        buttonClassName="w-full h-32 border-2 border-dashed border-gray-300 hover:border-champagne"
                      >
                        <div className="flex flex-col items-center">
                          <Video className="h-8 w-8 mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload Banner Video</span>
                        </div>
                      </ObjectUploader>
                    )
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-active"
                    checked={newBanner.isActive}
                    onCheckedChange={(checked) => setNewBanner(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="new-active">Active</Label>
                </div>
                <div>
                  <Label htmlFor="new-order">Display Order</Label>
                  <Input
                    id="new-order"
                    type="number"
                    value={newBanner.displayOrder}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                    className="w-20"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateBanner}
                  disabled={createBannerMutation.isPending}
                  className="bg-champagne text-navy hover:bg-champagne/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banners List */}
        <div className="space-y-6">
          {banners.map((banner: Banner) => (
            <Card key={banner.id}>
              <CardContent className="p-6">
                {editingBanner?.id === banner.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`title-${banner.id}`}>Title</Label>
                        <Input
                          id={`title-${banner.id}`}
                          value={editingBanner.title}
                          onChange={(e) => setEditingBanner(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`link-${banner.id}`}>Link URL</Label>
                        <Input
                          id={`link-${banner.id}`}
                          value={editingBanner.linkUrl || ''}
                          onChange={(e) => setEditingBanner(prev => prev ? { ...prev, linkUrl: e.target.value } : null)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`desc-${banner.id}`}>Description</Label>
                      <Textarea
                        id={`desc-${banner.id}`}
                        value={editingBanner.description}
                        onChange={(e) => setEditingBanner(prev => prev ? { ...prev, description: e.target.value } : null)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Banner Media</Label>
                      <div className="mt-2">
                        {editingBanner.imageUrl ? (
                          <div className="relative">
                            <img
                              src={editingBanner.imageUrl}
                              alt="Banner"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 bg-white"
                              onClick={() => setEditingBanner(prev => prev ? { ...prev, imageUrl: '' } : null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : editingBanner.videoUrl ? (
                          <div className="relative">
                            <video
                              src={editingBanner.videoUrl}
                              className="w-full h-48 object-cover rounded-lg"
                              autoPlay
                              muted
                              loop
                              controls
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 bg-white"
                              onClick={() => setEditingBanner(prev => prev ? { ...prev, videoUrl: '' } : null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              uploadType="image"
                              onGetUploadParameters={getUploadParameters}
                              onComplete={(urls) => handleMediaUpload(urls, 'image', false)}
                              buttonClassName="w-full h-16 border-2 border-dashed border-gray-300 hover:border-champagne"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Image className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Upload Image</span>
                              </div>
                            </ObjectUploader>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={100 * 1024 * 1024} // 100MB for videos
                              uploadType="video"
                              onGetUploadParameters={getUploadParameters}
                              onComplete={(urls) => handleMediaUpload(urls, 'video', false)}
                              buttonClassName="w-full h-16 border-2 border-dashed border-gray-300 hover:border-champagne"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Video className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Upload Video</span>
                              </div>
                            </ObjectUploader>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${banner.id}`}
                          checked={editingBanner.isActive}
                          onCheckedChange={(checked) => setEditingBanner(prev => prev ? { ...prev, isActive: checked } : null)}
                        />
                        <Label htmlFor={`active-${banner.id}`}>Active</Label>
                      </div>
                      <div>
                        <Label htmlFor={`order-${banner.id}`}>Display Order</Label>
                        <Input
                          id={`order-${banner.id}`}
                          type="number"
                          value={editingBanner.displayOrder}
                          onChange={(e) => setEditingBanner(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) || 1 } : null)}
                          className="w-20"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpdateBanner}
                        disabled={updateBannerMutation.isPending}
                        className="bg-champagne text-navy hover:bg-champagne/80"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingBanner(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex gap-6">
                    {banner.imageUrl && (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    {banner.videoUrl && (
                      <video
                        src={banner.videoUrl}
                        className="w-48 h-32 object-cover rounded-lg"
                        autoPlay
                        muted
                        loop
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-navy">{banner.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBanner(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBannerMutation.mutate(banner.id)}
                            disabled={deleteBannerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{banner.description}</p>
                      {banner.linkUrl && (
                        <p className="text-sm text-champagne mb-2">
                          Link: <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="underline">{banner.linkUrl}</a>
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Status: {banner.isActive ? '✅ Active' : '❌ Inactive'}</span>
                        <span>Order: {banner.displayOrder}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {banners.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-500 mb-2">No banners yet</h3>
                <p className="text-gray-400 mb-4">Create your first banner to get started</p>
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-champagne text-navy hover:bg-champagne/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Banner
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}