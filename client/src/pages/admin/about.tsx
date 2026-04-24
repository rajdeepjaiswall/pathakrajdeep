import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import type { AboutSection } from '@shared/schema';

const SECTION_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'hero', label: 'Hero', description: 'Big top banner with title, subtitle, image carousel and CTA' },
  { value: 'founder', label: 'Founder / Legacy', description: 'Circular portrait + quote — one card per section' },
  { value: 'story', label: 'Story', description: 'Image grid (up to 4) on one side and a written story on the other' },
  { value: 'gallery', label: 'Image Grid', description: 'Multi-image gallery with optional heading and CTA' },
  { value: 'team', label: 'Team / Workplace', description: 'Hero image, secondary image and a quote card' },
];

const sectionLabel = (t: string) => SECTION_TYPES.find((s) => s.value === t)?.label || t;
const sectionDescription = (t: string) => SECTION_TYPES.find((s) => s.value === t)?.description || '';

type FormState = {
  sectionType: string;
  title: string;
  subtitle: string;
  description: string;
  media: string[];
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  displayOrder: number;
};

const emptyForm = (sectionType = 'hero', displayOrder = 0): FormState => ({
  sectionType,
  title: '',
  subtitle: '',
  description: '',
  media: [],
  ctaText: '',
  ctaLink: '',
  isActive: true,
  displayOrder,
});

const friendlyAuthError = (error: any) => {
  const msg = error?.message || '';
  if (msg.startsWith('401')) return 'Your admin session has expired. Please log in again.';
  if (msg.startsWith('403')) return 'You do not have permission to do this.';
  return msg || 'Something went wrong. Please try again.';
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AdminAbout() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [mediaInput, setMediaInput] = useState('');

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

  const { data: sections = [], isLoading } = useQuery<AboutSection[]>({
    queryKey: ['/api/admin/about-sections'],
  });

  const sortedSections = [...sections].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const nextOrder = sortedSections.length
    ? Math.max(...sortedSections.map((s) => s.displayOrder ?? 0)) + 1
    : 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/about-sections'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-sections'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      const res = await apiRequest('POST', '/api/admin/about-sections', data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Section added', description: 'The new section is live.' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Could not add section', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => {
      const res = await apiRequest('PATCH', `/api/admin/about-sections/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Section saved' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Could not save section', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/about-sections/${id}`);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Section deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Could not delete section', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const toggleActive = (s: AboutSection) => {
    updateMutation.mutate({ id: s.id, data: { isActive: !s.isActive } as any });
  };

  const moveSection = (s: AboutSection, dir: -1 | 1) => {
    const idx = sortedSections.findIndex((x) => x.id === s.id);
    const swap = sortedSections[idx + dir];
    if (!swap) return;
    updateMutation.mutate({ id: s.id, data: { displayOrder: swap.displayOrder ?? 0 } as any });
    updateMutation.mutate({ id: swap.id, data: { displayOrder: s.displayOrder ?? 0 } as any });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm('hero', nextOrder));
    setMediaInput('');
    setDialogOpen(true);
  };

  const openEdit = (s: AboutSection) => {
    setEditingId(s.id);
    setForm({
      sectionType: s.sectionType,
      title: s.title || '',
      subtitle: s.subtitle || '',
      description: s.description || '',
      media: (s.media || []).filter((m) => typeof m === 'string'),
      ctaText: s.ctaText || '',
      ctaLink: s.ctaLink || '',
      isActive: s.isActive ?? true,
      displayOrder: s.displayOrder ?? 0,
    });
    setMediaInput('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setMediaInput('');
  };

  const onMediaFile = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, media: [...prev.media, dataUrl] }));
    } catch (e) {
      toast({ title: 'Could not read image', variant: 'destructive' });
    }
  };

  const addMediaUrl = () => {
    const v = mediaInput.trim();
    if (!v) return;
    setForm((prev) => ({ ...prev, media: [...prev.media, v] }));
    setMediaInput('');
  };

  const removeMedia = (i: number) => {
    setForm((prev) => ({ ...prev, media: prev.media.filter((_, idx) => idx !== i) }));
  };

  const moveMedia = (i: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.media];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...prev, media: next };
    });
  };

  const saveForm = () => {
    if (!form.sectionType) {
      toast({ title: 'Pick a section type', variant: 'destructive' });
      return;
    }
    const payload = { ...form };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const helperFor = (type: string) => {
    switch (type) {
      case 'hero':
        return 'Use a short subtitle (e.g. "Honoring Our Origins"), a big title, a one-line description and a CTA. Add 1–3 background images for the carousel.';
      case 'founder':
        return 'Title = founder name. Subtitle = role / year. Description = the quote (no need for quote marks). Upload one portrait image.';
      case 'story':
        return 'Add up to 4 images (they will fall into a 2-column collage). Use the description for the body text — line breaks are kept.';
      case 'gallery':
        return 'Upload as many images as you like. The first one becomes a large feature card.';
      case 'team':
        return 'Subtitle format: "100+ — Master Bakers" (number, em dash, label). Use ||| in the description to split body text and the quote card text.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#47160b]">About Us Editor</h1>
            <p className="text-sm text-[#534340] mt-1">
              Build the public About Us page section by section. Only active sections with content are shown.
            </p>
          </div>
          <Button onClick={openCreate} className="bg-[#47160b] hover:bg-[#632b1e] text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedSections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ImageIcon className="w-10 h-10 mx-auto text-[#9b4518] mb-3" />
              <p className="text-[#47160b] font-bold text-lg mb-1">No sections yet</p>
              <p className="text-[#534340] text-sm mb-6">
                Add your first section to start building the About Us page.
              </p>
              <Button onClick={openCreate} className="bg-[#47160b] hover:bg-[#632b1e] text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedSections.map((s, idx) => (
              <Card key={s.id} data-testid={`about-section-${s.id}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {s.media && s.media[0] ? (
                      <img
                        src={s.media[0]}
                        alt=""
                        className="w-full sm:w-24 h-24 object-cover rounded-lg bg-[#efe7e1]"
                      />
                    ) : (
                      <div className="w-full sm:w-24 h-24 rounded-lg bg-[#efe7e1] flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-[#9b4518]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className="bg-[#9b4518] text-white hover:bg-[#9b4518]">
                          {sectionLabel(s.sectionType)}
                        </Badge>
                        <span className="text-xs text-[#534340]">
                          Order {s.displayOrder ?? 0} · {(s.media || []).length} media
                        </span>
                        {!s.isActive && (
                          <Badge variant="outline" className="border-[#534340] text-[#534340]">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold text-[#47160b] truncate">
                        {s.title || <span className="italic text-[#86736f]">(no title)</span>}
                      </p>
                      {s.subtitle && (
                        <p className="text-sm text-[#534340] truncate">{s.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveSection(s, -1)}
                        disabled={idx === 0 || updateMutation.isPending}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveSection(s, 1)}
                        disabled={idx === sortedSections.length - 1 || updateMutation.isPending}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2 px-2">
                        <Switch
                          checked={s.isActive ?? true}
                          onCheckedChange={() => toggleActive(s)}
                          aria-label="Toggle active"
                        />
                        {s.isActive ? (
                          <Eye className="w-4 h-4 text-[#9b4518]" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[#86736f]" />
                        )}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)} title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Delete this section? This cannot be undone.')) {
                            deleteMutation.mutate(s.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Section' : 'Add Section'}</DialogTitle>
            <DialogDescription>
              Sections only appear on the About Us page when they are active and have content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Section Type</Label>
              <Select
                value={form.sectionType}
                onValueChange={(v) => setForm((p) => ({ ...p, sectionType: v }))}
                disabled={!!editingId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.label}</span>
                        <span className="text-xs text-gray-500">{t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#534340] mt-1.5">{helperFor(form.sectionType)}</p>
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Two Generations of Sweet Tradition"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="e.g. Honoring Our Origins"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Body text — line breaks are preserved"
                rows={5}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Media (images)</Label>
              <div className="mt-1 space-y-2">
                {form.media.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {form.media.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt=""
                          className="w-full h-20 object-cover rounded-md bg-[#efe7e1] border"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => moveMedia(i, -1)}
                            disabled={i === 0}
                            className="bg-black/60 text-white rounded p-0.5 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMedia(i, 1)}
                            disabled={i === form.media.length - 1}
                            className="bg-black/60 text-white rounded p-0.5 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Paste an image URL"
                    value={mediaInput}
                    onChange={(e) => setMediaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMediaUrl();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addMediaUrl}>
                    Add
                  </Button>
                </div>

                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#d8c2bd] rounded-md cursor-pointer hover:bg-[#f5ece7] transition-colors">
                  <ImageIcon className="w-4 h-4 text-[#9b4518]" />
                  <span className="text-sm text-[#534340]">Or upload an image from your device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onMediaFile(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>CTA Text (optional)</Label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                  placeholder="e.g. See Our Journey"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>CTA Link (optional)</Label>
                <Input
                  value={form.ctaLink}
                  onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="e.g. /products"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, displayOrder: parseInt(e.target.value || '0', 10) }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                />
                <Label>Active (visible on site)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={saveForm}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#47160b] hover:bg-[#632b1e] text-white"
            >
              {editingId ? 'Save Changes' : 'Add Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
