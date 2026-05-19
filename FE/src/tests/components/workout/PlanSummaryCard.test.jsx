import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PlanSummaryCard from '../../../components/workout/PlanSummaryCard';

describe('PlanSummaryCard', () => {
  const defaultProps = {
    name: 'Beginner Weight Gain Plan',
    startDate: '2026-05-18',
    endDate: '2026-06-14',
    durationWeeks: 4,
    daysPerWeek: 3,
    status: 'active',
  };

  describe('renders plan name and metadata', () => {
    it('displays plan name', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('Beginner Weight Gain Plan')).toBeInTheDocument();
    });

    it('displays formatted date range', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText(/May 18.*Jun 14, 2026/)).toBeInTheDocument();
    });

    it('displays frequency as "4 weeks · 3 days/week"', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('4 weeks')).toBeInTheDocument();
      expect(screen.getByText('3 days/week')).toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('shows "Active" badge when status = "active"', () => {
      render(<PlanSummaryCard {...defaultProps} status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('Active badge has emerald color class', () => {
      render(<PlanSummaryCard {...defaultProps} status="active" />);
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('bg-emerald-500/20');
      expect(badge.className).toContain('text-emerald-300');
    });

    it('shows "Completed" badge when status = "completed"', () => {
      render(<PlanSummaryCard {...defaultProps} status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('Completed badge has gray color class', () => {
      render(<PlanSummaryCard {...defaultProps} status="completed" />);
      const badge = screen.getByText('Completed');
      expect(badge.className).toContain('bg-slate-500/20');
      expect(badge.className).toContain('text-slate-300');
    });

    it('shows "Cancelled" badge when status = "cancelled"', () => {
      render(<PlanSummaryCard {...defaultProps} status="cancelled" />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('Cancelled badge has red color class', () => {
      render(<PlanSummaryCard {...defaultProps} status="cancelled" />);
      const badge = screen.getByText('Cancelled');
      expect(badge.className).toContain('bg-red-500/20');
      expect(badge.className).toContain('text-red-300');
    });
  });

  describe('edge cases', () => {
    it('does not crash when status is undefined', () => {
      expect(() => render(<PlanSummaryCard {...defaultProps} status={undefined} />)).not.toThrow();
    });

    it('renders with different date ranges', () => {
      render(
        <PlanSummaryCard
          {...defaultProps}
          startDate="2026-01-01"
          endDate="2026-12-31"
        />
      );
      expect(screen.getByText(/Jan 1.*Dec 31, 2026/)).toBeInTheDocument();
    });
  });
});
