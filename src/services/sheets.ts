import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report } from '../types';

export const SHEETS_URL_KEY = '@monev_sheets_webhook_url';
export const DEFAULT_WEBHOOK_URL = process.env.EXPO_PUBLIC_SHEETS_WEBHOOK_URL || '';

/**
 * Get stored Google Apps Script Webhook URL
 */
export const getSheetsWebhookUrl = async (): Promise<string> => {
  try {
    const url = await AsyncStorage.getItem(SHEETS_URL_KEY);
    return url || DEFAULT_WEBHOOK_URL;
  } catch (error) {
    console.error('Failed to get Google Sheets Webhook URL:', error);
    return DEFAULT_WEBHOOK_URL;
  }
};


/**
 * Save Google Apps Script Webhook URL
 */
export const saveSheetsWebhookUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SHEETS_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save Google Sheets Webhook URL:', error);
    throw error;
  }
};

/**
 * Backup report data to Google Sheets via Apps Script Web App Webhook
 */
export const backupToGoogleSheets = async (report: Report): Promise<boolean> => {
  try {
    const webhookUrl = await getSheetsWebhookUrl();

    if (!webhookUrl) {
      console.warn('Google Sheets Webhook URL is not configured.');
      // Return false if URL is not configured yet
      return false;
    }

    // Google Apps Script Web App expects JSON payload
    // Using text/plain content-type avoids CORS preflight issues with Apps Script
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        id: report.id,
        date: report.date,
        rawInput: report.rawInput,
        activity: report.activity,
        learning: report.learning,
        obstacle: report.obstacle,
        createdAt: report.createdAt,
      }),
    });

    if (!response.ok) {
      console.error('Google Sheets backup HTTP error:', response.status);
      return false;
    }

    const result = await response.json();
    return result.status === 'success' || result.success === true;
  } catch (error) {
    console.error('Google Sheets backup error:', error);
    return false;
  }
};

