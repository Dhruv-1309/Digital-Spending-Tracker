import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function EditIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </Icon>
  );
}

export default EditIcon;
