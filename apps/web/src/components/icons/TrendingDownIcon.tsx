import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function TrendingDownIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
    </Icon>
  );
}

export default TrendingDownIcon;
