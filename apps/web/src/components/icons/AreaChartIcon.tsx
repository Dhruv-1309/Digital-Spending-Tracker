import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function AreaChartIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 3v18h18" /><path d="M7 12v5h12V8l-5 5-4-4Z" />
    </Icon>
  );
}

export default AreaChartIcon;
