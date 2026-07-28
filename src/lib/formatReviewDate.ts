import { differenceInDays, formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatReviewDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (differenceInDays(new Date(), date) < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  }
  return format(date, 'd MMM yyyy', { locale: fr });
}
