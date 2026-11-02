import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ChevronDownIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export default ChevronDownIcon;
