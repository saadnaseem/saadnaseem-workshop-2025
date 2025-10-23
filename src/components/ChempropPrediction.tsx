import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import KetcherEditor, { KetcherEditorRef } from './KetcherEditor';
import {
  predictionService,
  PredictionResponse,
} from '../services/predictionService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ChempropPrediction: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [smilesInput, setSmilesInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ketcherEditorRef = useRef<KetcherEditorRef>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setResult(null);
  };

  const handleSubmitFromDrawing = async () => {
    if (!ketcherEditorRef.current) {
      setError('Chemical editor not initialized');
      return;
    }

    try {
      const smiles = await ketcherEditorRef.current.getSmiles();
      if (!smiles) {
        setError('No structure drawn. Please draw a molecule first.');
        return;
      }

      await runPrediction(smiles);
    } catch (err) {
      setError('Failed to get SMILES from structure editor');
    }
  };

  const handleSubmitFromText = async () => {
    if (!smilesInput.trim()) {
      setError('Please enter a SMILES string');
      return;
    }

    await runPrediction(smilesInput.trim());
  };

  const runPrediction = async (smiles: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await predictionService.predict(smiles);
      setResult(response);

      if (!response.success) {
        setError(response.error || 'Prediction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Substrate Prediction via Graph Neural Networks
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Predict whether Pseudomonas putida can utilize a given substrate using
        our trained Chemprop models. You can either draw a molecular structure
        or input a SMILES string directly.
      </Typography>

      {/* Model Predictor Image - Below the text */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center', // 'flex-start', 'center', 'flex-end'
          mb: 3, // Margin bottom - adjust spacing below image
          // Size adjustments - modify these values to change image size
          width: 'fit-content', // Adjusts to image size
          // Alternative: set specific width like '300px', '400px', etc.
        }}
      >
        <img
          src="/model_predictor.png"
          alt="Model Predictor"
          style={{
            // Size adjustments - modify these values to change image size
            width: '600px', // Doubled from 300px to 600px
            height: 'auto', // Change to specific height if needed (e.g., '200px')
            objectFit: 'contain', // 'contain', 'cover', 'fill', 'scale-down', 'none'
            borderRadius: '8px', // Optional: rounded corners
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Optional: subtle shadow
            transform: 'translateX(300px)', // Move image 20px to the right
          }}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Draw Structure" />
            <Tab label="Enter SMILES" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="subtitle1" gutterBottom>
            Draw Your Molecular Structure
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use the chemical structure editor below to draw molecules. Click
            "Submit" when done.
          </Typography>

          <KetcherEditor ref={ketcherEditorRef} height="500px" />

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmitFromDrawing}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Running Prediction...' : 'Submit Structure'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle1" gutterBottom>
            Enter SMILES String
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a SMILES string directly (e.g., "CCO" for ethanol).
          </Typography>

          <TextField
            fullWidth
            label="SMILES String"
            value={smilesInput}
            onChange={(e) => setSmilesInput(e.target.value)}
            placeholder="e.g., CCO, CC(C)O, c1ccccc1"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleSubmitFromText}
            disabled={isLoading || !smilesInput.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Running Prediction...' : 'Submit SMILES'}
          </Button>
        </TabPanel>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prediction Results
            </Typography>

            {result.success ? (
              <Box>
                {result.prediction !== undefined && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Prediction Probability: {result.prediction.toFixed(3)}
                    </Typography>
                    <Typography variant="body2">
                      {result.prediction >= 0.8
                        ? 'High confidence - Likely to be actively utilized'
                        : result.prediction <= 0.2
                          ? 'Low confidence - Likely to be inactive'
                          : 'Uncertain - Moderate activity predicted'}
                    </Typography>
                  </Alert>
                )}

                <Typography variant="subtitle2" gutterBottom>
                  Detailed Output:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: 400,
                  }}
                >
                  {result.output}
                </Paper>
              </Box>
            ) : (
              <Alert severity="error">
                <Typography variant="subtitle2">Prediction Failed</Typography>
                <Typography variant="body2">{result.error}</Typography>
                {result.output && (
                  <Paper
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    {result.output}
                  </Paper>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ChempropPrediction;
