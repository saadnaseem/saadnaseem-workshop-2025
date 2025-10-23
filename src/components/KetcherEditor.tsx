import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
// @ts-ignore
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
  clear: () => Promise<void>;
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

    const clear = async () => {
      if (ketcherRef.current) {
        try {
          // Try different approaches to clear the editor
          if (typeof ketcherRef.current.setMolecule === 'function') {
            await ketcherRef.current.setMolecule('');
          } else if (typeof ketcherRef.current.clear === 'function') {
            ketcherRef.current.clear();
          } else if (typeof ketcherRef.current.setKetcher === 'function') {
            ketcherRef.current.setKetcher('');
          } else if (ketcherRef.current.editor) {
            const editor = ketcherRef.current.editor;
            if (typeof editor.setMolecule === 'function') {
              await editor.setMolecule('');
            } else if (typeof editor.clear === 'function') {
              editor.clear();
            }
          } else {
            // Try to set an empty molfile
            const emptyMolfile =
              '\n\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END';
            if (typeof ketcherRef.current.setMolecule === 'function') {
              await ketcherRef.current.setMolecule(emptyMolfile);
            }
          }
        } catch (err) {
          // Silently handle clear errors
        }
      }
    };

    // Expose methods to parent component via ref
    useImperativeHandle(
      ref,
      () => ({
        getSmiles,
        clear,
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
            errorHandler={(ketcherError: any) => {
              setError(
                `Ketcher error: ${ketcherError.message || 'Unknown error'}`
              );
            }}
          />
        )}
      </Box>
    );
  }
);

KetcherEditor.displayName = 'KetcherEditor';

export default KetcherEditor;
