import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ChevronRightIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export default ChevronRightIcon;
