import { supabase } from "../supabaseClient";

export const uploadImageToSupabase = async (file, userId, bucket = "generated-images") => {
  if (!file) throw new Error("No file selected.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return { path: data.path };
};

export const createImageRecord = async ({
  storagePath,
  fileName,
  prompt,
  notes,
  bucket = "generated-images",
}) => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (!userId) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("images")
    .insert([
      {
        user_id: userId,
        file_name: fileName,
        storage_bucket: bucket,
        storage_path: storagePath,
        prompt,
        notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const listImages = async () => {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSignedImageUrl = async ({
  bucket,
  path,
  expiresIn = 60 * 60,
}) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data?.signedUrl;
};
