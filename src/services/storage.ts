import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report } from '../types';

const STORAGE_KEY = '@monev_reports';

export const saveReportLocal = async (report: Report): Promise<void> => {
  try {
    const existingReports = await getReportsLocal();
    const updatedReports = [report, ...existingReports];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
  } catch (error) {
    console.error('Failed to save report locally', error);
    throw error;
  }
};

export const getReportsLocal = async (): Promise<Report[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to fetch local reports', error);
    return [];
  }
};

export const deleteReportLocal = async (id: string): Promise<void> => {
  try {
    const existingReports = await getReportsLocal();
    const updatedReports = existingReports.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
  } catch (error) {
    console.error('Failed to delete local report', error);
    throw error;
  }
};
