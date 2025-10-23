# Frontend Integration Instructions for Chemprop Prediction

## Overview

This document provides comprehensive instructions for integrating the existing React frontend with the `easy_run2.py` prediction script. The integration uses a Flask backend server that executes the Chemprop prediction script and returns results to the React frontend.

### Architecture

- **Frontend**: React/Vite application (existing)
- **Backend**: Flask server with subprocess execution
- **Prediction Script**: `easy_run2.py` in conda environment
- **Communication**: REST API with JSON payloads
- **Deployment**: Backend and frontend can run on different servers

## Backend Setup (Flask)

### 1. Directory Structure

Create the following backend structure:

```
backend/
├── app.py
├── requirements.txt
└── run_server.py
```

### 2. Requirements File

Create `backend/requirements.txt`:

```txt
Flask==2.3.3
Flask-CORS==4.0.0
python-dotenv==1.0.0
```

### 3. Flask Application

Create `backend/app.py`:

```python
#!/usr/bin/env python3
"""
Flask backend for Chemprop prediction integration.
Executes easy_run2.py script and returns results to frontend.
"""

import os
import subprocess
import json
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app, origins=["http://localhost:5175", "http://localhost:3000", "http://localhost:5173"])

# Configuration
CHEMPROP_BASE_PATH = "/Users/snaseem/Coding/saadnaseem-workshop-2025/Strudel_ML_10232025"
EASY_RUN_SCRIPT = "chemprop/easy_run2.py"
CONDA_ENV_NAME = "chemprop"

def validate_smiles(smiles):
    """Basic SMILES validation."""
    if not smiles or not smiles.strip():
        return False, "SMILES string cannot be empty"

    smiles = smiles.strip()
    if len(smiles) < 1:
        return False, "SMILES string too short"

    # Basic character validation (can be enhanced)
    allowed_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789()[]{}@=#+-\\/")
    if not all(c in allowed_chars for c in smiles):
        return False, "SMILES contains invalid characters"

    return True, smiles

def run_prediction(smiles):
    """Execute easy_run2.py prediction script."""
    try:
        # Validate SMILES
        is_valid, result = validate_smiles(smiles)
        if not is_valid:
            return {
                "success": False,
                "error": f"SMILES validation failed: {result}",
                "output": "",
                "prediction": None
            }

        validated_smiles = result

        # Construct the command
        script_path = os.path.join(CHEMPROP_BASE_PATH, EASY_RUN_SCRIPT)

        # Command to activate conda environment and run prediction
        cmd = [
            "bash", "-c",
            f"source ~/.bashrc && conda activate {CONDA_ENV_NAME} && "
            f"cd {CHEMPROP_BASE_PATH} && "
            f"python {EASY_RUN_SCRIPT} --smiles '{validated_smiles}'"
        ]

        # Execute the command
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=CHEMPROP_BASE_PATH
        )

        # Parse output
        stdout = process.stdout
        stderr = process.stderr

        if process.returncode == 0:
            # Success - extract prediction probability if possible
            prediction_prob = None
            lines = stdout.split('\n')
            for line in lines:
                if 'Probability:' in line:
                    try:
                        # Extract probability value
                        prob_str = line.split('Probability:')[1].strip()
                        prediction_prob = float(prob_str)
                        break
                    except (ValueError, IndexError):
                        pass

            return {
                "success": True,
                "error": None,
                "output": stdout,
                "prediction": prediction_prob
            }
        else:
            # Error occurred
            error_msg = stderr if stderr else "Unknown error occurred"
            return {
                "success": False,
                "error": f"Prediction failed (exit code {process.returncode}): {error_msg}",
                "output": stdout,
                "prediction": None
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Prediction timed out after 5 minutes",
            "output": "",
            "prediction": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "output": "",
            "prediction": None
        }

@app.route('/api/predict', methods=['POST'])
def predict():
    """Main prediction endpoint."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided",
                "output": "",
                "prediction": None
            }), 400

        smiles = data.get('smiles')
        if not smiles:
            return jsonify({
                "success": False,
                "error": "SMILES string is required",
                "output": "",
                "prediction": None
            }), 400

        # Run prediction
        result = run_prediction(smiles)

        # Return appropriate HTTP status
        status_code = 200 if result["success"] else 500
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}",
            "output": "",
            "prediction": None
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "message": "Chemprop prediction service is running"
    })

if __name__ == '__main__':
    # Check if chemprop environment exists
    try:
        result = subprocess.run(['conda', 'env', 'list'],
                              capture_output=True, text=True, check=True)
        if CONDA_ENV_NAME not in result.stdout:
            print(f"⚠️  Warning: Conda environment '{CONDA_ENV_NAME}' not found")
            print(f"Please create it with: conda create -n {CONDA_ENV_NAME} python=3.11 -y")
    except:
        print("⚠️  Warning: Could not check conda environments")

    print("🚀 Starting Chemprop prediction server...")
    print(f"📁 Chemprop base path: {CHEMPROP_BASE_PATH}")
    print(f"🧪 Script path: {os.path.join(CHEMPROP_BASE_PATH, EASY_RUN_SCRIPT)}")
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 4. Server Runner

Create `backend/run_server.py`:

```python
#!/usr/bin/env python3
"""
Convenience script to run the Flask server with proper environment setup.
"""

import os
import sys
import subprocess

def check_conda_environment():
    """Check if chemprop conda environment exists."""
    try:
        result = subprocess.run(['conda', 'env', 'list'],
                              capture_output=True, text=True, check=True)
        return 'chemprop' in result.stdout
    except:
        return False

def main():
    print("🧪 Chemprop Prediction Server")
    print("=" * 40)

    if not check_conda_environment():
        print("❌ Conda environment 'chemprop' not found!")
        print("Please create it first:")
        print("  conda create -n chemprop python=3.11 -y")
        print("  conda activate chemprop")
        print("  pip install -e .")
        print("  pip install rdkit scikit-learn matplotlib seaborn pandas numpy")
        print("  pip install descriptastorus")
        sys.exit(1)

    print("✅ Conda environment 'chemprop' found")
    print("🚀 Starting Flask server...")

    # Run the Flask app
    os.system("python app.py")

if __name__ == "__main__":
    main()
```

## Frontend Integration

### 1. Environment Configuration

Create `.env.local` in the frontend root:

```env
VITE_API_URL=http://localhost:5000
```

### 2. API Service

Create `src/services/predictionService.ts`:

```typescript
/**
 * Service for communicating with the Chemprop prediction backend
 */

export interface PredictionRequest {
  smiles: string;
}

export interface PredictionResponse {
  success: boolean;
  error?: string;
  output: string;
  prediction?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const predictionService = {
  /**
   * Submit a SMILES string for prediction
   */
  async predict(smiles: string): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ smiles }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        output: '',
        prediction: undefined,
      };
    }
  },

  /**
   * Check if the backend service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
```

### 3. Prediction Component

Create `src/components/ChempropPrediction.tsx`:

```typescript
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
import { predictionService, PredictionResponse } from '../services/predictionService';

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
        Chemprop Substrate Utilization Prediction
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Predict whether Pseudomonas putida can utilize a given substrate using our trained Chemprop models.
        You can either draw a molecular structure or input a SMILES string directly.
      </Typography>

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
            Use the chemical structure editor below to draw molecules. Click "Submit" when done.
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
                        ? "High confidence - Likely to be actively utilized"
                        : result.prediction <= 0.2
                        ? "Low confidence - Likely to be inactive"
                        : "Uncertain - Moderate activity predicted"
                      }
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
                    maxHeight: 400
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
                      maxHeight: 200
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
```

## Input/Output Specifications

### API Request Format

**Endpoint**: `POST /api/predict`

**Request Body**:

```json
{
  "smiles": "CCO"
}
```

**Request Headers**:

```
Content-Type: application/json
```

### API Response Format

**Success Response** (HTTP 200):

```json
{
  "success": true,
  "error": null,
  "output": "🧪 Chemprop Easy Run Prediction Script\n==================================================\n✅ Conda environment 'chemprop' is active\n📁 Validating SMILES: CCO\n✅ SMILES validated: CCO\n🔍 Checking model checkpoints...\n✅ All 10 model checkpoints found\n🔬 Starting predictions...\n📊 Processing SMILES: CCO\n🧠 Running ensemble predictions...\n✅ Prediction completed\n📈 Prediction Summary:\n   SMILES: CCO\n   Probability: 0.856\n   Confidence: High confidence (≥0.8)\n🔍 Prediction Result:\n   CCO                              → 0.856\n💡 Interpretation:\n   This compound is predicted to be ACTIVELY utilized by Pseudomonas putida\n🎉 Prediction completed successfully!",
  "prediction": 0.856
}
```

**Error Response** (HTTP 500):

```json
{
  "success": false,
  "error": "SMILES validation failed: SMILES string cannot be empty",
  "output": "",
  "prediction": null
}
```

## Error Handling

### Common Error Scenarios

1. **Conda Environment Not Activated**

   - Error: "Prediction failed (exit code 1): ⚠️ Currently in conda environment 'base', not 'chemprop'"
   - Solution: Ensure `conda activate chemprop` is run before starting Flask server

2. **Invalid SMILES Input**

   - Error: "SMILES validation failed: SMILES contains invalid characters"
   - Solution: Validate SMILES format before submission

3. **Missing Model Checkpoints**

   - Error: "❌ Model checkpoint directory not found: checkpoints_rdkit"
   - Solution: Ensure model training is completed and checkpoints exist

4. **Network/Connection Errors**

   - Error: "Failed to fetch"
   - Solution: Check backend server is running and CORS is configured

5. **Timeout Errors**
   - Error: "Prediction timed out after 5 minutes"
   - Solution: Increase timeout or optimize model performance

### Frontend Error Handling

The React component handles errors at multiple levels:

```typescript
// Network errors
try {
  const response = await predictionService.predict(smiles);
} catch (err) {
  setError('Network error: Unable to connect to prediction service');
}

// API errors
if (!response.success) {
  setError(response.error || 'Prediction failed');
}

// Validation errors
if (!smiles.trim()) {
  setError('Please enter a SMILES string');
}
```

## Testing Instructions

### 1. Backend Testing

Test the backend independently using curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Valid prediction
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"smiles": "CCO"}'

# Invalid SMILES
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"smiles": ""}'
```

### 2. Frontend Testing

1. Start the backend server:

   ```bash
   cd backend
   python run_server.py
   ```

2. Start the frontend development server:

   ```bash
   npm run dev
   ```

3. Navigate to the prediction component and test:
   - Draw a molecule using Ketcher editor
   - Enter SMILES strings directly
   - Test error scenarios (empty input, invalid SMILES)

### 3. Example SMILES for Testing

From `easy_run2.py` examples:

- `"CCO"` - Ethanol (should work)
- `"CC(C)O"` - Isopropanol (should work)
- `"c1ccccc1"` - Benzene (aromatic)
- `""` - Empty string (should fail validation)
- `"invalid_smiles"` - Invalid format (should fail)

## Deployment Considerations

### 1. Backend Server Configuration

**Production Flask Configuration** (`backend/app.py`):

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

**Environment Variables**:

```bash
export FLASK_ENV=production
export CHEMPROP_BASE_PATH=/path/to/Strudel_ML_10232025
```

### 2. Frontend Configuration

**Environment Variables** (`.env.production`):

```env
VITE_API_URL=https://your-backend-domain.com
```

**Build Configuration** (`vite.config.ts`):

```typescript
export default defineConfig({
  // ... existing config
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
});
```

### 3. CORS Configuration

**Production CORS** (`backend/app.py`):

```python
CORS(app, origins=[
    "https://your-frontend-domain.com",
    "https://your-production-domain.com"
])
```

### 4. System Service Configuration

**systemd service** (`/etc/systemd/system/chemprop-prediction.service`):

```ini
[Unit]
Description=Chemprop Prediction Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
Environment=PATH=/path/to/miniconda3/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/path/to/miniconda3/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5. Conda Environment Activation

**Supervisor Configuration** (`/etc/supervisor/conf.d/chemprop.conf`):

```ini
[program:chemprop-prediction]
command=/path/to/miniconda3/bin/python app.py
directory=/path/to/backend
user=your-user
autostart=true
autorestart=true
environment=PATH="/path/to/miniconda3/bin:%(ENV_PATH)s"
```

## Security Considerations

1. **Input Validation**: SMILES strings are validated on both frontend and backend
2. **CORS**: Configure allowed origins for production
3. **Rate Limiting**: Consider implementing rate limiting for production use
4. **Authentication**: Add API key authentication if needed
5. **Subprocess Security**: SMILES input is properly escaped in subprocess calls

## Troubleshooting

### Common Issues

1. **"Conda environment not found"**

   - Solution: Run `conda create -n chemprop python=3.11 -y` and install dependencies

2. **"Module not found: chemprop"**

   - Solution: Install chemprop in the conda environment: `pip install -e .`

3. **CORS errors in browser**

   - Solution: Check CORS configuration in Flask app and ensure frontend URL is allowed

4. **Prediction timeout**

   - Solution: Increase timeout value or check model performance

5. **Frontend can't connect to backend**
   - Solution: Verify `VITE_API_URL` environment variable and backend server status

### Debug Mode

Enable debug logging in Flask:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

Check backend logs for detailed error information.

---

This integration provides a complete solution for connecting the React frontend with the Chemprop prediction script, including proper error handling, testing procedures, and deployment considerations.
