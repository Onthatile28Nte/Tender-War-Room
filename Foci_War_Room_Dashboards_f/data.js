import { supabase } from "./supabase.js";

const { data, error } = await supabase
  .from("bids")
  .select("*");