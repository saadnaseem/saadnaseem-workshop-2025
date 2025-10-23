import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import KetcherEditor, { KetcherEditorRef } from './KetcherEditor';

interface StructureSketchProps {
  onSmilesChange?: (smiles: string) => void;
}

const StructureSketch: React.FC<StructureSketchProps> = ({
  onSmilesChange,
}) => {
  const [smiles, setSmiles] = useState<string>('');
  const [inputSmiles, setInputSmiles] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [inputMode, setInputMode] = useState<'draw' | 'text'>('draw');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const ketcherEditorRef = useRef<KetcherEditorRef>(null);

  // Common SMILES examples
  const exampleSmiles = [
    { name: 'Benzene', smiles: 'c1ccccc1' },
    { name: 'Ethanol', smiles: 'CCO' },
    { name: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
    { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
    { name: 'Water', smiles: 'O' },
    { name: 'Methane', smiles: 'C' },
  ];

  const validateSmiles = (smilesString: string): boolean => {
    // Basic SMILES validation - check for common patterns
    if (!smilesString.trim()) return false;

    // Check for valid characters in SMILES
    const validChars = /^[A-Za-z0-9@+\-\[\]()=#\\\/\\*:;.,]+$/;
    if (!validChars.test(smilesString)) return false;

    // Check for balanced parentheses and brackets
    const openParens = (smilesString.match(/\(/g) || []).length;
    const closeParens = (smilesString.match(/\)/g) || []).length;
    const openBrackets = (smilesString.match(/\[/g) || []).length;
    const closeBrackets = (smilesString.match(/\]/g) || []).length;

    return openParens === closeParens && openBrackets === closeBrackets;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputSmiles(value);
    const valid = validateSmiles(value);
    setIsValid(valid);
  };

  const handleConvert = () => {
    if (validateSmiles(inputSmiles)) {
      setSmiles(inputSmiles);
      setIsValid(true);
      onSmilesChange?.(inputSmiles);
    } else {
      setIsValid(false);
    }
  };

  const handleSubmitFromDrawing = async () => {
    if (!ketcherEditorRef.current) {
      setConversionError(
        'Chemical structure editor is not ready. Please wait for it to load.'
      );
      return;
    }

    setIsConverting(true);
    setConversionError(null);

    try {
      const smilesFromDrawing = await ketcherEditorRef.current.getSmiles();

      if (!smilesFromDrawing || smilesFromDrawing.trim() === '') {
        setConversionError(
          'No structure drawn. Please draw a chemical structure first.'
        );
        return;
      }

      setSmiles(smilesFromDrawing);
      setIsValid(true);
      onSmilesChange?.(smilesFromDrawing);
    } catch (error) {
      setConversionError(
        'Failed to convert structure to SMILES. Please try again.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopySmiles = () => {
    if (smiles) {
      navigator.clipboard.writeText(smiles);
    }
  };

  const handleClear = () => {
    setSmiles('');
    setInputSmiles('');
    setIsValid(null);
    setConversionError(null);
    onSmilesChange?.('');
  };

  const handleExampleClick = (exampleSmilesString: string) => {
    setInputSmiles(exampleSmilesString);
    setIsValid(true);
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: 'draw' | 'text'
  ) => {
    setInputMode(newValue);
    setConversionError(null); // Clear any conversion errors when switching tabs
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px' }}>
      <Typography variant="h6" gutterBottom>
        Structure to SMILES Converter
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Draw a chemical structure or enter a SMILES string to work with
        molecular structures. SMILES (Simplified Molecular Input Line Entry
        System) is a chemical notation system.
      </Typography>

      {/* Mode Selection Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={inputMode} onChange={handleTabChange}>
          <Tab
            icon={<DrawIcon />}
            iconPosition="start"
            label="Draw Structure"
            value="draw"
          />
          <Tab
            icon={<TextFieldsIcon />}
            iconPosition="start"
            label="Text Input"
            value="text"
          />
        </Tabs>
      </Box>

      {/* Drawing Mode */}
      {inputMode === 'draw' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Draw Your Structure
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use the chemical structure editor below to draw molecules. Click
              "Submit" when done to convert to SMILES.
            </Typography>

            {/* Show conversion error if any */}
            {conversionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {conversionError}
              </Alert>
            )}

            <KetcherEditor ref={ketcherEditorRef} height="500px" />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmitFromDrawing}
                disabled={isConverting}
                startIcon={isConverting ? <CircularProgress size={20} /> : null}
              >
                {isConverting ? 'Converting...' : 'Submit'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <>
          {/* Input Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Enter SMILES String
              </Typography>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <TextField
                  value={inputSmiles}
                  onChange={handleInputChange}
                  placeholder="e.g., c1ccccc1 (benzene)"
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={isValid === false}
                  helperText={
                    isValid === false
                      ? 'Invalid SMILES format. Check parentheses, brackets, and characters.'
                      : isValid === true
                        ? 'Valid SMILES format'
                        : 'Enter a SMILES string to validate'
                  }
                />
                <Button
                  variant="contained"
                  onClick={handleConvert}
                  disabled={!inputSmiles.trim()}
                >
                  Validate
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Examples Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Common Examples
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {exampleSmiles.map((example, index) => (
                  <Chip
                    key={index}
                    label={`${example.name}: ${example.smiles}`}
                    onClick={() => handleExampleClick(example.smiles)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {/* Output Section - Shown for both modes */}
      {smiles && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              SMILES Output
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Valid SMILES string processed successfully!
            </Alert>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                value={smiles}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  },
                }}
              />
              <Button variant="outlined" onClick={handleCopySmiles}>
                Copy
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={handleClear}>
          Clear All
        </Button>
      </Stack>
    </Box>
  );
};

export default StructureSketch;
