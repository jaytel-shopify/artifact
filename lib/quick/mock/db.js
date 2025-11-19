/**
 * Mock Quick Database Client Library
 * Zero-config client for the Quick database API
 */

class Collection {
  constructor(name, schema = null, data = []) {
    this.name = name;
    this.schema = schema;
    this.queryParams = {
      where: {},
      arrayContains: {},
      arrayLength: {},
      arrayAny: {},
      select: null,
      orderBy: [],
      limit: null,
      offset: null,
    };
    this.data = data;
  }

  // Fluent query interface
  where(conditions) {
    const newCollection = this._clone();
    newCollection.queryParams.where = {
      ...newCollection.queryParams.where,
      ...conditions,
    };
    return newCollection;
  }

  arrayContains(conditions) {
    const newCollection = this._clone();
    newCollection.queryParams.arrayContains = {
      ...newCollection.queryParams.arrayContains,
      ...conditions,
    };
    return newCollection;
  }

  arrayLength(conditions) {
    const newCollection = this._clone();
    newCollection.queryParams.arrayLength = {
      ...newCollection.queryParams.arrayLength,
      ...conditions,
    };
    return newCollection;
  }

  arrayAny(conditions) {
    const newCollection = this._clone();
    newCollection.queryParams.arrayAny = {
      ...newCollection.queryParams.arrayAny,
      ...conditions,
    };
    return newCollection;
  }

  select(fields) {
    const newCollection = this._clone();
    newCollection.queryParams.select = Array.isArray(fields)
      ? fields
      : [fields];
    return newCollection;
  }

  limit(count) {
    const newCollection = this._clone();
    newCollection.queryParams.limit = count;
    return newCollection;
  }

  offset(count) {
    const newCollection = this._clone();
    newCollection.queryParams.offset = count;
    return newCollection;
  }

  orderBy(field, direction = "asc") {
    const newCollection = this._clone();
    newCollection.queryParams.orderBy.push({
      field: field,
      direction: direction.toLowerCase() === "desc" ? "desc" : "asc",
    });
    return newCollection;
  }

  // Helper method to clone collection with query state
  _clone() {
    const newCollection = new Collection(this.name, this.schema, this.data);
    newCollection.queryParams = JSON.parse(JSON.stringify(this.queryParams));
    return newCollection;
  }

  // Build query string with optional additional parameters
  _buildQueryString(additionalParams = {}) {
    const params = new URLSearchParams();

    // Add schema parameter if specified
    if (this.schema) {
      params.append("schema", this.schema);
    }

    // Add any additional parameters first
    for (const [key, value] of Object.entries(additionalParams)) {
      params.append(key, value);
    }

    if (Object.keys(this.queryParams.where).length > 0) {
      params.append("where", JSON.stringify(this.queryParams.where));
    }

    if (Object.keys(this.queryParams.arrayContains).length > 0) {
      params.append(
        "arrayContains",
        JSON.stringify(this.queryParams.arrayContains)
      );
    }

    if (Object.keys(this.queryParams.arrayLength).length > 0) {
      params.append(
        "arrayLength",
        JSON.stringify(this.queryParams.arrayLength)
      );
    }

    if (Object.keys(this.queryParams.arrayAny).length > 0) {
      params.append("arrayAny", JSON.stringify(this.queryParams.arrayAny));
    }

    if (this.queryParams.select) {
      params.append("select", this.queryParams.select.join(","));
    }

    if (this.queryParams.orderBy.length > 0) {
      const orderByString = this.queryParams.orderBy
        .map((order) => `${order.field}:${order.direction}`)
        .join(",");
      params.append("orderBy", orderByString);
    }

    if (this.queryParams.limit) {
      params.append("limit", this.queryParams.limit);
    }

    if (this.queryParams.offset) {
      params.append("offset", this.queryParams.offset);
    }

    const queryString = params.toString();
    return queryString ? "?" + queryString : "";
  }

  _transformResults(results) {
    let filtered = [...results];

    // Apply WHERE conditions (supports operators)
    if (Object.keys(this.queryParams.where).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(this.queryParams.where).every(([key, value]) => {
          const itemValue = item[key];

          // Check if value is an object with operators
          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            // Handle comparison operators
            return Object.entries(value).every(([operator, operandValue]) => {
              // Skip $type - it's metadata, not an operator
              if (operator === "$type") return true;

              switch (operator) {
                case "$ne":
                  return itemValue != operandValue;
                case "$gt":
                  return itemValue > operandValue;
                case "$gte":
                  return itemValue >= operandValue;
                case "$lt":
                  return itemValue < operandValue;
                case "$lte":
                  return itemValue <= operandValue;
                case "$in":
                  if (!Array.isArray(operandValue)) {
                    throw new Error("$in operator requires an array value");
                  }
                  return operandValue.includes(itemValue);
                case "$nin":
                  if (!Array.isArray(operandValue)) {
                    throw new Error("$nin operator requires an array value");
                  }
                  return !operandValue.includes(itemValue);
                case "$like":
                  // Convert SQL LIKE pattern to regex (% -> .*, _ -> .)
                  const likePattern = operandValue
                    .replace(/%/g, ".*")
                    .replace(/_/g, ".");
                  return new RegExp(`^${likePattern}$`).test(String(itemValue));
                case "$ilike":
                  // Case-insensitive LIKE
                  const ilikePattern = operandValue
                    .replace(/%/g, ".*")
                    .replace(/_/g, ".");
                  return new RegExp(`^${ilikePattern}$`, "i").test(
                    String(itemValue)
                  );
                default:
                  throw new Error(`Unsupported operator: ${operator}`);
              }
            });
          } else {
            // Simple equality check
            return itemValue === value;
          }
        });
      });
    }

    // Apply arrayContains conditions (array must contain value)
    if (Object.keys(this.queryParams.arrayContains).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(this.queryParams.arrayContains).every(
          ([key, value]) => {
            const fieldValue = item[key];
            if (!Array.isArray(fieldValue)) return false;
            return fieldValue.includes(value);
          }
        );
      });
    }

    // Apply arrayLength conditions (array length must match)
    if (Object.keys(this.queryParams.arrayLength).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(this.queryParams.arrayLength).every(
          ([key, length]) => {
            const fieldValue = item[key];
            if (!Array.isArray(fieldValue)) return false;
            return fieldValue.length === length;
          }
        );
      });
    }

    // Apply arrayAny conditions (array must contain at least one of the values)
    if (Object.keys(this.queryParams.arrayAny).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(this.queryParams.arrayAny).every(
          ([key, values]) => {
            const fieldValue = item[key];
            if (!Array.isArray(fieldValue)) return false;
            if (!Array.isArray(values)) return false;
            return values.some((value) => fieldValue.includes(value));
          }
        );
      });
    }

    // Apply orderBy (sorting)
    if (this.queryParams.orderBy.length > 0) {
      filtered.sort((a, b) => {
        for (const order of this.queryParams.orderBy) {
          const aVal = a[order.field];
          const bVal = b[order.field];

          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;

          if (comparison !== 0) {
            return order.direction === "desc" ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply offset
    if (this.queryParams.offset) {
      filtered = filtered.slice(this.queryParams.offset);
    }

    // Apply limit
    if (this.queryParams.limit) {
      filtered = filtered.slice(0, this.queryParams.limit);
    }

    // Apply select (field projection)
    if (this.queryParams.select) {
      filtered = filtered.map((item) => {
        const projected = {};
        // Always include id, created_at, and updated_at
        projected.id = item.id;
        projected.created_at = item.created_at;
        projected.updated_at = item.updated_at;

        // Include selected fields
        for (const field of this.queryParams.select) {
          if (item.hasOwnProperty(field)) {
            projected[field] = item[field];
          }
        }
        return projected;
      });
    }

    return filtered;
  }

  // Execute query and return results
  async find() {
    const results = this.data;
    return this._transformResults(results);
  }

  // Find by ID
  async findById(id) {
    const doc = this.data.find((item) => item.id === id);
    if (!doc) throw new Error(`Not found: ${id}`);
    return this._transformResults([doc]);
  }

  // Create new object(s) - supports both single and bulk creation
  async create(data) {
    if (Array.isArray(data)) {
      return this._bulkCreate(data);
    } else {
      return this._singleCreate(data);
    }
  }

  // Single object creation
  async _singleCreate(data) {
    const now = new Date().toISOString();
    const doc = {
      id: self.crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...data,
    };
    this.data.push(doc);
    return doc;
  }

  // Bulk object creation
  async _bulkCreate(objects) {
    return objects.map((object) => {
      return this._singleCreate(object);
    });
  }

  // Update object(s) - supports single, ID-based bulk, and filter-based bulk updates
  async update(idOrData, dataOrOptions, options = {}) {
    // Single update by ID
    if (typeof idOrData === "string") {
      return this._singleUpdate(idOrData, dataOrOptions, options);
    }

    // ID-based bulk update (array of objects with IDs)
    if (Array.isArray(idOrData)) {
      return this._bulkUpdateById(idOrData, dataOrOptions || {});
    }

    // Filter-based bulk update (uses query conditions)
    if (this._hasQueryConditions()) {
      return this._bulkUpdateByFilter(idOrData, dataOrOptions || {});
    }

    throw new Error(
      "update() requires either an ID (string), array of objects with IDs, or query conditions"
    );
  }

  // Single object update
  async _singleUpdate(id, data, options = {}) {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Not found: ${id}`);
    this.data[index] = {
      ...this.data[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.data[index];
  }

  // ID-based bulk update
  async _bulkUpdateById(updates, options = {}) {
    return updates.map((update) => {
      return this._singleUpdate(update.id, update.data, options);
    });
  }

  // Filter-based bulk update
  async _bulkUpdateByFilter(data, options = {}) {
    return data.map((item) => {
      return this._singleUpdate(item.id, item.data, options);
    });
  }

  // Helper to check if query conditions are set
  _hasQueryConditions() {
    return (
      Object.keys(this.queryParams.where).length > 0 ||
      Object.keys(this.queryParams.arrayContains).length > 0 ||
      Object.keys(this.queryParams.arrayLength).length > 0 ||
      Object.keys(this.queryParams.arrayAny).length > 0
    );
  }

  // Delete object(s) - supports single ID, ID-based bulk, and filter-based bulk
  async delete(idOrData) {
    // Single ID delete
    if (typeof idOrData === "string") {
      const index = this.data.findIndex((item) => item.id === idOrData);
      if (index === -1) throw new Error(`Not found: ${idOrData}`);
      return this.data.splice(index, 1);
    }

    // ID-based bulk delete (array of objects with IDs)
    if (Array.isArray(idOrData)) {
      return this._bulkDeleteById(idOrData);
    }
  }

  // ID-based bulk delete
  async _bulkDeleteById(deleteObjects) {
    return deleteObjects.map((id) => {
      return this.delete(id);
    });
  }

  // Real-time subscription via SSE
  subscribe(handlers = {}) {
    return () => {};
  }

  // Get collection statistics
  async getStats() {
    return {
      collection: this.name,
      count: this.data.length,
      size: this.data.reduce(
        (acc, item) => acc + JSON.stringify(item).length,
        0
      ),
      site: "development",
    };
  }

  // Get unique values from array field
  async getArrayValues(fieldName) {
    try {
      // Get all documents from the collection
      const documents = this.data || [];

      // Extract all values from the specified array field
      const allValues = new Set();

      for (const doc of documents) {
        const fieldValue = doc[fieldName];

        // If field is an array, add all its values
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((value) => {
            if (value != null) {
              allValues.add(String(value));
            }
          });
        }
      }

      // Convert to array and sort
      const sortedValues = Array.from(allValues).sort();

      return sortedValues;
    } catch (error) {
      throw new Error(`Failed to get array values: ${error.message}`);
    }
  }

  // Reactive query that auto-refreshes on changes
  reactive() {
    return null;
  }
}

class Database {
  constructor(schema = null) {
    this.collections = new Map();
    this.schema = schema;
  }

  // Get collection instance
  collection(name) {
    const key = `${name}:${this.schema || "default"}`;
    if (!this.collections.has(key)) {
      this.collections.set(key, new Collection(name, this.schema));
    }
    return this.collections.get(key);
  }

  // Get all collections
  async getCollections() {
    return Array.from(this.collections.values());
  }
}

// Export singleton instance
const db = new Database();
db.Database = Database;
db.Collection = Collection;

export default db;

// Also export Collection class for advanced usage
export { Collection };
