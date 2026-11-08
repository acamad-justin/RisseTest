import { createClient } from '@supabase/supabase-js';
import { resolveGeminiConfig } from './frontend/server/geminiConfig.ts';

const c = resolveGeminiConfig();
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptaG5jYXplZHd2eXV4cnp1Y3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NDcyNDQsImV4cCI6MjEwODIyMzI0NH0.g-o9jeI4Ym9goe09Ong36Zkx5nTdozcWwmHXQ49e-FM';
const sbAnon = createClient(c.supabaseUrl, anonKey);

async function run() {
  // Test what a student browser sees: courses with proposals using anon key
  const { data: courses, error: ce } = await sbAnon
    .from('courses')
    .select('id, title, status, enrollment_type, curriculum_proposals(id, status, proposal_data)')
    .eq('status', 'published')
    .eq('enrollment_type', 'self_paced');

  console.log('Courses error:', ce?.message);
  console.log('Courses count:', courses?.length);
  courses?.forEach((course: any) => {
    const props = course.curriculum_proposals || [];
    const publishedProp = props.find((p: any) => p.status === 'published') || props[0];
    const nodes = publishedProp?.proposal_data?.learning_nodes || [];
    console.log('Course:', course.title, '| Proposals:', props.length, '| Published prop nodes:', nodes.length, '| First node:', nodes[0]?.title);
  });

  // Also check if proposals are readable anonymously
  const { data: rawProps, error: pe } = await sbAnon
    .from('curriculum_proposals')
    .select('id, course_id, status')
    .in('course_id', ['f5e154f2-3395-4238-a18d-1f1e45afc696', 'ea1dd692-5146-4a95-9bc4-5f4ac5a9f921']);
  
  console.log('\nDirect proposals read (anon):', JSON.stringify(rawProps));
  console.log('Proposals error:', pe?.message);
}

run();
