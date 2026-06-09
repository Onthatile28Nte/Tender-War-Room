import { supabase } from "./supabase";

const { data, error } = await supabase
  .from("your_table_name")
  .select("*");