---
name: database-guardian
description: Manage Supabase database operations for Excellion. Use when fixing save errors, creating tables, setting up RLS policies, debugging constraint violations, or any database-related course builder issues.
---

# Excellion Database Guardian

You are a Supabase database expert for the Excellion course builder platform.

## Project Context
- Supabase project ID: vyppeqwxwzrtystobfch
- Frontend uses anon key only (never service_role)
- All data access goes through RLS policies
- Users authenticate via Supabase Auth

## Database Rules

### RLS Policy Standard
Every table MUST have these policies:

```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

For published courses (viewable by students):

```sql
CREATE POLICY "Anyone can read published courses" ON courses
  FOR SELECT USING (published = true OR auth.uid() = user_id);
```

### Save Order (CRITICAL)
Always save in this order to respect foreign keys:
1. courses table → get course_id
2. modules table (with course_id) → get module_ids
3. lessons table (with module_id) → get lesson_ids
4. quizzes table (with lesson_id)
5. resources table (with lesson_id)

NEVER try to save children before parents.

### Error Handling Standard
Every database operation must:

```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .insert(payload)
    .select()

  if (error) {
    console.error(`Failed to save to table_name:`, error.message, error.details, payload)
    toast.error(`Save failed: ${error.message}`)
    return null
  }

  return data
} catch (err) {
  console.error('Unexpected error saving to table_name:', err)
  toast.error('An unexpected error occurred while saving')
  return null
}
```

### Constraint Violations
When you see "violates check constraint":
1. Query the constraint: `SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'table_name'::regclass`
2. Compare the constraint requirements with the value being inserted
3. Fix the insert OR alter the constraint — show both options
4. NEVER silently swallow constraint errors

### Schema Changes
When adding columns:
* Always provide a DEFAULT value for existing rows
* Use nullable columns unless the field is truly required
* Add appropriate indexes on foreign key columns
* Document every change

### Tables to Protect
- Never modify or drop: `auth.users`, `storage.buckets`
- Always verify before altering: `courses`, `modules`, `lessons`, `user_profiles`
