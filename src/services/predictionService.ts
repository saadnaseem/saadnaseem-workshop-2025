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
