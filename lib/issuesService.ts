import { supabase } from './supabaseClient';

// Fetch a single issue by id
export async function getIssueById(issueId: string) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single();
  if (error) throw error;
  return data;
}

// Fetch comments for an issue
export async function getComments(issueId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Add a new comment
export async function addComment(issueId: string, userName: string, text: string) {
  const { data, error } = await supabase.from('comments').insert([
    { issue_id: issueId, user_name: userName, text }
  ]);
  if (error) throw error;
  return data;
}
