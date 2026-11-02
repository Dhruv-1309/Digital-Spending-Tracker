import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function XIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </Icon>
  );
}

export default XIcon;
