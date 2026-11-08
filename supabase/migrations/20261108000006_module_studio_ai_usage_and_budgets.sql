-- ═══════════════════════════════════════════════════════════════════════════
-- RISSE AI — MODULE STUDIO AI USAGE TRACKING & SAFETY BUDGETS
-- Migration: 20261108000006_module_studio_ai_usage_and_budgets.sql
-- Description:
--   Tracks Gemini AI generation usage, operations, token estimates, and
--   enforces daily safety budgets to protect the shared Gemini API quota.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.module_studio_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    module_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    model_used TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    request_count INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance and daily aggregation
CREATE INDEX IF NOT EXISTS idx_ms_usage_teacher_date 
    ON public.module_studio_usage_logs(teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ms_usage_operation_date 
    ON public.module_studio_usage_logs(operation_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.module_studio_usage_logs ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own usage logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'module_studio_usage_logs' AND policyname = 'Teachers can view own usage logs'
    ) THEN
        CREATE POLICY "Teachers can view own usage logs"
            ON public.module_studio_usage_logs
            FOR SELECT
            USING (auth.uid() = teacher_id);
    END IF;
END $$;

-- Service role has full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'module_studio_usage_logs' AND policyname = 'Service role full access on usage logs'
    ) THEN
        CREATE POLICY "Service role full access on usage logs"
            ON public.module_studio_usage_logs
            FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Authenticated teachers can insert their own usage records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'module_studio_usage_logs' AND policyname = 'Teachers can insert own usage logs'
    ) THEN
        CREATE POLICY "Teachers can insert own usage logs"
            ON public.module_studio_usage_logs
            FOR INSERT
            WITH CHECK (auth.uid() = teacher_id OR auth.role() = 'service_role');
    END IF;
END $$;

-- RPC: Get daily usage metrics for a teacher (or global if NULL)
CREATE OR REPLACE FUNCTION public.get_module_studio_daily_usage(
    p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_requests BIGINT,
    total_input_tokens BIGINT,
    total_output_tokens BIGINT,
    successful_requests BIGINT,
    failed_requests BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        COALESCE(COUNT(*), 0) AS total_requests,
        COALESCE(SUM(input_tokens), 0)::BIGINT AS total_input_tokens,
        COALESCE(SUM(output_tokens), 0)::BIGINT AS total_output_tokens,
        COALESCE(COUNT(*) FILTER (WHERE success = TRUE), 0) AS successful_requests,
        COALESCE(COUNT(*) FILTER (WHERE success = FALSE), 0) AS failed_requests
    FROM public.module_studio_usage_logs
    WHERE created_at >= date_trunc('day', timezone('utc'::text, now()))
      AND (p_teacher_id IS NULL OR teacher_id = p_teacher_id);
$$;

