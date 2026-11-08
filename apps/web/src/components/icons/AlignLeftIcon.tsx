import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function AlignLeftIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" />
    </Icon>
  );
}

export default AlignLeftIcon;
