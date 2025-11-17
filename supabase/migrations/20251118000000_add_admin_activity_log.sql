-- Admin Activity Log Table
-- Tracks all admin actions for auditing and monitoring

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'user_modified', 'property_approved', 'property_rejected', 'agent_verified', 'data_exported', etc.
  resource_type text, -- 'user', 'property', 'agent', 'inquiry'
  resource_id uuid,
  description text NOT NULL,
  details jsonb DEFAULT '{}', -- Store additional context
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_resource ON admin_activity_log(resource_type, resource_id);

-- RLS Policy
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Only admins can insert activity logs (via application logic)
CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- Function to log admin activity (called from application)
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action_type text,
  p_resource_type text,
  p_resource_id uuid,
  p_description text,
  p_details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    description,
    details
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_description,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

COMMENT ON TABLE admin_activity_log IS 'Tracks all admin actions for auditing and monitoring';



