# Chemprop Prediction Backend

This directory contains the Flask backend server for integrating the `easy_run2.py` prediction script with the React frontend.

## Quick Start

1. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Ensure conda environment exists**:

   ```bash
   conda create -n chemprop python=3.11 -y
   conda activate chemprop
   pip install -e .
   pip install rdkit scikit-learn matplotlib seaborn pandas numpy
   pip install descriptastorus
   ```

3. **Run the server**:

   ```bash
   python run_server.py
   ```

   Or directly:

   ```bash
   python app.py
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/predict` - Submit SMILES for prediction

## Configuration

The server is configured to:

- Run on port 5000
- Accept CORS requests from common development ports
- Execute predictions in the `chemprop` conda environment
- Use the Chemprop script at `Strudel_ML_10232025/chemprop/easy_run2.py`

See `FRONTEND_INTEGRATION_INSTRUCTIONS.md` for complete integration details.
