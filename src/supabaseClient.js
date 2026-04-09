import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dopdfkzrqpimobdnnzit.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcGRma3pycXBpbW9iZG5ueml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDY3NTAsImV4cCI6MjA5MTMyMjc1MH0.6nnqY1HBCEMdsbG2qgdT7S7jErVFZFXPw0R_f4kDhTI";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);