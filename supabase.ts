import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://cgzypavgkpiklnzvjoxt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjA1NTgsImV4cCI6MjA2NzczNjU1OH0.okPQKEt1HSK8fxeOTgW7Iv6Qv96gayvOAVo1x9vRDdY'; // مختصر هنا

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // مهم جدًا في React Native
  },
});
