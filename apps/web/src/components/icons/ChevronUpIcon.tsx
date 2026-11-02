import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ChevronUpIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="m18 15-6-6-6 6" />
    </Icon>
  );
}

export default ChevronUpIcon;
