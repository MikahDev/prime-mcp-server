/**
 * Contact management tools for Prime MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import {
  extractSingleResource,
  extractResourceList,
  extractPagination,
  buildJsonApiBody
} from '../client/json-api.js';
import { formatError, formatSuccess } from '../utils/error-handler.js';
import { CommonFilters, buildListQuery } from '../utils/filter-builder.js';
import {
  SearchContactsInputSchema,
  GetContactInputSchema,
  CreateContactInputSchema,
  UpdateContactInputSchema
} from '../schemas/contact.js';

export function registerContactTools(server: McpServer, client: PrimeClient): void {
  // prime_search_contacts
  server.tool(
    'prime_search_contacts',
    'Search and filter contacts by name, email, phone, or type. Returns paginated list.',
    SearchContactsInputSchema.shape,
    async (args) => {
      try {
        const filters = CommonFilters.contacts({
          name: args.name || args.query,
          email: args.email,
          phone: args.phone,
          isActive: args.is_active,
          contactTypeId: args.contact_type_id
        });

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'name',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('contacts', query);
        const contacts = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(contacts, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_contact
  server.tool(
    'prime_get_contact',
    'Get detailed contact information by ID. Includes addresses, licences, and relationships.',
    GetContactInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`contacts/${args.contact_id}`, query);
        const contact = extractSingleResource(response);

        return formatSuccess(contact);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_contact
  server.tool(
    'prime_create_contact',
    'Create a new contact (individual or organization). Set is_individual=true for people.',
    CreateContactInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          isIndividual: args.is_individual
        };

        // Individual fields
        if (args.first_name) attributes.firstName = args.first_name;
        if (args.last_name) attributes.lastName = args.last_name;
        if (args.title) attributes.title = args.title;

        // Organization fields
        if (args.name) attributes.name = args.name;
        if (args.trading_name) attributes.tradingName = args.trading_name;
        if (args.abn) attributes.abn = args.abn;
        if (args.acn) attributes.acn = args.acn;

        // Contact details
        if (args.email) attributes.email = args.email;
        if (args.mobile_number) attributes.mobileNumber = args.mobile_number;
        if (args.home_number) attributes.homeNumber = args.home_number;
        if (args.work_number) attributes.workNumber = args.work_number;
        if (args.fax_number) attributes.faxNumber = args.fax_number;

        // Address
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

        // Classification
        if (args.contact_type_id) attributes.contactTypeId = args.contact_type_id;
        if (args.is_active !== undefined) attributes.isActive = args.is_active;
        if (args.notes) attributes.notes = args.notes;

        const body = buildJsonApiBody('contact', attributes);
        const response = await client.post('contacts', body);
        const contact = extractSingleResource(response);

        return formatSuccess(contact);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_contact
  server.tool(
    'prime_update_contact',
    'Update contact information. Requires contact_id and version for optimistic locking.',
    UpdateContactInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        // Update fields
        if (args.first_name !== undefined) attributes.firstName = args.first_name;
        if (args.last_name !== undefined) attributes.lastName = args.last_name;
        if (args.title !== undefined) attributes.title = args.title;
        if (args.name !== undefined) attributes.name = args.name;
        if (args.trading_name !== undefined) attributes.tradingName = args.trading_name;
        if (args.abn !== undefined) attributes.abn = args.abn;
        if (args.acn !== undefined) attributes.acn = args.acn;
        if (args.email !== undefined) attributes.email = args.email;
        if (args.mobile_number !== undefined) attributes.mobileNumber = args.mobile_number;
        if (args.home_number !== undefined) attributes.homeNumber = args.home_number;
        if (args.work_number !== undefined) attributes.workNumber = args.work_number;
        if (args.fax_number !== undefined) attributes.faxNumber = args.fax_number;
        if (args.contact_type_id !== undefined) attributes.contactTypeId = args.contact_type_id;
        if (args.is_active !== undefined) attributes.isActive = args.is_active;
        if (args.notes !== undefined) attributes.notes = args.notes;

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

        const body = buildJsonApiBody('contact', attributes, args.contact_id);
        const response = await client.put(`contacts/${args.contact_id}`, body);
        const contact = extractSingleResource(response);

        return formatSuccess(contact);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
