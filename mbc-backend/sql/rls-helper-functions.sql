-- RLS Helper Functions for MBC System
-- These functions are used by the Supabase RLS policies

-- Function to enable RLS on a table
CREATE OR REPLACE FUNCTION enable_rls(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$;

-- Function to create RLS policies
CREATE OR REPLACE FUNCTION create_policy(
  table_name text,
  policy_name text,
  operation text,
  policy_definition text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR %s USING (%s)',
    policy_name,
    table_name,
    operation,
    policy_definition
  );
END;
$$;

-- Function to drop all policies on a table
CREATE OR REPLACE FUNCTION drop_all_policies(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = table_name
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
  END LOOP;
END;
$$;

-- Function to get user's institution ID from JWT
CREATE OR REPLACE FUNCTION get_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'institution_id')::uuid;
$$;

-- Function to get user's branch ID from JWT
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'branch_id')::uuid;
$$;

-- Function to get user's role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() ->> 'role';
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() ->> 'role' = 'admin';
$$;

-- Function to check if user is professor
CREATE OR REPLACE FUNCTION is_professor()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() ->> 'role' = 'professor';
$$;

-- Function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() ->> 'role' = 'student';
$$;

-- Function to check if user can access institution data
CREATE OR REPLACE FUNCTION can_access_institution(institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    is_admin() OR 
    get_user_institution_id() = institution_id;
$$;

-- Function to check if user can access branch data
CREATE OR REPLACE FUNCTION can_access_branch(branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    is_admin() OR 
    get_user_branch_id() = branch_id OR
    EXISTS (
      SELECT 1 FROM branches b 
      WHERE b.id = branch_id 
      AND b.institution_id = get_user_institution_id()
    );
$$;

-- Function to check if user is enrolled in a course
CREATE OR REPLACE FUNCTION is_enrolled_in_course(course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.course_id = course_id 
    AND e.student_id = auth.uid()
  );
$$;

-- Function to check if user is professor of a course
CREATE OR REPLACE FUNCTION is_course_professor(course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_id 
    AND c.professor_id = auth.uid()
  );
$$;

-- Function to check if user is professor of an assignment
CREATE OR REPLACE FUNCTION is_assignment_professor(assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments a 
    WHERE a.id = assignment_id 
    AND a.professor_id = auth.uid()
  );
$$;

-- Function to check if user can view notice based on target audience
CREATE OR REPLACE FUNCTION can_view_notice(target_audience text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    is_admin() OR
    'all' = ANY(target_audience) OR
    get_user_role() = ANY(target_audience) OR
    ('branch:' || get_user_branch_id()::text) = ANY(target_audience);
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION enable_rls(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_policy(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION drop_all_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_institution_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION is_student() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_institution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_branch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_enrolled_in_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_course_professor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_assignment_professor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_notice(text[]) TO authenticated;