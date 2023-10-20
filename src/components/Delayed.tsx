import * as React from 'react';

interface DelayedProps extends React.HTMLProps<HTMLDivElement> {
  delay?: number;
}

const Delayed = ({ delay = 1000, children }: DelayedProps) => {
  const [isShown, setIsShown] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return isShown ? children : null;
};
export default Delayed;
