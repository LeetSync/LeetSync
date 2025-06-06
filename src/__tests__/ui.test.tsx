import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingLayout } from '../modules/OnboardingLayout';
import StreakCounter from '../components/StreakCounter';
import Logo from '../components/Logo';

// Minimal mock for Chakra UI components used in tests
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  return {
    __esModule: true,
    Container: ({ children }: any) => <div>{children}</div>,
    Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    VStack: ({ children }: any) => <div>{children}</div>,
    HStack: ({ children }: any) => <div>{children}</div>,
    Heading: ({ children }: any) => <h1>{children}</h1>,
    Box: ({ children }: any) => <div>{children}</div>,
    Image: (props: any) => <img {...props} />,
    Tooltip: ({ children }: any) => <div>{children}</div>,
    IconButton: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  };
});

// helper to format date string as used in component
const format = (d: Date) => d.toLocaleDateString();

describe('UI Components', () => {
  it('renders OnboardingLayout with footer and children', () => {
    render(
      <OnboardingLayout step={1} totalSteps={3}>
        <div data-testid="child">Child Content</div>
      </OnboardingLayout>,
    );

    expect(screen.getByText(/Step 1 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    // footer link
    expect(screen.getByText(/Report Bug/i)).toBeInTheDocument();
  });

  it('renders Logo with alt text', () => {
    render(<Logo />);
    const img = screen.getByAltText('LeetSync') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    // ensure image has source set
    expect(img.src).toContain('wide-logo');
  });

  it('shows solved and unsolved icons in StreakCounter', () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const problemsPerDay = {
      [format(today)]: 1,
      [format(yesterday)]: 1,
    };

    const { container } = render(<StreakCounter problemsPerDay={problemsPerDay} />);

    // there should be 5 icons in total for last 5 days
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(5);

    // solved days use golden color
    const solvedIcons = container.querySelectorAll('svg[color="#FCC34A"]');
    expect(solvedIcons.length).toBe(2);
  });
});
