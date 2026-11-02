import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function SearchIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export default SearchIcon;
