import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function PlayIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </Icon>
  );
}

export default PlayIcon;
