import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
// CSS imports are handled via CDN or external stylesheets
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  uploadType?: 'image' | 'video' | 'any';
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (urls: string[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  uploadType = 'any',
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Get file type restrictions based on upload type
  const getFileTypes = () => {
    switch (uploadType) {
      case 'image':
        return ['image/*'];
      case 'video':
        return ['video/*', '.mp4', '.webm', '.ogg', '.mov', '.avi'];
      default:
        return undefined;
    }
  };

  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: getFileTypes(),
      },
      autoProceed: false,
      debug: true,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          try {
            console.log('Getting upload parameters for file:', file.name, file.type, file.size);
            const params = await onGetUploadParameters();
            console.log('Upload parameters received:', params);
            return {
              method: params.method,
              url: params.url,
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
              }
            };
          } catch (error) {
            console.error('Error getting upload parameters:', error);
            throw error;
          }
        },
      })
      .on("complete", (result) => {
        console.log('Upload complete:', result);
        if (result.successful && result.successful.length > 0) {
          // Extract uploaded URLs from the upload response
          const uploadedUrls = result.successful.map(file => {
            console.log('Processing uploaded file:', file);
            
            // For Google Cloud Storage signed URLs, we need to construct the public URL
            if (file.uploadURL) {
              // Remove query parameters from the signed URL to get the base object URL
              const baseUrl = file.uploadURL.split('?')[0];
              console.log('Base URL extracted:', baseUrl);
              return baseUrl;
            }
            
            // Fallback: try to extract from response
            if (file.response && file.response.uploadURL) {
              return file.response.uploadURL.split('?')[0];
            }
            
            console.warn('Could not extract URL from file:', file);
            return '';
          }).filter(Boolean);
          console.log('Extracted URLs:', uploadedUrls);
          onComplete?.(uploadedUrls);
        }
        setShowModal(false);
      })
      .on("upload-error", (file, error) => {
        console.error('Upload error for file:', file?.name, error);
      })
      .on("restriction-failed", (file, error) => {
        console.error('Restriction failed for file:', file?.name, error);
      });

    return uppyInstance;
  });

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}