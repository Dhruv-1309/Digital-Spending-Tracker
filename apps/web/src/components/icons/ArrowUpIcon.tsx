import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ArrowUpIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </Icon>
  );
}

export default ArrowUpIcon;
