import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function PlusIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </Icon>
  );
}

export default PlusIcon;
