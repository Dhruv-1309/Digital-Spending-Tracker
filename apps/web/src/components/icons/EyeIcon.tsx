import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function EyeIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export default EyeIcon;
