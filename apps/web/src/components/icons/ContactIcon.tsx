import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function ContactIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M16 2v2" /><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /><path d="M8 2v2" /><circle cx="12" cy="11" r="4" /><rect x="3" y="4" width="18" height="18" rx="2" />
    </Icon>
  );
}

export default ContactIcon;
