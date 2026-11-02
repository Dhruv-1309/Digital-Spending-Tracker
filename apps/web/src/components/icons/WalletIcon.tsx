import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function WalletIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </Icon>
  );
}

export default WalletIcon;
