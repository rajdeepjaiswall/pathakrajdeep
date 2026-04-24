import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Upload, Video, Image, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import VideoUploader from '@/components/VideoUploader';

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  placement?: string | null;
}

const PLACEMENTS: { value: string; label: string; description: string }[] = [
  { value: 'hero', label: 'Hero Banner', description: 'Top of homepage — main carousel' },
  { value: 'after_featured', label: 'After Featured Products', description: 'Below the featured products section' },
  { value: 'after_trending', label: 'After Trending', description: 'Below the trending section' },
  { value: 'after_zero_products', label: 'After Zero Products', description: 'Below the deal of the day' },
  { value: 'after_chef_editorial', label: 'After Chef Editorial', description: 'Below the chef editorial section' },
];

const placementLabel = (value: string | null | undefined) => {
  const p = PLACEMENTS.find((x) => x.value === (value || 'hero'));
  return p?.label || 'Hero Banner';
};

export default function AdminBanners() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createPlacement, setCreatePlacement] = useState<string>('hero');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 1,
    placement: 'hero',
  });
  const [bannerType, setBannerType] = useState<'image' | 'video'>('image');

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
      const response = await apiRequest('POST', '/api/admin/banners', bannerData);
      return response.json();
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
        displayOrder: 1,
        placement: createPlacement,
      });
      setBannerType('image');
      toast({
        title: 'Banner created',
        description: 'The new banner has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...bannerData }: any) => {
      const response = await apiRequest('PATCH', `/api/admin/banners/${id}`, bannerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      setEditingBanner(null);
      toast({
        title: 'Banner updated',
        description: 'The banner has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/banners/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      toast({
        title: 'Banner deleted',
        description: 'The banner has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = (file: File, isNew = false) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (isNew) {
        setNewBanner((prev) => ({ ...prev, imageUrl }));
      } else if (editingBanner) {
        setEditingBanner((prev) => (prev ? { ...prev, imageUrl } : null));
      }
      toast({
        title: 'Image uploaded',
        description: 'Banner image has been uploaded successfully',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBanner = () => {
    if (!newBanner.title.trim() || !newBanner.description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the title and description',
        variant: 'destructive',
      });
      return;
    }

    if (!newBanner.imageUrl && !newBanner.videoUrl) {
      toast({
        title: 'Missing content',
        description: 'Please add either an image or video for the banner',
        variant: 'destructive',
      });
      return;
    }

    createBannerMutation.mutate(newBanner);
  };

  const handleUpdateBanner = () => {
    if (!editingBanner) return;
    updateBannerMutation.mutate(editingBanner);
  };

  const startCreating = (placement: string) => {
    setCreatePlacement(placement);
    setNewBanner({
      title: '',
      description: '',
      imageUrl: '',
      videoUrl: '',
      linkUrl: '',
      isActive: true,
      displayOrder: 1,
      placement,
    });
    setBannerType('image');
    setIsCreating(true);
  };

  const toggleGroup = (placement: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [placement]: !prev[placement] }));
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

  // Group banners by placement
  const allBanners = banners as Banner[];
  const grouped: Record<string, Banner[]> = {};
  PLACEMENTS.forEach((p) => {
    grouped[p.value] = [];
  });
  allBanners.forEach((b) => {
    const key = b.placement || 'hero';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.displayOrder - b.displayOrder));

  const renderBannerCard = (banner: Banner) => (
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
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor={`link-${banner.id}`}>Link URL</Label>
                <Input
                  id={`link-${banner.id}`}
                  value={editingBanner.linkUrl || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, linkUrl: e.target.value } : null))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`desc-${banner.id}`}>Description</Label>
              <Textarea
                id={`desc-${banner.id}`}
                value={editingBanner.description}
                onChange={(e) =>
                  setEditingBanner((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`placement-${banner.id}`}>Placement</Label>
              <Select
                value={editingBanner.placement || 'hero'}
                onValueChange={(value) =>
                  setEditingBanner((prev) => (prev ? { ...prev, placement: value } : null))
                }
              >
                <SelectTrigger id={`placement-${banner.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banner Image</Label>
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
                      onClick={() =>
                        setEditingBanner((prev) => (prev ? { ...prev, imageUrl: '' } : null))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor={`image-${banner.id}`} className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-champagne">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload new image</span>
                    </div>
                    <Input
                      id={`image-${banner.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, false);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`active-${banner.id}`}
                  checked={editingBanner.isActive}
                  onCheckedChange={(checked) =>
                    setEditingBanner((prev) => (prev ? { ...prev, isActive: checked } : null))
                  }
                />
                <Label htmlFor={`active-${banner.id}`}>Active</Label>
              </div>
              <div>
                <Label htmlFor={`order-${banner.id}`}>Display Order</Label>
                <Input
                  id={`order-${banner.id}`}
                  type="number"
                  value={editingBanner.displayOrder}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, displayOrder: parseInt(e.target.value) || 1 } : null,
                    )
                  }
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
              <Button variant="outline" onClick={() => setEditingBanner(null)}>
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
              <div className="w-48 h-32 rounded-lg overflow-hidden">
                <video
                  src={banner.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-navy">{banner.title}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingBanner(banner)}>
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
                  Link:{' '}
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {banner.linkUrl}
                  </a>
                </p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Status: {banner.isActive ? 'Active' : 'Inactive'}</span>
                <span>Order: {banner.displayOrder}</span>
                <span>Placement: {placementLabel(banner.placement)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Banner Management</h1>
            <p className="text-gray-600">
              Manage the hero carousel and modular banner blocks across the homepage
            </p>
          </div>
          <Button
            onClick={() => startCreating('hero')}
            className="bg-champagne text-navy hover:bg-champagne/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner Block
          </Button>
        </div>

        {/* Create Banner Form */}
        {isCreating && (
          <Card className="mb-8 border-2 border-champagne">
            <CardHeader>
              <CardTitle>
                Create New Banner — {placementLabel(newBanner.placement)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-placement">Placement</Label>
                <Select
                  value={newBanner.placement}
                  onValueChange={(value) =>
                    setNewBanner((prev) => ({ ...prev, placement: value }))
                  }
                >
                  <SelectTrigger id="new-placement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} — {p.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newBanner.title}
                    onChange={(e) =>
                      setNewBanner((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Banner title"
                  />
                </div>
                <div>
                  <Label htmlFor="new-link">Link URL (optional)</Label>
                  <Input
                    id="new-link"
                    value={newBanner.linkUrl}
                    onChange={(e) =>
                      setNewBanner((prev) => ({ ...prev, linkUrl: e.target.value }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newBanner.description}
                  onChange={(e) =>
                    setNewBanner((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Banner description"
                  rows={3}
                />
              </div>
              {/* Banner Type Selection */}
              <div className="space-y-3">
                <Label>Banner Content</Label>
                <Tabs
                  value={bannerType}
                  onValueChange={(value) => setBannerType(value as 'image' | 'video')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Image Banner
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Banner
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="mt-4">
                    <div className="space-y-3">
                      <div>
                        {newBanner.imageUrl ? (
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
                              onClick={() =>
                                setNewBanner((prev) => ({ ...prev, imageUrl: '' }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="new-image-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-champagne">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Click to upload banner image
                              </span>
                            </div>
                            <Input
                              id="new-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, true);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="mt-4">
                    <div className="space-y-3">
                      <VideoUploader
                        value={newBanner.videoUrl}
                        onChange={(url) =>
                          setNewBanner((prev) => ({ ...prev, videoUrl: url, imageUrl: '' }))
                        }
                        onRemove={() => setNewBanner((prev) => ({ ...prev, videoUrl: '' }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-active"
                    checked={newBanner.isActive}
                    onCheckedChange={(checked) =>
                      setNewBanner((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="new-active">Active</Label>
                </div>
                <div>
                  <Label htmlFor="new-order">Display Order</Label>
                  <Input
                    id="new-order"
                    type="number"
                    value={newBanner.displayOrder}
                    onChange={(e) =>
                      setNewBanner((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value) || 1,
                      }))
                    }
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
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grouped Banner Blocks */}
        <div className="space-y-8">
          {PLACEMENTS.map((p) => {
            const items = grouped[p.value] || [];
            const collapsed = collapsedGroups[p.value];
            const isHero = p.value === 'hero';
            return (
              <div
                key={p.value}
                className={`rounded-xl border-2 ${
                  isHero ? 'border-champagne bg-champagne/5' : 'border-gray-200 bg-white/40'
                } p-4 md:p-6`}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGroup(p.value)}
                    className="flex items-center gap-2 text-left"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-5 w-5 text-navy" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-navy" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-navy">{p.label}</h2>
                        <Badge variant="secondary" className="bg-navy text-white">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{p.description}</p>
                    </div>
                  </button>
                  <Button
                    onClick={() => startCreating(p.value)}
                    variant="outline"
                    size="sm"
                    className="border-champagne text-navy hover:bg-champagne/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to {p.label}
                  </Button>
                </div>

                {!collapsed && (
                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        No banners in this block yet
                      </div>
                    ) : (
                      items.map((banner) => renderBannerCard(banner))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
