import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function BanknoteIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
    </Icon>
  );
}

export default BanknoteIcon;
