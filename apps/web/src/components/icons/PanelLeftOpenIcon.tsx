import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function PanelLeftOpenIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m14 9 3 3-3 3" />
    </Icon>
  );
}

export default PanelLeftOpenIcon;
