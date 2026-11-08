import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function TrendingUpIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </Icon>
  );
}

export default TrendingUpIcon;
