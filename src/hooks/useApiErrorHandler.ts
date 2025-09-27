import { useCallback } from 'react';
import { useToastContext } from '../context/toastContextUtils';

interface ApiError {
  error?: {
    code?: string;
    message?: string;
    details?: string;
  };
  message?: string;
}

export const useApiErrorHandler = () => {
  const { showError, showWarning } = useToastContext();

  const handleApiError = useCallback(async (response: Response, fallbackTitle = 'Operation Failed') => {
    try {
      const errorData: ApiError = await response.json();
      
      // Use the structured error message if available
      const errorMessage = errorData.error?.message || errorData.message || 'An unexpected error occurred';
      const errorCode = errorData.error?.code;
      
      // Show different toast types based on error codes
      if (errorCode === 'EXTRACTION_TIMEOUT' || errorCode === 'ACCESS_BLOCKED' || errorCode === 'ROBOTS_BLOCKED') {
        showWarning(fallbackTitle, errorMessage);
      } else {
        showError(fallbackTitle, errorMessage);
      }
      
      return errorMessage;
    } catch {
      // Fallback if response isn't JSON - try to get text
      try {
        const errorText = await response.text();
        const friendlyMessage = getFriendlyErrorMessage(response.status, errorText);
        showError(fallbackTitle, friendlyMessage);
        return friendlyMessage;
      } catch {
        const genericMessage = `${fallbackTitle}: ${response.statusText}`;
        showError(fallbackTitle, genericMessage);
        return genericMessage;
      }
    }
  }, [showError, showWarning]);

  const handleGenericError = useCallback((error: unknown, fallbackTitle = 'Unexpected Error') => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    showError(fallbackTitle, errorMessage);
    return errorMessage;
  }, [showError]);

  return { handleApiError, handleGenericError };
};

// Helper function to convert technical errors to user-friendly messages
function getFriendlyErrorMessage(status: number, errorText: string): string {
  // Check if it's already a user-friendly message
  if (!errorText.toLowerCase().includes('internal server error') && 
      !errorText.toLowerCase().includes('500') &&
      !errorText.toLowerCase().includes('error:') &&
      errorText.length > 10) {
    return errorText;
  }

  // Convert based on status code
  switch (status) {
    case 400:
      return "We couldn't process your request. Please check the URL and try again.";
    case 401:
      return "You need to be logged in to save articles. Please sign in and try again.";
    case 403:
      return "This website is blocking our content extraction. We're constantly working to support more sites.";
    case 404:
      return "The article couldn't be found. Please check the URL and try again.";
    case 408:
      return "The website took too long to respond. Please try again in a moment.";
    case 429:
      return "You've made too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on our end. Please try again in a few moments.";
    case 502:
    case 503:
    case 504:
      return "Our servers are temporarily unavailable. Please try again in a few minutes.";
    default:
      return "We couldn't save this article right now. Please try again or contact support if the problem persists.";
  }
}