import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  onUploadComplete: (videoUrl: string) => void;
  maxFileSize?: number;
  buttonClassName?: string;
  children?: React.ReactNode;
}

export function VideoUploader({
  onUploadComplete,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  buttonClassName,
  children
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File Too Large",
        description: `Please select a video file smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    console.log('Starting video upload:', file.name, file.type, file.size);

    try {
      // Get upload URL
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await response.json();
      console.log('Got upload URL:', uploadURL);

      // Upload file directly to the signed URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Extract the base URL (without query parameters)
      const baseUrl = uploadURL.split('?')[0];
      console.log('Upload successful, base URL:', baseUrl);

      // Convert to our object endpoint format
      const url = new URL(baseUrl);
      const pathParts = url.pathname.split('/');
      const objectId = pathParts[pathParts.length - 1];
      const videoUrl = `/objects/uploads/${objectId}`;
      
      console.log('Converted to object URL:', videoUrl);
      onUploadComplete(videoUrl);

      toast({
        title: "Video Uploaded",
        description: "Your video has been uploaded successfully.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.flv,.wmv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={buttonClassName}
      >
        {uploading ? (
          <>
            <Upload className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : children ? (
          children
        ) : (
          <>
            <Video className="h-4 w-4 mr-2" />
            Upload Video
          </>
        )}
      </Button>
    </div>
  );
}