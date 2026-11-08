import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ArrowLeftRightIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
    </Icon>
  );
}

export default ArrowLeftRightIcon;
