import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function AlertTriangleIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </Icon>
  );
}

export default AlertTriangleIcon;
