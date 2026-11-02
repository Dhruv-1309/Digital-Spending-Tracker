import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ClockIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export default ClockIcon;
