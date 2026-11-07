-- ============================================================================
-- RISSE AI — Migration: 20261107000005_course_studio_materials_pipeline.sql
-- Course Studio Material-to-Curriculum Pipeline & Document Extraction Tracking
-- ============================================================================

-- 1. Add document text extraction and error tracking columns to course_materials
ALTER TABLE public.course_materials
ADD COLUMN IF NOT EXISTS extracted_content TEXT,
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- 2. Add helpful comment documenting status values:
-- 'uploaded': stored in storage bucket, awaiting extraction
-- 'processing': content extraction and pedagogical parsing in progress
-- 'ready': successfully extracted and indexed for curriculum grounding
-- 'error': extraction failed, detailed in processing_error
COMMENT ON COLUMN public.course_materials.status IS 'Document extraction lifecycle status: uploaded, processing, ready, error';
COMMENT ON COLUMN public.course_materials.extracted_content IS 'Extracted text, instructional outlines, and syllabus topics used for AI curriculum grounding';
COMMENT ON COLUMN public.course_materials.processing_error IS 'Human-readable failure details if document text extraction could not be completed';

