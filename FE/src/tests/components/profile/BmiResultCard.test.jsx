import React from 'react';
import { render, screen } from '@testing-library/react';
import BmiResultCard from '../../../components/profile/BmiResultCard';

describe('BmiResultCard', () => {
  describe('placeholder state', () => {
    it('shows placeholder when bmi is null', () => {
      render(<BmiResultCard bmi={null} bodyClassification={null} />);
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });

    it('shows placeholder when bmi is undefined', () => {
      render(<BmiResultCard />);
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });

    it('does NOT show badge when bmi is null', () => {
      render(<BmiResultCard bmi={null} bodyClassification={null} />);
      expect(screen.queryByTestId('bmi-badge')).not.toBeInTheDocument();
    });

    it('does NOT show classification label when bmi is null', () => {
      render(<BmiResultCard bmi={null} bodyClassification={null} />);
      expect(screen.queryByText('Underweight')).not.toBeInTheDocument();
      expect(screen.queryByText('Normal')).not.toBeInTheDocument();
      expect(screen.queryByText('Overweight')).not.toBeInTheDocument();
      expect(screen.queryByText('Obese')).not.toBeInTheDocument();
    });
  });

  describe('BMI value formatting', () => {
    it('displays BMI with 1 decimal — 17.63 → "17.6"', () => {
      render(<BmiResultCard bmi={17.63} bodyClassification="underweight" />);
      expect(screen.getByText('17.6')).toBeInTheDocument();
    });

    it('displays BMI with 1 decimal — integer 17 → "17.0"', () => {
      render(<BmiResultCard bmi={17} bodyClassification="underweight" />);
      expect(screen.getByText('17.0')).toBeInTheDocument();
    });

    it('displays BMI with 1 decimal — 24.95 → "24.9" (JS toFixed)', () => {
      render(<BmiResultCard bmi={24.95} bodyClassification="normal" />);
      expect(screen.getByText('24.9')).toBeInTheDocument();
    });

    it('displays boundary BMI 18.5 → "18.5"', () => {
      render(<BmiResultCard bmi={18.5} bodyClassification="normal" />);
      expect(screen.getByText('18.5')).toBeInTheDocument();
    });

    it('shows placeholder when bmi = 0 (invalid value)', () => {
      render(<BmiResultCard bmi={0} bodyClassification="underweight" />);
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });

    it('shows placeholder when bmi is negative', () => {
      render(<BmiResultCard bmi={-1} bodyClassification="underweight" />);
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });
  });

  describe('classification labels (UR-02)', () => {
    it('shows "Underweight" when bodyClassification is "underweight"', () => {
      render(<BmiResultCard bmi={17.6} bodyClassification="underweight" />);
      expect(screen.getByText('Underweight')).toBeInTheDocument();
    });

    it('shows "Normal" when bodyClassification is "normal"', () => {
      render(<BmiResultCard bmi={22.0} bodyClassification="normal" />);
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('shows "Overweight" when bodyClassification is "overweight"', () => {
      render(<BmiResultCard bmi={27.0} bodyClassification="overweight" />);
      expect(screen.getByText('Overweight')).toBeInTheDocument();
    });

    it('shows "Obese" when bodyClassification is "obese"', () => {
      render(<BmiResultCard bmi={32.0} bodyClassification="obese" />);
      expect(screen.getByText('Obese')).toBeInTheDocument();
    });
  });

  describe('badge colour per classification (UR-03)', () => {
    it('underweight badge has amber/yellow class', () => {
      render(<BmiResultCard bmi={17.6} bodyClassification="underweight" />);
      const badge = screen.getByTestId('bmi-badge');
      expect(badge.className).toMatch(/amber/);
    });

    it('normal badge has green class', () => {
      render(<BmiResultCard bmi={22.0} bodyClassification="normal" />);
      const badge = screen.getByTestId('bmi-badge');
      expect(badge.className).toMatch(/emerald|green/);
    });

    it('overweight badge has orange class', () => {
      render(<BmiResultCard bmi={27.0} bodyClassification="overweight" />);
      const badge = screen.getByTestId('bmi-badge');
      expect(badge.className).toMatch(/orange/);
    });

    it('obese badge has red class', () => {
      render(<BmiResultCard bmi={32.0} bodyClassification="obese" />);
      const badge = screen.getByTestId('bmi-badge');
      expect(badge.className).toMatch(/red/);
    });
  });

  describe('edge cases', () => {
    it('does not crash when bodyClassification is an unknown value', () => {
      expect(() =>
        render(<BmiResultCard bmi={20} bodyClassification="unknown_value" />)
      ).not.toThrow();
    });

    it('shows BMI when bodyClassification is unknown (neutral fallback)', () => {
      render(<BmiResultCard bmi={20} bodyClassification="unknown_value" />);
      expect(screen.getByText('20.0')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('unknown badge has slate class (neutral colour)', () => {
      render(<BmiResultCard bmi={20} bodyClassification="unknown_value" />);
      const badge = screen.getByTestId('bmi-badge');
      expect(badge.className).toMatch(/slate/);
    });
  });
});
