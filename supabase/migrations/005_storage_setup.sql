-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('question-images', 'question-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('question-audio', 'question-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']),
  ('feedback-files', 'feedback-files', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for question-images bucket
CREATE POLICY "Question images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-images');

CREATE POLICY "Tutors can upload question images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'question-images' AND 
    is_tutor_or_admin(auth.uid())
  );

CREATE POLICY "Tutors can update question images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'question-images' AND 
    is_tutor_or_admin(auth.uid())
  );

CREATE POLICY "Tutors can delete question images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'question-images' AND 
    is_tutor_or_admin(auth.uid())
  );

-- Storage policies for question-audio bucket
CREATE POLICY "Question audio files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-audio');

CREATE POLICY "Tutors can upload question audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'question-audio' AND 
    is_tutor_or_admin(auth.uid())
  );

CREATE POLICY "Tutors can update question audio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'question-audio' AND 
    is_tutor_or_admin(auth.uid())
  );

CREATE POLICY "Tutors can delete question audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'question-audio' AND 
    is_tutor_or_admin(auth.uid())
  );

-- Storage policies for feedback-files bucket
CREATE POLICY "Users can view feedback files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'feedback-files' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_tutor_or_admin(auth.uid())
    )
  );

CREATE POLICY "Users can upload feedback files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'feedback-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own feedback files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'feedback-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own feedback files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'feedback-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Super tutors can manage all files
CREATE POLICY "Super tutors can manage all files" ON storage.objects
  FOR ALL USING (is_super_tutor(auth.uid()));
