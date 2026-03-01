-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',       -- info | success | warning | status_update
    reference_id UUID,                        -- optional link to citizen_concerns.id
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- System / admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-create a notification when a citizen_concern status is updated by an admin
CREATE OR REPLACE FUNCTION public.notify_on_concern_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.user_id,
      'Request Status Updated',
      'Your request "' || LEFT(NEW.subject, 60) || '" has been updated to: ' || UPPER(REPLACE(NEW.status, '-', ' ')),
      'status_update',
      NEW.id
    );
  END IF;
  IF NEW.admin_response IS NOT NULL AND (OLD.admin_response IS NULL OR OLD.admin_response IS DISTINCT FROM NEW.admin_response) THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.user_id,
      'Admin Response',
      'An admin responded to your request "' || LEFT(NEW.subject, 60) || '"',
      'info',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_concern_change
  AFTER UPDATE ON public.citizen_concerns
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_concern_status_change();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
