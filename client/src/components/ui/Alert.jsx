import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import cn from '../../utils/cn.js';

const TONES = {
  info: { wrap: 'border-info-100 bg-info-50 text-info-600', body: 'text-navy-700', icon: Info },
  success: { wrap: 'border-success-100 bg-success-50 text-success-700', body: 'text-success-700', icon: CheckCircle2 },
  warning: { wrap: 'border-warning-100 bg-warning-50 text-warning-700', body: 'text-warning-700', icon: TriangleAlert },
  danger: { wrap: 'border-danger-100 bg-danger-50 text-danger-700', body: 'text-danger-700', icon: AlertCircle },
};

/**
 * Inline message block for form-level feedback and page notices.
 *
 * `role="alert"` on danger/warning so assistive tech announces a failed submit
 * immediately; informational tones stay silent to avoid interrupting the user.
 */
export default function Alert({ tone = 'info', title, children, action, className }) {
  const { wrap, body, icon: Icon } = TONES[tone];
  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', wrap, className)}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className={cn('text-sm font-semibold', body)}>{title}</p>}
        {children && <div className={cn('text-sm leading-relaxed', body, title && 'mt-0.5')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
