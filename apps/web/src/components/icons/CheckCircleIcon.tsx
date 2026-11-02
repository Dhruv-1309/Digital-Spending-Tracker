import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function CheckCircleIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export default CheckCircleIcon;
