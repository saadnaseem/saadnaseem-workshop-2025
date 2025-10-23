# Chemprop Setup and Usage Guide

This guide provides detailed instructions for setting up and using Chemprop for molecular property prediction with biological activity data.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Data Preparation](#data-preparation)
4. [Training Models](#training-models)
5. [Making Predictions](#making-predictions)
6. [Hyperparameter Optimization](#hyperparameter-optimization)
7. [Troubleshooting](#troubleshooting)
8. [Example Workflow](#example-workflow)

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Python**: 3.7 or higher (tested with Python 3.11)
- **Memory**: At least 8GB RAM recommended
- **Storage**: At least 2GB free space

### Required Software

- **Conda/Miniconda**: For environment management
- **Git**: For cloning repositories (optional)

## Installation

### Step 1: Clone or Download Chemprop

```bash
# Option 1: Clone the repository
git clone https://github.com/chemprop/chemprop.git
cd chemprop

# Option 2: Download and extract the zip file
# Then navigate to the chemprop directory
cd chemprop
```

### Step 2: Create Conda Environment

```bash
# Create a new conda environment
conda create -n chemprop python=3.11

# Activate the environment
conda activate chemprop
```

### Step 3: Install Dependencies

```bash
# Install PyTorch (CPU version - change to CUDA if you have GPU)
conda install pytorch torchvision torchaudio -c pytorch

# Install RDKit
conda install -c conda-forge rdkit

# Install other dependencies
pip install hyperopt matplotlib pandas scikit-learn tensorboardX tqdm typed-argument-parser flask werkzeug

# Install descriptastorus for molecular descriptors
pip install descriptastorus
```

### Step 4: Install Chemprop

```bash
# Install chemprop in development mode
pip install -e .
```

### Step 5: Apply Compatibility Fixes

Due to compatibility issues with newer versions of NumPy and PyTorch, apply these fixes:

#### Fix 1: NumPy Compatibility

Edit `chemprop/chemprop/train/run_training.py`:

```python
# Find line 8 and change:
warnings.filterwarnings("ignore", category=np.VisibleDeprecationWarning)
# To:
warnings.filterwarnings("ignore", category=Warning)
```

#### Fix 2: PyTorch Compatibility

Edit `chemprop/chemprop/utils.py` and add `weights_only=False` to all `torch.load()` calls:

```python
# Change all instances of:
torch.load(path, map_location=lambda storage, loc: storage)
# To:
torch.load(path, map_location=lambda storage, loc: storage, weights_only=False)
```

### Step 6: Verify Installation

```bash
# Test if chemprop commands work
chemprop_train --help
chemprop_predict --help
chemprop_hyperopt --help
```

## Data Preparation

### Data Format Requirements

Your CSV file should have the following structure:

```csv
SMILES,ACTIVITY
OC(C(C)=O)C,0
CC(C)CC1=CC=C(C=C1)C(C)C(=O)O,1
CC(C)(C)CC1=CC=C(C=C1)C(C)C(=O)O,0
...
```

### Required Columns

- **SMILES**: Molecular structure in SMILES format
- **Target Column(s)**: Your biological activity values (e.g., ACTIVITY)

### Data Types

- **Classification**: Binary (0/1) or multiclass values
- **Regression**: Continuous numerical values
- **Multiclass**: Multiple discrete classes

### Example Data Files

- `activity.csv`: Full dataset
- `activity_20.csv`: Small subset for testing
- `activity_shuffled.csv`: Shuffled version

## Training Models

### Basic Training Command

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --epochs 30 \
    --save_dir model_checkpoint \
    --split_type random \
    --split_sizes 0.8 0.1 0.1
```

### Key Parameters Explained

#### Data Parameters

- `--data_path`: Path to your CSV file
- `--dataset_type`: `classification`, `regression`, or `multiclass`
- `--target_columns`: Column name(s) containing target values
- `--split_sizes`: Train/validation/test split ratios

#### Model Parameters

- `--hidden_size`: Size of hidden layers (default: 300)
- `--depth`: Number of message passing steps (default: 3)
- `--dropout`: Dropout probability (default: 0.0)
- `--batch_size`: Batch size for training (default: 50)

#### Training Parameters

- `--epochs`: Number of training epochs (default: 30)
- `--init_lr`: Initial learning rate (default: 0.0001)
- `--max_lr`: Maximum learning rate (default: 0.001)
- `--final_lr`: Final learning rate (default: 0.0001)

### Advanced Training Options

#### Cross-Validation

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --num_folds 5 \
    --save_dir cv_results
```

#### Feature Generation

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --features_generator morgan rdkit_2d \
    --save_dir model_with_features
```

#### Ensemble Training

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --ensemble_size 5 \
    --save_dir ensemble_model
```

## Making Predictions

### Basic Prediction

```bash
chemprop_predict \
    --test_path new_compounds.csv \
    --preds_path predictions.csv \
    --checkpoint_dir model_checkpoint
```

### Prediction with Uncertainty

```bash
chemprop_predict \
    --test_path new_compounds.csv \
    --preds_path predictions_with_uncertainty.csv \
    --checkpoint_dir model_checkpoint \
    --uncertainty_method ensemble
```

### Key Prediction Parameters

- `--test_path`: Path to CSV file with new compounds
- `--preds_path`: Output file for predictions
- `--checkpoint_dir`: Directory containing trained model(s)
- `--uncertainty_method`: Method for uncertainty estimation

## Hyperparameter Optimization

### Basic Hyperopt

```bash
chemprop_hyperopt \
    --data_path activity.csv \
    --dataset_type classification \
    --num_iters 20 \
    --config_save_path hyperparameters.json
```

### Advanced Hyperopt

```bash
chemprop_hyperopt \
    --data_path activity.csv \
    --dataset_type classification \
    --num_iters 50 \
    --config_save_path best_hyperparameters.json \
    --epochs 10 \
    --num_folds 3
```

### Using Optimized Hyperparameters

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --config_path hyperparameters.json \
    --save_dir optimized_model
```

## Troubleshooting

### Common Issues and Solutions

#### 1. NumPy Compatibility Error

**Error**: `AttributeError: module 'numpy' has no attribute 'VisibleDeprecationWarning'`

**Solution**: Apply the NumPy compatibility fix described in Installation Step 5.

#### 2. PyTorch Loading Error

**Error**: `Weights only load failed. This file can still be loaded...`

**Solution**: Apply the PyTorch compatibility fix described in Installation Step 5.

#### 3. Memory Issues

**Error**: Out of memory errors during training

**Solutions**:

- Reduce batch size: `--batch_size 25`
- Reduce hidden size: `--hidden_size 150`
- Use smaller dataset for testing

#### 4. Data Format Issues

**Error**: `ValueError: Regression data targets must be more than just 0 or 1`

**Solution**: Use `--dataset_type classification` for binary data (0/1 values).

#### 5. CUDA/GPU Issues

**Error**: CUDA-related errors

**Solutions**:

- Use CPU: `--no_cuda`
- Specify GPU: `--gpu 0`
- Check GPU memory availability

### Performance Optimization Tips

#### For Large Datasets

- Use `--cache_cutoff 1000` for datasets > 10,000 compounds
- Increase `--num_workers` for faster data loading
- Use `--batch_size` appropriate for your GPU memory

#### For Better Results

- Use cross-validation: `--num_folds 5`
- Try different split types: `--split_type scaffold_balanced`
- Experiment with feature generation
- Use ensemble models: `--ensemble_size 5`

## Example Workflow

### Complete Workflow Example

#### Step 1: Prepare Data

```bash
# Ensure your data is in the correct format
head -5 activity.csv
# Should show: SMILES,ACTIVITY
```

#### Step 2: Hyperparameter Optimization

```bash
chemprop_hyperopt \
    --data_path activity.csv \
    --dataset_type classification \
    --num_iters 20 \
    --config_save_path best_params.json
```

#### Step 3: Train Final Model

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --config_path best_params.json \
    --save_dir final_model \
    --ensemble_size 5
```

#### Step 4: Make Predictions

```bash
chemprop_predict \
    --test_path new_compounds.csv \
    --preds_path predictions.csv \
    --checkpoint_dir final_model
```

#### Step 5: Evaluate Results

```bash
# Check prediction file
head -10 predictions.csv

# Check model performance metrics
cat final_model/test_scores.json
```

### Quick Test Workflow

```bash
# Test with small dataset
chemprop_train \
    --data_path activity_20.csv \
    --dataset_type classification \
    --epochs 1 \
    --save_dir test_model \
    --quiet

# Test prediction
chemprop_predict \
    --test_path activity_20.csv \
    --preds_path test_predictions.csv \
    --checkpoint_dir test_model
```

## File Structure

```
biolog_data_V6/
├── activity.csv              # Main dataset
├── activity_20.csv           # Small test dataset
├── activity_shuffled.csv     # Shuffled dataset
├── chemprop/                 # Chemprop installation
├── README_CHEMPROP_SETUP.md # This file
└── eval_V1.ipynb            # Evaluation notebook
```

## Additional Resources

### Documentation

- [Chemprop Documentation](https://chemprop.readthedocs.io/)
- [GitHub Repository](https://github.com/chemprop/chemprop)

### Useful Commands

```bash
# Check chemprop version
pip show chemprop

# List all available commands
ls chemprop/chemprop/train/

# Get help for any command
chemprop_train --help
chemprop_predict --help
chemprop_hyperopt --help
```

### Environment Management

```bash
# Activate environment
conda activate chemprop

# Deactivate environment
conda deactivate

# List installed packages
conda list

# Update packages
conda update --all
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your data format matches requirements
3. Ensure all compatibility fixes are applied
4. Check the chemprop documentation
5. Review error messages carefully for specific guidance

---

**Note**: This setup has been tested with Python 3.11, PyTorch 2.7.1, and NumPy 1.26.4. Compatibility fixes have been applied for these versions.
