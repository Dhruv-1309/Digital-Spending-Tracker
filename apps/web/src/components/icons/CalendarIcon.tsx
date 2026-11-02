import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function CalendarIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
    </Icon>
  );
}

export default CalendarIcon;
