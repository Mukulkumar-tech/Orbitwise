import { useCallback, useRef, useState } from 'react';

/**
 * Write-side counterpart to useQuery — for shortlisting, marking notifications
 * read, submitting an application, and so on.
 *
 * `mutate` both records state and rethrows, so a caller can bind server-side
 * field errors onto a form (see utils/formErrors.js) while `isLoading` still
 * drives the button. Forms backed by React Hook Form already get `isSubmitting`
 * and do not need this.
 *
 *   const { mutate, isLoading } = useMutation(
 *     (courseId) => shortlistService.add(courseId),
 *     { onSuccess: () => toast.success('Added to your shortlist') }
 *   )
 */
export function useMutation(mutator, { onSuccess, onError } = {}) {
  const [state, setState] = useState({ isLoading: false, error: null, data: null });

  const mutatorRef = useRef(mutator);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  mutatorRef.current = mutator;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const mutate = useCallback(async (variables) => {
    setState({ isLoading: true, error: null, data: null });
    try {
      const data = await mutatorRef.current(variables);
      setState({ isLoading: false, error: null, data });
      await onSuccessRef.current?.(data, variables);
      return data;
    } catch (error) {
      setState({ isLoading: false, error, data: null });
      onErrorRef.current?.(error, variables);
      // Rethrown so callers can attach field errors or branch on failure.
      // A mutation that swallows its own error is impossible to handle.
      throw error;
    }
  }, []);

  const reset = useCallback(() => setState({ isLoading: false, error: null, data: null }), []);

  return { mutate, reset, ...state };
}

export default useMutation;
