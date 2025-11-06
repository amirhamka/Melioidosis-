import { EVResult, TornadoResult, GraphModelForAPI } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const analyzeRollback = async (
  model: GraphModelForAPI,
  variables: { [key: string]: number }
): Promise<EVResult> => {
  const response = await fetch(`${API_BASE_URL}/analyze/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, variables }),
  });
  if (!response.ok) {
    const errorDetail = await response.json();
    throw new Error(`Analysis failed: ${errorDetail.detail}`);
  }
  return response.json() as Promise<EVResult>;
};

export const analyzeSensitivity = async (
  model: GraphModelForAPI,
  variables: { [key: string]: number }
): Promise<TornadoResult> => {
  const response = await fetch(`${API_BASE_URL}/analyze/sensitivity-oneway`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, variables }),
  });
  if (!response.ok) {
    const errorDetail = await response.json();
    throw new Error(`Analysis failed: ${errorDetail.detail}`);
  }
  return response.json() as Promise<TornadoResult>;
};
