import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function LayoutDashboardIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </Icon>
  );
}

export default LayoutDashboardIcon;
