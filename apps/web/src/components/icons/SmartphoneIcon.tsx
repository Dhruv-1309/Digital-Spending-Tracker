import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function SmartphoneIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
    </Icon>
  );
}

export default SmartphoneIcon;
