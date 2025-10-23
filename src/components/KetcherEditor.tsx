import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import { Editor } from 'ketcher-react';
import 'ketcher-react/dist/index.css';
import { Box, CircularProgress, Alert } from '@mui/material';

interface KetcherEditorProps {
  onSmilesChange?: (smiles: string) => void;
  height?: string | number;
}

export interface KetcherEditorRef {
  getSmiles: () => Promise<string>;
}

const KetcherEditor = forwardRef<KetcherEditorRef, KetcherEditorProps>(
  ({ onSmilesChange, height = '600px' }, ref) => {
    const [structServiceProvider, setStructServiceProvider] =
      useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const ketcherRef = useRef<any>(null);

    useEffect(() => {
      const initKetcher = async () => {
        try {
          setIsLoading(true);
          const provider = new StandaloneStructServiceProvider();
          setStructServiceProvider(provider);
          setIsLoading(false);
        } catch (err) {
          setError('Failed to initialize chemical structure editor');
          setIsLoading(false);
        }
      };

      initKetcher();
    }, []);

    const getSmiles = async (): Promise<string> => {
      if (ketcherRef.current) {
        try {
          const smiles = await ketcherRef.current.getSmiles();
          if (onSmilesChange) {
            onSmilesChange(smiles);
          }
          return smiles;
        } catch (err) {
          throw new Error('Failed to convert structure to SMILES');
        }
      }
      throw new Error('Ketcher editor not initialized');
    };

    // Expose getSmiles method to parent component via ref
    useImperativeHandle(
      ref,
      () => ({
        getSmiles,
      }),
      []
    );

    if (isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: height,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          height: height,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
          '& .Ketcher-root': {
            height: '100%',
          },
        }}
      >
        {structServiceProvider && (
          <Editor
            staticResourcesUrl=""
            structServiceProvider={structServiceProvider}
            onInit={(ketcher: any) => {
              ketcherRef.current = ketcher;
            }}
          />
        )}
      </Box>
    );
  }
);

KetcherEditor.displayName = 'KetcherEditor';

export default KetcherEditor;
