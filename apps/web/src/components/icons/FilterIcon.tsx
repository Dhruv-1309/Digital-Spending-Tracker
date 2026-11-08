import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function FilterIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </Icon>
  );
}

export default FilterIcon;
