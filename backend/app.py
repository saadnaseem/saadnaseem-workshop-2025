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
        # Use full conda path to avoid shell initialization issues
        conda_path = "/Users/snaseem/miniconda3/bin/conda"
        cmd = [
            "bash", "-c",
            f"source {conda_path.replace('/bin/conda', '/etc/profile.d/conda.sh')} && "
            f"conda activate {CONDA_ENV_NAME} && "
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
