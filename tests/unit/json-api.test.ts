/**
 * JSON:API parser unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseJsonApiResponse,
  extractSingleResource,
  extractResourceList,
  extractPagination,
  extractIncluded,
  findIncludedById,
  buildJsonApiBody,
  buildRelationshipBody,
  isErrorResponse,
  extractErrorMessages
} from '../../src/client/json-api.js';

describe('JSON:API Parser', () => {
  describe('parseJsonApiResponse', () => {
    it('should parse single resource response', () => {
      const raw = {
        data: {
          type: 'job',
          id: '123',
          attributes: { jobNumber: 'J001', status: 'active' }
        }
      };

      const result = parseJsonApiResponse(raw);
      expect(result.data).toEqual(raw.data);
    });

    it('should parse list response with pagination', () => {
      const raw = {
        data: [
          { type: 'job', id: '1', attributes: { jobNumber: 'J001' } },
          { type: 'job', id: '2', attributes: { jobNumber: 'J002' } }
        ],
        meta: {
          pagination: {
            total: 100,
            count: 2,
            per_page: 15,
            current_page: 1,
            total_pages: 7
          }
        }
      };

      const result = parseJsonApiResponse(raw);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta?.pagination?.total).toBe(100);
    });
  });

  describe('extractSingleResource', () => {
    it('should flatten single resource attributes', () => {
      const response = {
        data: {
          type: 'job',
          id: '123',
          attributes: { jobNumber: 'J001', status: 'active' }
        }
      };

      const result = extractSingleResource(response);

      expect(result.id).toBe('123');
      expect(result.type).toBe('job');
      expect(result.jobNumber).toBe('J001');
      expect(result.status).toBe('active');
    });

    it('should throw if given array', () => {
      const response = {
        data: [{ type: 'job', id: '123', attributes: {} }]
      };

      expect(() => extractSingleResource(response)).toThrow('Expected single resource but got array');
    });
  });

  describe('extractResourceList', () => {
    it('should flatten list of resources', () => {
      const response = {
        data: [
          { type: 'job', id: '1', attributes: { jobNumber: 'J001' } },
          { type: 'job', id: '2', attributes: { jobNumber: 'J002' } }
        ]
      };

      const result = extractResourceList(response);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].jobNumber).toBe('J001');
      expect(result[1].id).toBe('2');
      expect(result[1].jobNumber).toBe('J002');
    });

    it('should throw if given single resource', () => {
      const response = {
        data: { type: 'job', id: '123', attributes: {} }
      };

      expect(() => extractResourceList(response)).toThrow('Expected array but got single resource');
    });
  });

  describe('extractPagination', () => {
    it('should extract pagination from meta', () => {
      const response = {
        data: [],
        meta: {
          pagination: {
            total: 100,
            count: 15,
            per_page: 15,
            current_page: 1,
            total_pages: 7
          }
        }
      };

      const pagination = extractPagination(response);

      expect(pagination?.total).toBe(100);
      expect(pagination?.current_page).toBe(1);
      expect(pagination?.total_pages).toBe(7);
    });

    it('should return null if no pagination', () => {
      const response = { data: [] };

      const pagination = extractPagination(response);

      expect(pagination).toBeNull();
    });
  });

  describe('extractIncluded', () => {
    it('should extract included resources by type', () => {
      const response = {
        data: { type: 'job', id: '1', attributes: {} },
        included: [
          { type: 'status', id: 's1', attributes: { name: 'Active' } },
          { type: 'division', id: 'd1', attributes: { name: 'North' } },
          { type: 'status', id: 's2', attributes: { name: 'Closed' } }
        ]
      };

      const statuses = extractIncluded(response, 'status');

      expect(statuses).toHaveLength(2);
      expect(statuses[0].name).toBe('Active');
      expect(statuses[1].name).toBe('Closed');
    });

    it('should return empty array if no included', () => {
      const response = { data: { type: 'job', id: '1', attributes: {} } };

      const result = extractIncluded(response, 'status');

      expect(result).toEqual([]);
    });
  });

  describe('findIncludedById', () => {
    it('should find specific included resource', () => {
      const response = {
        data: { type: 'job', id: '1', attributes: {} },
        included: [
          { type: 'status', id: 's1', attributes: { name: 'Active' } },
          { type: 'status', id: 's2', attributes: { name: 'Closed' } }
        ]
      };

      const status = findIncludedById(response, 'status', 's2');

      expect(status?.id).toBe('s2');
      expect(status?.name).toBe('Closed');
    });

    it('should return null if not found', () => {
      const response = {
        data: { type: 'job', id: '1', attributes: {} },
        included: [{ type: 'status', id: 's1', attributes: {} }]
      };

      const result = findIncludedById(response, 'status', 's999');

      expect(result).toBeNull();
    });
  });

  describe('buildJsonApiBody', () => {
    it('should build create body without id', () => {
      const body = buildJsonApiBody('job', { jobNumber: 'J001' });

      expect(body.data.type).toBe('job');
      expect(body.data.id).toBeUndefined();
      expect(body.data.attributes.jobNumber).toBe('J001');
    });

    it('should build update body with id', () => {
      const body = buildJsonApiBody('job', { jobNumber: 'J001' }, '123');

      expect(body.data.type).toBe('job');
      expect(body.data.id).toBe('123');
      expect(body.data.attributes.jobNumber).toBe('J001');
    });
  });

  describe('buildRelationshipBody', () => {
    it('should build relationship update body', () => {
      const body = buildRelationshipBody('status', '456');

      expect(body.data.type).toBe('status');
      expect(body.data.id).toBe('456');
    });
  });

  describe('isErrorResponse', () => {
    it('should identify error response', () => {
      const response = {
        errors: [{ detail: 'Something went wrong' }]
      };

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response = {
        data: { type: 'job', id: '1', attributes: {} }
      };

      expect(isErrorResponse(response)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isErrorResponse(null)).toBe(false);
    });
  });

  describe('extractErrorMessages', () => {
    it('should extract error details', () => {
      const response = {
        errors: [
          { detail: 'Field is required' },
          { title: 'Validation Error' },
          {}
        ]
      };

      const messages = extractErrorMessages(response);

      expect(messages).toEqual([
        'Field is required',
        'Validation Error',
        'Unknown error'
      ]);
    });
  });
});
