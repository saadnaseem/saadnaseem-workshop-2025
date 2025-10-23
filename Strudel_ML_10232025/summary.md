# Chemprop Molecular Property Prediction Repository Summary

## Overview

This repository contains a **Chemprop-based machine learning system** for predicting molecular properties, specifically focused on **binary classification of substrate utilization by Pseudomonas putida**. The system uses Message Passing Neural Networks (MPNNs) enhanced with RDKit molecular descriptors to predict whether a given compound will be utilized by the bacterium.

## What This Repository Does

### Primary Function

- **Binary Classification**: Predicts whether a compound (represented by SMILES) will be utilized by _P. putida_ (1 = utilized, 0 = not utilized)
- **Molecular Property Prediction**: Uses graph neural networks to learn structure-activity relationships
- **Ensemble Learning**: Employs multiple models (10 ensemble members) for robust predictions

### Key Components

1. **Training Pipeline**: Trains MPNN models on molecular structure data
2. **Prediction System**: Makes predictions on new compounds using trained models
3. **Feature Engineering**: Combines graph-based features with RDKit 2D descriptors
4. **Model Evaluation**: Comprehensive performance analysis with multiple metrics

## Current Model Performance

### Performance Metrics

- **AUPRC**: 0.8814 (Excellent performance)
- **AUROC**: 0.8681 (Good performance)
- **F1-score**: 0.8302 at optimal threshold (0.52)
- **Accuracy**: 82.7% on test set
- **Test Samples**: 52 molecules with balanced classes (27 positive, 25 negative)

### Dataset Information

- **Training Data**: 209 molecules (`activity_80.csv`)
- **Test Data**: 52 molecules (`activity_20.csv`)
- **Class Distribution**: ~53.6% positive vs 46.4% negative (well-balanced)
- **Data Source**: Phenotype microarray data from PM1 & PM2A plates

## How to Run Predictions on New Compounds

### Prerequisites

1. **Environment Setup**:

   ```bash
   conda activate chemprop
   ```

2. **Data Format**: Your CSV file must have this structure:
   ```csv
   SMILES,ACTIVITY
   OC(C(C)=O)C,0
   CC(C)CC1=CC=C(C=C1)C(C)C(=O)O,1
   ```

### Method 1: Command Line Prediction (Recommended)

#### Basic Prediction

```bash
chemprop_predict \
    --test_path your_compounds.csv \
    --preds_path predictions.csv \
    --checkpoint_dir chemprop/checkpoints_rdkit
```

#### Prediction with Uncertainty Estimation

```bash
chemprop_predict \
    --test_path your_compounds.csv \
    --preds_path predictions_with_uncertainty.csv \
    --checkpoint_dir chemprop/checkpoints_rdkit \
    --uncertainty_method ensemble
```

#### Individual Model Predictions

```bash
chemprop_predict \
    --test_path your_compounds.csv \
    --preds_path individual_predictions.csv \
    --checkpoint_dir chemprop/checkpoints_rdkit \
    --individual_ensemble_predictions
```

### Method 2: Python Script Prediction

```python
import chemprop

# Prepare your SMILES data
smiles = [['CCC'], ['CCCC'], ['OCC']]  # List of lists

# Set up arguments
arguments = [
    '--test_path', '/dev/null',
    '--preds_path', '/dev/null',
    '--checkpoint_dir', 'chemprop/checkpoints_rdkit'
]

# Make predictions
args = chemprop.args.PredictArgs().parse_args(arguments)
preds = chemprop.train.make_predictions(args=args, smiles=smiles)
```

### Method 3: Preloaded Model (Efficient for Multiple Predictions)

```python
import chemprop

# Load model once
arguments = [
    '--test_path', '/dev/null',
    '--preds_path', '/dev/null',
    '--checkpoint_dir', 'chemprop/checkpoints_rdkit'
]
args = chemprop.args.PredictArgs().parse_args(arguments)
model_objects = chemprop.train.load_model(args=args)

# Make multiple predictions efficiently
smiles_batch1 = [['CCC'], ['CCCC'], ['OCC']]
preds1 = chemprop.train.make_predictions(args=args, smiles=smiles_batch1, model_objects=model_objects)

smiles_batch2 = [['CCCC'], ['CCCCC'], ['COCC']]
preds2 = chemprop.train.make_predictions(args=args, smiles=smiles_batch2, model_objects=model_objects)
```

## Model Architecture Details

### Neural Network Configuration

- **Model Type**: Directed Message Passing Neural Network (D-MPNN)
- **Message Passing Depth**: 5 layers
- **Hidden Size**: 700 dimensions
- **Dropout**: 0.05
- **Ensemble Size**: 10 models (seeds 0-9)
- **Features**: RDKit 2D normalized descriptors + graph features

### Training Configuration

- **Epochs**: 30 with early stopping
- **Loss Function**: Binary cross-entropy
- **Optimizer**: Adam with learning rate scheduling
- **Batch Size**: 50 molecules
- **Hardware**: CPU-based training

## File Structure

```
/Users/snaseem/Coding/Strudel_ML_10232025/
├── activity.csv                    # Full dataset (261 molecules)
├── activity_20.csv                 # Test dataset (52 molecules)
├── activity_shuffled.csv           # Shuffled dataset
├── chemprop/                       # Chemprop installation
│   ├── activity_80.csv            # Training dataset (209 molecules)
│   ├── checkpoints_rdkit/         # Trained model checkpoints
│   │   ├── 0/                    # Model 0 checkpoint
│   │   ├── 1/                    # Model 1 checkpoint
│   │   └── ...                   # Models 2-9 checkpoints
│   ├── test_20_results_rdkit.csv  # Model predictions on test set
│   └── eval_V1.ipynb             # Evaluation notebook
├── README_CHEMPROP_SETUP.md       # Detailed setup guide
├── CHEMPROP_QUICK_REFERENCE.md    # Quick command reference
└── readme_07312025_V2.md         # Session documentation
```

## Key Commands Reference

### Training Commands

```bash
# Basic training
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --epochs 30 \
    --save_dir model_checkpoint

# Quick test training
chemprop_train \
    --data_path activity_20.csv \
    --dataset_type classification \
    --epochs 1 \
    --save_dir test_model \
    --quiet
```

### Prediction Commands

```bash
# Basic prediction
chemprop_predict \
    --test_path new_compounds.csv \
    --preds_path predictions.csv \
    --checkpoint_dir chemprop/checkpoints_rdkit

# Prediction with uncertainty
chemprop_predict \
    --test_path new_compounds.csv \
    --preds_path predictions.csv \
    --checkpoint_dir chemprop/checkpoints_rdkit \
    --uncertainty_method ensemble
```

### Hyperparameter Optimization

```bash
# Basic hyperopt
chemprop_hyperopt \
    --data_path activity.csv \
    --dataset_type classification \
    --num_iters 20 \
    --config_save_path hyperparameters.json
```

## Output Interpretation

### Prediction Output Format

The prediction output CSV will contain:

- **SMILES**: Original molecular structure
- **ACTIVITY**: Predicted probability (0.0 to 1.0)
- **Additional columns**: If using uncertainty methods

### Probability Interpretation

- **Values close to 1.0**: High confidence that compound will be utilized
- **Values close to 0.0**: High confidence that compound will NOT be utilized
- **Values around 0.5**: Uncertain prediction
- **Optimal threshold**: 0.52 for binary classification

## Troubleshooting

### Common Issues

1. **NumPy Compatibility Error**: Apply compatibility fix in `chemprop/chemprop/train/run_training.py`
2. **PyTorch Loading Error**: Add `weights_only=False` to `torch.load()` calls
3. **Memory Issues**: Reduce batch size with `--batch_size 25`
4. **Data Format Error**: Ensure CSV has `SMILES` and target columns

### Performance Tips

- Use `--cache_cutoff 1000` for large datasets
- Increase `--num_workers` for faster data loading
- Use `--no_cuda` if GPU issues occur

## Biological Insights

### Substrate Utilization Patterns

- **Alcohols**: 100% utilization rate (universal)
- **Aromatic compounds**: 66.7% utilization rate (specialized)
- **Amino acids**: 59.1% utilization rate (selective)
- **Carbohydrates**: 21.6% utilization rate (limited)
- **Organic acids**: 37.5% utilization rate (moderate)

### Model Strengths

- Excellent performance on diverse molecular classes
- Robust ensemble approach reduces prediction variance
- Biological relevance confirmed by utilization patterns
- Practical applications for biotechnology and strain development

## Next Steps for Improvement

1. **Hyperparameter Optimization**: Expected +0.03-0.05 AUROC improvement
2. **Ensemble Expansion**: Increase to 15+ models for enhanced stability
3. **Advanced Features**: Morgan fingerprints, 3D descriptors
4. **Multi-task Learning**: Predict growth rates and yields simultaneously
5. **Transfer Learning**: Pre-train on ChEMBL bioactivity data

## Contact and Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify data format matches requirements
3. Ensure compatibility fixes are applied
4. Review the detailed documentation in `README_CHEMPROP_SETUP.md`

---

**Repository Status**: ✅ **Fully functional with trained models ready for predictions**  
**Last Updated**: January 31, 2025  
**Model Performance**: Excellent (AUPRC: 0.8814, AUROC: 0.8681)
