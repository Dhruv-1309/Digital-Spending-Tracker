import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ChevronLeftIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export default ChevronLeftIcon;
