import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function LockIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

export default LockIcon;
