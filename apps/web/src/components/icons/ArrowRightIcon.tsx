import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ArrowRightIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export default ArrowRightIcon;
