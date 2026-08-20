import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Select from './Select.jsx';

afterEach(cleanup);

describe('Select', () => {
  it('renders the options prop', () => {
    render(
      <Select
        label="Destination"
        options={[
          { value: 'GB', label: 'United Kingdom' },
          { value: 'CA', label: 'Canada' },
        ]}
      />
    );

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Canada' })).toBeTruthy();
  });

  it('renders <option> children when no options prop is given', () => {
    // Regression guard. JSX explicit children override a spread `children` prop,
    // so a component that renders only `options` silently discarded these — every
    // public filter dropdown was empty, with no error logged anywhere.
    render(
      <Select label="Level">
        <option value="">All levels</option>
        <option value="Bachelors">Bachelor’s degree</option>
      </Select>
    );

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'All levels' })).toBeTruthy();
  });

  it('prefers the options prop when both are supplied', () => {
    render(
      <Select label="Both" options={[{ value: 'a', label: 'From prop' }]}>
        <option value="b">From children</option>
      </Select>
    );

    const rendered = screen.getAllByRole('option');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].textContent).toBe('From prop');
  });

  it('associates its label with the control', () => {
    render(<Select label="Subject" options={[{ value: 'x', label: 'X' }]} />);
    expect(screen.getByLabelText('Subject')).toBeTruthy();
  });
});
