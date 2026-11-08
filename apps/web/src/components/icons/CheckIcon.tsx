import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function CheckIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

export default CheckIcon;
