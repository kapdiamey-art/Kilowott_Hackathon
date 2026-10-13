import { Toaster, toast } from 'react-hot-toast';

export { toast };

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#18181b',
          color: '#f4f4f5',
          fontSize: '13px',
          fontWeight: 500,
          borderRadius: '10px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          padding: '10px 16px',
        },
        success: {
          iconTheme: { primary: '#6366f1', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
}
