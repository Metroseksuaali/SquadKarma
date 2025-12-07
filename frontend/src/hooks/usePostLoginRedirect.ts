// src/hooks/usePostLoginRedirect.ts
// Hook for handling post-login redirect to intended destination

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Hook that handles redirecting users back to their intended destination
 * after successful Steam login.
 * 
 * Checks for:
 * 1. URL parameter indicating successful login
 * 2. Stored redirect path in sessionStorage
 * 
 * Cleans up URL and storage after processing.
 */
export function usePostLoginRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const loginStatus = searchParams.get('login');

    if (loginStatus === 'success') {
      // Get stored redirect destination
      const redirectPath = sessionStorage.getItem('authRedirect');

      // Clean up storage
      sessionStorage.removeItem('authRedirect');

      // Clean up URL params
      searchParams.delete('login');
      setSearchParams(searchParams, { replace: true });

      // Navigate to intended destination or stay on current page
      if (redirectPath && redirectPath !== window.location.pathname) {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, navigate]);
}
