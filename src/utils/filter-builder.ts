/**
 * Prime API Filter Query Builder
 *
 * Builds filter query strings for Prime API using their custom syntax:
 * - Format: q='field'.operator('value')
 * - Multiple filters: q='field1'.eq('val1'),'field2'.gt('val2')
 * - OR logic: q='field1'.eq('val1')|'field2'.eq('val2')
 *
 * Supported operators:
 * - eq(value): Equal to
 * - neq(value): Not equal to
 * - gt(value): Greater than
 * - gte(value): Greater than or equal
 * - lt(value): Less than
 * - lte(value): Less than or equal
 * - in(val1,val2,...): In list
 * - nin(val1,val2,...): Not in list
 * - like(pattern): Pattern match (use % for wildcards)
 * - between(min,max): Between range
 */

export class FilterBuilder {
  private filters: string[] = [];

  /**
   * Equal to
   */
  eq(field: string, value: string | number | boolean): this {
    this.filters.push(`'${field}'.eq('${value}')`);
    return this;
  }

  /**
   * Not equal to
   */
  neq(field: string, value: string | number | boolean): this {
    this.filters.push(`'${field}'.neq('${value}')`);
    return this;
  }

  /**
   * Greater than
   */
  gt(field: string, value: string | number): this {
    this.filters.push(`'${field}'.gt('${value}')`);
    return this;
  }

  /**
   * Greater than or equal
   */
  gte(field: string, value: string | number): this {
    this.filters.push(`'${field}'.gte('${value}')`);
    return this;
  }

  /**
   * Less than
   */
  lt(field: string, value: string | number): this {
    this.filters.push(`'${field}'.lt('${value}')`);
    return this;
  }

  /**
   * Less than or equal
   */
  lte(field: string, value: string | number): this {
    this.filters.push(`'${field}'.lte('${value}')`);
    return this;
  }

  /**
   * Like pattern match (use % for wildcards)
   */
  like(field: string, pattern: string): this {
    this.filters.push(`'${field}'.like('${pattern}')`);
    return this;
  }

  /**
   * In list of values
   */
  in(field: string, values: Array<string | number>): this {
    const valueList = values.join(',');
    this.filters.push(`'${field}'.in(${valueList})`);
    return this;
  }

  /**
   * Not in list of values
   */
  nin(field: string, values: Array<string | number>): this {
    const valueList = values.join(',');
    this.filters.push(`'${field}'.nin(${valueList})`);
    return this;
  }

  /**
   * Between range (inclusive)
   */
  between(field: string, min: string | number, max: string | number): this {
    this.filters.push(`'${field}'.between('${min}','${max}')`);
    return this;
  }

  /**
   * Add a raw filter expression
   */
  raw(expression: string): this {
    this.filters.push(expression);
    return this;
  }

  /**
   * Build the filter query string with AND logic (comma separated)
   */
  build(): string {
    return this.filters.join(',');
  }

  /**
   * Build the filter query string with OR logic (pipe separated)
   */
  buildOr(): string {
    return this.filters.join('|');
  }

  /**
   * Check if any filters have been added
   */
  hasFilters(): boolean {
    return this.filters.length > 0;
  }

  /**
   * Clear all filters
   */
  clear(): this {
    this.filters = [];
    return this;
  }

  /**
   * Get the number of filters
   */
  get length(): number {
    return this.filters.length;
  }
}

/**
 * Build query parameters object for list endpoints
 */
export function buildListQuery(options: {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  includes?: string[];
  filters?: FilterBuilder;
}): Record<string, string | number | undefined> {
  const query: Record<string, string | number | undefined> = {};

  if (options.page !== undefined) {
    query.page = options.page;
  }

  if (options.perPage !== undefined) {
    query.per_page = options.perPage;
  }

  if (options.orderBy) {
    query.order = options.orderDir === 'DESC'
      ? `${options.orderBy}|DESC`
      : options.orderBy;
  }

  if (options.includes && options.includes.length > 0) {
    query.includes = options.includes.join(',');
  }

  if (options.filters && options.filters.hasFilters()) {
    query.q = options.filters.build();
  }

  return query;
}

/**
 * Common filter builders for specific entities
 */
export const CommonFilters = {
  /**
   * Build job list filters
   */
  jobs(params: {
    statusId?: string;
    divisionId?: string;
    assignedId?: string;
    clientId?: string;
    customerId?: string;
    perilId?: string;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    jobNumber?: string;
    clientReference?: string;
  }): FilterBuilder {
    const builder = new FilterBuilder();

    if (params.statusId) builder.eq('statusId', params.statusId);
    if (params.divisionId) builder.eq('divisionId', params.divisionId);
    if (params.assignedId) builder.eq('assignedId', params.assignedId);
    if (params.clientId) builder.eq('clientId', params.clientId);
    if (params.customerId) builder.eq('customerId', params.customerId);
    if (params.perilId) builder.eq('perilId', params.perilId);
    if (params.createdAfter) builder.gte('createdAt', params.createdAfter);
    if (params.createdBefore) builder.lte('createdAt', params.createdBefore);
    if (params.updatedAfter) builder.gte('updatedAt', params.updatedAfter);
    if (params.jobNumber) builder.like('jobNumber', `%${params.jobNumber}%`);
    if (params.clientReference) builder.like('clientReference', `%${params.clientReference}%`);

    return builder;
  },

  /**
   * Build contact list filters
   */
  contacts(params: {
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    contactTypeId?: string;
  }): FilterBuilder {
    const builder = new FilterBuilder();

    if (params.name) builder.like('name', `%${params.name}%`);
    if (params.email) builder.like('email', `%${params.email}%`);
    if (params.phone) builder.like('phone', `%${params.phone}%`);
    if (params.isActive !== undefined) builder.eq('isActive', params.isActive);
    if (params.contactTypeId) builder.eq('contactTypeId', params.contactTypeId);

    return builder;
  },

  /**
   * Build allocation list filters
   */
  allocations(params: {
    jobId?: string;
    assignedContactId?: string;
    allocationStatusId?: string;
    allocationType?: string;
  }): FilterBuilder {
    const builder = new FilterBuilder();

    if (params.jobId) builder.eq('jobId', params.jobId);
    if (params.assignedContactId) builder.eq('assignedContactId', params.assignedContactId);
    if (params.allocationStatusId) builder.eq('allocationStatusId', params.allocationStatusId);
    if (params.allocationType) builder.eq('allocationType', params.allocationType);

    return builder;
  },

  /**
   * Build estimate list filters
   */
  estimates(params: {
    jobId?: string;
    createdAfter?: string;
    createdBefore?: string;
  }): FilterBuilder {
    const builder = new FilterBuilder();

    if (params.jobId) builder.eq('jobId', params.jobId);
    if (params.createdAfter) builder.gte('createdAt', params.createdAfter);
    if (params.createdBefore) builder.lte('createdAt', params.createdBefore);

    return builder;
  }
};
