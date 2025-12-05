import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    setLocation('/admin/login');
    return null;
  }

  const [settings, setSettings] = useState({
    fast2smsApiKey: localStorage.getItem('fast2sms_api_key') || '',
    fast2smsSenderId: localStorage.getItem('fast2sms_sender_id') || 'GETDWN',
    fast2smsTemplateId: localStorage.getItem('fast2sms_template_id') || '148245',
  });

  const handleSaveSettings = async () => {
    if (!settings.fast2smsApiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Fast2SMS API Key is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage (for client-side reference)
      localStorage.setItem('fast2sms_api_key', settings.fast2smsApiKey);
      localStorage.setItem('fast2sms_sender_id', settings.fast2smsSenderId);
      localStorage.setItem('fast2sms_template_id', settings.fast2smsTemplateId);

      toast({
        title: 'Success',
        description: 'Fast2SMS WhatsApp settings saved successfully. OTP messages will be sent via WhatsApp.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-cream">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy mb-2">Admin Settings</h1>
          <p className="text-gray-600">Configure your Fast2SMS WhatsApp integration</p>
        </div>

        {/* Fast2SMS Configuration Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-champagne to-cream border-b">
            <CardTitle className="text-navy flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Fast2SMS WhatsApp Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* API Key Input */}
              <div>
                <Label htmlFor="apiKey" className="text-navy font-semibold mb-2 block">
                  Fast2SMS API Key *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Fast2SMS API key"
                  value={settings.fast2smsApiKey}
                  onChange={(e) => setSettings({ ...settings, fast2smsApiKey: e.target.value })}
                  className="border-2 border-gray-200 focus:border-champagne"
                  data-testid="input-fast2sms-api-key"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Your API key is used to authenticate with Fast2SMS WhatsApp service. Get it from your Fast2SMS dashboard.
                </p>
              </div>

              {/* Sender ID Input */}
              <div>
                <Label htmlFor="senderId" className="text-navy font-semibold mb-2 block">
                  Sender ID
                </Label>
                <Input
                  id="senderId"
                  type="text"
                  placeholder="e.g., GETDWN"
                  value={settings.fast2smsSenderId}
                  onChange={(e) => setSettings({ ...settings, fast2smsSenderId: e.target.value })}
                  className="border-2 border-gray-200 focus:border-champagne"
                  data-testid="input-sender-id"
                />
                <p className="text-sm text-gray-500 mt-2">
                  The WhatsApp sender ID registered with Fast2SMS.
                </p>
              </div>

              {/* Template ID Input */}
              <div>
                <Label htmlFor="templateId" className="text-navy font-semibold mb-2 block">
                  DLT Template ID
                </Label>
                <Input
                  id="templateId"
                  type="text"
                  placeholder="e.g., 148245"
                  value={settings.fast2smsTemplateId}
                  onChange={(e) => setSettings({ ...settings, fast2smsTemplateId: e.target.value })}
                  className="border-2 border-gray-200 focus:border-champagne"
                  data-testid="input-template-id"
                />
                <p className="text-sm text-gray-500 mt-2">
                  The approved DLT template ID for OTP messages on Fast2SMS.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">WhatsApp OTP Format</p>
                    <p>Messages will be sent in format: <code className="bg-blue-100 px-2 py-1 rounded">CustomerName|OTP|</code></p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 flex items-center justify-center gap-2"
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status Card */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-navy flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              API Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {settings.fast2smsApiKey ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                    API Key configured and ready to use
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-orange-600 rounded-full"></span>
                    API Key not configured yet
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                Once configured, OTP verification messages will be sent to customers' WhatsApp during checkout.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info Card */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-navy">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              value={JSON.stringify({
                apiKeyConfigured: !!settings.fast2smsApiKey,
                senderId: settings.fast2smsSenderId,
                templateId: settings.fast2smsTemplateId,
                timestamp: new Date().toISOString(),
              }, null, 2)}
              readOnly
              className="bg-gray-100 text-xs font-mono"
              rows={6}
              data-testid="textarea-debug-info"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
