/**
 * Job management tools for Prime MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import {
  extractSingleResource,
  extractResourceList,
  extractPagination,
  buildJsonApiBody,
  buildRelationshipBody
} from '../client/json-api.js';
import { formatError, formatSuccess } from '../utils/error-handler.js';
import { CommonFilters, buildListQuery } from '../utils/filter-builder.js';
import {
  SearchJobsInputSchema,
  SearchJobsByAddressInputSchema,
  SearchJobsByCustomerInputSchema,
  GetJobInputSchema,
  CreateJobInputSchema,
  UpdateJobInputSchema,
  UpdateJobStatusInputSchema,
  GetJobAllocationSummaryInputSchema,
  GetJobTradeComparisonInputSchema,
  GetJobFinancialSummaryInputSchema
} from '../schemas/job.js';

export function registerJobTools(server: McpServer, client: PrimeClient): void {
  // prime_search_jobs
  server.tool(
    'prime_search_jobs',
    'Search and filter jobs with pagination. Returns job list with status, division, customer info.',
    SearchJobsInputSchema.shape,
    async (args) => {
      try {
        const filters = CommonFilters.jobs({
          statusId: args.status_id,
          divisionId: args.division_id,
          assignedId: args.assigned_id,
          clientId: args.client_id,
          customerId: args.customer_id,
          perilId: args.peril_id,
          createdAfter: args.created_after,
          createdBefore: args.created_before,
          updatedAfter: args.updated_after
          // Note: query handled separately with OR logic below
        });

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'updatedAt',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        // Handle text search with OR logic (jobNumber OR clientReference OR description)
        if (args.query) {
          const searchFilter = `'jobNumber'.like('%${args.query}%')|'clientReference'.like('%${args.query}%')|'description'.like('%${args.query}%')`;
          if (query.q) {
            // Combine with existing filters using AND
            query.q = `(${searchFilter}),${query.q}`;
          } else {
            query.q = searchFilter;
          }
        }

        const response = await client.get('jobs', query);
        const jobs = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(jobs, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_job
  server.tool(
    'prime_get_job',
    'Get detailed job information by ID. Includes status, division, customer, client, and other relationships.',
    GetJobInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`jobs/${args.job_id}`, query);
        const job = extractSingleResource(response);

        return formatSuccess(job);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_job
  server.tool(
    'prime_create_job',
    'Create a new job. Requires workflow_id, status_id, and client_id. Optionally creates new customer or links existing.',
    CreateJobInputSchema.shape,
    async (args) => {
      try {
        // Build attributes, converting snake_case to camelCase for API
        const attributes: Record<string, unknown> = {
          workflowId: args.workflow_id,
          statusId: args.status_id,
          clientId: args.client_id
        };

        // Optional fields
        if (args.job_number) attributes.jobNumber = args.job_number;
        if (args.client_reference) attributes.clientReference = args.client_reference;
        if (args.additional_reference) attributes.additionalReference = args.additional_reference;
        if (args.description) attributes.description = args.description;
        if (args.notes) attributes.notes = args.notes;
        if (args.division_id) attributes.divisionId = args.division_id;
        if (args.job_type_id) attributes.jobTypeId = args.job_type_id;
        if (args.peril_id) attributes.perilId = args.peril_id;
        if (args.catastrophe_code_id) attributes.catastropheCodeId = args.catastrophe_code_id;
        if (args.assigned_id) attributes.assignedId = args.assigned_id;
        if (args.case_manager_id) attributes.caseManagerId = args.case_manager_id;
        if (args.supervisor_id) attributes.supervisorId = args.supervisor_id;
        if (args.estimator_id) attributes.estimatorId = args.estimator_id;
        if (args.customer_id) attributes.customerId = args.customer_id;
        if (args.excess_amount !== undefined) attributes.excessAmount = args.excess_amount;
        if (args.incident_date) attributes.incidentDate = args.incident_date;

        // Handle address
        if (args.address) {
          attributes.address = {
            streetAddress: args.address.street_address,
            suburb: args.address.suburb,
            state: args.address.state,
            postcode: args.address.postcode,
            country: args.address.country,
            latitude: args.address.latitude,
            longitude: args.address.longitude
          };
        }

        // Handle new customer creation
        if (args.customer) {
          attributes.customer = {
            isIndividual: args.customer.is_individual,
            firstName: args.customer.first_name,
            lastName: args.customer.last_name,
            name: args.customer.name,
            email: args.customer.email,
            mobileNumber: args.customer.mobile_number,
            homeNumber: args.customer.home_number,
            workNumber: args.customer.work_number
          };
        }

        const body = buildJsonApiBody('job', attributes);
        const response = await client.post('jobs', body);
        const job = extractSingleResource(response);

        return formatSuccess(job);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_job
  server.tool(
    'prime_update_job',
    'Update job details. Requires job_id and version for optimistic locking.',
    UpdateJobInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        // Optional update fields
        if (args.client_reference !== undefined) attributes.clientReference = args.client_reference;
        if (args.additional_reference !== undefined) attributes.additionalReference = args.additional_reference;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.notes !== undefined) attributes.notes = args.notes;
        if (args.division_id !== undefined) attributes.divisionId = args.division_id;
        if (args.job_type_id !== undefined) attributes.jobTypeId = args.job_type_id;
        if (args.peril_id !== undefined) attributes.perilId = args.peril_id;
        if (args.catastrophe_code_id !== undefined) attributes.catastropheCodeId = args.catastrophe_code_id;
        if (args.assigned_id !== undefined) attributes.assignedId = args.assigned_id;
        if (args.case_manager_id !== undefined) attributes.caseManagerId = args.case_manager_id;
        if (args.supervisor_id !== undefined) attributes.supervisorId = args.supervisor_id;
        if (args.estimator_id !== undefined) attributes.estimatorId = args.estimator_id;
        if (args.excess_amount !== undefined) attributes.excessAmount = args.excess_amount;
        if (args.incident_date !== undefined) attributes.incidentDate = args.incident_date;

        if (args.address) {
          attributes.address = {
            streetAddress: args.address.street_address,
            suburb: args.address.suburb,
            state: args.address.state,
            postcode: args.address.postcode,
            country: args.address.country,
            latitude: args.address.latitude,
            longitude: args.address.longitude
          };
        }

        const body = buildJsonApiBody('job', attributes, args.job_id);
        const response = await client.put(`jobs/${args.job_id}`, body);
        const job = extractSingleResource(response);

        return formatSuccess(job);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_job_status
  server.tool(
    'prime_update_job_status',
    'Change the status of a job. Use prime_list_job_statuses to get available status IDs.',
    UpdateJobStatusInputSchema.shape,
    async (args) => {
      try {
        const body = buildRelationshipBody('status', args.status_id);
        await client.patch(`jobs/${args.job_id}/relationships/status`, body);

        return formatSuccess({
          job_id: args.job_id,
          status_id: args.status_id,
          message: 'Job status updated successfully'
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_search_jobs_by_address
  server.tool(
    'prime_search_jobs_by_address',
    'Search jobs by address (street, suburb, state, postcode). Paginates through all jobs to find matches since API does not support address filtering directly.',
    SearchJobsByAddressInputSchema.shape,
    async (args) => {
      try {
        if (!args.street && !args.suburb && !args.state && !args.postcode) {
          return formatError(new Error('At least one address field (street, suburb, state, postcode) is required'));
        }

        const maxPages = args.max_pages || 50;
        const matches: unknown[] = [];
        let page = 1;
        let hasMore = true;
        let totalJobsSearched = 0;

        // Build query with includes
        const baseQuery: Record<string, string | number> = { per_page: 100 };
        if (args.includes && args.includes.length > 0) {
          baseQuery.includes = args.includes.join(',');
        }

        while (hasMore && page <= maxPages) {
          const query = { ...baseQuery, page };
          const response = await client.get('jobs', query);
          const jobs = extractResourceList(response);

          if (!jobs || jobs.length === 0) {
            hasMore = false;
            break;
          }

          totalJobsSearched += jobs.length;

          // Filter jobs by address fields (case-insensitive partial match)
          const pageMatches = jobs.filter((job: Record<string, unknown>) => {
            const addr = job.address as Record<string, string> | undefined;
            if (!addr) return false;

            const streetMatch = !args.street ||
              (addr.addressLine1 || '').toLowerCase().includes(args.street.toLowerCase());
            const suburbMatch = !args.suburb ||
              (addr.suburb || '').toLowerCase().includes(args.suburb.toLowerCase());
            const stateMatch = !args.state ||
              (addr.state || '').toLowerCase() === args.state.toLowerCase();
            const postcodeMatch = !args.postcode ||
              (addr.postcode || '') === args.postcode;

            return streetMatch && suburbMatch && stateMatch && postcodeMatch;
          });

          matches.push(...pageMatches);

          if (jobs.length < 100) {
            hasMore = false;
          }
          page++;
        }

        return formatSuccess({
          matches,
          total_matches: matches.length,
          jobs_searched: totalJobsSearched,
          pages_searched: page - 1,
          search_complete: !hasMore
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_search_jobs_by_customer
  server.tool(
    'prime_search_jobs_by_customer',
    'Search jobs by customer name. First finds matching customers, then retrieves their associated jobs.',
    SearchJobsByCustomerInputSchema.shape,
    async (args) => {
      try {
        // Step 1: Search for customers matching the name
        const contactQuery = {
          per_page: 20,
          q: `'name'.like('%${args.customer_name}%')`
        };
        const contactResponse = await client.get('contacts', contactQuery);
        const contacts = extractResourceList(contactResponse);

        if (!contacts || contacts.length === 0) {
          return formatSuccess({
            customers_found: 0,
            jobs: [],
            message: `No customers found matching "${args.customer_name}"`
          });
        }

        // Step 2: Get jobs for each matching customer
        const allJobs: unknown[] = [];
        const customerJobMap: Record<string, { customer: unknown; jobs: unknown[] }> = {};

        for (const contact of contacts) {
          const contactId = (contact as Record<string, unknown>).id as string;

          // Search jobs by customerId
          const jobQuery: Record<string, string | number> = {
            per_page: 100,
            q: `'customerId'.eq('${contactId}')`
          };
          if (args.includes && args.includes.length > 0) {
            jobQuery.includes = args.includes.join(',');
          }

          const jobResponse = await client.get('jobs', jobQuery);
          const jobs = extractResourceList(jobResponse) || [];

          // Also search by primaryContactId if different
          const jobQuery2: Record<string, string | number> = {
            per_page: 100,
            q: `'primaryContactId'.eq('${contactId}')`
          };
          if (args.includes && args.includes.length > 0) {
            jobQuery2.includes = args.includes.join(',');
          }

          const jobResponse2 = await client.get('jobs', jobQuery2);
          const jobs2 = extractResourceList(jobResponse2) || [];

          // Merge and dedupe jobs
          const jobMap = new Map<string, unknown>();
          [...jobs, ...jobs2].forEach((job: unknown) => {
            const jobId = (job as Record<string, unknown>).id as string;
            if (!jobMap.has(jobId)) {
              jobMap.set(jobId, job);
            }
          });

          const uniqueJobs = Array.from(jobMap.values());

          if (uniqueJobs.length > 0) {
            customerJobMap[contactId] = {
              customer: contact,
              jobs: uniqueJobs
            };
            allJobs.push(...uniqueJobs);
          }
        }

        return formatSuccess({
          customers_found: contacts.length,
          customers_with_jobs: Object.keys(customerJobMap).length,
          total_jobs: allJobs.length,
          results: customerJobMap
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_job_allocation_summary
  server.tool(
    'prime_get_job_allocation_summary',
    'Get work order totals grouped by trade for a job. Returns breakdown of allocated amounts per trade category.',
    GetJobAllocationSummaryInputSchema.shape,
    async (args) => {
      try {
        // First get the job to get the job number
        const jobResponse = await client.get(`jobs/${args.job_id}`);
        const job = extractSingleResource(jobResponse) as Record<string, unknown>;
        const jobNumber = job.jobNumber as string;

        // Fetch all work orders for the job (paginate if needed)
        const allWorkOrders: Array<Record<string, unknown>> = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const query = {
            per_page: 100,
            page,
            q: `'jobId'.eq('${args.job_id}')`
          };
          const response = await client.get('work-orders', query);
          const workOrders = extractResourceList(response) as Array<Record<string, unknown>> || [];
          allWorkOrders.push(...workOrders);

          if (workOrders.length < 100) hasMore = false;
          page++;
        }

        // Filter by status
        const statusFilter = args.status_filter || ['Locked', 'Draft', 'Completed'];
        const includeCancelled = args.include_cancelled || false;

        const filteredWOs = allWorkOrders.filter(wo => {
          const status = wo.workOrderStatus as string;
          if (status === 'Cancelled' && !includeCancelled) return false;
          if (args.status_filter && !statusFilter.includes(status)) return false;
          return true;
        });

        // Group by trade
        const byTrade: Record<string, { total: number; count: number; statuses: Record<string, number> }> = {};

        for (const wo of filteredWOs) {
          const items = wo.workOrderItems as Array<Record<string, unknown>> || [];
          const trade = items[0]?.trade as string || 'Unknown';
          const sellTotal = wo.sellTotal as number || 0;
          const status = wo.workOrderStatus as string;

          if (!byTrade[trade]) {
            byTrade[trade] = { total: 0, count: 0, statuses: {} };
          }
          byTrade[trade].total += sellTotal;
          byTrade[trade].count++;
          byTrade[trade].statuses[status] = (byTrade[trade].statuses[status] || 0) + 1;
        }

        // Format output
        const tradeList = Object.entries(byTrade)
          .map(([trade, data]) => ({
            trade,
            total: Math.round(data.total * 100) / 100,
            work_order_count: data.count,
            statuses: data.statuses
          }))
          .sort((a, b) => b.total - a.total);

        const grandTotal = tradeList.reduce((sum, t) => sum + t.total, 0);

        return formatSuccess({
          job_id: args.job_id,
          job_number: jobNumber,
          by_trade: tradeList,
          grand_total: Math.round(grandTotal * 100) / 100,
          work_orders_analyzed: filteredWOs.length
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_job_trade_comparison
  server.tool(
    'prime_get_job_trade_comparison',
    'Compare work order amounts vs authorized estimate amounts by trade. Shows variance between what was estimated and what was allocated.',
    GetJobTradeComparisonInputSchema.shape,
    async (args) => {
      try {
        // Get job info
        const jobResponse = await client.get(`jobs/${args.job_id}`);
        const job = extractSingleResource(jobResponse) as Record<string, unknown>;
        const jobNumber = job.jobNumber as string;

        // 1. Get work orders by trade
        const woByTrade: Record<string, number> = {};
        let woPage = 1;
        let woHasMore = true;
        const woStatuses = args.wo_statuses || ['Locked', 'Draft'];

        while (woHasMore) {
          const response = await client.get('work-orders', {
            per_page: 100,
            page: woPage,
            q: `'jobId'.eq('${args.job_id}')`
          });
          const workOrders = extractResourceList(response) as Array<Record<string, unknown>> || [];

          for (const wo of workOrders) {
            const status = wo.workOrderStatus as string;
            if (!woStatuses.includes(status)) continue;

            const items = wo.workOrderItems as Array<Record<string, unknown>> || [];
            const trade = items[0]?.trade as string || 'Unknown';
            const sellTotal = wo.sellTotal as number || 0;

            woByTrade[trade] = (woByTrade[trade] || 0) + sellTotal;
          }

          if (workOrders.length < 100) woHasMore = false;
          woPage++;
        }

        // 2. Get authorized estimate items directly by trade
        const estByTrade: Record<string, number> = {};
        let estPage = 1;
        let estHasMore = true;

        while (estHasMore) {
          const response = await client.get('estimate-items-snapshot', {
            per_page: 100,
            page: estPage,
            q: `'jobId'.eq('${args.job_id}'),'authorised'.eq('1')`
          });
          const items = extractResourceList(response) as Array<Record<string, unknown>> || [];

          for (const item of items) {
            const trade = item.trade as string || 'Unknown';
            const labourTotal = parseFloat(String(item.labourTotal)) || 0;
            const materialTotal = parseFloat(String(item.materialTotal)) || 0;
            estByTrade[trade] = (estByTrade[trade] || 0) + labourTotal + materialTotal;
          }

          if (items.length < 100) estHasMore = false;
          estPage++;
        }

        // 3. Combine and calculate variances
        const allTrades = new Set([...Object.keys(woByTrade), ...Object.keys(estByTrade)]);
        const comparison = Array.from(allTrades)
          .filter(t => t !== 'General Note')
          .map(trade => ({
            trade,
            estimate_authorized: Math.round((estByTrade[trade] || 0) * 100) / 100,
            work_orders: Math.round((woByTrade[trade] || 0) * 100) / 100,
            variance: Math.round(((woByTrade[trade] || 0) - (estByTrade[trade] || 0)) * 100) / 100
          }))
          .sort((a, b) => b.estimate_authorized - a.estimate_authorized);

        const totals = comparison.reduce((acc, row) => {
          acc.estimate_authorized += row.estimate_authorized;
          acc.work_orders += row.work_orders;
          acc.variance += row.variance;
          return acc;
        }, { estimate_authorized: 0, work_orders: 0, variance: 0 });

        return formatSuccess({
          job_id: args.job_id,
          job_number: jobNumber,
          comparison,
          totals: {
            estimate_authorized: Math.round(totals.estimate_authorized * 100) / 100,
            work_orders: Math.round(totals.work_orders * 100) / 100,
            variance: Math.round(totals.variance * 100) / 100
          }
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_job_financial_summary
  server.tool(
    'prime_get_job_financial_summary',
    'Get full financial comparison by trade: Authorized Estimates vs Work Orders vs AP Invoices. Includes alerts for anomalies.',
    GetJobFinancialSummaryInputSchema.shape,
    async (args) => {
      try {
        // Get job info
        const jobResponse = await client.get(`jobs/${args.job_id}`);
        const job = extractSingleResource(jobResponse) as Record<string, unknown>;
        const jobNumber = job.jobNumber as string;

        // 1. Get work orders and build trade lookup
        const woByTrade: Record<string, number> = {};
        const woIdToTrade: Record<string, string> = {};
        let woPage = 1;
        let woHasMore = true;

        while (woHasMore) {
          const response = await client.get('work-orders', {
            per_page: 100,
            page: woPage,
            q: `'jobId'.eq('${args.job_id}')`
          });
          const workOrders = extractResourceList(response) as Array<Record<string, unknown>> || [];

          for (const wo of workOrders) {
            const status = wo.workOrderStatus as string;
            if (status === 'Cancelled') continue;

            const woId = wo.id as string;
            const items = wo.workOrderItems as Array<Record<string, unknown>> || [];
            const trade = items[0]?.trade as string || 'Unknown';
            const sellTotal = wo.sellTotal as number || 0;

            woIdToTrade[woId] = trade;
            if (status === 'Locked' || status === 'Draft') {
              woByTrade[trade] = (woByTrade[trade] || 0) + sellTotal;
            }
          }

          if (workOrders.length < 100) woHasMore = false;
          woPage++;
        }

        // 2. Get authorized estimate items directly
        const estByTrade: Record<string, number> = {};
        let estPage = 1;
        let estHasMore = true;

        while (estHasMore) {
          const response = await client.get('estimate-items-snapshot', {
            per_page: 100,
            page: estPage,
            q: `'jobId'.eq('${args.job_id}'),'authorised'.eq('1')`
          });
          const items = extractResourceList(response) as Array<Record<string, unknown>> || [];

          for (const item of items) {
            const trade = item.trade as string || 'Unknown';
            const labourTotal = parseFloat(String(item.labourTotal)) || 0;
            const materialTotal = parseFloat(String(item.materialTotal)) || 0;
            estByTrade[trade] = (estByTrade[trade] || 0) + labourTotal + materialTotal;
          }

          if (items.length < 100) estHasMore = false;
          estPage++;
        }

        // 3. Get AP invoices
        const apByTrade: Record<string, { invoiced: number; paid: number }> = {};
        let apPage = 1;
        let apHasMore = true;

        while (apHasMore) {
          const response = await client.get('accounts-payable-invoices', {
            per_page: 100,
            page: apPage,
            q: `'jobId'.eq('${args.job_id}')`
          });
          const invoices = extractResourceList(response) as Array<Record<string, unknown>> || [];

          for (const inv of invoices) {
            const woId = inv.workOrderId as string;
            const trade = woIdToTrade[woId] || 'Unknown/No WO';
            const amount = parseFloat(inv.amount as string) || 0;
            const status = inv.accountsPayableInvoiceStatus as string;

            if (!apByTrade[trade]) {
              apByTrade[trade] = { invoiced: 0, paid: 0 };
            }
            apByTrade[trade].invoiced += amount;
            if (status === 'Paid') {
              apByTrade[trade].paid += amount;
            }
          }

          if (invoices.length < 100) apHasMore = false;
          apPage++;
        }

        // 4. Combine all trades
        const allTrades = new Set([
          ...Object.keys(woByTrade),
          ...Object.keys(estByTrade),
          ...Object.keys(apByTrade)
        ]);

        const comparison = Array.from(allTrades)
          .filter(t => t !== 'General Note' && t !== 'Unknown/No WO')
          .map(trade => ({
            trade,
            estimate_authorized: Math.round((estByTrade[trade] || 0) * 100) / 100,
            work_orders: Math.round((woByTrade[trade] || 0) * 100) / 100,
            ap_invoiced: Math.round((apByTrade[trade]?.invoiced || 0) * 100) / 100,
            ap_paid: Math.round((apByTrade[trade]?.paid || 0) * 100) / 100,
            variance_wo_vs_est: Math.round(((woByTrade[trade] || 0) - (estByTrade[trade] || 0)) * 100) / 100,
            variance_ap_vs_wo: Math.round(((apByTrade[trade]?.invoiced || 0) - (woByTrade[trade] || 0)) * 100) / 100
          }))
          .sort((a, b) => b.estimate_authorized - a.estimate_authorized);

        // 5. Calculate totals
        const totals = comparison.reduce((acc, row) => {
          acc.estimate_authorized += row.estimate_authorized;
          acc.work_orders += row.work_orders;
          acc.ap_invoiced += row.ap_invoiced;
          acc.ap_paid += row.ap_paid;
          return acc;
        }, { estimate_authorized: 0, work_orders: 0, ap_invoiced: 0, ap_paid: 0 });

        // 6. Generate alerts
        const alerts: Array<{ trade: string; issue: string }> = [];

        for (const row of comparison) {
          // Alert if AP significantly exceeds WO
          if (row.ap_invoiced > row.work_orders + 1000 && row.work_orders > 0) {
            const diff = row.ap_invoiced - row.work_orders;
            alerts.push({
              trade: row.trade,
              issue: `AP invoiced exceeds WO by $${diff.toLocaleString()}`
            });
          }
          // Alert if no estimate but has AP
          if (row.estimate_authorized === 0 && row.ap_invoiced > 0) {
            alerts.push({
              trade: row.trade,
              issue: `AP invoiced ($${row.ap_invoiced.toLocaleString()}) with no estimate authorization`
            });
          }
          // Alert if significant estimate with no WO
          if (row.estimate_authorized > 10000 && row.work_orders === 0) {
            alerts.push({
              trade: row.trade,
              issue: `Estimate authorized ($${row.estimate_authorized.toLocaleString()}) but no work orders issued`
            });
          }
        }

        return formatSuccess({
          job_id: args.job_id,
          job_number: jobNumber,
          by_trade: comparison,
          totals: {
            estimate_authorized: Math.round(totals.estimate_authorized * 100) / 100,
            work_orders: Math.round(totals.work_orders * 100) / 100,
            ap_invoiced: Math.round(totals.ap_invoiced * 100) / 100,
            ap_paid: Math.round(totals.ap_paid * 100) / 100
          },
          alerts
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
