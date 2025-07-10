
'use server';
/**
 * @fileOverview An AI flow for predicting future cumulative profit based on historical data.
 *
 * - predictProfit - A function that handles the profit prediction.
 * - PredictProfitInput - The input type for the predictProfit function.
 * - PredictProfitOutput - The return type for the predictProfit function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addDays, addMonths, addYears, format } from 'date-fns';

const TradeDataPointSchema = z.object({
    date: z.string().describe('The closing date of the trade.'),
    cumulativeProfit: z.number().describe('The cumulative profit at that point in time.'),
});

const PredictProfitInputSchema = z.object({
  history: z.array(TradeDataPointSchema).describe('The historical cumulative profit data, sorted chronologically.'),
  duration: z.enum(['1W', '1M', '3M', '1Y']).describe('The duration for the prediction.'),
});
export type PredictProfitInput = z.infer<typeof PredictProfitInputSchema>;

const PredictionPointSchema = z.object({
    name: z.string().describe("The label for the data point (e.g., 'Prediction 1')."),
    date: z.string().describe('The predicted future date in yyyy-MM-dd format.'),
    predictedProfit: z.number().describe('The predicted cumulative profit for that date.'),
});

const PredictProfitOutputSchema = z.object({
  prediction: z.array(PredictionPointSchema).describe('An array of predicted future profit points.'),
});
export type PredictProfitOutput = z.infer<typeof PredictProfitOutputSchema>;

export async function predictProfit(input: PredictProfitInput): Promise<PredictProfitOutput> {
  return predictProfitFlow(input);
}

// Helper to get future date based on duration
function getFutureDate(startDate: Date, duration: '1W' | '1M' | '3M' | '1Y'): Date {
    switch (duration) {
        case '1W': return addDays(startDate, 7);
        case '1M': return addMonths(startDate, 1);
        case '3M': return addMonths(startDate, 3);
        case '1Y': return addYears(startDate, 1);
    }
}

const prompt = ai.definePrompt({
  name: 'predictProfitPrompt',
  input: { schema: z.object({ 
      formattedHistory: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      lastProfit: z.number(),
    }) 
  },
  output: { schema: PredictProfitOutputSchema },
  prompt: `You are a financial analyst specializing in time-series forecasting.
Your task is to predict the cumulative profit trajectory based on the provided historical data.

Analyze the trends, volatility, and patterns in the historical data to make a realistic projection. The prediction should consist of 10-15 data points.

The last known cumulative profit is {{lastProfit}}. Your prediction should start from there.

Historical Data:
{{formattedHistory}}

Predict the cumulative profit from {{startDate}} to {{endDate}}.
The output should be a series of data points, each with a date and a predicted cumulative profit value. Do not just return a single final value; provide the progression.
The name for each point should be 'Prediction 1', 'Prediction 2', etc.
The date format for each prediction point must be 'yyyy-MM-dd'.`,
});

const predictProfitFlow = ai.defineFlow(
  {
    name: 'predictProfitFlow',
    inputSchema: PredictProfitInputSchema,
    outputSchema: PredictProfitOutputSchema,
  },
  async ({ history, duration }) => {
    if (history.length < 2) {
      // Not enough data to make a prediction
      return { prediction: [] };
    }

    const lastDataPoint = history[history.length - 1];
    const startDate = new Date(lastDataPoint.date);
    const endDate = getFutureDate(startDate, duration);
    
    // Format history for the prompt
    const formattedHistory = history.map(p => `${p.date}: $${p.cumulativeProfit.toFixed(2)}`).join('\n');

    const { output } = await prompt({
        formattedHistory,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        lastProfit: lastDataPoint.cumulativeProfit,
    });
    
    return output!;
  }
);
