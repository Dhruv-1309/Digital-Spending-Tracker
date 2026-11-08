import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function MenuIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </Icon>
  );
}

export default MenuIcon;
