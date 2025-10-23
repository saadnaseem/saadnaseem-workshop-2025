# Chemprop Quick Reference

## Setup Commands

```bash
# Activate environment
conda activate chemprop

# Verify installation
chemprop_train --help
```

## Training Commands

### Basic Training

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --epochs 30 \
    --save_dir model_checkpoint
```

### Quick Test

```bash
chemprop_train \
    --data_path activity_20.csv \
    --dataset_type classification \
    --epochs 1 \
    --save_dir test_model \
    --quiet
```

### Cross-Validation

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --target_columns ACTIVITY \
    --num_folds 5 \
    --save_dir cv_results
```

## Prediction Commands

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
    --preds_path predictions.csv \
    --checkpoint_dir model_checkpoint \
    --uncertainty_method ensemble
```

## Hyperparameter Optimization

### Basic Hyperopt

```bash
chemprop_hyperopt \
    --data_path activity.csv \
    --dataset_type classification \
    --num_iters 20 \
    --config_save_path hyperparameters.json
```

### Using Optimized Parameters

```bash
chemprop_train \
    --data_path activity.csv \
    --dataset_type classification \
    --config_path hyperparameters.json \
    --save_dir optimized_model
```

## Common Parameters

### Data Parameters

- `--data_path`: Input CSV file
- `--dataset_type`: `classification`, `regression`, `multiclass`
- `--target_columns`: Column name(s) with target values
- `--split_sizes`: Train/val/test ratios (default: 0.8 0.1 0.1)

### Model Parameters

- `--hidden_size`: Hidden layer size (default: 300)
- `--depth`: Message passing steps (default: 3)
- `--dropout`: Dropout probability (default: 0.0)
- `--batch_size`: Batch size (default: 50)

### Training Parameters

- `--epochs`: Training epochs (default: 30)
- `--ensemble_size`: Number of models (default: 1)
- `--num_folds`: Cross-validation folds (default: 1)

## Data Format

```csv
SMILES,ACTIVITY
OC(C(C)=O)C,0
CC(C)CC1=CC=C(C=C1)C(C)C(=O)O,1
```

## Troubleshooting Quick Fixes

### NumPy Error

```python
# In chemprop/chemprop/train/run_training.py, line 8:
warnings.filterwarnings("ignore", category=Warning)
```

### PyTorch Error

```python
# In chemprop/chemprop/utils.py, all torch.load calls:
torch.load(path, map_location=lambda storage, loc: storage, weights_only=False)
```

### Memory Issues

```bash
--batch_size 25 --hidden_size 150
```

### GPU Issues

```bash
--no_cuda  # Use CPU
--gpu 0    # Use specific GPU
```
