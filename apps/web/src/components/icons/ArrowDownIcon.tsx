import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ArrowDownIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </Icon>
  );
}

export default ArrowDownIcon;
