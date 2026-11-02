import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function PauseIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />
    </Icon>
  );
}

export default PauseIcon;
