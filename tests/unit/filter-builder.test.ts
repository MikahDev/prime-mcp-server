/**
 * Filter builder unit tests
 */

import { describe, it, expect } from 'vitest';
import { FilterBuilder, buildListQuery, CommonFilters } from '../../src/utils/filter-builder.js';

describe('FilterBuilder', () => {
  describe('basic operations', () => {
    it('should build eq filter', () => {
      const builder = new FilterBuilder();
      builder.eq('status', 'active');

      expect(builder.build()).toBe("'status'.eq('active')");
    });

    it('should build neq filter', () => {
      const builder = new FilterBuilder();
      builder.neq('status', 'closed');

      expect(builder.build()).toBe("'status'.neq('closed')");
    });

    it('should build gt filter', () => {
      const builder = new FilterBuilder();
      builder.gt('amount', 100);

      expect(builder.build()).toBe("'amount'.gt('100')");
    });

    it('should build gte filter', () => {
      const builder = new FilterBuilder();
      builder.gte('createdAt', '2024-01-01');

      expect(builder.build()).toBe("'createdAt'.gte('2024-01-01')");
    });

    it('should build lt filter', () => {
      const builder = new FilterBuilder();
      builder.lt('amount', 1000);

      expect(builder.build()).toBe("'amount'.lt('1000')");
    });

    it('should build lte filter', () => {
      const builder = new FilterBuilder();
      builder.lte('updatedAt', '2024-12-31');

      expect(builder.build()).toBe("'updatedAt'.lte('2024-12-31')");
    });

    it('should build like filter', () => {
      const builder = new FilterBuilder();
      builder.like('name', '%Smith%');

      expect(builder.build()).toBe("'name'.like('%Smith%')");
    });

    it('should build in filter', () => {
      const builder = new FilterBuilder();
      builder.in('status', ['active', 'pending', 'approved']);

      expect(builder.build()).toBe("'status'.in(active,pending,approved)");
    });

    it('should build nin filter', () => {
      const builder = new FilterBuilder();
      builder.nin('status', ['closed', 'cancelled']);

      expect(builder.build()).toBe("'status'.nin(closed,cancelled)");
    });

    it('should build between filter', () => {
      const builder = new FilterBuilder();
      builder.between('amount', 100, 500);

      expect(builder.build()).toBe("'amount'.between('100','500')");
    });
  });

  describe('chaining', () => {
    it('should chain multiple filters with AND', () => {
      const builder = new FilterBuilder();
      builder
        .eq('status', 'active')
        .gte('createdAt', '2024-01-01')
        .like('name', '%test%');

      expect(builder.build()).toBe(
        "'status'.eq('active'),'createdAt'.gte('2024-01-01'),'name'.like('%test%')"
      );
    });

    it('should build OR filters', () => {
      const builder = new FilterBuilder();
      builder
        .eq('status', 'active')
        .eq('status', 'pending');

      expect(builder.buildOr()).toBe("'status'.eq('active')|'status'.eq('pending')");
    });
  });

  describe('utility methods', () => {
    it('should track filter count', () => {
      const builder = new FilterBuilder();
      expect(builder.length).toBe(0);

      builder.eq('field1', 'val1');
      expect(builder.length).toBe(1);

      builder.eq('field2', 'val2');
      expect(builder.length).toBe(2);
    });

    it('should check hasFilters', () => {
      const builder = new FilterBuilder();
      expect(builder.hasFilters()).toBe(false);

      builder.eq('status', 'active');
      expect(builder.hasFilters()).toBe(true);
    });

    it('should clear filters', () => {
      const builder = new FilterBuilder();
      builder.eq('status', 'active').eq('type', 'job');

      expect(builder.length).toBe(2);

      builder.clear();
      expect(builder.length).toBe(0);
      expect(builder.hasFilters()).toBe(false);
    });

    it('should add raw filter', () => {
      const builder = new FilterBuilder();
      builder.raw("'custom'.special('value')");

      expect(builder.build()).toBe("'custom'.special('value')");
    });
  });
});

describe('buildListQuery', () => {
  it('should build query with pagination', () => {
    const query = buildListQuery({
      page: 2,
      perPage: 25
    });

    expect(query.page).toBe(2);
    expect(query.per_page).toBe(25);
  });

  it('should build query with ordering', () => {
    const query = buildListQuery({
      orderBy: 'createdAt',
      orderDir: 'DESC'
    });

    expect(query.order).toBe('createdAt|DESC');
  });

  it('should build query with ascending order (default)', () => {
    const query = buildListQuery({
      orderBy: 'name'
    });

    expect(query.order).toBe('name');
  });

  it('should build query with includes', () => {
    const query = buildListQuery({
      includes: ['status', 'division', 'customer']
    });

    expect(query.includes).toBe('status,division,customer');
  });

  it('should build query with filters', () => {
    const filters = new FilterBuilder();
    filters.eq('status', 'active').gte('createdAt', '2024-01-01');

    const query = buildListQuery({ filters });

    expect(query.q).toBe("'status'.eq('active'),'createdAt'.gte('2024-01-01')");
  });

  it('should not include empty filters', () => {
    const filters = new FilterBuilder();
    const query = buildListQuery({ filters });

    expect(query.q).toBeUndefined();
  });
});

describe('CommonFilters', () => {
  describe('jobs', () => {
    it('should build job filters', () => {
      const filters = CommonFilters.jobs({
        statusId: 'status-123',
        divisionId: 'div-456',
        createdAfter: '2024-01-01'
      });

      const query = filters.build();

      expect(query).toContain("'statusId'.eq('status-123')");
      expect(query).toContain("'divisionId'.eq('div-456')");
      expect(query).toContain("'createdAt'.gte('2024-01-01')");
    });

    it('should build job number search', () => {
      const filters = CommonFilters.jobs({
        jobNumber: 'J001'
      });

      expect(filters.build()).toContain("'jobNumber'.like('%J001%')");
    });
  });

  describe('contacts', () => {
    it('should build contact filters', () => {
      const filters = CommonFilters.contacts({
        name: 'Smith',
        isActive: true
      });

      const query = filters.build();

      expect(query).toContain("'name'.like('%Smith%')");
      expect(query).toContain("'isActive'.eq('true')");
    });
  });

  describe('allocations', () => {
    it('should build allocation filters', () => {
      const filters = CommonFilters.allocations({
        jobId: 'job-123',
        allocationType: 'Make Safe'
      });

      const query = filters.build();

      expect(query).toContain("'jobId'.eq('job-123')");
      expect(query).toContain("'allocationType'.eq('Make Safe')");
    });
  });

  describe('estimates', () => {
    it('should build estimate filters', () => {
      const filters = CommonFilters.estimates({
        jobId: 'job-123',
        createdAfter: '2024-01-01',
        createdBefore: '2024-12-31'
      });

      const query = filters.build();

      expect(query).toContain("'jobId'.eq('job-123')");
      expect(query).toContain("'createdAt'.gte('2024-01-01')");
      expect(query).toContain("'createdAt'.lte('2024-12-31')");
    });
  });
});
