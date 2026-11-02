import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ShieldIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </Icon>
  );
}

export default ShieldIcon;
