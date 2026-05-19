import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm, { validateProfileForm } from '../../../components/profile/ProfileForm';

const noop = () => {};

// ─── Unit tests: validateProfileForm ─────────────────────────────────────────

describe('validateProfileForm(values)', () => {
  const valid = { height: 165, weight: 48, age: 22, gender: 'male' };

  describe('height', () => {
    it('error when height is empty', () => {
      const { isValid, errors } = validateProfileForm({ ...valid, height: '' });
      expect(isValid).toBe(false);
      expect(errors.height).toBeTruthy();
    });

    it('error when height < 100', () => {
      const { errors } = validateProfileForm({ ...valid, height: 99 });
      expect(errors.height).toBeTruthy();
    });

    it('error when height > 250', () => {
      const { errors } = validateProfileForm({ ...valid, height: 251 });
      expect(errors.height).toBeTruthy();
    });

    it('error when height is a non-numeric string', () => {
      const { errors } = validateProfileForm({ ...valid, height: 'abc' });
      expect(errors.height).toBeTruthy();
    });

    it('valid when height = 100 (boundary min)', () => {
      const { errors } = validateProfileForm({ ...valid, height: 100 });
      expect(errors.height).toBeFalsy();
    });

    it('valid when height = 250 (boundary max)', () => {
      const { errors } = validateProfileForm({ ...valid, height: 250 });
      expect(errors.height).toBeFalsy();
    });

    it('valid when height is a decimal (165.5)', () => {
      const { errors } = validateProfileForm({ ...valid, height: 165.5 });
      expect(errors.height).toBeFalsy();
    });
  });

  describe('weight', () => {
    it('error when weight is empty', () => {
      const { isValid, errors } = validateProfileForm({ ...valid, weight: '' });
      expect(isValid).toBe(false);
      expect(errors.weight).toBeTruthy();
    });

    it('error when weight < 20', () => {
      const { errors } = validateProfileForm({ ...valid, weight: 19 });
      expect(errors.weight).toBeTruthy();
    });

    it('error when weight > 300', () => {
      const { errors } = validateProfileForm({ ...valid, weight: 301 });
      expect(errors.weight).toBeTruthy();
    });

    it('valid when weight = 20 (boundary min)', () => {
      const { errors } = validateProfileForm({ ...valid, weight: 20 });
      expect(errors.weight).toBeFalsy();
    });

    it('valid when weight = 300 (boundary max)', () => {
      const { errors } = validateProfileForm({ ...valid, weight: 300 });
      expect(errors.weight).toBeFalsy();
    });
  });

  describe('age', () => {
    it('error when age is empty', () => {
      const { errors } = validateProfileForm({ ...valid, age: '' });
      expect(errors.age).toBeTruthy();
    });

    it('error when age < 10', () => {
      const { errors } = validateProfileForm({ ...valid, age: 9 });
      expect(errors.age).toBeTruthy();
    });

    it('error when age > 100', () => {
      const { errors } = validateProfileForm({ ...valid, age: 101 });
      expect(errors.age).toBeTruthy();
    });

    it('error when age is a decimal (22.5)', () => {
      const { errors } = validateProfileForm({ ...valid, age: 22.5 });
      expect(errors.age).toBeTruthy();
    });

    it('valid when age = 10 (boundary min)', () => {
      const { errors } = validateProfileForm({ ...valid, age: 10 });
      expect(errors.age).toBeFalsy();
    });

    it('valid when age = 100 (boundary max)', () => {
      const { errors } = validateProfileForm({ ...valid, age: 100 });
      expect(errors.age).toBeFalsy();
    });
  });

  describe('gender', () => {
    it('error when gender is empty', () => {
      const { errors } = validateProfileForm({ ...valid, gender: '' });
      expect(errors.gender).toBeTruthy();
    });

    it('error when gender is not "male" or "female"', () => {
      const { errors } = validateProfileForm({ ...valid, gender: 'other' });
      expect(errors.gender).toBeTruthy();
    });

    it('valid when gender = "male"', () => {
      const { errors } = validateProfileForm({ ...valid, gender: 'male' });
      expect(errors.gender).toBeFalsy();
    });

    it('valid when gender = "female"', () => {
      const { errors } = validateProfileForm({ ...valid, gender: 'female' });
      expect(errors.gender).toBeFalsy();
    });
  });

  describe('isValid aggregate', () => {
    it('returns isValid=true when all fields are valid', () => {
      const { isValid } = validateProfileForm(valid);
      expect(isValid).toBe(true);
    });

    it('returns isValid=false when any field has an error', () => {
      const { isValid } = validateProfileForm({ ...valid, height: '' });
      expect(isValid).toBe(false);
    });

    it('errors only contains keys for invalid fields', () => {
      const { errors } = validateProfileForm({ ...valid, height: '' });
      expect(Object.keys(errors)).toContain('height');
      expect(Object.keys(errors)).not.toContain('weight');
    });

    it('errors is empty when all fields are valid', () => {
      const { errors } = validateProfileForm(valid);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

// ─── Component tests: ProfileForm ────────────────────────────────────────────

describe('ProfileForm component', () => {
  describe('rendering', () => {
    it('renders height field with label', () => {
      render(<ProfileForm onSubmit={noop} />);
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    });

    it('renders weight field with label', () => {
      render(<ProfileForm onSubmit={noop} />);
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    });

    it('renders age field with label', () => {
      render(<ProfileForm onSubmit={noop} />);
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });

    it('renders "Male" and "Female" radio options', () => {
      render(<ProfileForm onSubmit={noop} />);
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
    });

    it('renders submit button with submitLabel prop', () => {
      render(<ProfileForm onSubmit={noop} submitLabel="Save Profile" />);
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    it('does not crash when initialValues is undefined', () => {
      expect(() => render(<ProfileForm onSubmit={noop} />)).not.toThrow();
    });

    it('does not crash when initialValues is an empty object', () => {
      expect(() => render(<ProfileForm onSubmit={noop} initialValues={{}} />)).not.toThrow();
    });
  });

  describe('initialValues', () => {
    const initial = { height: 170, weight: 60, age: 25, gender: 'female' };

    it('pre-populates height input', () => {
      render(<ProfileForm onSubmit={noop} initialValues={initial} />);
      expect(screen.getByLabelText(/height/i)).toHaveValue(170);
    });

    it('pre-populates weight input', () => {
      render(<ProfileForm onSubmit={noop} initialValues={initial} />);
      expect(screen.getByLabelText(/weight/i)).toHaveValue(60);
    });

    it('pre-populates age input', () => {
      render(<ProfileForm onSubmit={noop} initialValues={initial} />);
      expect(screen.getByLabelText(/age/i)).toHaveValue(25);
    });

    it('pre-selects female gender', () => {
      render(<ProfileForm onSubmit={noop} initialValues={initial} />);
      const femaleRadio = screen.getByDisplayValue('female');
      expect(femaleRadio).toBeChecked();
    });

    it('syncs fields when initialValues change (edit flow: async data load)', async () => {
      const { rerender } = render(<ProfileForm onSubmit={noop} initialValues={{}} />);
      expect(screen.getByLabelText(/height/i)).toHaveValue(null);

      rerender(<ProfileForm onSubmit={noop} initialValues={initial} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/height/i)).toHaveValue(170);
        expect(screen.getByLabelText(/weight/i)).toHaveValue(60);
        expect(screen.getByLabelText(/age/i)).toHaveValue(25);
      });
    });

    it('resets touched/errors when initialValues change', async () => {
      const { rerender } = render(<ProfileForm onSubmit={noop} initialValues={{}} />);
      fireEvent.blur(screen.getByLabelText(/height/i));
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      rerender(<ProfileForm onSubmit={noop} initialValues={initial} />);
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('inline validation on blur (UR-04)', () => {
    it('does NOT show height error before blur', () => {
      render(<ProfileForm onSubmit={noop} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows height error after blur when field is empty', async () => {
      render(<ProfileForm onSubmit={noop} />);
      fireEvent.blur(screen.getByLabelText(/height/i));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows height range error after blur with value 50 (< 100)', async () => {
      render(<ProfileForm onSubmit={noop} />);
      await userEvent.type(screen.getByLabelText(/height/i), '50');
      fireEvent.blur(screen.getByLabelText(/height/i));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert').textContent).toMatch(/100|250/);
      });
    });

    it('shows weight error after blur when field is empty', async () => {
      render(<ProfileForm onSubmit={noop} />);
      fireEvent.blur(screen.getByLabelText(/weight/i));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows age error after blur when field is empty', async () => {
      render(<ProfileForm onSubmit={noop} />);
      fireEvent.blur(screen.getByLabelText(/age/i));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('error clears when a valid value is entered and blurred again', async () => {
      render(<ProfileForm onSubmit={noop} />);
      const heightInput = screen.getByLabelText(/height/i);
      fireEvent.blur(heightInput);
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      await userEvent.type(heightInput, '165');
      fireEvent.blur(heightInput);
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('error messages are in English', async () => {
      render(<ProfileForm onSubmit={noop} />);
      fireEvent.blur(screen.getByLabelText(/height/i));
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent.length).toBeGreaterThan(0);
        expect(alert.textContent).toMatch(/height|enter/i);
      });
    });
  });

  describe('loading state (UR-05)', () => {
    it('submit button is disabled when isLoading=true', () => {
      render(<ProfileForm onSubmit={noop} isLoading={true} submitLabel="Save" />);
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('spinner is shown when isLoading=true', () => {
      render(<ProfileForm onSubmit={noop} isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('submit button is NOT disabled when isLoading=false', () => {
      render(<ProfileForm onSubmit={noop} isLoading={false} submitLabel="Save" />);
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });

    it('spinner is NOT shown when isLoading=false', () => {
      render(<ProfileForm onSubmit={noop} isLoading={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('submit behaviour', () => {
    it('calls onSubmit with correct Number values when form is valid', async () => {
      const mockSubmit = vi.fn();
      render(<ProfileForm onSubmit={mockSubmit} submitLabel="Save" />);

      await userEvent.type(screen.getByLabelText(/height/i), '165');
      await userEvent.type(screen.getByLabelText(/weight/i), '48');
      await userEvent.type(screen.getByLabelText(/age/i), '22');
      fireEvent.click(screen.getByText('Male'));
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          height: 165,
          weight: 48,
          age: 22,
          gender: 'male',
        });
      });
    });

    it('onSubmit receives Number values, not Strings', async () => {
      const mockSubmit = vi.fn();
      render(<ProfileForm onSubmit={mockSubmit} submitLabel="Save" />);

      await userEvent.type(screen.getByLabelText(/height/i), '165');
      await userEvent.type(screen.getByLabelText(/weight/i), '48');
      await userEvent.type(screen.getByLabelText(/age/i), '22');
      fireEvent.click(screen.getByText('Male'));
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        const args = mockSubmit.mock.calls[0][0];
        expect(typeof args.height).toBe('number');
        expect(typeof args.weight).toBe('number');
        expect(typeof args.age).toBe('number');
      });
    });

    it('does NOT call onSubmit when form has errors (empty fields)', async () => {
      const mockSubmit = vi.fn();
      render(<ProfileForm onSubmit={mockSubmit} submitLabel="Save" />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      await new Promise((r) => setTimeout(r, 50));
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('shows errors for all fields when submitting an empty form', async () => {
      render(<ProfileForm onSubmit={noop} submitLabel="Save" />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(4);
      });
    });

    it('does NOT call onSubmit when isLoading=true and user clicks submit', async () => {
      const mockSubmit = vi.fn();
      render(<ProfileForm onSubmit={mockSubmit} isLoading={true} submitLabel="Save" />);
      fireEvent.click(screen.getByRole('button', { name: /saving/i }));
      await new Promise((r) => setTimeout(r, 50));
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});
