
import { createClient } from '@supabase/supabase-js';

// استخدام المفاتيح التي تم تزويدنا بها
const supabaseUrl = 'https://psdzyzdqyeioaflbhitj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZHp5emRxeWVpb2FmbGJoaXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjQ1NjgsImV4cCI6MjA4MDQ0MDU2OH0.1TRUw2D10mFDTGAe9ExN-Vg43yLNoYHAPWhbyv0YjyY';

export const supabase = createClient(supabaseUrl, supabaseKey);
