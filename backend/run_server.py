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
