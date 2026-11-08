import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function MoonIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  );
}

export default MoonIcon;
