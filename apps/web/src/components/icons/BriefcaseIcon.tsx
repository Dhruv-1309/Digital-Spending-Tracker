import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function BriefcaseIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Icon>
  );
}

export default BriefcaseIcon;
